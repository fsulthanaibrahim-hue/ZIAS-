// src/components/ChatList.jsx
import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { formatDistanceToNow } from 'date-fns';

const ChatList = ({ onSelectRoom, selectedRoomId }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFetched = useRef(false);   // ← prevent double call

  useEffect(() => {
    if (isFetched.current) return;
    isFetched.current = true;

    api.get('/chat-rooms/')
      .then(res => setRooms(res.data))
      .catch(err => {
        // silent error – you could add a user-friendly message if needed
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Loading chats...</div>;
  if (rooms.length === 0) return <div className="p-4 text-gray-500">No chat rooms yet.</div>;

  return (
    <div className="overflow-y-auto h-full">
      {rooms.map(room => (
        <div
          key={room.id}
          onClick={() => onSelectRoom(room)}
          className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedRoomId === room.id ? 'bg-gray-100' : ''}`}
        >
          <div className="font-medium">{room.other_user_name || 'Unknown'}</div>
          <div className="text-sm text-gray-500 truncate">
            {room.last_message?.content || 'No messages yet'}
          </div>
          <div className="text-xs text-gray-400">
            {room.last_message?.timestamp && formatDistanceToNow(new Date(room.last_message.timestamp), { addSuffix: true })}
          </div>
          {room.unread_count > 0 && (
            <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
              {room.unread_count}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatList;