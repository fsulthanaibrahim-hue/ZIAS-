// src/services/socketio.js
import { io } from 'socket.io-client';

class SocketIOService {
    constructor() {
        this.socket = null;
    }

    connect(token) {
        this.socket = io('http://localhost:8000', {
            transports: ['websocket'],
            query: { token }
        });

        this.socket.on('connect', () => {
            console.log('Socket.IO connected');
            // After connection, join appropriate rooms
            this.joinUserTypeRoom();
            this.joinPrivateRoom();
        });

        this.socket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
        });
    }

    joinUserTypeRoom() {
        this.socket.emit('join_user_type_room');
    }

    joinPrivateRoom() {
        this.socket.emit('join_private_room');
    }

    // Broadcast to everyone
    sendBroadcast(message, timestamp = new Date().toISOString()) {
        this.socket.emit('broadcast_message', { message, timestamp });
    }

    // Send to specific user type (admin, student, mentor, reviewer)
    sendUserTypeMessage(userType, message, timestamp = new Date().toISOString()) {
        this.socket.emit('user_type_message', { user_type: userType, message, timestamp });
    }

    // Send private message to a specific user_id
    sendPrivateMessage(targetUserId, message, timestamp = new Date().toISOString()) {
        this.socket.emit('private_message', { target_user_id: targetUserId, message, timestamp });
    }

    // Listeners
    onBroadcast(callback) {
        this.socket.on('new_broadcast', callback);
    }

    onUserTypeMessage(callback) {
        this.socket.on('new_user_type_message', callback);
    }

    onPrivateMessage(callback) {
        this.socket.on('new_private_message', callback);
    }

    onJoinedRoom(callback) {
        this.socket.on('joined_room', callback);
    }
}

export default new SocketIOService();