const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

io.use(async (socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error('No token'));
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/users/me/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    socket.user = response.data;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(`${socket.user.username} connected`);

  socket.on('join_room', ({ room_id }) => {
    socket.join(`room_${room_id}`);
  });

  socket.on('send_message', async ({ room_id, content }) => {
    if (!room_id || !content) return;
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat-messages/', {
        room: room_id,
        content: content
      }, {
        headers: { Authorization: `Bearer ${socket.handshake.query.token}` }
      });
      const saved = response.data;
      const normalized = {
        id: saved.id,
        content: saved.content,
        sender_id: saved.sender,
        sender_name: saved.sender_name,
        timestamp: saved.timestamp,
        room_id: saved.room,
        is_read: false
      };
      io.to(`room_${room_id}`).emit('receive_message', normalized);
    } catch (err) {
      console.error('Save failed:', err.response?.data);
    }
  });

  socket.on('typing', ({ room_id, is_typing }) => {
    socket.to(`room_${room_id}`).emit('user_typing', {
      user_id: socket.user.id,
      username: socket.user.username,
      is_typing
    });
  });

  socket.on('mark_read', async ({ room_id }) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/chat-messages/mark-read/${room_id}/`, {}, {
        headers: { Authorization: `Bearer ${socket.handshake.query.token}` }
      });
      socket.to(`room_${room_id}`).emit('messages_read', { room_id, read_by: socket.user.id });
    } catch (err) {}
  });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`Socket.IO server on port ${PORT}`));