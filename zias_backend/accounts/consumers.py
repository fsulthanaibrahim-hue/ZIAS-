# accounts/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, User

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user and self.user.is_authenticated:
            await self.channel_layer.group_add("broadcast", self.channel_name)
            user_type = await self.get_user_type()
            self.type_room = f"type_{user_type}"
            await self.channel_layer.group_add(self.type_room, self.channel_name)
            self.private_room = f"private_{self.user.id}"
            await self.channel_layer.group_add(self.private_room, self.channel_name)
            await self.accept()
            print(f"✅ WebSocket connected: {self.user.username} (type: {user_type})")
            await self.send_previous_messages()
        else:
            await self.close()

    async def disconnect(self, close_code):
        username = self.user.username if self.user and self.user.is_authenticated else 'unknown'
        print(f"❌ WebSocket disconnected: {username}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type')
        message = data.get('message')
        if not message:
            return
        sender = self.user.username
        if msg_type == "broadcast":
            await self.save_message('broadcast', None, message)
            await self.channel_layer.group_send("broadcast", {"type": "chat_message", "sender": sender, "message": message, "room": "broadcast"})
        elif msg_type == "user_type":
            target = data.get("target_type")
            if target:
                await self.save_message('user_type', target, message)
                await self.channel_layer.group_send(f"type_{target}", {"type": "chat_message", "sender": sender, "message": message, "room": f"to {target}s"})
        elif msg_type == "private":
            target_id = data.get("target_user_id")
            if target_id:
                # ✅ Check if target user exists and is active
                target_user = await self.get_user_by_id(target_id)
                if not target_user or not target_user.is_active:
                    print(f"❌ Private message to inactive/deleted user {target_id} ignored")
                    return
                await self.save_message('private', target_id, message)
                await self.channel_layer.group_send(f"private_{target_id}", {"type": "chat_message", "sender": sender, "message": message, "room": f"private to user {target_id}"})

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "chat", "sender": event["sender"], "message": event["message"], "room": event["room"]}))

    async def send_previous_messages(self):
        # Broadcast messages
        for msg in await self.get_messages('broadcast', None, 30):
            await self.send(text_data=json.dumps({"type": "chat", "sender": msg.sender.username, "message": msg.message, "room": "broadcast (past)"}))
        # User‑type messages
        user_type = await self.get_user_type()
        for msg in await self.get_messages('user_type', user_type, 30):
            await self.send(text_data=json.dumps({"type": "chat", "sender": msg.sender.username, "message": msg.message, "room": f"to {user_type}s (past)"}))
        # Private messages
        for msg in await self.get_messages('private', str(self.user.id), 30):
            await self.send(text_data=json.dumps({"type": "chat", "sender": msg.sender.username, "message": msg.message, "room": "private (past)"}))

    @database_sync_to_async
    def save_message(self, room_type, identifier, message_text):
        return ChatMessage.objects.create(
            sender=self.user,
            room_type=room_type,
            room_identifier=identifier,
            message=message_text
        )

    @database_sync_to_async
    def get_messages(self, room_type, identifier, limit):
        # Pre‑fetch sender to avoid async‑unsafe lazy loading
        qs = ChatMessage.objects.filter(room_type=room_type).select_related('sender')
        if identifier is not None:
            qs = qs.filter(room_identifier=identifier)
        return list(qs.order_by('-timestamp')[:limit][::-1])

    @database_sync_to_async
    def get_user_type(self):
        if self.user.is_admin:
            return "admin"
        if self.user.is_student:
            return "student"
        if self.user.is_mentor:
            return "mentor"
        if self.user.is_reviewer:
            return "reviewer"
        return "unknown"

    @database_sync_to_async
    def get_user_by_id(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None