# # accounts/consumers.py
# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from .models import ChatMessage, User

# class NotificationConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         print("[DEBUG] connect() called")
#         self.user = self.scope.get('user')
#         print(f"[DEBUG] user: {self.user}, authenticated: {self.user.is_authenticated if self.user else False}")

#         if self.user and self.user.is_authenticated:
#             try:
#                 # Check if channel layer is available
#                 if not self.channel_layer:
#                     print("[ERROR] Channel layer not configured!")
#                     await self.close()
#                     return

#                 # Join broadcast room
#                 await self.channel_layer.group_add("broadcast", self.channel_name)
#                 print("[DEBUG] Joined broadcast room")

#                 # Join user-type room
#                 user_type = await self.get_user_type()
#                 self.user_type_room = f"type_{user_type}"
#                 await self.channel_layer.group_add(self.user_type_room, self.channel_name)
#                 print(f"[DEBUG] Joined user-type room: {self.user_type_room}")

#                 # Join private room
#                 self.private_room = f"private_{self.user.id}"
#                 await self.channel_layer.group_add(self.private_room, self.channel_name)
#                 print(f"[DEBUG] Joined private room: {self.private_room}")

#                 await self.accept()
#                 print(f"✅ WebSocket connected: {self.user.username} (type: {user_type})")

#                 # Send past messages
#                 await self.send_previous_messages()
#             except Exception as e:
#                 print(f"[ERROR] Exception in connect(): {e}")
#                 await self.close()
#         else:
#             print("[DEBUG] User not authenticated, closing connection")
#             await self.close()

#     async def disconnect(self, close_code):
#         username = getattr(self.user, 'username', 'unknown') if hasattr(self, 'user') and self.user and self.user.is_authenticated else 'unknown'
#         print(f"❌ WebSocket disconnected: {username} (code: {close_code})")

#     async def receive(self, text_data):
#         try:
#             data = json.loads(text_data)
#         except json.JSONDecodeError:
#             return

#         msg_type = data.get('type')
#         message_text = data.get('message')
#         if not message_text:
#             return

#         sender = self.user.username
#         sender_id = self.user.id

#         # Save message to database
#         if msg_type == "broadcast":
#             await self.save_message('broadcast', None, message_text)
#             await self.channel_layer.group_send(
#                 "broadcast",
#                 {"type": "chat_message", "sender": sender, "message": message_text, "room": "broadcast"}
#             )
#         elif msg_type == "user_type":
#             target_type = data.get("target_type")
#             if target_type:
#                 await self.save_message('user_type', target_type, message_text)
#                 room = f"type_{target_type}"
#                 await self.channel_layer.group_send(
#                     room,
#                     {"type": "chat_message", "sender": sender, "message": message_text, "room": f"to {target_type}s"}
#                 )
#         elif msg_type == "private":
#             target_id = data.get("target_user_id")
#             if target_id:
#                 await self.save_message('private', target_id, message_text)
#                 room = f"private_{target_id}"
#                 await self.channel_layer.group_send(
#                     room,
#                     {"type": "chat_message", "sender": sender, "message": message_text, "room": f"private to user {target_id}"}
#                 )

#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             "type": "chat",
#             "sender": event["sender"],
#             "message": event["message"],
#             "room": event["room"]
#         }))

#     async def send_previous_messages(self):
#         """Send last 30 messages from all rooms to the newly connected user."""
#         try:
#             # Broadcast messages
#             broadcast_msgs = await self.get_messages('broadcast', None, limit=30)
#             for msg in broadcast_msgs:
#                 await self.send(text_data=json.dumps({
#                     "type": "chat",
#                     "sender": msg.sender.username,
#                     "message": msg.message,
#                     "room": "broadcast (past)"
#                 }))

#             # User‑type messages for this user's type
#             user_type = await self.get_user_type()
#             type_msgs = await self.get_messages('user_type', user_type, limit=30)
#             for msg in type_msgs:
#                 await self.send(text_data=json.dumps({
#                     "type": "chat",
#                     "sender": msg.sender.username,
#                     "message": msg.message,
#                     "room": f"to {user_type}s (past)"
#                 }))

#             # Private messages for this user
#             private_msgs = await self.get_messages('private', str(self.user.id), limit=30)
#             for msg in private_msgs:
#                 await self.send(text_data=json.dumps({
#                     "type": "chat",
#                     "sender": msg.sender.username,
#                     "message": msg.message,
#                     "room": "private (past)"
#                 }))
#         except Exception as e:
#             print(f"[ERROR] send_previous_messages: {e}")

#     @database_sync_to_async
#     def save_message(self, room_type, identifier, message_text):
#         return ChatMessage.objects.create(
#             sender=self.user,
#             room_type=room_type,
#             room_identifier=identifier,
#             message=message_text
#         )

#     @database_sync_to_async
#     def get_messages(self, room_type, identifier, limit=50):
#         queryset = ChatMessage.objects.filter(room_type=room_type)
#         if identifier is not None:
#             queryset = queryset.filter(room_identifier=identifier)
#         return list(queryset.order_by('-timestamp')[:limit][::-1])

#     @database_sync_to_async
#     def get_user_type(self):
#         if self.user.is_admin:
#             return "admin"
#         if self.user.is_student:
#             return "student"
#         if self.user.is_mentor:
#             return "mentor"
#         if self.user.is_reviewer:
#             return "reviewer"
#         return "unknown"


# accounts/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated:
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
        username = self.user.username if self.user.is_authenticated else 'unknown'
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
        # ✅ Pre‑fetch sender to avoid async‑unsafe lazy loading
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