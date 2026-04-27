import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from accounts.middleware import JwtAuthMiddleware
from accounts import routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zias_backend.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JwtAuthMiddleware(
        URLRouter(routing.websocket_urlpatterns)
    ),
})