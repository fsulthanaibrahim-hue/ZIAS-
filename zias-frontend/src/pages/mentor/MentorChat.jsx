// src/pages/mentor/MentorChat.jsx
import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/api";
import toast from "react-hot-toast";

function MentorChat() {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = useSocket();
  const { user } = useAuth();

  // Helper: extract reviewer name from room object
  const getReviewerName = (room) => {
    // Try common field names based on your backend response
    if (room.other_user_name) return room.other_user_name;
    if (room.reviewer_name) return room.reviewer_name;
    if (room.participants) {
      const reviewer = room.participants.find(p => p.role === "reviewer");
      if (reviewer) return reviewer.name || reviewer.username;
    }
    if (room.name) return room.name;
    return "Reviewer";
  };

  // Fetch chat rooms – only those where the other participant is a reviewer
  const fetchChatRooms = async () => {
    setLoadingRooms(true);
    try {
      // Use the same endpoint that returned 3.4 kB data
      const res = await API.get("chat-rooms/");
      console.log("Raw chat rooms response:", res.data);

      // Filter to keep only rooms where the other user is a reviewer
      // (assuming your backend sends `other_user_role` or participants list)
      let rooms = res.data;
      if (Array.isArray(rooms)) {
        rooms = rooms.filter(room => {
          // Logic depends on your actual room object structure
          // Common patterns:
          // 1) room.other_user_role === "reviewer"
          // 2) room.participants.some(p => p.role === "reviewer" && p.id !== user.id)
          // 3) room.type === "reviewer_chat"
          if (room.other_user_role) return room.other_user_role === "reviewer";
          if (room.participants) {
            const other = room.participants.find(p => p.id !== user.id);
            return other?.role === "reviewer";
          }
          // If no role info, assume the room is valid (fallback)
          return true;
        });
      }
      setChatRooms(rooms);
      console.log("Filtered chat rooms (reviewers only):", rooms);
    } catch (err) {
      console.error("Failed to load chat rooms", err);
      toast.error("Could not load chat list");
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  // Select a room and load messages
  const selectRoom = async (room) => {
    setSelectedRoom(room);
    setLoadingMessages(true);
    try {
      // Adjust the message endpoint to match your backend
      // Common possibilities:
      // - `/chat-rooms/${room.id}/messages/`
      // - `/messages/?room_id=${room.id}`
      const res = await API.get(`chat-rooms/${room.id}/messages/`);
      setMessages(res.data);
      // Mark messages as read (if needed)
      try {
        await API.post(`chat-messages/mark-read/${room.id}/`);
      } catch (err) {}
    } catch (err) {
      console.error("Failed to load messages", err);
      toast.error("Could not load messages");
    } finally {
      setLoadingMessages(false);
    }
    setIsMobileListVisible(false);
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real‑time message listener
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      if (msg.chatRoomId === selectedRoom?.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("new_message", onNewMessage);
    return () => socket.off("new_message", onNewMessage);
  }, [socket, selectedRoom]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    // Optimistic update
    const tempMessage = {
      id: Date.now(),
      text: newMessage,
      senderId: user.id,
      senderName: user.full_name || user.username,
      senderRole: "mentor",
      chatRoomId: selectedRoom.id,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    try {
      // Adjust send endpoint to match your backend
      await API.post("chat/send/", {
        chat_room_id: selectedRoom.id,
        text: newMessage,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    }
  };

  const clearChat = async () => {
    if (!selectedRoom) return;
    setConfirmClear(false);
    try {
      await API.delete(`chat-messages/clear/?room=${selectedRoom.id}`);
      setMessages([]);
      toast.success("Chat cleared successfully");
      setShowDropdown(false);
    } catch (err) {
      toast.error("Failed to clear chat");
    }
  };

  // Filter rooms by search term
  const filteredRooms = chatRooms.filter(room =>
    getReviewerName(room).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingRooms) {
    return <div className="flex items-center justify-center h-screen">Loading conversations...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Sidebar – list of reviewers */}
      <div className={`w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300 ${!isMobileListVisible ? 'hidden md:flex' : ''}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
          <p className="text-xs text-gray-500 mt-1">Chat with reviewers</p>
        </div>
        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search reviewer..."
              className="w-full bg-gray-100 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        {/* Room list */}
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {filteredRooms.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? "No matching reviewers" : "No conversations with reviewers yet"}
            </div>
          ) : (
            filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => selectRoom(room)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition hover:bg-gray-100 ${
                  selectedRoom?.id === room.id ? "bg-green-50 border-l-4 border-l-green-600" : ""
                }`}
              >
                <div className="font-medium text-gray-800">{getReviewerName(room)}</div>
                <div className="text-xs text-gray-400 truncate">
                  {room.last_message?.text || "Tap to start chatting"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
        {!selectedRoom ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg">Your messages</p>
              <p className="text-sm">Select a reviewer to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {getReviewerName(selectedRoom).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{getReviewerName(selectedRoom)}</h3>
                  <p className="text-xs text-gray-500">Reviewer</p>
                </div>
              </div>
              <div className="relative">
                <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 rounded-full hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                    <button onClick={() => setConfirmClear(true)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      Clear chat
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="text-center">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400">No messages yet. Say hello!</div>
              ) : (
                messages.map((msg) => {
                  const isMentor = msg.senderRole === "mentor" || msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMentor ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isMentor
                            ? "bg-green-600 text-white rounded-br-none"
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {!isMentor && (
                          <div className="text-xs font-semibold text-green-600 mb-1">
                            {msg.senderName || "Reviewer"}
                          </div>
                        )}
                        <p className="text-sm break-words">{msg.text}</p>
                        <div className="text-[10px] opacity-70 mt-1 text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={sendMessage} className="p-3 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Clear confirmation modal */}
      {confirmClear && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 z-50 border">
          <span className="text-sm font-medium">Clear all messages?</span>
          <button onClick={clearChat} className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">Yes</button>
          <button onClick={() => setConfirmClear(false)} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300">No</button>
        </div>
      )}
    </div>
  );
}

export default MentorChat;