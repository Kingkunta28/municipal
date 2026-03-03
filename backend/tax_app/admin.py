"""
Admin configuration for tax_app
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, TaxpayerProfile, TaxType, TaxAccount, PaymentRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'role', 'account_status', 'is_active', 'last_login_time']
    list_filter = ['role', 'account_status', 'is_active']
    search_fields = ['email']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'role')}),
        ('Account', {'fields': ('account_status', 'last_login_time')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )


@admin.register(TaxpayerProfile)
class TaxpayerProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'national_id_number', 'taxpayer_type', 'registration_date']
    list_filter = ['taxpayer_type', 'gender']
    search_fields = ['first_name', 'last_name', 'national_id_number', 'user__email']
    raw_id_fields = ['user']


@admin.register(TaxType)
class TaxTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'default_amount', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']
    fields = ['name', 'description', 'default_amount', 'is_active']


@admin.register(TaxAccount)
class TaxAccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'tax_type', 'total_tax_due', 'paid_amount', 'outstanding_balance', 'status']
    list_filter = ['status', 'tax_type']
    search_fields = ['user__email']
    raw_id_fields = ['user']


@admin.register(PaymentRequest)
class PaymentRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'amount', 'payment_method', 'status', 'control_number', 'created_at']
    list_filter = ['status', 'payment_method']
    search_fields = ['user__email', 'control_number', 'provider_reference']
    raw_id_fields = ['user', 'tax_account']
    readonly_fields = ['control_number', 'provider_reference', 'created_at', 'updated_at']
