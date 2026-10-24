import os
from django.core.asgi import get_asgi_application

# 1. Set the environment variable first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zias_backend.settings')

# 2. Load Django's ASGI app FIRST (this initializes the apps)
django_asgi_app = get_asgi_application()

# 3. NOW it is safe to import your custom modules that depend on models
from channels.routing import ProtocolTypeRouter, URLRouter
from accounts.middleware import JwtAuthMiddleware
from accounts import routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JwtAuthMiddleware(
        URLRouter(routing.websocket_urlpatterns)
    ),
})