# accounts/middleware.py
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework import status

# -------------------------------------------------------------------
# 1. Password Expiry Middleware (HTTP)
# -------------------------------------------------------------------
class PasswordExpiryMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip media and static files
        if request.path.startswith('/media/') or request.path.startswith('/static/'):
            return self.get_response(request)

        if request.user.is_authenticated:
            expiry_days = settings.PASSWORD_EXPIRY_DAYS
            if request.user.password_changed_at:
                if timezone.now() - request.user.password_changed_at > timedelta(days=expiry_days):
                    # Return a JSON response for API calls, or redirect for HTML
                    if request.path.startswith('/api/'):
                        return Response(
                            {"detail": "Your password has expired. Please change it.", "code": "password_expired"},
                            status=status.HTTP_401_UNAUTHORIZED
                        )
                    else:
                        return redirect('/change-password/')
        return self.get_response(request)


# -------------------------------------------------------------------
# 2. Weekly Dashboard Lock Middleware (HTTP)
# -------------------------------------------------------------------
class WeeklyDashboardLockMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip media and static files
        if request.path.startswith('/media/') or request.path.startswith('/static/'):
            return self.get_response(request)

        if request.user.is_authenticated and request.user.is_student:
            if request.path.startswith('/user/dashboard'):
                last_access = request.user.last_dashboard_access
                if last_access:
                    if timezone.now() - last_access > timedelta(days=7):
                        return redirect('/dashboard-lock/')
                request.user.last_dashboard_access = timezone.now()
                request.user.save(update_fields=['last_dashboard_access'])
        return self.get_response(request)


# -------------------------------------------------------------------
# 3. JWT Authentication for WebSockets (Channels)
# -------------------------------------------------------------------
@database_sync_to_async
def get_user_from_token(token):
    try:
        print(f"[DEBUG] Validating token: {token[:50]}...")
        access_token = AccessToken(token)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=access_token['user_id'])
        print(f"[DEBUG] Found user: {user.username} (id={user.id})")
        return user
    except Exception as e:
        print(f"[DEBUG] Token error: {type(e).__name__}: {e}")
        return AnonymousUser()

class JwtAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        print(f"[AUTH] Query string: {query_string}")
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]
        if token:
            print(f"[AUTH] Token received: {token[:30]}...")
            user = await get_user_from_token(token)
            scope['user'] = user
            print(f"[AUTH] User: {user}, authenticated: {user.is_authenticated}")
        else:
            scope['user'] = AnonymousUser()
            print("[AUTH] No token, anonymous")
        return await self.app(scope, receive, send)