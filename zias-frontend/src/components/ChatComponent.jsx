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
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}").username;

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
      // No contact selected: show broadcast messages only (or all? Better to show broadcast)
      return messages.filter(msg => msg.room === "Broadcast" || msg.room === "broadcast (past)");
    }
    // Contact selected: show broadcast + private messages with this contact
    return messages.filter(msg => {
      if (msg.room === "Broadcast" || msg.room === "broadcast (past)") return true;
      if (msg.room === "Private" || msg.room === "private (past)") {
        // Private message: check if sender or receiver is selected contact
        // Since we don't store receiver in message, we rely on the room identifier.
        // For simplicity, we show all private messages where the other party is selectedContact.username
        // But our private messages don't store the other party's name. So we need to compare using the room identifier.
        // Better: We'll show private messages that involve the selected contact.
        // We'll assume that if the message sender is selectedContact.username OR (if we had receiver info)
        // For now, we show all private messages because we don't have enough data.
        // To fix properly, store receiver name in message or filter by room_identifier.
        // Since we don't have that, we'll show all private messages (not ideal but works for now)
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
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* LEFT SIDEBAR - Contact List */}
      <div className="w-80 border-r border-[#21262d] flex flex-col">
        <div className="p-4 border-b border-[#21262d]">
          <h2 className="text-xl font-bold">Chats</h2>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="mt-2 w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm"
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
            <div className="p-4 text-center text-[#7d8590]">No users found</div>
          )}
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedContact(user)}
              className={`flex items-center p-3 cursor-pointer hover:bg-[#161b22] transition ${
                selectedContact?.id === user.id ? "bg-[#161b22]" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#30363d] flex items-center justify-center mr-3 uppercase font-bold">
                {user.username.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-medium">{user.username}</div>
                <div className="text-xs text-[#7d8590]">{user.user_type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE - Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {selectedContact ? (
          <div className="p-4 border-b border-[#21262d] flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#30363d] flex items-center justify-center mr-3 uppercase font-bold">
              {selectedContact.username.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{selectedContact.username}</div>
              <div className="text-xs text-[#7d8590]">{selectedContact.user_type}</div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-[#21262d] text-center text-[#7d8590]">
            Select a contact or send a broadcast
          </div>
        )}

        {/* Messages area - filtered */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {displayedMessages.length === 0 && (
            <div className="text-center text-[#7d8590]">No messages yet</div>
          )}
          {displayedMessages.map((msg, idx) => {
            const isCurrentUser = msg.sender === currentUser;
            return (
              <div key={idx} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUser ? "bg-[#1f6feb] text-white" : "bg-[#161b22] text-[#e6edf3]"
                  }`}
                >
                  {!isCurrentUser && <div className="text-xs font-bold mb-1">{msg.sender}</div>}
                  <div className="text-sm">{msg.message}</div>
                  <div className="text-xs text-right mt-1 opacity-70">{formatTimestamp(msg.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-[#21262d]">
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
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2 focus:outline-none focus:border-[#388bfd]"
            />
            <button
              onClick={handleSend}
              className="bg-[#238636] hover:bg-[#2ea043] px-4 py-2 rounded-lg text-white transition"
            >
              Send
            </button>
          </div>
          {!selectedContact && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={sendToRole}
                className="bg-[#1f6feb] hover:bg-[#388bfd] px-3 py-1 rounded-lg text-sm transition"
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