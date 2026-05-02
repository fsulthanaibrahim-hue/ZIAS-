import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function NotificationBell({ role = "mentor" }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await API.get("notifications/unread-count/");
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Failed to fetch unread count", err);
      }
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // fallback polling
    const handleNotificationRead = () => fetchUnreadCount(); // ✅ event handler
    window.addEventListener('notification-read', handleNotificationRead);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-read', handleNotificationRead);
    };
  }, []);

  const handleClick = () => {
    if (role === "admin") navigate("/admin/notifications");
    else if (role === "mentor") navigate("/mentor/notifications");
    else if (role === "reviewer") navigate("/reviewer/notifications");
    else navigate("/notifications");
  };

  return (
    <button onClick={handleClick} className="relative p-2">
      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs px-1 min-w-[1.25rem] h-5 flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;