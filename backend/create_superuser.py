#!/usr/bin/env python
"""Create a super admin user from environment variables."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'municipal_tax.settings')
django.setup()

from tax_app.models import User

email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not email or not password:
    raise SystemExit('Set DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD before running this script.')

email = email.strip().lower()

try:
    if User.objects.filter(email=email).exists():
        print(f'User with email {email} already exists.')
    else:
        User.objects.create_superuser(email, password)
        print(f'Super admin created successfully: {email}')
except Exception as exc:
    print(f'Error creating super admin: {exc}')
