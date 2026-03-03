"""
URL configuration for Municipal Tax System project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tax_app.urls')),
]
