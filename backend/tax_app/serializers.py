"""
Serializers for Municipal Tax System API
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, TaxpayerProfile, TaxType, TaxAccount, PaymentRequest


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'account_status', 'last_login_time', 'date_joined']
        read_only_fields = ['id', 'account_status', 'last_login_time', 'date_joined']


class TaxpayerProfileSerializer(serializers.ModelSerializer):
    """Serializer for TaxpayerProfile model"""
    
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    
    def get_full_name(self, obj):
        return obj.full_name
    
    class Meta:
        model = TaxpayerProfile
        fields = [
            'id', 'email', 'full_name',
            # Personal Details
            'first_name', 'middle_name', 'last_name', 'gender', 'date_of_birth', 'mobile_phone',
            # Identification
            'national_id_number',
            # Address
            'ward', 'street_village', 'house_number',
            # Taxpayer/Property Details
            'taxpayer_type', 'property_location', 'business_name',
            # System assigned
            'registration_date',
        ]
        read_only_fields = ['id', 'registration_date']
    
    def validate(self, data):
        # Check declaration only for create operations (when instance is None)
        if self.instance is None:
            if hasattr(self, 'initial_data'):
                if not self.initial_data.get('declaration', False):
                    raise serializers.ValidationError({'declaration': 'You must confirm that the information provided is true and correct.'})
        return data


class TaxpayerProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating TaxpayerProfile with user"""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    declaration = serializers.BooleanField(write_only=True)
    
    class Meta:
        model = TaxpayerProfile
        fields = [
            'email', 'password', 'password_confirm', 'declaration',
            # Personal Details
            'first_name', 'middle_name', 'last_name', 'gender', 'date_of_birth', 'mobile_phone',
            # Identification
            'national_id_number',
            # Address
            'ward', 'street_village', 'house_number',
            # Taxpayer/Property Details
            'taxpayer_type', 'property_location', 'business_name',
        ]
    
    def validate(self, data):
        # Check password match
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        
        # Check declaration
        if not data.get('declaration', False):
            raise serializers.ValidationError({'declaration': 'You must confirm that the information provided is true and correct.'})
        
        # Check business name for Business/Organization types
        if data.get('taxpayer_type') in ['Business', 'Organization'] and not data.get('business_name'):
            raise serializers.ValidationError({'business_name': 'Business name is required for Business or Organization type.'})
        
        # Check email uniqueness
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'This email is already registered.'})
        
        # Check national ID uniqueness
        if TaxpayerProfile.objects.filter(national_id_number=data['national_id_number']).exists():
            raise serializers.ValidationError({'national_id_number': 'This national ID number is already registered.'})
        
        return data
    
    def create(self, validated_data):
        # Extract user data
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
        validated_data.pop('declaration')
        
        # Create user
        user = User.objects.create_user(
            email=email,
            password=password,
            role='Taxpayer'
        )
        
        # Create profile
        profile = TaxpayerProfile.objects.create(user=user, **validated_data)
        
        # Create default tax account.
        # total_tax_due, outstanding_balance, and next_payment_due_date are
        # automatically populated by the post_save signal in signals.py
        # using TaxType.default_amount.
        tax_type = TaxType.objects.filter(is_active=True).first()
        if tax_type:
            TaxAccount.objects.create(
                user=user,
                tax_type=tax_type,
            )
        
        return profile


class TaxTypeSerializer(serializers.ModelSerializer):
    """Serializer for TaxType model"""
    
    class Meta:
        model = TaxType
        fields = ['id', 'name', 'description', 'default_amount', 'is_active']


