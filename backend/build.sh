#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail

python -m pip install --upgrade pip
python -m pip install -r requirements.txt

python manage.py migrate 
python manage.py collectstatic --noinput

if [[ -n "${DJANGO_SUPERUSER_EMAIL:-}" && -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]]; then
  python manage.py shell <<'PY'
import os
from tax_app.models import User

email = os.environ["DJANGO_SUPERUSER_EMAIL"].strip().lower()
password = os.environ["DJANGO_SUPERUSER_PASSWORD"]
first_name = os.environ.get("DJANGO_SUPERUSER_FIRST_NAME", "Admin")
last_name = os.environ.get("DJANGO_SUPERUSER_LAST_NAME", "User")

defaults = {
    "first_name": first_name,
    "last_name": last_name,
    "role": "Administrator",
    "is_staff": True,
    "is_superuser": True,
    "is_active": True,
}
user, created = User.objects.get_or_create(email=email, defaults=defaults)
if not created:
    user.first_name = first_name
    user.last_name = last_name
    user.role = "Administrator"
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
user.set_password(password)
user.save()
print(f"[build] superuser ready: {email}")
PY
else
  echo "[build] skipping superuser bootstrap (set DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD)"
fi

if [[ -n "${DJANGO_DEFAULT_USER_EMAIL:-}" && -n "${DJANGO_DEFAULT_USER_PASSWORD:-}" ]]; then
  python manage.py shell <<'PY'
import os
from tax_app.models import User

email = os.environ["DJANGO_DEFAULT_USER_EMAIL"].strip().lower()
password = os.environ["DJANGO_DEFAULT_USER_PASSWORD"]
first_name = os.environ.get("DJANGO_DEFAULT_USER_FIRST_NAME", "Default")
last_name = os.environ.get("DJANGO_DEFAULT_USER_LAST_NAME", "User")
role = os.environ.get("DJANGO_DEFAULT_USER_ROLE", "Taxpayer")

defaults = {
    "first_name": first_name,
    "last_name": last_name,
    "role": role,
    "is_staff": False,
    "is_superuser": False,
    "is_active": True,
}
user, created = User.objects.get_or_create(email=email, defaults=defaults)
if not created:
    user.first_name = first_name
    user.last_name = last_name
    user.role = role
    user.is_active = True
user.set_password(password)
user.save()
print(f"[build] default user ready: {email}")
PY
else
  echo "[build] skipping default user bootstrap (set DJANGO_DEFAULT_USER_EMAIL and DJANGO_DEFAULT_USER_PASSWORD)"
fi
