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
  const messagesEndRef = useRef(null);
  const initialLoadRef = useRef(true);
  const roomIdRef = useRef(null);

  // Expose "clearMessages" to parent component
  useImperativeHandle(ref, () => ({
    clearMessages: () => {
      setMessages([]);
    }
  }));

  // Fetch messages and mark as read when room changes
  useEffect(() => {
    if (!room) return;
    roomIdRef.current = room.id;

    // Fetch messages
    setLoading(true);
    api.get(`/chat-rooms/${room.id}/messages/`)
      .then(res => setMessages(res.data))
      .catch(err => console.error('Failed to fetch messages:', err))
      .finally(() => setLoading(false));

    // Mark messages as read (for messages sent by others)
    const markRead = async () => {
      try {
        await api.post(`chat-messages/mark-read/${room.id}/`);
        // Also emit socket event to notify the other user that messages are read
        if (socket) {
          socket.emit('mark_read', { room_id: room.id });
        }
      } catch (err) {
        console.error('Failed to mark messages as read:', err);
      }
    };
    markRead();

    // Cleanup not needed for this effect
  }, [room, socket]);

  // Scroll to bottom on new messages or first load
  useEffect(() => {
    if (messagesEndRef.current && !loading) {
      const behavior = initialLoadRef.current ? 'auto' : 'smooth';
      messagesEndRef.current.scrollIntoView({ behavior });
      initialLoadRef.current = false;
    }
  }, [messages, loading]);

  // WebSocket real‑time events
  useEffect(() => {
    if (!socket || !room) return;

    socket.emit('join_room', { room_id: room.id });

    const handleReceiveMessage = (msg) => {
      // Only add if message belongs to this room
      if (msg.room_id === room.id) {
        setMessages(prev => [...prev, msg]);
        // If the message is from someone else, mark as read immediately
        if (msg.sender_id !== user.id) {
          api.post(`chat-messages/mark-read/${room.id}/`).catch(console.error);
          socket.emit('mark_read', { room_id: room.id });
        }
      }
    };

    const handleUserTyping = ({ user_id, is_typing }) => {
      if (user_id !== user.id) setOtherTyping(is_typing);
    };

    const handleMessagesRead = ({ room_id, read_by }) => {
      if (room_id === room.id && read_by !== user.id) {
        // Update all messages sent by current user to is_read = true
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
    // Emit send_message – the server will broadcast to all in room
    socket.emit('send_message', {
      room_id: room.id,
      content: input,
      sender_id: user.id,
      sender_name: user.username,
      timestamp: new Date().toISOString()
    });
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

  // Helper to render double ticks
  const renderReadReceipt = (msg) => {
    if (msg.sender_id !== user.id) return null;
    return (
      <span className="ml-1 text-xs">
        {msg.is_read ? (
          <span className="text-blue-500 font-bold">✓✓</span>
        ) : (
          <span className="text-gray-400">✓✓</span>
        )}
      </span>
    );
  };

  if (!room) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center shadow-sm">
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
          {room.other_user_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="ml-3 flex-1">
          <div className="font-semibold text-gray-800">{room.other_user_name}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-gray-400 mt-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg px-3 py-2 ${isMine ? 'bg-green-600 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                  {!isMine && <div className="text-xs font-semibold text-green-600 mb-1">{msg.sender_name}</div>}
                  <div className="text-sm break-words">{msg.content}</div>
                  <div className={`text-xs text-right mt-1 flex items-center justify-end gap-1 ${isMine ? 'text-green-100' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {renderReadReceipt(msg)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {otherTyping && <div className="text-gray-500 text-sm italic ml-2">Typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-3 flex gap-2">
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