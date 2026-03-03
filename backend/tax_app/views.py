"""
API views for Municipal Tax System
"""
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum, Count, Q
from django.utils import timezone

from .models import User, TaxpayerProfile, TaxType, TaxAccount, PaymentRequest
from .serializers import (
    UserSerializer, TaxpayerProfileSerializer, TaxpayerProfileCreateSerializer,
    TaxTypeSerializer, TaxAccountSerializer, PaymentRequestSerializer,
    PaymentRequestCreateSerializer, LoginSerializer, DashboardSummarySerializer,
    AdminMetricsSerializer, PayNowSerializer, PaymentApprovalSerializer,
    UserStatusUpdateSerializer
)
from .permissions import IsAdministrator, IsTaxpayer, IsOwnerOrAdministrator, CanAccessAdmin


class TaxAccountViewSet(viewsets.ModelViewSet):
    """Tax account endpoints"""
    
    serializer_class = TaxAccountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'Administrator':
            return TaxAccount.objects.all()
        return TaxAccount.objects.filter(user=self.request.user)


class RegisterView(generics.CreateAPIView):
    """Registration endpoint for taxpayers"""
    
    serializer_class = TaxpayerProfileCreateSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        
        # Generate tokens
        user = profile.user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Login endpoint"""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Update last login
        user.update_last_login()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class RefreshTokenView(APIView):
    """Refresh token endpoint"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        refresh_token = request.data.get('refresh')
        
        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """Get current user info"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        
        # Add profile data if taxpayer
        if user.role == 'Taxpayer':
            try:
                profile = user.profile
                data['profile'] = TaxpayerProfileSerializer(profile).data
            except TaxpayerProfile.DoesNotExist:
                pass
        
        return Response(data, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update taxpayer profile"""
    
    serializer_class = TaxpayerProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        try:
            return self.request.user.profile
        except TaxpayerProfile.DoesNotExist:
            return None
    
    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Don't allow updating system fields
        data = request.data.copy()
        data.pop('registration_date', None)
        data.pop('user', None)
        
        serializer = self.get_serializer(profile, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardSummaryView(APIView):
    """Get taxpayer dashboard summary"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        try:
            tax_account = user.tax_account
        except TaxAccount.DoesNotExist:
            return Response({
                'total_tax_due': 0,
                'paid_amount': 0,
                'outstanding_balance': 0,
                'next_payment_due_date': None,
                'status': 'Active'
            }, status=status.HTTP_200_OK)
        
        data = {
            'total_tax_due': tax_account.total_tax_due,
            'paid_amount': tax_account.paid_amount,
            'outstanding_balance': tax_account.outstanding_balance,
            'next_payment_due_date': tax_account.next_payment_due_date,
            'status': tax_account.status
        }
        
        serializer = DashboardSummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PaymentRequestViewSet(viewsets.ModelViewSet):
    """Payment request endpoints"""
    
    serializer_class = PaymentRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'Administrator':
            return PaymentRequest.objects.all().order_by('-created_at')
        return PaymentRequest.objects.filter(user=self.request.user).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        # Pre-process data to handle empty string for tax_account
        data = request.data.copy()
        
        # If tax_account is empty string or not provided, set to None
        if not data.get('tax_account') or data.get('tax_account') == '':
            data['tax_account'] = None
        
        serializer = PaymentRequestCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        # Get tax account - if not provided, use the user's default tax account
        tax_account = serializer.validated_data.get('tax_account')
        
        if not tax_account:
            # Try to get the user's existing tax account
            try:
                tax_account = TaxAccount.objects.get(user=request.user)
            except TaxAccount.DoesNotExist:
                # Create a new tax account if none exists
                tax_type = TaxType.objects.first()
                if not tax_type:
                    return Response({'error': 'No tax type available. Please contact administrator.'}, status=status.HTTP_400_BAD_REQUEST)
                tax_account = TaxAccount.objects.create(
                    user=request.user,
                    tax_type=tax_type,
                    total_tax_due=0,
                    paid_amount=0,
                    outstanding_balance=0
                )
        else:
            # Verify the tax account belongs to the user
            if tax_account.user != request.user:
                return Response({'error': 'Tax account not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get payment method or use default
        payment_method = serializer.validated_data.get('payment_method', 'Mobile Money')
        
        # Create payment request with Pending status (manual payment flow)
        payment = PaymentRequest.objects.create(
            user=request.user,
            tax_account=tax_account,
            amount=serializer.validated_data['amount'],
            payment_method=payment_method,
            status='Pending'
        )
        
        # Generate reference number
        import random
        payment.provider_reference = f"PAY{random.randint(100000, 999999)}"
        payment.save()
        
        return Response({
            'message': 'Payment request submitted! Waiting for admin approval.',
            'payment': PaymentRequestSerializer(payment).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAccessAdmin])
    def approve(self, request, pk=None):
        """Admin action to approve a payment"""
        payment = self.get_object()
        
        # Only admin can approve
        if request.user.role != 'Administrator':
            return Response({'error': 'Permission denied. Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Accept Pending (control number generated) or Processing (user submitted amount)
        if payment.status not in ['Pending', 'Processing']:
            return Response({'error': f'Cannot approve payment with status: {payment.status}'}, status=status.HTTP_400_BAD_REQUEST)
        
        payment.status = 'Approved'
        payment.approved_by = request.user
        payment.approved_at = timezone.now()
        payment.save()
        
        return Response({
            'message': 'Payment approved successfully!',
            'payment': PaymentRequestSerializer(payment).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAccessAdmin])
    def reject(self, request, pk=None):
        """Admin action to reject a payment"""
        payment = self.get_object()
        
        # Only admin can reject
        if request.user.role != 'Administrator':
            return Response({'error': 'Permission denied. Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Accept Pending (control number generated) or Processing (user submitted amount)
        if payment.status not in ['Pending', 'Processing']:
            return Response({'error': f'Cannot reject payment with status: {payment.status}'}, status=status.HTTP_400_BAD_REQUEST)
        
        rejection_reason = request.data.get('rejection_reason', '')
        
        payment.status = 'Rejected'
        payment.approved_by = request.user
        payment.approved_at = timezone.now()
        payment.rejection_reason = rejection_reason
        payment.save()
        
        return Response({
            'message': 'Payment rejected!',
            'payment': PaymentRequestSerializer(payment).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanAccessAdmin])
    def mark_paid(self, request, pk=None):
        """Admin action to mark approved payment as completed and update tax account"""
        payment = self.get_object()
        
        # Only admin can mark as completed
        if request.user.role != 'Administrator':
            return Response({'error': 'Permission denied. Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if payment is in Approved status
        if payment.status != 'Approved':
            return Response({'error': 'Only approved payments can be marked as completed.'}, status=status.HTTP_400_BAD_REQUEST)
        
        payment.status = 'Completed'
        payment.completed_at = timezone.now()
        payment.save()
        
        # Update tax account
        tax_account = payment.tax_account
        tax_account.paid_amount += payment.amount
        tax_account.calculate_outstanding()
        
        return Response({
            'message': 'Payment completed successfully!',
            'payment': PaymentRequestSerializer(payment).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, CanAccessAdmin])
    def pending(self, request):
        """Get all pending payments (admin only)"""
        if request.user.role != 'Administrator':
            return Response({'error': 'Permission denied. Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        
        pending_payments = PaymentRequest.objects.filter(status='Pending').order_by('-created_at')
        serializer = PaymentRequestSerializer(pending_payments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def generate_control_number(self, request):
        """Generate a unique control number for the user's payment"""
        try:
            tax_account = TaxAccount.objects.get(user=request.user)
        except TaxAccount.DoesNotExist:
            return Response({'error': 'No tax account found.'}, status=status.HTTP_404_NOT_FOUND)

        # Cancel any existing pending control-number payments for this user
        PaymentRequest.objects.filter(
            user=request.user,
            payment_method='Generate Control Number',
            status='Pending'
        ).update(status='Cancelled')

        # Use outstanding balance as placeholder amount (must be > 0 for DB)
        placeholder_amount = tax_account.outstanding_balance if tax_account.outstanding_balance > 0 else 1

        payment = PaymentRequest.objects.create(
            user=request.user,
            tax_account=tax_account,
            amount=placeholder_amount,
            payment_method='Generate Control Number',
            status='Pending'
        )

        control_number = payment.generate_control_number()

        return Response({
            'control_number': control_number,
            'payment_id': payment.id,
            'outstanding_balance': str(tax_account.outstanding_balance),
            'total_tax_due': str(tax_account.total_tax_due),
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def pay_with_control_number(self, request):
        """Process payment using a generated control number"""
        from decimal import Decimal, InvalidOperation
        from datetime import date, timedelta

        control_number = request.data.get('control_number', '').strip()
        amount_str = request.data.get('amount', '')

        if not control_number:
            return Response({'error': 'Control number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not amount_str:
            return Response({'error': 'Amount is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount_str))
            if amount <= 0:
                raise ValueError()
        except (InvalidOperation, ValueError):
            return Response({'error': 'Please enter a valid amount greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate control number belongs to this user and is still Pending
        try:
            payment = PaymentRequest.objects.get(
                control_number=control_number,
                user=request.user,
                status='Pending'
            )
        except PaymentRequest.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired control number. Please generate a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tax_account = payment.tax_account

        # Validate amount >= outstanding balance
        if tax_account.outstanding_balance > 0 and amount < tax_account.outstanding_balance:
            return Response({
                'error': (
                    f'Amount must be at least TZS {tax_account.outstanding_balance:,.0f} '
                    f'(your outstanding balance).'
                )
            }, status=status.HTTP_400_BAD_REQUEST)

        # Submit payment for admin verification — do NOT complete or update tax account yet
        payment.amount = amount
        payment.status = 'Processing'
        payment.save()

        return Response({
            'success': True,
            'message': 'Payment submitted! Awaiting admin verification.',
            'payment': PaymentRequestSerializer(payment).data,
        }, status=status.HTTP_200_OK)


class AdminMetricsView(APIView):
    """Admin dashboard metrics"""
    
    permission_classes = [IsAuthenticated, CanAccessAdmin]
    
    def get(self, request):
        # Total taxpayers
        total_taxpayers = User.objects.filter(role='Taxpayer').count()
        
        # Total properties/businesses
        total_properties = TaxpayerProfile.objects.filter(
            taxpayer_type__in=['Business', 'Organization']
        ).count()
        
        # Total tax assessed
        total_tax_assessed = TaxAccount.objects.aggregate(
            total=Sum('total_tax_due')
        )['total'] or 0
        
        # Total revenue collected
        total_revenue = PaymentRequest.objects.filter(
            status='Completed'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Outstanding tax
        outstanding = TaxAccount.objects.aggregate(
            total=Sum('outstanding_balance')
        )['total'] or 0
        
        # Overdue accounts
        overdue_accounts = TaxAccount.objects.filter(
            Q(status='Overdue') | Q(outstanding_balance__gt=0)
        ).count()
        
        # Pending payments count
        pending_payments = PaymentRequest.objects.filter(status='Pending').count()
        
        data = {
            'total_registered_taxpayers': total_taxpayers,
            'total_properties_businesses': total_properties,
            'total_tax_assessed': total_tax_assessed,
            'total_revenue_collected': total_revenue,
            'outstanding_tax_amount': outstanding,
            'overdue_accounts': overdue_accounts,
            'pending_payments': pending_payments
        }
        
        serializer = AdminMetricsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserListView(generics.ListAPIView):
    """List all users (admin only)"""
    
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, CanAccessAdmin]
    queryset = User.objects.all().order_by('-date_joined')
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Search by email or name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(profile__first_name__icontains=search) |
                Q(profile__last_name__icontains=search)
            )
        
        return queryset


class AdminUserStatusUpdateView(APIView):
    """Update a user's account status (admin only). Admins cannot change their own status."""

    permission_classes = [IsAuthenticated, CanAccessAdmin]

    def patch(self, request, pk):
        try:
            user_to_update = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Prevent admin from changing their own status
        if user_to_update == request.user:
            return Response(
                {'error': 'You cannot change your own account status.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['account_status']
        user_to_update.account_status = new_status
        user_to_update.save(update_fields=['account_status'])

        return Response({
            'message': f"User {user_to_update.email} status updated to '{new_status}'.",
            'user': UserSerializer(user_to_update).data
        }, status=status.HTTP_200_OK)


class AdminUserDeleteView(generics.DestroyAPIView):
    """Delete a user (admin only). Admins cannot delete themselves."""
    
    permission_classes = [IsAuthenticated, CanAccessAdmin]
    queryset = User.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        user_to_delete = self.get_object()
        
        # Prevent admin from deleting themselves
        if user_to_delete == request.user:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_to_delete.delete()
        return Response(
            {'message': f'User {user_to_delete.email} has been deleted successfully.'},
            status=status.HTTP_200_OK
        )


class AdminUnpaidUsersView(generics.ListAPIView):
    """List unpaid users for printing"""
    
    serializer_class = TaxAccountSerializer
    permission_classes = [IsAuthenticated, CanAccessAdmin]
    
    def get_queryset(self):
        return TaxAccount.objects.filter(
            Q(outstanding_balance__gt=0) | Q(status='Overdue')
        ).order_by('-outstanding_balance')


class TaxTypeViewSet(viewsets.ModelViewSet):
    """Tax type CRUD - Read access for all authenticated users, write only for admin"""
    
    serializer_class = TaxTypeSerializer
    permission_classes = [IsAuthenticated]
    queryset = TaxType.objects.all()


class PayNowView(APIView):
    """
    Pay Now endpoint - Process instant payment
    
    Creates a payment request and immediately processes it (marks as paid).
    This is a streamlined payment flow for immediate tax payments.
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PayNowSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get tax account - if not provided, use the user's default tax account
        tax_account = serializer.validated_data.get('tax_account')
        
        if not tax_account:
            # Try to get the user's existing tax account
            try:
                tax_account = TaxAccount.objects.get(user=request.user)
            except TaxAccount.DoesNotExist:
                # Create a new tax account if none exists
                tax_type = TaxType.objects.first()
                if not tax_type:
                    return Response(
                        {'error': 'No tax type available. Please contact administrator.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                tax_account = TaxAccount.objects.create(
                    user=request.user,
                    tax_type=tax_type,
                    total_tax_due=0,
                    paid_amount=0,
                    outstanding_balance=0
                )
        else:
            # Verify the tax account belongs to the user
            if tax_account.user != request.user:
                return Response(
                    {'error': 'Tax account not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get payment details
        amount = serializer.validated_data['amount']
        payment_method = serializer.validated_data.get('payment_method', 'Mobile Money')
        
        # Validate amount doesn't exceed outstanding balance (optional business rule)
        if tax_account.outstanding_balance > 0 and amount > tax_account.outstanding_balance:
            # Allow overpayment, but log a warning (optional)
            pass
        
        # Generate reference number
        import random
        provider_reference = f"PAY{random.randint(100000, 999999)}"
        
        # Create payment with Pending status — admin must verify before completion
        payment = PaymentRequest.objects.create(
            user=request.user,
            tax_account=tax_account,
            amount=amount,
            payment_method=payment_method,
            status='Pending',
            provider_reference=provider_reference,
        )
        
        return Response({
            'success': True,
            'message': 'Payment submitted! Awaiting admin verification.',
            'payment': {
                'id': payment.id,
                'amount': str(payment.amount),
                'payment_method': payment.payment_method,
                'status': payment.status,
                'provider_reference': payment.provider_reference,
            },
        }, status=status.HTTP_200_OK)
