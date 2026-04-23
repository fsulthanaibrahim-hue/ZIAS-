// src/components/StudentChatComponent.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import API from "../api/api";

function StudentChatComponent() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState("Connecting...");
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  const token = localStorage.getItem("access_token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser.id;
  const currentUsername = currentUser.username;

  // Fetch only mentors, reviewers, admins (student's contacts)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await API.get("users/");
        // Exclude self, include only allowed roles
        let users = res.data.filter(u => u.id !== currentUserId);
        users = users.filter(u => ["admin", "mentor", "reviewer"].includes(u.user_type));
        setContacts(users);
      } catch (err) {
        console.error("Failed to fetch contacts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, [currentUserId]);

  // Fetch chat history (broadcast + private)
  const fetchHistory = async () => {
    try {
      const [broadcastRes, privateRes] = await Promise.all([
        API.get("chat-history/?room_type=broadcast").catch(() => ({ data: [] })),
        API.get("chat-history/?room_type=private").catch(() => ({ data: [] })),
      ]);
      const allMessages = [...broadcastRes.data, ...privateRes.data];
      allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMessages(allMessages);
    } catch (err) {
      console.error("History error", err);
    }
  };

  // WebSocket connection
  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Student chat WebSocket connected");
      setWsStatus("Connected");
      fetchHistory();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat" || data.type === "private" || data.type === "broadcast") {
          setMessages(prev => [...prev, data]);
        }
      } catch (err) {
        console.error("Parse error", err);
      }
    };

    ws.onerror = () => {
      setWsStatus("Error");
    };

    ws.onclose = () => {
      setWsStatus("Disconnected");
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  // Send private message
  const sendPrivateMessage = () => {
    if (!selectedContact) return;
    if (!inputMessage.trim()) return;
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      alert("Chat not connected. Please refresh.");
      return;
    }

    const payload = {
      type: "private",
      message: inputMessage,
      recipient_id: selectedContact.id,
      target_user_id: selectedContact.id,
      sender_id: currentUserId,
      sender: currentUsername,
    };
    wsRef.current.send(JSON.stringify(payload));
    setInputMessage("");
  };

  // Filter messages for display
  const getDisplayMessages = () => {
    if (!selectedContact) {
      // Show only broadcast messages
      return messages.filter(m => m.type === "broadcast" || m.room === "Broadcast");
    }
    return messages.filter(m => {
      if (m.type === "broadcast" || m.room === "Broadcast") return true;
      // Private messages with selected contact
      const isToMe = (m.recipient_id === currentUserId || m.target_user_id === currentUserId) 
                    && m.sender_id === selectedContact.id;
      const isFromMe = m.sender_id === currentUserId 
                    && (m.recipient_id === selectedContact.id || m.target_user_id === selectedContact.id);
      return isToMe || isFromMe;
    });
  };

  const displayedMessages = getDisplayMessages();
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading contacts...</div>;
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg overflow-hidden border border-gray-200">
      {/* Contacts sidebar */}
      <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-3 border-b border-gray-200 bg-white">
          <h3 className="font-semibold text-gray-800">Mentors & Reviewers</h3>
          <div className="text-xs text-gray-400 mt-1">Status: {wsStatus}</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-sm">
              No mentors or reviewers available
            </div>
          )}
          {contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`flex items-center p-3 cursor-pointer transition ${
                selectedContact?.id === contact.id
                  ? "bg-green-50 border-l-4 border-green-500"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center mr-3 font-bold text-green-700 uppercase">
                {contact.username.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-gray-800">{contact.username}</div>
                <div className="text-xs text-gray-500">{contact.user_type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="font-medium text-gray-800">{selectedContact.username}</div>
              <div className="text-xs text-gray-500">{selectedContact.user_type}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {displayedMessages.length === 0 && (
                <div className="text-center text-gray-400 text-sm">No messages yet. Say hello!</div>
              )}
              {displayedMessages.map((msg, idx) => {
                const isMine = msg.sender_id === currentUserId;
                return (
                  <div key={idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-lg p-2 ${isMine ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
                      {!isMine && <div className="text-xs font-bold text-green-600 mb-1">{msg.sender}</div>}
                      <div className="text-sm">{msg.message}</div>
                      <div className={`text-xs text-right mt-1 ${isMine ? "text-green-100" : "text-gray-400"}`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendPrivateMessage()}
                  placeholder={`Message ${selectedContact.username}...`}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={sendPrivateMessage}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a mentor or reviewer to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentChatComponent;