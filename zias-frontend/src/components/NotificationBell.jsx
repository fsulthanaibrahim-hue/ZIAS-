// src/components/NotificationBell.jsx
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);
  const fetched = useRef(false);

  // Initial fetch via REST (fallback / first load)
  const fetchUnreadCount = async () => {
    setLoading(true);
    try {
      const res = await API.get("unread-messages/");
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    } finally {
      setLoading(false);
    }
  };

  // Set up WebSocket connection
  const setupWebSocket = () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Use the same WebSocket URL as your Django Channels endpoint
    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Notification WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "unread_count") {
        setUnreadCount(data.count);
      } else if (data.type === "new_notification") {
        // Optional: show a toast or update state
        setUnreadCount(data.unread_count);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Notification WebSocket disconnected");
      // Attempt to reconnect after 5 seconds
      setTimeout(setupWebSocket, 5000);
    };
  };

  // Initial data and WebSocket setup
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchUnreadCount();     // initial count
    setupWebSocket();       // real‑time updates
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  // Manual refresh when clicking the bell
  const handleClick = () => {
    fetchUnreadCount();
  };

  return (
    <Link
      to="/admin/messages"
      className="relative p-2 rounded-lg hover:bg-gray-700 transition"
      onClick={handleClick}
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1 -translate-y-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {loading && <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-white/50">...</span>}
    </Link>
  );
}

export default NotificationBell;