import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const formatTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "";
  }
};

const formatDay = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const diff = today.setHours(0,0,0,0) - d.setHours(0,0,0,0);
  if (diff === 0) return "Today";
  if (diff === 86400000) return "Yesterday";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
};

const ChatWindow = forwardRef(({ room }, ref) => {
  if (!room) return null;

  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const limit = 20;

  useImperativeHandle(ref, () => ({
    clearMessages: () => setMessages([]),
  }));

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages from backend – assumes API returns oldest first (ascending)
  const fetchMessages = async (reset = false) => {
    if (!room?.id) return;
    if (reset) setLoading(true);
    else setLoadingOlder(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const res = await api.get(`/chat-rooms/${room.id}/messages/`, {
        params: { limit, offset: currentOffset } // backend orders by timestamp asc
      });
      let fetched = res.data.results || [];
      setHasMore(fetched.length === limit);
      if (reset) {
        setMessages(fetched);
        setOffset(limit);
        setTimeout(scrollToBottom, 100);
      } else if (fetched.length) {
        // Prepend older messages to the top
        setMessages(prev => [...fetched, ...prev]);
        setOffset(offset + limit);
        // Adjust scroll position
        const prevHeight = topRef.current?.scrollHeight;
        setTimeout(() => {
          const newHeight = topRef.current?.scrollHeight;
          if (prevHeight && newHeight) {
            topRef.current.scrollTop = newHeight - prevHeight;
          }
        }, 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load messages");
    } finally {
      if (reset) setLoading(false);
      else setLoadingOlder(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    const markRead = async () => {
      try {
        await api.post(`chat-messages/mark-read/${room.id}/`);
        if (socket) socket.emit('mark_read', { room_id: room.id });
      } catch (err) {}
    };
    markRead();
  }, [room]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket events
  useEffect(() => {
    if (!socket || !room) return;
    socket.emit('join_room', { room_id: room.id });
    const handleReceiveMessage = (msg) => {
      const senderId = msg.sender_id !== undefined ? msg.sender_id : msg.sender?.id;
      // Ignore messages that I sent – they are already added optimistically
      if (String(senderId) === String(user?.id)) return;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 100);
      if (senderId !== user?.id) {
        api.post(`chat-messages/mark-read/${room.id}/`).catch(() => {});
      }
    };
    const handleTyping = ({ user_id, is_typing }) => {
      if (user_id !== user?.id) setOtherTyping(is_typing);
    };
    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing', handleTyping);
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing', handleTyping);
    };
  }, [socket, room, user]);

  // Send message – optimistic + HTTP POST
  const sendMessage = async () => {
    if (!input.trim() || !room?.id) return;
    const text = input.trim();
    const tempId = Date.now();
    const optimistic = {
      id: tempId,
      content: text,
      sender_id: user.id,
      sender_name: user.full_name || user.username,
      timestamp: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    // Broadcast over WebSocket (so others in the room see it)
    socket.emit('send_message', { room_id: room.id, content: text });
    // Save to database via HTTP
    try {
      const res = await api.post('chat-messages/', { room: room.id, content: text });
      // Replace optimistic with real server data
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
    setTimeout(scrollToBottom, 100);
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket || !room) return;
    socket.emit('typing', { room_id: room.id, is_typing: true });
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit('typing', { room_id: room.id, is_typing: false });
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Group messages by day for better readability
  const groupedMessages = messages.reduce((acc, msg) => {
    const day = formatDay(msg.timestamp);
    if (!acc.length || acc[acc.length-1].day !== day) acc.push({ day, msgs: [] });
    acc[acc.length-1].msgs.push(msg);
    return acc;
  }, []);

  if (loading && messages.length === 0) return <div className="flex-1 flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50" ref={topRef}>
      <div className="flex-1 overflow-y-auto p-4">
        {hasMore && !loading && (
          <div className="text-center my-2">
            <button onClick={() => fetchMessages(false)} disabled={loadingOlder} className="text-sm text-blue-500 hover:underline">
              {loadingOlder ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No messages yet. Say hello!</div>
        ) : (
          groupedMessages.map(({ day, msgs }) => (
            <div key={day}>
              <div className="text-center text-xs text-gray-400 my-3">{day}</div>
              {msgs.map((msg, idx) => {
                const senderId = msg.sender_id !== undefined ? msg.sender_id : msg.sender?.id;
                const isOwn = String(senderId) === String(user?.id);
                const showName = idx === 0 || (msgs[idx-1]?.sender_id !== senderId && msgs[idx-1]?.sender?.id !== senderId);
                return (
                  <div key={msg.id} className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isOwn ? 'bg-green-600 text-white' : 'bg-white shadow-sm border'}`}>
                      {showName && !isOwn && (
                        <div className="text-xs font-semibold text-gray-500 mb-1">
                          {msg.sender_name || 'Unknown'}
                        </div>
                      )}
                      <div className="text-sm break-words">{msg.content}</div>
                      <div className="text-xs text-right mt-1 opacity-70">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        {otherTyping && <div className="text-gray-500 text-sm italic ml-2">Typing...</div>}
        <div ref={bottomRef} />
      </div>
      <div className="bg-white border-t p-3 flex gap-2">
        <input
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={input}
          onChange={handleTyping}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-green-600 text-white rounded-full px-4 py-2 hover:bg-green-700">Send</button>
      </div>
    </div>
  );
});

export default ChatWindow;