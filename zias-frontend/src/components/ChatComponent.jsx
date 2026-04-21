import { useEffect, useState, useRef } from "react";
import API from "../api/api";

// Module‑level flags to prevent duplicate fetches
let globalUsersFetched = false;
let isFetchingUsers = false;
let globalHistoryFetched = false;
let isFetchingHistory = false;

function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [targetRole, setTargetRole] = useState("admin");
  const [roleFilter, setRoleFilter] = useState("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [wsStatus, setWsStatus] = useState("Connecting...");
  const [isReady, setIsReady] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const token = localStorage.getItem("access_token");

  // Fetch users only once
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

  // Filter users based on selected role
  useEffect(() => {
    if (roleFilter === "all") {
      setFilteredUsers(allUsers);
    } else {
      setFilteredUsers(allUsers.filter(u => u.user_type === roleFilter));
    }
  }, [roleFilter, allUsers]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timeStr;
    if (isYesterday) return `Yesterday ${timeStr}`;
    return `${date.toLocaleDateString()} ${timeStr}`;
  };

  const fetchHistory = async () => {
    if (globalHistoryFetched || isFetchingHistory) return;
    isFetchingHistory = true;
    try {
      const [broadcastRes, privateRes] = await Promise.all([
        API.get("chat-history/?room_type=broadcast"),
        API.get("chat-history/?room_type=private").catch(() => ({ data: [] }))
      ]);
      const broadcastMsgs = broadcastRes.data.map(m => ({ ...m, room: "Broadcast" }));
      const privateMsgs = privateRes.data.map(m => ({ ...m, room: "Private" }));
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

  const connect = () => {
    if (!token) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Chat WebSocket opened");
      setWsStatus("Connected ✅");
      setIsReady(true);
      if (!globalHistoryFetched) fetchHistory();
    };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "chat") {
          setMessages(prev => [...prev, data]);
        }
      } catch (err) { console.error(err); }
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
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
    };
  }, [token]);

  const send = (type, extra = {}) => {
    if (!input.trim() || !isReady || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type, message: input, ...extra }));
    setInput("");
  };

  const sendBroadcast = () => send("broadcast");
  const sendToRole = () => send("user_type", { target_type: targetRole });
  const sendPrivate = () => {
    if (targetUserId) send("private", { target_user_id: targetUserId });
  };

  return (
    <div className="bg-[#161b22] rounded-xl border border-[#21262d] p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-[#e6edf3]">💬 WhatsApp‑like Chat</h2>
        <span className={`text-xs px-2 py-1 rounded-full ${wsStatus === "Connected ✅" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{wsStatus}</span>
      </div>

      {/* Messages area */}
      <div className="h-80 overflow-y-auto bg-[#0d1117] rounded-lg p-3 space-y-2 mb-3 border border-[#21262d]">
        {messages.length === 0 ? (
          <div className="text-center text-[#7d8590] text-sm">No messages yet. Send one!</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="text-sm border-b border-[#21262d] pb-2">
              <div className="flex justify-between items-start">
                <span className="text-[#e6edf3] font-medium">{msg.sender}</span>
                <span className="text-[#7d8590] text-xs">{formatTimestamp(msg.timestamp)}</span>
              </div>
              <div className="text-[#c9d1d9] mt-0.5">{msg.message}</div>
              <div className="text-[#7d8590] text-xs mt-1">[{msg.room}]</div>
            </div>
          ))
        )}
      </div>

      {/* Input + Broadcast */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === "Enter" && isReady && sendBroadcast()}
          disabled={!isReady}
          className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] disabled:opacity-50"
          placeholder="Type a message..."
        />
        <button onClick={sendBroadcast} disabled={!isReady} className="bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 px-4 py-2 rounded-lg text-white">Broadcast</button>
      </div>

      {/* Send to a role (group message) */}
      <div className="flex gap-2 mb-3">
        <select value={targetRole} onChange={e => setTargetRole(e.target.value)} disabled={!isReady} className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3]">
          <option value="admin">Admin</option>
          <option value="student">Student</option>
          <option value="mentor">Mentor</option>
          <option value="reviewer">Reviewer</option>
        </select>
        <button onClick={sendToRole} disabled={!isReady} className="bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-50 px-4 py-2 rounded-lg text-white">Send to {targetRole}</button>
      </div>

      {/* Private message – role filter + user dropdown */}
      <div className="flex gap-2">
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3]">
          <option value="all">All users</option>
          <option value="admin">Admin</option>
          <option value="student">Student</option>
          <option value="mentor">Mentor</option>
          <option value="reviewer">Reviewer</option>
        </select>
        <select
          value={targetUserId}
          onChange={e => setTargetUserId(e.target.value)}
          disabled={!isReady}
          className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] disabled:opacity-50"
        >
          <option value="">Select user...</option>
          {filteredUsers.map(user => (
            <option key={user.id} value={user.id}>{user.username} ({user.user_type})</option>
          ))}
        </select>
        <button onClick={sendPrivate} disabled={!isReady || !targetUserId} className="bg-[#8250df] hover:bg-[#9867e8] disabled:opacity-50 px-4 py-2 rounded-lg text-white">Private</button>
      </div>
    </div>
  );
}

export default ChatComponent;