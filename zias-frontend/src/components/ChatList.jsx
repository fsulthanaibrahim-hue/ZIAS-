// src/components/ChatList.jsx
import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';

const ChatList = ({ onSelectRoom, selectedRoomId }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const isFetched = useRef(false);

  // Helper: sort rooms by last_message timestamp descending (newest first)
  const sortRooms = (roomsArray) => {
    return [...roomsArray].sort((a, b) => {
      const timeA = a.last_message?.timestamp ? new Date(a.last_message.timestamp) : 0;
      const timeB = b.last_message?.timestamp ? new Date(b.last_message.timestamp) : 0;
      return timeB - timeA;
    });
  };

  // Fetch initial rooms
  useEffect(() => {
    if (isFetched.current) return;
    isFetched.current = true;
    api.get('/chat-rooms/')
      .then(res => setRooms(sortRooms(res.data)))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      // Update the room that received the message
      setRooms(prevRooms => {
        const updatedRooms = prevRooms.map(room => {
          if (room.id === msg.room_id) {
            // Update last_message and unread_count (if message is not from current user)
            const isOwnMessage = msg.sender_id === (JSON.parse(localStorage.getItem('user'))?.id);
            return {
              ...room,
              last_message: {
                content: msg.content,
                timestamp: msg.timestamp,
                sender_id: msg.sender_id
              },
              unread_count: isOwnMessage ? room.unread_count : (room.unread_count || 0) + 1
            };
          }
          return room;
        });
        // Re-sort after update
        return sortRooms(updatedRooms);
      });
    };

    socket.on('receive_message', handleNewMessage);
    return () => socket.off('receive_message', handleNewMessage);
  }, [socket]);

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
          <div className="font-medium flex justify-between">
            <span>{room.other_user_name || 'Unknown'}</span>
            {room.last_message?.timestamp && (
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(room.last_message.timestamp), { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {room.last_message?.content || 'No messages yet'}
          </div>
          {room.unread_count > 0 && (
            <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5 mt-1 inline-block">
              {room.unread_count}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatList;