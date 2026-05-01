// src/pages/reviewer/ReviewerNotifications.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";
import toast from "react-hot-toast";

export default function ReviewerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications/");
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/`, { is_read: true });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    try {
      await API.post("/notifications/mark_all_read/");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read");
    }
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with the latest activity
          </p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">🔔</div>
          <h3 className="text-lg font-medium text-gray-800">No notifications</h3>
          <p className="text-gray-500 text-sm mt-1">
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-xl border shadow-sm transition hover:shadow-md ${
                notif.is_read
                  ? "border-gray-200"
                  : "border-l-4 border-l-green-500 border-gray-200"
              }`}
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notif.is_read
                      ? "bg-gray-100 text-gray-500"
                      : "bg-green-100 text-green-600"
                  }`}>
                    {notif.is_read ? "📄" : "🔔"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className={`text-sm ${notif.is_read ? "text-gray-600" : "text-gray-800 font-medium"}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatRelativeTime(notif.created_at)}</span>
                      {!notif.is_read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                  {notif.link && (
                    <Link
                      to={notif.link}
                      className="inline-block mt-2 text-xs text-green-600 hover:underline"
                    >
                      View details →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}