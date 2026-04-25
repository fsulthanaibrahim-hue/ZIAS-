// src/pages/mentor/MentorChat.jsx
import { useState, useRef } from "react";
import ChatList from "../../components/ChatList";
import ChatWindow from "../../components/ChatWindow";
import API from "../../api/api";

function MentorChat() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [confirmClear, setConfirmClear] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ search state
  const chatWindowRef = useRef();

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleSelectRoom = async (room) => {
    setSelectedRoom(room);
    setIsMobileListVisible(false);
    try {
      await API.post(`chat-messages/mark-read/${room.id}/`);
    } catch (err) {}
  };

  const clearChat = async () => {
    if (!selectedRoom) return;
    setConfirmClear(false);
    try {
      await API.delete(`chat-messages/clear/?room=${selectedRoom.id}`);
      if (chatWindowRef.current) chatWindowRef.current.clearMessages();
      showToast("Chat cleared successfully", "success");
      setShowDropdown(false);
    } catch (err) {
      showToast("Failed to clear chat", "error");
    }
  };

  const requestClear = () => {
    setConfirmClear(true);
    setShowDropdown(false);
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className={`w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300 ${!isMobileListVisible ? 'hidden md:flex' : ''}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
        </div>
        <div className="p-3">
          <div className="relative">
            {/* ✅ Search input – bound to searchTerm */}
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-gray-100 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {/* ✅ Pass searchTerm to ChatList */}
          <ChatList
            onSelectRoom={handleSelectRoom}
            selectedRoomId={selectedRoom?.id}
            searchTerm={searchTerm}
          />
        </div>
      </div>

      {/* Main Chat Area (unchanged) */}
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
        {selectedRoom ? (
          <>
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {selectedRoom?.other_user_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedRoom?.other_user_name || "Unknown"}</h3>
                  <p className="text-xs text-green-600">Online</p>
                </div>
              </div>
              <div className="relative">
                <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100">
                    <button onClick={requestClear} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      Clear chat
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatWindow ref={chatWindowRef} room={selectedRoom} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg">Your messages</p>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Toasts (unchanged) */}
      {confirmClear && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 z-50 border border-gray-200">
          <span className="text-sm font-medium">Clear all messages?</span>
          <button onClick={clearChat} className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">Yes</button>
          <button onClick={() => setConfirmClear(false)} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300">No</button>
        </div>
      )}
      {toast.show && (
        <div className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-white text-sm z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default MentorChat;