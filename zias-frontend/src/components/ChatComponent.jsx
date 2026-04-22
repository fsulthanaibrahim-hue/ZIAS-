// src/components/ChatComponent.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import API from "../api/api";

let globalUsersFetched = false;
let isFetchingUsers = false;
let globalHistoryFetched = false;
let isFetchingHistory = false;

function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [wsStatus, setWsStatus] = useState("Connecting...");
  const [isReady, setIsReady] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const token = localStorage.getItem("access_token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUsername = currentUser.username || "";
  const currentUserId = currentUser.id || null;

  // ---------- Helper: format timestamp ----------
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return timeStr;
    if (isYesterday) return `Yesterday ${timeStr}`;
    const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${dateStr} ${timeStr}`;
  };

  // ---------- Filter messages based on selected contact ----------
  const getFilteredMessages = () => {
    if (!selectedContact) {
      // No contact selected: show only broadcast messages
      return messages.filter(msg => 
        msg.room === "Broadcast" || msg.room === "broadcast (past)"
      );
    }
    // Contact selected: show broadcast + private messages involving this contact
    return messages.filter(msg => {
      // Always show broadcast messages
      if (msg.room === "Broadcast" || msg.room === "broadcast (past)") return true;
      // Show private messages where the other party is the selected contact
      if (msg.room === "Private" || msg.room === "private (past)") {
        // If we have sender_id and room_identifier, use them
        if (msg.sender_id === selectedContact.id || msg.room_identifier === String(selectedContact.id)) {
          return true;
        }
        // Fallback: show all private messages (less accurate)
        return true;
      }
      return false;
    });
  };

  const displayedMessages = getFilteredMessages();

  // ---------- Fetch users (once) ----------
  useEffect(() => {
    const fetchUsers = async () => {
      if (globalUsersFetched || isFetchingUsers) return;
      isFetchingUsers = true;
      try {
        const res = await API.get("users/");
        setAllUsers(res.data);
        globalUsersFetched = true;
      } catch (err) {
        console.warn("Could not fetch users", err);
      } finally {
        isFetchingUsers = false;
      }
    };
    fetchUsers();
  }, []);

  // Filter users based on role selection
  useEffect(() => {
    if (roleFilter === "all") {
      setFilteredUsers(allUsers);
    } else {
      setFilteredUsers(allUsers.filter((u) => u.user_type === roleFilter));
    }
  }, [roleFilter, allUsers]);

  // ---------- Fetch chat history (once) ----------
  const fetchHistory = async () => {
    if (globalHistoryFetched || isFetchingHistory) return;
    isFetchingHistory = true;
    try {
      const [broadcastRes, privateRes] = await Promise.all([
        API.get("chat-history/?room_type=broadcast"),
        API.get("chat-history/?room_type=private").catch(() => ({ data: [] })),
      ]);
      const broadcastMsgs = broadcastRes.data.map((m) => ({ ...m, room: "Broadcast" }));
      const privateMsgs = privateRes.data.map((m) => ({ ...m, room: "Private" }));
      const all = [...broadcastMsgs, ...privateMsgs];
      all.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMessages(all);
      globalHistoryFetched = true;
    } catch (err) {
      console.error("History fetch error", err);
    } finally {
      isFetchingHistory = false;
    }
  };

  // ---------- WebSocket connection ----------
  const connect = useCallback(() => {
    if (!token) return;
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    )
      return;

    const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Chat WebSocket opened");
      setWsStatus("Connected ✅");
      setIsReady(true);
      if (!globalHistoryFetched) fetchHistory();
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat") {
          if (!data.timestamp) data.timestamp = new Date().toISOString();
          setMessages((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("Parse error", err);
      }
    };
    ws.onerror = (err) => {
      console.error("WebSocket error", err);
      setWsStatus("Error ❌");
      setIsReady(false);
    };
    ws.onclose = () => {
      console.log("WebSocket closed");
      setWsStatus("Disconnected ❌");
      setIsReady(false);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
    };
  }, [connect]);

  // ---------- Send message ----------
  const sendMessage = (type, extra = {}) => {
    if (!inputMessage.trim()) return;
    if (!isReady || wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not ready");
      return;
    }
    wsRef.current.send(JSON.stringify({ type, message: inputMessage, ...extra }));
    setInputMessage("");
  };

  const sendBroadcast = () => sendMessage("broadcast");
  const sendToRole = () => sendMessage("user_type", { target_type: roleFilter });
  const sendPrivate = () => {
    if (selectedContact) {
      sendMessage("private", { target_user_id: selectedContact.id });
    }
  };

  const handleSend = () => {
    if (selectedContact) {
      sendPrivate();
    } else {
      sendBroadcast();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* LEFT SIDEBAR - Contact List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Chats</h2>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="mt-2 w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="student">Students</option>
            <option value="mentor">Mentors</option>
            <option value="reviewer">Reviewers</option>
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 && (
            <div className="p-4 text-center text-gray-500">No users found</div>
          )}
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedContact(user)}
              className={`flex items-center p-3 cursor-pointer transition ${
                selectedContact?.id === user.id
                  ? "bg-green-50 border-l-4 border-green-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 uppercase font-bold text-green-700">
                {user.username.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{user.username}</div>
                <div className="text-xs text-gray-500">{user.user_type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE - Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        {selectedContact ? (
          <div className="p-4 border-b border-gray-200 flex items-center bg-white">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 uppercase font-bold text-green-700">
              {selectedContact.username.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-gray-800">{selectedContact.username}</div>
              <div className="text-xs text-gray-500">{selectedContact.user_type}</div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-gray-200 text-center text-gray-500 bg-white">
            Select a contact or send a broadcast
          </div>
        )}

        {/* Messages area - filtered */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {displayedMessages.length === 0 && (
            <div className="text-center text-gray-500">No messages yet</div>
          )}
          {displayedMessages.map((msg, idx) => {
            const isCurrentUser = msg.sender === currentUsername;
            return (
              <div key={idx} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-green-600 text-white"
                      : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                  }`}
                >
                  {!isCurrentUser && <div className="text-xs font-bold mb-1 text-green-700">{msg.sender}</div>}
                  <div className="text-sm">{msg.message}</div>
                  <div className={`text-xs text-right mt-1 ${isCurrentUser ? "text-green-100" : "text-gray-400"}`}>
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                selectedContact
                  ? `Message ${selectedContact.username}...`
                  : "Type a broadcast message..."
              }
              className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <button
              onClick={handleSend}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              Send
            </button>
          </div>
          {!selectedContact && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={sendToRole}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-sm transition"
              >
                Send to {roleFilter} group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatComponent;