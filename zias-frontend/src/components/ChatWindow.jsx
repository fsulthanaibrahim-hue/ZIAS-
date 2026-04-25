// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const ChatWindow = forwardRef(({ room }, ref) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const processedIds = useRef(new Set());

  useImperativeHandle(ref, () => ({
    clearMessages: () => setMessages([]),
  }));

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages when room changes
  useEffect(() => {
    if (!room) return;
    setLoading(true);
    api.get(`/chat-rooms/${room.id}/messages/`)
      .then(res => {
        setMessages(res.data);
        setTimeout(scrollToBottom, 100);
      })
      .catch(err => console.error('Failed to fetch messages:', err))
      .finally(() => setLoading(false));

    // Mark messages as read
    const markRead = async () => {
      try {
        await api.post(`chat-messages/mark-read/${room.id}/`);
        if (socket) socket.emit('mark_read', { room_id: room.id });
      } catch (err) {}
    };
    markRead();
  }, [room, socket]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket events
  useEffect(() => {
    if (!socket || !room) return;
    socket.emit('join_room', { room_id: room.id });

    const handleReceiveMessage = (msg) => {
      const msgRoomId = msg.room_id || msg.room;
      if (msgRoomId !== room.id) return;
      if (processedIds.current.has(msg.id)) return;
      processedIds.current.add(msg.id);
      
      setMessages(prev => [...prev, msg]);
      
      if (msg.sender_id !== user.id) {
        api.post(`chat-messages/mark-read/${room.id}/`).catch(() => {});
        socket.emit('mark_read', { room_id: room.id });
      }
    };

    const handleUserTyping = ({ user_id, is_typing }) => {
      if (user_id !== user.id) setOtherTyping(is_typing);
    };

    const handleMessagesRead = ({ room_id, read_by }) => {
      if (room_id === room.id && read_by !== user.id) {
        setMessages(prev =>
          prev.map(msg =>
            msg.sender_id === user.id ? { ...msg, is_read: true } : msg
          )
        );
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, room, user.id]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const tempId = Date.now();
    const optimistic = {
      id: tempId,
      content: input,
      sender_id: user.id,
      sender_name: user.username,
      timestamp: new Date().toISOString(),
      room_id: room.id,
      is_read: false,
    };
    processedIds.current.add(tempId);
    setMessages(prev => [...prev, optimistic]);
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

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!room) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-gray-400 mt-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg) => {
            // ✅ CRITICAL: Check if the message sender is the current logged-in user
            const isMine = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg px-3 py-2 ${isMine ? 'bg-green-600 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                  {!isMine && (
                    <div className="text-xs font-semibold text-green-600 mb-1">{msg.sender_name}</div>
                  )}
                  <div className="text-sm break-words">{msg.content}</div>
                  <div className={`text-xs text-right mt-1 flex items-center justify-end gap-1 ${isMine ? 'text-green-100' : 'text-gray-400'}`}>
                    {formatTime(msg.timestamp)}
                    {isMine && <span>{msg.is_read ? '✓✓' : '✓'}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {otherTyping && <div className="text-gray-500 text-sm italic ml-2">Typing...</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input Box */}
      <div className="bg-white border-t p-3 flex gap-2 flex-shrink-0">
        <input
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={input}
          onChange={handleTyping}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-green-600 text-white rounded-full px-4 py-2 hover:bg-green-700 transition">
          Send
        </button>
      </div>
    </div>
  );
});

export default ChatWindow;