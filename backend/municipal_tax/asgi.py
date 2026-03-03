# municipal_tax/asgi.py
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'municipal_tax.settings')
application = get_asgi_application()