// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const ChatWindow = ({ room }) => {
  const { user } = useAuth();
  const { socket, sendMessage, sendTyping, markRead } = useChat();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch previous messages
  useEffect(() => {
    if (!room) return;
    api.get(`/chat-rooms/${room.id}/messages/`).then(res => setMessages(res.data));
  }, [room]);

  // Join room and set up event listeners
  useEffect(() => {
    if (!socket || !room) return;

    // Send 'join_room' event
    socket.send(JSON.stringify({ action: 'join_room', room_id: room.id }));

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setMessages(prev => [...prev, {
          id: data.id,
          content: data.message,
          sender_id: data.sender_id,
          sender_name: data.sender_name,
          timestamp: data.timestamp,
        }]);
        // Mark message as read if not from current user
        if (data.sender_id !== user.id) {
          markRead(room.id);
        }
      } else if (data.type === 'typing') {
        setOtherTyping(data.is_typing && data.user_id !== user.id);
      } else if (data.type === 'read_receipt') {
        // Optionally update read status in UI
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, room, user.id, markRead]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(room.id, input);
    setInput('');
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    sendTyping(room.id, true);
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => sendTyping(room.id, false), 1000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!room) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="p-3 border-b bg-gray-50 font-semibold">
        {room.mentor_name || room.student_name}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg p-2 ${msg.sender_id === user.id ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
              <div className="text-sm">{msg.content}</div>
              <div className="text-xs text-right mt-1 opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {otherTyping && <div className="text-gray-500 text-sm italic">Typing...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
          value={input}
          onChange={handleTyping}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
        />
        <button onClick={handleSend} className="bg-green-600 text-white px-4 py-2 rounded-lg">Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;