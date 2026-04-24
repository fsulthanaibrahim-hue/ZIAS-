import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import User, Student, Mentor, ChatRoom, ChatMessage

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return
        self.room_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        # notify others of online status (optional)
        await self.update_online_status(True)

    async def disconnect(self, close_code):
        await self.update_online_status(False)
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        if action == 'join_room':
            # student joins room with mentor_id
            mentor_id = data.get('mentor_id')
            if self.user.is_student:
                room = await self.get_or_create_room(mentor_id)
                self.room_id = room.id
                await self.channel_layer.group_add(f"room_{self.room_id}", self.channel_name)
        elif action == 'send_message':
            content = data.get('content')
            mentor_id = data.get('mentor_id')
            room = await self.get_or_create_room(mentor_id)
            message = await self.save_message(room.id, content)
            await self.channel_layer.group_send(
                f"room_{room.id}",
                {
                    'type': 'chat_message',
                    'message': message.content,
                    'sender_id': self.user.id,
                    'sender_name': self.user.username,
                    'timestamp': message.timestamp.isoformat(),
                }
            )
        elif action == 'typing':
            mentor_id = data.get('mentor_id')
            room = await self.get_or_create_room(mentor_id)
            await self.channel_layer.group_send(
                f"room_{room.id}",
                {
                    'type': 'typing_indicator',
                    'user_id': self.user.id,
                    'is_typing': data.get('is_typing'),
                }
            )
        elif action == 'mark_read':
            mentor_id = data.get('mentor_id')
            room = await self.get_or_create_room(mentor_id)
            await self.mark_messages_read(room.id)
            await self.channel_layer.group_send(
                f"room_{room.id}",
                {'type': 'read_receipt', 'user_id': self.user.id}
            )

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

    @database_sync_to_async
    def get_or_create_room(self, mentor_id):
        if self.user.is_student:
            student = Student.objects.get(user=self.user)
            mentor = Mentor.objects.get(id=mentor_id)
            room, _ = ChatRoom.objects.get_or_create(student=student, mentor=mentor)
            return room
        else:  # mentor
            mentor = Mentor.objects.get(user=self.user)
            student = Student.objects.get(id=mentor_id)
            room, _ = ChatRoom.objects.get_or_create(student=student, mentor=mentor)
            return room

    @database_sync_to_async
    def save_message(self, room_id, content):
        room = ChatRoom.objects.get(id=room_id)
        return ChatMessage.objects.create(room=room, sender=self.user, content=content)

    @database_sync_to_async
    def mark_messages_read(self, room_id):
        ChatMessage.objects.filter(room_id=room_id).exclude(sender=self.user).update(is_read=True)

    @database_sync_to_async
    def update_online_status(self, is_online):
        # optional: store status in a Redis set or model
        pass