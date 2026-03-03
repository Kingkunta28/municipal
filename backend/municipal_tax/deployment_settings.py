import os
import dj_database_url
from .settings import *
from .settings import BASE_DIR
from urllib.parse import urlparse

# Update the database configuration with the environment variable


def _to_origin(value, default="http://localhost"):
    """Return a clean origin (scheme + host[:port]) without path."""
    raw = (value or default).strip()
    if not raw:
        raw = default
    if "://" not in raw:
        raw = f"https://{raw}"

    parsed = urlparse(raw)
    if not parsed.netloc:
        return default
    return f"{parsed.scheme}://{parsed.netloc}"


def _to_host(value, default="localhost"):
    """Return only host[:port] for ALLOWED_HOSTS."""
    origin = _to_origin(value, default=f"https://{default}")
    return urlparse(origin).netloc


# Hardcoded production URLs
RENDER_EXTERNAL_HOSTNAME = "municipal-backend-3dc6.onrender.com"
FRONTEND_URL = "https://municipal-orpin.vercel.app"
FRONTEND_ORIGIN = _to_origin(FRONTEND_URL, default="http://localhost:5173")

ALLOWED_HOSTS = [_to_host(RENDER_EXTERNAL_HOSTNAME)]

CSRF_TRUSTED_ORIGINS = [
    _to_origin(RENDER_EXTERNAL_HOSTNAME, default="http://localhost"),
    FRONTEND_ORIGIN,
]

DEBUG = False

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY') or SECRET_KEY

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
]

CORS_ALLOWED_ORIGINS = [
    FRONTEND_ORIGIN,
]

# Render terminates TLS at the proxy; trust forwarded proto for secure checks.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

STORAGES = {
    'default': {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    'staticfiles': {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

database_url = os.environ.get('DATABASE_URL')
if database_url:
    DATABASES = {
        'default': dj_database_url.config(
            default=database_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
