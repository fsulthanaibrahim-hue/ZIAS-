// src/pages/mentor/MentorChat.jsx
import { useState } from "react";
import ChatList from "../../components/ChatList";
import ChatWindow from "../../components/ChatWindow";

function MentorChat() {
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedMentorName, setSelectedMentorName] = useState("");

  return (
    <div className="flex h-screen">
      <ChatList
        onSelectMentor={(name, id) => {
          setSelectedMentorName(name);
          setSelectedMentor(id);
        }}
      />
      {selectedMentor ? (
        <ChatWindow mentorId={selectedMentor} mentorName={selectedMentorName} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Select a chat
        </div>
      )}
    </div>
  );
}

export default MentorChat;