"""
Service helpers for tax account lifecycle.
"""
from .models import TaxAccount, TaxType


DEFAULT_TAX_TYPE_NAME = "General Municipal Tax"
DEFAULT_TAX_TYPE_DESCRIPTION = (
    "Default tax type auto-created by the system for new registrations."
)


def get_or_create_default_tax_type():
    """
    Return an active tax type, creating one if the system has none.
    """
    tax_type = TaxType.objects.filter(is_active=True).first() or TaxType.objects.first()
    if tax_type:
        return tax_type

    return TaxType.objects.create(
        name=DEFAULT_TAX_TYPE_NAME,
        description=DEFAULT_TAX_TYPE_DESCRIPTION,
        default_amount=0,
        is_active=True,
    )


def ensure_user_tax_account(user):
    """
    Ensure the given user has a TaxAccount and return it.
    """
    tax_type = get_or_create_default_tax_type()
    tax_account, _ = TaxAccount.objects.get_or_create(
        user=user,
        defaults={"tax_type": tax_type},
    )
    return tax_account
