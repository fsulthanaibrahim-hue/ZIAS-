# accounts/consumers.py
import json
import re
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import User, ChatRoom, ChatMessage, Notification

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return
        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()
        await self.update_online_status(True)

    async def disconnect(self, close_code):
        await self.update_online_status(False)
        await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')
            room_id = data.get('room_id')
            content = data.get('content')
            is_typing = data.get('is_typing')

            if action == 'send_message':
                if not room_id or not content:
                    return
                # ❌ DO NOT save here – the HTTP POST already saved it.
                # Just broadcast the message to other users in the room.
                await self.channel_layer.group_send(
                    f"room_{room_id}",
                    {
                        'type': 'chat_message',
                        'message': content,
                        'sender_id': self.user.id,
                        'sender_name': await self.get_sender_name(self.user),
                        'timestamp': timezone.now().isoformat(),
                    }
                )
                # Optionally send notification to the recipient (using the bell)
                other_user = await self.get_other_user(room_id, self.user.id)
                if other_user:
                    unread_count = await self.get_unread_count(other_user.id)
                    await self.channel_layer.group_send(
                        f"user_{other_user.id}",
                        {
                            'type': 'notification',
                            'unread_count': unread_count,
                            'message': f"New message from {self.user.username}: {content[:50]}",
                            'link': f"/mentor/chat?room={room_id}",  # adjust as needed
                        }
                    )
            elif action == 'typing' and room_id is not None:
                await self.channel_layer.group_send(
                    f"room_{room_id}",
                    {
                        'type': 'typing_indicator',
                        'user_id': self.user.id,
                        'is_typing': is_typing,
                    }
                )
            elif action == 'mark_read' and room_id is not None:
                await self.mark_messages_read(room_id)
                await self.channel_layer.group_send(
                    f"room_{room_id}",
                    {'type': 'read_receipt', 'user_id': self.user.id}
                )
        except Exception as e:
            print(f"Error in receive: {e}")

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'timestamp': event['timestamp'],
        }))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'is_typing': event['is_typing'],
        }))

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'user_id': event['user_id'],
        }))

    # ---------- Database helpers ----------
    @database_sync_to_async
    def mark_messages_read(self, room_id):
        ChatMessage.objects.filter(room_id=room_id).exclude(sender=self.user).update(is_read=True)

    @database_sync_to_async
    def update_online_status(self, is_online):
        # optional: store online status (e.g., in Redis)
        pass

    @database_sync_to_async
    def get_sender_name(self, user):
        # Returns a readable name (full_name if exists, else cleaned username)
        if user.get_full_name():
            return user.get_full_name()
        # Try profile full_name if any (mentor/reviewer/student)
        profile = None
        if hasattr(user, 'mentor'):
            profile = user.mentor
        elif hasattr(user, 'reviewer'):
            profile = user.reviewer
        elif hasattr(user, 'student'):
            profile = user.student
        if profile and profile.full_name:
            return profile.full_name
        # Strip digits from username
        cleaned = re.sub(r'\d+$', '', user.username)
        return cleaned if cleaned else user.username

    @database_sync_to_async
    def get_other_user(self, room_id, current_user_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
            if room.mentor and room.mentor.user.id != current_user_id:
                return room.mentor.user
            if room.reviewer and room.reviewer.user.id != current_user_id:
                return room.reviewer.user
            if room.student and room.student.user.id != current_user_id:
                return room.student.user
        except ChatRoom.DoesNotExist:
            pass
        return None

    @database_sync_to_async
    def get_unread_count(self, user_id):
        from django.contrib.auth import get_user_model
        UserModel = get_user_model()
        user_obj = UserModel.objects.get(id=user_id)
        return Notification.objects.filter(user=user_obj, is_read=False).count()


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated:
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'unread_count': event['unread_count'],
            'message': event.get('message'),
            'link': event.get('link'),
        }))