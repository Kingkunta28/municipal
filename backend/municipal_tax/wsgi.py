"""
WSGI config for Municipal Tax System project.
"""

import os

from django.core.wsgi import get_wsgi_application

settings_module = 'municipal_tax.deployment' if 'RENDER_EXTERNAL_HOSTNAME' in os.environ else 'municipal_tax.settings'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings_module)

application = get_wsgi_application()
