"""
Django signals for Municipal Tax System

Handles automatic Tax Due assignment when a new TaxAccount is created.
"""
from datetime import date, timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import TaxAccount


@receiver(post_save, sender=TaxAccount)
def auto_assign_tax_due_on_creation(sender, instance, created, **kwargs):
    """
    Automatically assign total_tax_due, outstanding_balance, and
    next_payment_due_date when a new TaxAccount is created.

    Uses the linked TaxType.default_amount as the initial tax due.
    Uses queryset.update() to avoid triggering this signal recursively.
    """
    if not created:
        return

    tax_type = instance.tax_type
    default_amount = getattr(tax_type, 'default_amount', 0) or 0

    # Only auto-assign if the account was created with zero tax due
    # (i.e., no explicit amount was provided by the caller)
    if instance.total_tax_due == 0 and default_amount > 0:
        due_date = date.today() + timedelta(days=365)

        # Use update() to avoid triggering post_save again
        TaxAccount.objects.filter(pk=instance.pk).update(
            total_tax_due=default_amount,
            outstanding_balance=default_amount,
            next_payment_due_date=due_date,
            status='Overdue',
        )
