import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const ChatWindow = ({ room }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch previous messages
  useEffect(() => {
    if (!room) return;
    api.get(`/chat-rooms/${room.id}/messages/`)
      .then(res => setMessages(res.data))
      .catch(err => console.error("Failed to fetch messages:", err));
  }, [room]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !room) return;
    console.log("Joining room:", room.id);
    socket.emit('join_room', { room_id: room.id });

    socket.on('receive_message', (msg) => {
      console.log("Received message:", msg);
      setMessages(prev => [...prev, msg]);
      if (msg.sender_id !== user.id) {
        socket.emit('mark_read', { room_id: room.id });
      }
    });
    socket.on('user_typing', ({ user_id, is_typing }) => {
      if (user_id !== user.id) setOtherTyping(is_typing);
    });
    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
    };
  }, [socket, room, user.id]);

  const sendMessage = () => {
    if (!input.trim()) {
      console.warn("Empty message ignored");
      return;
    }
    console.log("Sending message:", { room_id: room.id, content: input });
    socket.emit('send_message', { room_id: room.id, content: input });
    setInput('');
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    socket.emit('typing', { room_id: room.id, is_typing: true });
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit('typing', { room_id: room.id, is_typing: false });
    }, 1000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!room) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center shadow-sm">
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
          {room.other_user_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="ml-3">
          <div className="font-semibold text-gray-800">{room.other_user_name}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(msg => {
          const isMine = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg px-3 py-2 ${isMine ? 'bg-green-600 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                <div className="text-sm">{msg.content}</div>
                <div className={`text-xs mt-1 ${isMine ? 'text-green-100' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        {otherTyping && <div className="text-gray-500 text-sm italic">Typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-3 flex gap-2">
        <input
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={input}
          onChange={handleTyping}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-green-600 text-white rounded-full px-4 py-2 hover:bg-green-700 transition">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;