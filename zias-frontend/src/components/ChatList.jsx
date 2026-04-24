// src/components/ChatList.jsx
import React, { useEffect, useState } from 'react';
import api from '../api/api';

const ChatList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api.get('/chat-rooms/').then(res => setRooms(res.data));
  }, []);

  return (
    <div className="w-80 bg-white border-r overflow-y-auto">
      {rooms.map(room => (
        <div
          key={room.id}
          onClick={() => onSelectRoom(room)}
          className="p-3 border-b cursor-pointer hover:bg-gray-50"
        >
          <div className="font-medium">{room.mentor_name || room.student_name}</div>
          <div className="text-sm text-gray-500 truncate">
            {room.last_message?.content || 'No messages yet'}
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