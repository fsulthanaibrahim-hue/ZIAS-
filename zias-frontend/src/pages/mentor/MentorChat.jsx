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
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = useSocket();
  const { user } = useAuth();

  // Helper: get other user's name (no fallback to "Reviewer")
  const getOtherUserName = (room) => {
    return room.other_user_name || "Unknown";
  };

  // Helper: get last message timestamp for sorting
  const getLastMessageTime = (room) => {
    if (room.last_message?.timestamp) return new Date(room.last_message.timestamp);
    if (room.created_at) return new Date(room.created_at);
    return new Date(0);
  };

  const sortRoomsByLatest = (rooms) => {
    return [...rooms].sort((a, b) => getLastMessageTime(b) - getLastMessageTime(a));
  };

  // ✅ Load messages using your API endpoint
  const loadMessages = async (roomId) => {
    setLoadingMessages(true);
    try {
      const response = await API.get("chat-messages/", { params: { room: roomId } });
      let fetchedMessages = [];
      if (Array.isArray(response.data)) fetchedMessages = response.data;
      else if (response.data.results) fetchedMessages = response.data.results;

      const normalized = fetchedMessages
        .map(msg => ({
          id: msg.id,
          text: msg.content,
          senderId: msg.sender,
          senderName: msg.sender_name,
          createdAt: msg.timestamp,
        }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // oldest first
      setMessages(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Could not load messages");
    } finally {
      setLoadingMessages(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // ✅ Fetch rooms, deduplicate, and restore selected room
  useEffect(() => {
    let isMounted = true;
    const fetchAndRestore = async () => {
      try {
        const res = await API.get("chat-rooms/");
        if (!isMounted) return;
        let rooms = res.data;

        // Deduplicate by other_user_name (or other_user_id)
        const seen = new Set();
        const uniqueRooms = rooms.filter(room => {
          const key = getOtherUserName(room);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const sorted = sortRoomsByLatest(uniqueRooms);
        setChatRooms(sorted);

        const savedRoomId = localStorage.getItem("lastSelectedRoomId");
        let roomToSelect = null;
        if (savedRoomId) {
          roomToSelect = sorted.find(r => r.id === parseInt(savedRoomId));
        }
        if (!roomToSelect && sorted.length > 0) {
          roomToSelect = sorted[0];
        }
        if (roomToSelect) {
          setSelectedRoom(roomToSelect);
          await loadMessages(roomToSelect.id);
        }
      } catch (err) {
        console.error(err);
        toast.error("Could not load conversations");
      } finally {
        if (isMounted) setLoadingRooms(false);
      }
    };
    fetchAndRestore();
    return () => { isMounted = false; };
  }, []);

  // Manual room selection
  const selectRoom = async (room) => {
    if (room.id === selectedRoom?.id) return;
    setSelectedRoom(room);
    localStorage.setItem("lastSelectedRoomId", room.id);
    await loadMessages(room.id);
    setIsMobileListVisible(false);
  };

  // Auto-scroll after messages change
  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingMessages]);

  // WebSocket listener – matches your backend's 'chat_message' event
  useEffect(() => {
    if (!socket) return;
    const onChatMessage = (data) => {
      if (!selectedRoom) return;
      const newMsg = {
        id: Date.now(),
        text: data.message,
        senderId: data.sender_id,
        senderName: data.sender_name,
        createdAt: data.timestamp,
      };
      setMessages(prev => [...prev, newMsg]);
      // Update last message in the room list and re-sort
      setChatRooms(prev =>
        sortRoomsByLatest(
          prev.map(room =>
            room.id === selectedRoom.id
              ? {
                  ...room,
                  updated_at: new Date().toISOString(),
                  last_message: { content: data.message, timestamp: data.timestamp }
                }
              : room
          )
        )
      );
    };
    socket.on("chat_message", onChatMessage);
    return () => socket.off("chat_message", onChatMessage);
  }, [socket, selectedRoom]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    const tempId = Date.now();
    const tempMsg = {
      id: tempId,
      text: newMessage,
      senderId: user?.id,
      senderName: user?.full_name || user?.username,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    const messageText = newMessage;
    setNewMessage("");

    // Optimistically update room list
    setChatRooms(prev =>
      sortRoomsByLatest(
        prev.map(room =>
          room.id === selectedRoom.id
            ? { ...room, updated_at: new Date().toISOString(), last_message: { content: messageText, timestamp: new Date().toISOString() } }
            : room
        )
      )
    );

    try {
      await API.post("chat-messages/", {
        room: selectedRoom.id,
        content: messageText,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send");
      // Rollback
      setMessages(prev => prev.filter(m => m.id !== tempId));
      const res = await API.get("chat-rooms/");
      const uniqueRes = res.data.filter((room, index, self) =>
        index === self.findIndex(r => getOtherUserName(r) === getOtherUserName(room))
      );
      setChatRooms(sortRoomsByLatest(uniqueRes));
    }
  };

  const filteredRooms = chatRooms.filter(room =>
    getOtherUserName(room).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingRooms) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Sidebar – room list, deduplicated */}
      <div className={`w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300 ${!isMobileListVisible ? "hidden md:flex" : ""}`}>
        <div className="p-4 border-b border-gray-100"><h2 className="text-xl font-semibold text-gray-800">Messages</h2></div>
        <div className="p-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-gray-100 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {filteredRooms.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No conversations</div>
          ) : (
            filteredRooms.map(room => (
              <button
                key={room.id}
                onClick={() => selectRoom(room)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition hover:bg-gray-100 ${selectedRoom?.id === room.id ? "bg-green-50 border-l-4 border-l-green-600" : ""}`}
              >
                <div className="font-medium text-gray-800">{getOtherUserName(room)}</div>
                <div className="text-xs text-gray-400 truncate">{room.last_message?.content || "No messages yet"}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedRoom ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Select a conversation to start chatting</div>
        ) : (
          <>
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {getOtherUserName(selectedRoom).charAt(0).toUpperCase()}
                </div>
                <div><h3 className="font-semibold text-gray-800">{getOtherUserName(selectedRoom)}</h3></div>
              </div>
              <button onClick={() => setIsMobileListVisible(true)} className="md:hidden p-2 rounded-full hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {loadingMessages ? (
                  <div className="text-center">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400">No messages yet. Say hello!</div>
                ) : (
                  messages.map(msg => {
                    const isOwn = msg.senderId === user?.id;
                    const displayName = isOwn ? "You" : (msg.senderName || getOtherUserName(selectedRoom));
                    let formattedDate = "Invalid date";
                    if (msg.createdAt) {
                      try { formattedDate = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch (e) {}
                    }
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] ${isOwn ? "bg-green-600 text-white rounded-l-xl rounded-tr-xl" : "bg-white border border-gray-200 text-gray-800 rounded-r-xl rounded-tl-xl"} px-4 py-2 shadow-sm`}>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-xs font-medium ${isOwn ? "text-green-100" : "text-green-700"}`}>{displayName}</span>
                            <span className={`text-[10px] ${isOwn ? "text-green-200" : "text-gray-400"}`}>{formattedDate}</span>
                          </div>
                          <p className="text-sm break-words mt-0.5">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={sendMessage} className="p-3 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">Send</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default MentorChat;