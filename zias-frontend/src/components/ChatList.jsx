import React, { useEffect, useState } from 'react';
import api from '../api';

const ChatList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/chat-rooms/')
      .then(res => setRooms(res.data))
      .catch(err => console.error('Failed to fetch rooms', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading chats...</div>;
  if (rooms.length === 0) return <div className="p-4 text-gray-500">No chat rooms yet.</div>;

  return (
    <div className="overflow-y-auto h-full">
      {rooms.map(room => (
        <div
          key={room.id}
          onClick={() => onSelectRoom(room)}
          className="p-3 border-b cursor-pointer hover:bg-gray-50"
        >
          <div className="font-medium">{room.mentor_name || room.student_name}</div>
          <div className="text-sm text-gray-500 truncate">
            {room.last_message || 'No messages yet'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;