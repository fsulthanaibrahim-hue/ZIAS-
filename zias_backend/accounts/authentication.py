from django.contrib.auth.backends import ModelBackend
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

User = get_user_model()

class PasswordExpiryBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        user = super().authenticate(request, username, password, **kwargs)
        if user and user.password_set_at:
            # Check if password is older than 3 days
            if timezone.now() - user.password_set_at > timedelta(days=3):
                # Option 1: Prevent login and force password change
                from django.contrib.auth import logout
                logout(request)
                raise Exception("Your password has expired. Please reset it using 'Forgot Password'.")
        return user