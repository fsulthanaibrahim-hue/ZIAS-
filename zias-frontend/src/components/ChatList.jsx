import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';

const getOtherUserName = (room) => room.other_user_name || "Unknown";

const getLastMessageTime = (room) => {
  if (room.last_message?.timestamp) return new Date(room.last_message.timestamp);
  if (room.updated_at) return new Date(room.updated_at);
  if (room.created_at) return new Date(room.created_at);
  return new Date(0);
};

const sortRoomsByLatest = (rooms) =>
  [...rooms].sort((a, b) => getLastMessageTime(b) - getLastMessageTime(a));

const ChatList = ({ onSelectRoom, selectedRoomId, searchTerm = '' }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const isFetched = useRef(false);

  useEffect(() => {
    if (isFetched.current) return;
    isFetched.current = true;
    api.get('/chat-rooms/')
      .then(res => {
        // Ensure unique rooms by other_user_name
        const seen = new Set();
        const unique = res.data.filter(r => {
          const name = getOtherUserName(r);
          if (seen.has(name)) return false;
          seen.add(name);
          return true;
        });
        setRooms(sortRoomsByLatest(unique));
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Real‑time update when a new message arrives (from any room)
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      setRooms(prevRooms => {
        const updatedRooms = prevRooms.map(room => {
          if (room.id === msg.room_id) {
            const isOwnMessage = msg.sender_id === (JSON.parse(localStorage.getItem('user'))?.id);
            return {
              ...room,
              last_message: {
                content: msg.message,
                timestamp: msg.timestamp
              },
              updated_at: msg.timestamp,
              unread_count: isOwnMessage ? room.unread_count : (room.unread_count || 0) + 1
            };
          }
          return room;
        });
        return sortRoomsByLatest(updatedRooms);
      });
    };
    socket.on('receive_message', handleNewMessage);
    return () => socket.off('receive_message', handleNewMessage);
  }, [socket]);

  // Filter rooms by search term
  const filteredRooms = rooms.filter(room =>
    getOtherUserName(room).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-4 text-gray-500">Loading chats...</div>;
  if (filteredRooms.length === 0) {
    return searchTerm
      ? <div className="p-4 text-gray-500">No matching conversations</div>
      : <div className="p-4 text-gray-500">No chat rooms yet.</div>;
  }

  return (
    <div className="overflow-y-auto h-full">
      {filteredRooms.map(room => (
        <div
          key={room.id}
          onClick={() => onSelectRoom(room)}
          className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedRoomId === room.id ? 'bg-gray-100' : ''}`}
        >
          <div className="font-medium flex justify-between">
            <span>{getOtherUserName(room)}</span>
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