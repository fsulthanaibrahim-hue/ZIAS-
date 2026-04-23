// src/pages/student/StudentChat.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import StudentSidebar from "../../components/StudentSidebar";
import API from "../../api/api";

function StudentChat() {
  const [studentName, setStudentName] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState("Connecting...");
  
  // Refs to avoid re-renders and race conditions
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const isConnectingRef = useRef(false);
  const messageQueueRef = useRef([]);
  
  const token = localStorage.getItem("access_token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser.id;
  const currentUsername = currentUser.username;

  // Fetch student name
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await API.get("students/me/");
        setStudentName(res.data.name || res.data.username);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudent();
  }, []);

  // Fetch contacts (mentors, reviewers, admins)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await API.get("users/");
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

  // Fetch chat history
  const fetchHistory = useCallback(async () => {
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
  }, []);

  // Send any queued messages
  const flushMessageQueue = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && messageQueueRef.current.length > 0) {
      messageQueueRef.current.forEach(msg => {
        wsRef.current.send(JSON.stringify(msg));
      });
      messageQueueRef.current = [];
    }
  }, []);

  // Send a private message (with queue if not connected)
  const sendPrivateMessage = useCallback(() => {
    if (!selectedContact) return;
    if (!inputMessage.trim()) return;
    
    const payload = {
      type: "private",
      message: inputMessage,
      recipient_id: selectedContact.id,
      target_user_id: selectedContact.id,
      sender_id: currentUserId,
      sender: currentUsername,
      timestamp: new Date().toISOString(),
    };
    
    // Optimistic update
    const optimisticMsg = { ...payload, isOptimistic: true };
    setMessages(prev => [...prev, optimisticMsg]);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      // Queue for later
      messageQueueRef.current.push(payload);
      setWsStatus("Queued (reconnecting...)");
    }
    setInputMessage("");
  }, [selectedContact, inputMessage, currentUserId, currentUsername]);

  // WebSocket connection logic
  const connect = useCallback(() => {
    if (!token || !shouldReconnectRef.current) return;
    if (isConnectingRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    isConnectingRef.current = true;
    setWsStatus("Connecting...");
    
    const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      isConnectingRef.current = false;
      setWsStatus("Connected");
      fetchHistory();
      flushMessageQueue();
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 Received:", data);
        if (data.type === "chat" || data.type === "private" || data.type === "broadcast") {
          // Remove optimistic version if it exists
          setMessages(prev => {
            const filtered = prev.filter(m => !(m.isOptimistic && m.message === data.message && m.sender_id === data.sender_id));
            return [...filtered, data];
          });
        }
      } catch (err) {
        console.error("Parse error", err);
      }
    };
    
    ws.onerror = (err) => {
      console.error("WebSocket error", err);
      isConnectingRef.current = false;
      setWsStatus("Error");
    };
    
    ws.onclose = (event) => {
      console.log(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
      isConnectingRef.current = false;
      setWsStatus("Disconnected");
      if (shouldReconnectRef.current && event.code !== 1000) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => connect(), 2000);
      }
    };
  }, [token, fetchHistory, flushMessageQueue]);
  
  // Start connection on mount
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Component unmount");
      }
    };
  }, [connect]);
  
  // Filter messages for display
  const getDisplayMessages = () => {
    if (!selectedContact) {
      return messages.filter(m => m.type === "broadcast" || m.room === "Broadcast");
    }
    return messages.filter(m => {
      if (m.type === "broadcast" || m.room === "Broadcast") return true;
      const isToMe = (m.recipient_id === currentUserId || m.target_user_id === currentUserId) && m.sender_id === selectedContact.id;
      const isFromMe = m.sender_id === currentUserId && (m.recipient_id === selectedContact.id || m.target_user_id === selectedContact.id);
      return isToMe || isFromMe;
    });
  };
  
  const displayedMessages = getDisplayMessages();
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Student Chat</h1>
            <p className="text-gray-500 mt-1">Connect with your mentors and reviewers</p>
            {studentName && (
              <p className="text-sm text-gray-500 mt-1">Logged in as: <span className="text-gray-700">{studentName}</span></p>
            )}
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex h-[600px]">
              {/* Contacts sidebar */}
              <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-3 border-b border-gray-200 bg-white">
                  <h3 className="font-semibold text-gray-800">Mentors & Reviewers</h3>
                  <div className="text-xs text-gray-400 mt-1">Status: {wsStatus}</div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {contacts.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">No mentors or reviewers available</div>
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
                          disabled={wsStatus !== "Connected"}
                        />
                        <button
                          onClick={sendPrivateMessage}
                          disabled={wsStatus !== "Connected"}
                          className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition ${
                            wsStatus !== "Connected" ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          Send
                        </button>
                      </div>
                      {wsStatus !== "Connected" && (
                        <div className="text-xs text-amber-600 mt-2">
                          ⚠️ Not connected. Messages will be sent automatically when connection is restored.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    Select a mentor or reviewer to start chatting
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentChat;