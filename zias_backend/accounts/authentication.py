from django.contrib.auth.backends import ModelBackend
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

class PasswordExpiryBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        user = super().authenticate(request, username, password, **kwargs)
        if user and user.password_changed_at:
            expiry_days = settings.PASSWORD_EXPIRY_DAYS
            if timezone.now() - user.password_changed_at > timedelta(days=expiry_days):
                return None
        return user