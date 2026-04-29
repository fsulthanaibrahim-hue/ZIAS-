// src/pages/reviewer/ReviewerNotifications.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

function ReviewerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await API.get("notifications/");
        setNotifications(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.patch(`notifications/${id}/`, { is_read: true });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(); // adjust as needed
  };

  if (loading) return <div className="p-8 text-center">Loading notifications...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg border ${
                notif.is_read ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"
              }`}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
            >
              <p className="text-gray-800">{notif.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(notif.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewerNotifications;