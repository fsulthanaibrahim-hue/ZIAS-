# accounts/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import models
from django.utils import timezone
from .models import ChatMessage, User

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user and self.user.is_authenticated:
            try:
                # Join broadcast room
                await self.channel_layer.group_add("broadcast", self.channel_name)
                # Join user-type room
                user_type = await self.get_user_type()
                self.type_room = f"type_{user_type}"
                await self.channel_layer.group_add(self.type_room, self.channel_name)
                # Join private room for this user
                self.private_room = f"private_{self.user.id}"
                await self.channel_layer.group_add(self.private_room, self.channel_name)
                
                await self.accept()
                print(f"✅ WebSocket connected: {self.user.username} (type: {user_type})")
                
                # Send previous messages
                await self.send_previous_messages()
            except Exception as e:
                print(f"Error during connect: {e}")
                await self.close()
        else:
            await self.close()

    async def disconnect(self, close_code):
        username = self.user.username if self.user and self.user.is_authenticated else 'unknown'
        print(f"❌ WebSocket disconnected: {username} (code: {close_code})")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')
            message = data.get('message')
            if not message:
                return

            sender = self.user.username
            sender_id = self.user.id
            timestamp = timezone.now().isoformat()

            if msg_type == "broadcast":
                await self.save_message('broadcast', None, message)
                await self.channel_layer.group_send("broadcast", {
                    "type": "chat_message",
                    "sender": sender,
                    "sender_id": sender_id,
                    "message": message,
                    "room": "broadcast",
                    "timestamp": timestamp
                })

            elif msg_type == "private":
                # Accept multiple possible field names
                target_id = data.get("target_user_id") or data.get("recipient_id") or data.get("to_user_id")
                if not target_id:
                    print("Private message missing target ID")
                    return

                target_user = await self.get_user_by_id(int(target_id))
                if not target_user or not target_user.is_active:
                    print(f"Cannot send to inactive user {target_id}")
                    return

                # Save message (room_identifier is the target user id for private messages)
                await self.save_message('private', str(target_id), message)

                # Payload includes all fields frontend expects
                payload = {
                    "type": "chat",
                    "sender": sender,
                    "sender_id": sender_id,
                    "message": message,
                    "room": "Private",
                    "recipient_id": target_id,
                    "target_user_id": target_id,
                    "timestamp": timestamp,
                }

                # Send to target's private room
                await self.channel_layer.group_send(f"private_{target_id}", payload)
                # Echo back to sender
                await self.channel_layer.group_send(f"private_{self.user.id}", payload)

            elif msg_type == "user_type":
                target_type = data.get("target_type")
                if target_type:
                    await self.save_message('user_type', target_type, message)
                    await self.channel_layer.group_send(f"type_{target_type}", {
                        "type": "chat_message",
                        "sender": sender,
                        "sender_id": sender_id,
                        "message": message,
                        "room": f"to {target_type}s",
                        "timestamp": timestamp
                    })

        except Exception as e:
            print(f"Error in receive: {e}")

    async def chat_message(self, event):
        """Called when a message is received from the group layer"""
        try:
            await self.send(text_data=json.dumps({
                "type": "chat",
                "sender": event.get("sender"),
                "sender_id": event.get("sender_id"),
                "message": event.get("message"),
                "room": event.get("room"),
                "recipient_id": event.get("recipient_id"),
                "target_user_id": event.get("target_user_id"),
                "timestamp": event.get("timestamp", timezone.now().isoformat())
            }))
        except Exception as e:
            print(f"Error sending chat message: {e}")

    async def send_previous_messages(self):
        """Send last 50 broadcast and private messages to the client"""
        try:
            # Broadcast messages
            broadcast_msgs = await self.get_messages('broadcast', None, 50)
            for msg in broadcast_msgs:
                await self.send(text_data=json.dumps({
                    "type": "chat",
                    "sender": msg.sender.username,
                    "sender_id": msg.sender.id,
                    "message": msg.message,
                    "room": "broadcast (past)",
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
                }))

            # Private messages involving this user
            private_msgs = await self.get_private_messages(self.user.id, 50)
            for msg in private_msgs:
                recipient_id = int(msg.room_identifier) if msg.room_identifier else None
                await self.send(text_data=json.dumps({
                    "type": "chat",
                    "sender": msg.sender.username,
                    "sender_id": msg.sender.id,
                    "message": msg.message,
                    "room": "private (past)",
                    "recipient_id": recipient_id,
                    "target_user_id": recipient_id,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
                }))
        except Exception as e:
            print(f"Error sending previous messages: {e}")

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
        qs = ChatMessage.objects.filter(room_type=room_type).select_related('sender')
        if identifier is not None:
            qs = qs.filter(room_identifier=identifier)
        return list(qs.order_by('-timestamp')[:limit][::-1])

    @database_sync_to_async
    def get_private_messages(self, user_id, limit):
        # Get all private messages where the user is either sender or recipient
        qs = ChatMessage.objects.filter(
            room_type='private'
        ).filter(
            models.Q(sender_id=user_id) | models.Q(room_identifier=str(user_id))
        ).select_related('sender').order_by('-timestamp')[:limit]
        return list(qs[::-1])

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