class TaxAccountSerializer(serializers.ModelSerializer):
    """Serializer for TaxAccount model"""
    
    tax_type_name = serializers.CharField(source='tax_type.name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = TaxAccount
        fields = [
            'id', 'email', 'tax_type', 'tax_type_name',
            'total_tax_due', 'paid_amount', 'outstanding_balance',
            'next_payment_due_date', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentRequestSerializer(serializers.ModelSerializer):
    """Serializer for PaymentRequest model"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    approved_by_email = serializers.EmailField(source='approved_by.email', read_only=True, allow_null=True)
    
    class Meta:
        model = PaymentRequest
        fields = [
            'id', 'user', 'user_email', 'tax_account', 'amount', 'payment_method',
            'status', 'control_number', 'provider_reference',
            'approved_by', 'approved_by_email', 'approved_at', 'rejection_reason',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'status', 'control_number', 'provider_reference', 
                          'approved_by', 'approved_at', 'rejection_reason',
                          'created_at', 'updated_at', 'completed_at']


class UserStatusUpdateSerializer(serializers.Serializer):
    """Serializer for admin to update user account status"""

    STATUS_CHOICES = ['Active', 'Inactive', 'Suspended']

    account_status = serializers.ChoiceField(choices=STATUS_CHOICES)


class PaymentApprovalSerializer(serializers.Serializer):
    """Serializer for admin to approve or reject payment"""
    
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data.get('action') == 'reject' and not data.get('rejection_reason'):
            raise serializers.ValidationError({'rejection_reason': 'Rejection reason is required when rejecting a payment.'})
        return data


class PaymentRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating PaymentRequest"""
    
    tax_account = serializers.PrimaryKeyRelatedField(
        queryset=TaxAccount.objects.all(),
        required=False,
        allow_null=True
    )
    payment_method = serializers.ChoiceField(
        choices=PaymentRequest.METHOD_CHOICES,
        default='Mobile Money',
        required=False
    )
    
    class Meta:
        model = PaymentRequest
        fields = ['amount', 'payment_method', 'tax_account']
    
    def validate(self, data):
        # Set default payment method if not provided
        if 'payment_method' not in data:
            data['payment_method'] = 'Mobile Money'
        
        # Handle empty string for tax_account
        if 'tax_account' in data and data['tax_account'] == '':
            data['tax_account'] = None
        
        if data.get('amount') and data['amount'] <= 0:
            raise serializers.ValidationError({'amount': 'Amount must be greater than 0.'})
        return data


class PayNowSerializer(serializers.Serializer):
    """Serializer for instant Pay Now payment"""
    
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.ChoiceField(
        choices=PaymentRequest.METHOD_CHOICES,
        default='Mobile Money'
    )
    tax_account = serializers.PrimaryKeyRelatedField(
        queryset=TaxAccount.objects.all(),
        required=False,
        allow_null=True
    )
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than 0.')
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer for login"""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password.')
            if user.account_status != 'Active':
                raise serializers.ValidationError('User account is not active.')
            data['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password.')
        
        return data


class DashboardSummarySerializer(serializers.Serializer):
    """Serializer for dashboard summary"""
    
    total_tax_due = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    outstanding_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    next_payment_due_date = serializers.DateField(required=False, allow_null=True)
    status = serializers.CharField()


class AdminMetricsSerializer(serializers.Serializer):
    """Serializer for admin dashboard metrics"""
    
    total_registered_taxpayers = serializers.IntegerField()
    total_properties_businesses = serializers.IntegerField()
    total_tax_assessed = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_revenue_collected = serializers.DecimalField(max_digits=12, decimal_places=2)
    outstanding_tax_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    overdue_accounts = serializers.IntegerField()


class DetentionNoticeSerializer(serializers.Serializer):
    """Serializer for individual detention notice - includes full taxpayer profile and tax details"""
    
    # Tax Account Basic Info
    tax_account_id = serializers.IntegerField()
    email = serializers.EmailField()
    outstanding_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_tax_due = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    tax_type_name = serializers.CharField()
    status = serializers.CharField()
    next_payment_due_date = serializers.DateField(required=False, allow_null=True)
    
    # Taxpayer Profile Details
    full_name = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    gender = serializers.CharField()
    date_of_birth = serializers.DateField()
    mobile_phone = serializers.CharField()
    national_id_number = serializers.CharField()
    ward = serializers.CharField()
    street_village = serializers.CharField()
    house_number = serializers.CharField(allow_blank=True)
    taxpayer_type = serializers.CharField()
    property_location = serializers.CharField()
    business_name = serializers.CharField(allow_blank=True)
    registration_date = serializers.DateTimeField()
