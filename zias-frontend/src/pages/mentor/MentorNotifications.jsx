import React, { useState, useEffect } from "react";
import API from "../../api/api";

function MentorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const fetchNotifications = async (url = null) => {
    setLoading(true);
    try {
      const res = url ? await API.get(url) : await API.get("notifications/", { params: { limit, offset: 0 } });
      const results = res.data.results || [];   // ✅ Extract array
      setNotifications(results);
      setNextUrl(res.data.next);
      setPrevUrl(res.data.previous);
      setTotalCount(res.data.count);

      // Determine current page from offset
      let offset = 0;
      if (res.data.previous) {
        const match = res.data.previous.match(/offset=(\d+)/);
        if (match) offset = parseInt(match[1]);
      } else if (res.data.next) {
        const match = res.data.next.match(/offset=(\d+)/);
        if (match) offset = parseInt(match[1]) - limit;
      }
      setCurrentPage(Math.floor(offset / limit) + 1);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const markAllAsRead = async () => {
    try {
      await API.post("notifications/mark_all_read/");
      // Re-fetch current page to update UI
      const offset = (currentPage - 1) * limit;
      await fetchNotifications(`notifications/?limit=${limit}&offset=${offset}`);
    } catch (err) {
      console.error(err);
    }
  };

  const goToPage = (url) => {
    if (url) fetchNotifications(url);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications</p>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-4 rounded-lg border cursor-pointer transition ${
                  notif.is_read
                    ? "bg-white border-gray-200"
                    : "bg-blue-50 border-blue-200 font-semibold"
                }`}
              >
                <p>{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(prevUrl || nextUrl) && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => goToPage(prevUrl)}
                disabled={!prevUrl}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {currentPage} of {Math.ceil(totalCount / limit)}
              </span>
              <button
                onClick={() => goToPage(nextUrl)}
                disabled={!nextUrl}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MentorNotifications;