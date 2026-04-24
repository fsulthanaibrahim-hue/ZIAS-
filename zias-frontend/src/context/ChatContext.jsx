// src/context/ChatContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!user || !token) return;
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`);
    wsRef.current = ws;
    ws.onopen = () => setSocket(ws);
    ws.onclose = () => setSocket(null);
    return () => ws.close();
  }, [user, token]);

  const sendMessage = (roomId, content) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'send_message',
        room_id: roomId,
        content,
      }));
    }
  };

  const joinRoom = (roomId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'join_room',
        room_id: roomId,
      }));
    }
  };

  const sendTyping = (roomId, isTyping) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'typing',
        room_id: roomId,
        is_typing: isTyping,
      }));
    }
  };

  const markRead = (roomId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'mark_read',
        room_id: roomId,
      }));
    }
  };

  return (
    <ChatContext.Provider value={{ socket, sendMessage, joinRoom, sendTyping, markRead }}>
      {children}
    </ChatContext.Provider>
  );
};