# zias_backend/socketio_app.py
import socketio
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs

User = get_user_model()

# Create a Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins='*',
    async_mode='asgi',
    logger=True,
    engineio_logger=True
)

# We'll attach this to an ASGI app later

@sio.event
async def connect(sid, environ):
    # Extract token from query string
    query_string = environ.get('QUERY_STRING', '')
    params = parse_qs(query_string)
    token = params.get('token', [None])[0]
    
    if not token:
        return False
    
    try:
        # Validate JWT and get user
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        user = await User.objects.aget(id=user_id)
        # Store user info in session
        sio.save_eio_session(sid, {'user_id': user.id, 'user_type': user.user_type})
        return True
    except Exception:
        return False

@sio.event
async def disconnect(sid):
    # Leave all rooms automatically (Socket.IO handles it)
    pass

# ----- Room management events -----
@sio.event
async def join_user_type_room(sid, data):
    """Client tells us which user type room to join."""
    session = await sio.get_eio_session(sid)
    user_type = session.get('user_type')
    if user_type:
        room_name = f"user_type_{user_type}"
        sio.enter_room(sid, room_name)
        await sio.emit('joined_room', {'room': room_name}, to=sid)

@sio.event
async def join_private_room(sid, data):
    """Join a private room named 'private_{user_id}' for one-to-one messaging."""
    session = await sio.get_eio_session(sid)
    user_id = session.get('user_id')
    if user_id:
        room_name = f"private_{user_id}"
        sio.enter_room(sid, room_name)
        await sio.emit('joined_room', {'room': room_name}, to=sid)

# ----- Messaging events -----
@sio.event
async def broadcast_message(sid, data):
    """Send message to all connected users."""
    message = data.get('message')
    sender_id = (await sio.get_eio_session(sid)).get('user_id')
    await sio.emit('new_broadcast', {
        'sender_id': sender_id,
        'message': message,
        'timestamp': data.get('timestamp')
    })

@sio.event
async def user_type_message(sid, data):
    """Send message to all users of a specific user type."""
    message = data.get('message')
    user_type = data.get('user_type')  # 'admin', 'student', etc.
    sender_id = (await sio.get_eio_session(sid)).get('user_id')
    room_name = f"user_type_{user_type}"
    await sio.emit('new_user_type_message', {
        'sender_id': sender_id,
        'user_type': user_type,
        'message': message,
        'timestamp': data.get('timestamp')
    }, room=room_name)

@sio.event
async def private_message(sid, data):
    """Send message to a specific user by their user_id."""
    message = data.get('message')
    target_user_id = data.get('target_user_id')
    sender_id = (await sio.get_eio_session(sid)).get('user_id')
    room_name = f"private_{target_user_id}"
    await sio.emit('new_private_message', {
        'sender_id': sender_id,
        'message': message,
        'timestamp': data.get('timestamp')
    }, room=room_name)