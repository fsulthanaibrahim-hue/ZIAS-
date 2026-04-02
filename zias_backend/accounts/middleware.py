from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta

class PasswordExpiryMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only check if user attribute exists and user is authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Skip for the change password page and logout
            if request.path not in ['/change-password/', '/logout/']:
                if request.user.password_changed_at is None:
                    return redirect('/change-password/')
                expiry_days = 7
                if timezone.now() - request.user.password_changed_at > timedelta(days=expiry_days):
                    return redirect('/change-password/')
        return self.get_response(request)