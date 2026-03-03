"""
Data models for Municipal Tax System
"""
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager where email is the unique identifier for authentication"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'Administrator')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')
            
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model using email as USERNAME_FIELD"""
    
    ROLE_CHOICES = [
        ('Taxpayer', 'Taxpayer'),
        ('Municipal Officer', 'Municipal Officer'),
        ('Administrator', 'Administrator'),
    ]
    
    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Taxpayer')
    account_status = models.CharField(max_length=20, default='Active')
    last_login_time = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    def __str__(self):
        return self.email
    
    def update_last_login(self):
        self.last_login_time = timezone.now()
        self.save(update_fields=['last_login_time'])


class TaxpayerProfile(models.Model):
    """Profile model for taxpayer details"""
    
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
    ]
    
    TAXPAYER_TYPE_CHOICES = [
        ('Business', 'Business'),
        ('Organization', 'Organization'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Personal Details
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    mobile_phone = models.CharField(max_length=20)
    
    # Identification
    national_id_number = models.CharField(max_length=50, unique=True)
    
    # Address
    ward = models.CharField(max_length=100)
    street_village = models.CharField(max_length=100)
    house_number = models.CharField(max_length=50, blank=True)
    
    # Taxpayer/Property Details
    taxpayer_type = models.CharField(max_length=20, choices=TAXPAYER_TYPE_CHOICES)
    property_location = models.TextField()
    business_name = models.CharField(max_length=200, blank=True)
    
    # System assigned fields
    registration_date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.user.email}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.middle_name} {self.last_name}".strip()


class TaxType(models.Model):
    """Tax types available in the system"""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    default_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Default annual tax due amount automatically assigned when a new tax account is created'
    )
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name


class TaxAccount(models.Model):
    """Tax account for each taxpayer"""
    
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Overdue', 'Overdue'),
        ('Suspended', 'Suspended'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tax_account')
    tax_type = models.ForeignKey(TaxType, on_delete=models.CASCADE, related_name='accounts')
    
    # Financial fields
    total_tax_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Dates
    next_payment_due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Tax Account - {self.user.email} - {self.tax_type.name}"
    
    def calculate_outstanding(self):
        self.outstanding_balance = self.total_tax_due - self.paid_amount
        if self.outstanding_balance > 0:
            self.status = 'Overdue'
        else:
            self.status = 'Active'
        self.save()


class PaymentRequest(models.Model):
    """Payment requests from taxpayers"""
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
        ('Failed', 'Failed'),
        ('Rejected', 'Rejected'),
        ('Cancelled', 'Cancelled'),
    ]
    
    METHOD_CHOICES = [
        ('Mobile Money', 'Mobile Money'),
        ('Pesapal', 'Pesapal'),
        ('Generate Control Number', 'Generate Control Number'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    tax_account = models.ForeignKey(TaxAccount, on_delete=models.CASCADE, related_name='payments')
    
    # Payment details
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    
    # Reference numbers
    control_number = models.CharField(max_length=50, blank=True, unique=True, null=True)
    provider_reference = models.CharField(max_length=100, blank=True)
    
    # Approval fields (for admin approval workflow)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payments')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Payment {self.id} - {self.user.email} - {self.amount}"
    
    def generate_control_number(self):
        """Generate a unique control number"""
        import random
        import string
        prefix = "TXN"
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        self.control_number = f"{prefix}{random_str}"
        self.save()
        return self.control_number
    
    def mark_as_paid(self):
        """Mark payment as completed and update tax account"""
        self.status = 'Completed'
        self.completed_at = timezone.now()
        self.save()
        
        # Update tax account
        tax_account = self.tax_account
        tax_account.paid_amount += self.amount
        tax_account.calculate_outstanding()
