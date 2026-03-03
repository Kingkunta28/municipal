from django.apps import AppConfig


class TaxAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tax_app'
    verbose_name = 'Municipal Tax Application'

    def ready(self):
        """Import signals so they are registered when the app is ready."""
        import tax_app.signals  # noqa: F401
