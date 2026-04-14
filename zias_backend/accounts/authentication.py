from django.contrib.auth.backends import ModelBackend
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

User = get_user_model()

class PasswordExpiryBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        user = super().authenticate(request, username, password, **kwargs)
        if user and user.password_changed_at:
            if timezone.now() - user.password_changed_at > timedelta(days=3):
                # Password expired – you can raise an exception or return None
                return None
        return user
    