// src/services/chatService.js
class ChatService {
    constructor() {
        this.ws = null;
    }

    connect(token) {
        this.ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);
        this.ws.onopen = () => console.log('Connected to chat');
        this.ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'chat') {
                // Handle chat message
                console.log(data);
            }
        };
    }

    sendBroadcast(message) {
        this.ws.send(JSON.stringify({ type: 'broadcast', message }));
    }

    sendToUserType(targetType, message) {
        this.ws.send(JSON.stringify({ type: 'user_type', target_type: targetType, message }));
    }

    sendPrivate(targetUserId, message) {
        this.ws.send(JSON.stringify({ type: 'private', target_user_id: targetUserId, message }));
    }
}

export default new ChatService();