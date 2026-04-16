from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.shortcuts import redirect
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


# NEW MIDDLEWARE – Weekly Dashboard Lock
class WeeklyDashboardLockMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated and request.user.is_student:
            # Only check for dashboard routes
            if request.path.startswith('/user/dashboard') or request.path == '/user/dashboard/':
                last_access = request.user.last_dashboard_access
                if last_access:
                    if timezone.now() - last_access > timedelta(days=7):
                        return redirect('/dashboard-lock/')
                else:
                    # If never accessed, set to now
                    request.user.last_dashboard_access = timezone.now()
                    request.user.save(update_fields=['last_dashboard_access'])
        return self.get_response(request)
    