import React, { useEffect, useState } from 'react';
import api from '../api';
import { formatDistanceToNow } from 'date-fns';

const ChatList = ({ onSelectRoom, selectedRoomId }) => {
  const [rooms, setRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    api.get('/chat-rooms/')
      .then(res => setRooms(res.data))
      .catch(err => console.error(err));
  }, []);

  // listen for online status updates (via WebSocket, but can also poll)
  // simplified: you can add a socket listener in a parent component

  return (
    <div className="h-full overflow-y-auto bg-white border-r">
      {rooms.length === 0 && (
        <div className="p-4 text-gray-500 text-center">No chats yet</div>
      )}
      {rooms.map(room => (
        <div
          key={room.id}
          onClick={() => onSelectRoom(room)}
          className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 transition ${
            selectedRoomId === room.id ? 'bg-gray-100' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-lg font-bold">
            {room.other_user_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <div className="flex justify-between">
              <span className="font-medium text-gray-800">{room.other_user_name}</span>
              <span className="text-xs text-gray-400">
                {room.last_message?.timestamp ? formatDistanceToNow(new Date(room.last_message.timestamp), { addSuffix: true }) : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 truncate">
                {room.last_message?.content || 'No messages yet'}
              </span>
              {room.unread_count > 0 && (
                <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                  {room.unread_count}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;