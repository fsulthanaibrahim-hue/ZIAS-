// src/pages/mentor/MentorChat.jsx
import { useState } from "react";
import ChatList from "../../components/ChatList";
import ChatWindow from "../../components/ChatWindow";

const MentorChat = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);

  return (
    <div className="flex h-screen w-full">
      <div className="w-96 border-r border-gray-200">
        <ChatList onSelectRoom={setSelectedRoom} selectedRoomId={selectedRoom?.id} />
      </div>
      <div className="flex-1">
        {selectedRoom ? (
          <ChatWindow room={selectedRoom} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a chat
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorChat;