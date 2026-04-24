// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const axios = require('axios');
// const cors = require('cors');

// const app = express();
// app.use(cors());
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
// });

// const userSockets = new Map();

// io.use(async (socket, next) => {
//   const token = socket.handshake.query.token;
//   if (!token) return next(new Error('No token'));
//   try {
//     const response = await axios.get('http://127.0.0.1:8000/api/users/me/', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     socket.user = response.data;
//     next();
//   } catch (err) {
//     next(new Error('Authentication failed'));
//   }
// });

// io.on('connection', (socket) => {
//   const user = socket.user;
//   console.log(`${user.username} connected`);
//   userSockets.set(user.id, socket.id);

//   socket.on('join_room', ({ room_id }) => {
//     socket.join(`room_${room_id}`);
//   });

//   socket.on('send_message', async ({ room_id, content }) => {
//     try {
//       const response = await axios.post('http://127.0.0.1:8000/api/chat-messages/', {
//         room_id, content
//       }, {
//         headers: { Authorization: `Bearer ${socket.handshake.query.token}` }
//       });
//       const message = response.data;
//       io.to(`room_${room_id}`).emit('receive_message', message);
//     } catch (err) {
//       console.error('Save message failed', err.response?.data);
//     }
//   });

//   socket.on('typing', ({ room_id, is_typing }) => {
//     socket.to(`room_${room_id}`).emit('user_typing', {
//       user_id: user.id,
//       username: user.username,
//       is_typing
//     });
//   });

//   socket.on('disconnect', () => {
//     userSockets.delete(user.id);
//     console.log(`${user.username} disconnected`);
//   });
// });

// const PORT = 3001;
// server.listen(PORT, () => {
//   console.log(`Socket.IO server running on http://localhost:${PORT}`);
// });