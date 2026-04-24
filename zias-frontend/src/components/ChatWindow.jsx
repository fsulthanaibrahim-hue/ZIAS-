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

  useEffect(() => {
    if (!room) return;
    api.get(`/chat-rooms/${room.id}/messages/`).then(res => setMessages(res.data));
  }, [room]);

  useEffect(() => {
    if (!socket || !room) return;
    socket.emit('join_room', { room_id: room.id });
    socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('user_typing', ({ user_id, is_typing }) => {
      if (user_id !== user.id) setOtherTyping(is_typing);
    });
    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
    };
  }, [socket, room, user.id]);

  const sendMessage = () => {
    if (!input.trim()) return;
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

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg p-2 ${msg.sender_id === user.id ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
              {msg.content}
              <div className="text-xs text-right mt-1 opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        {otherTyping && <div className="text-gray-500 italic">Typing...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <input className="flex-1 border rounded-lg px-3 py-2" value={input} onChange={handleTyping} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." />
        <button onClick={sendMessage} className="bg-green-600 text-white px-4 py-2 rounded-lg">Send</button>
      </div>
    </div>
  );
};
export default ChatWindow;