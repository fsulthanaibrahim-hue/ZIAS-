# accounts/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import User, ChatRoom, ChatMessage

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
                msg = await self.save_message(room_id, content)
                await self.channel_layer.group_send(
                    f"room_{room_id}",
                    {
                        'type': 'chat_message',
                        'message': msg.content,
                        'sender_id': msg.sender.id,
                        'sender_name': self.get_sender_name(msg.sender),
                        'timestamp': msg.timestamp.isoformat(),
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

    @database_sync_to_async
    def save_message(self, room_id, content):
        room = ChatRoom.objects.get(id=room_id)
        return ChatMessage.objects.create(room=room, sender=self.user, content=content)

    @database_sync_to_async
    def mark_messages_read(self, room_id):
        ChatMessage.objects.filter(room_id=room_id).exclude(sender=self.user).update(is_read=True)

    @database_sync_to_async
    def update_online_status(self, is_online):
        # optional: store online status (e.g., in Redis)
        pass


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated:
            self.group_name = f'notifications_{self.user.id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        async def send_notification(self, event):
            await self.send(text_data=json.dumps({
                'message': event['message'],
                'unread_count': event['unread_count']   
                }))