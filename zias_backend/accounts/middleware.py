from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status

class PasswordExpiryMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            expiry_days = settings.PASSWORD_EXPIRY_DAYS
            if request.user.password_changed_at:
                if timezone.now() - request.user.password_changed_at > timedelta(days=expiry_days):
                    return Response(
                        {"detail": "Your password has expired. Please change it.", "code": "password_expired"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
        return self.get_response(request)