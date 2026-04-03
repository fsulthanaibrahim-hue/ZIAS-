import { useEffect, useState } from "react";
import API from "../api/api";

function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await API.get("recent-messages/");
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.patch(`contact-messages/${id}/`, { is_read: true });
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = messages.filter(m => !m.is_read).map(m => m.id);
      await Promise.all(unreadIds.map(id => API.patch(`contact-messages/${id}/`, { is_read: true })));
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) return <div className="text-white p-8">Loading messages...</div>;

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="min-h-screen bg-[#0f1623] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Contact Messages</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Mark all as read ({unreadCount})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-[#1a2538] rounded-xl border border-white/10">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 text-left text-white/60">Name</th>
                <th className="p-3 text-left text-white/60">Email</th>
                <th className="p-3 text-left text-white/60">Phone</th>
                <th className="p-3 text-left text-white/60">Subject</th>
                <th className="p-3 text-left text-white/60">Message</th>
                <th className="p-3 text-left text-white/60">Date</th>
                <th className="p-3 text-left text-white/60">Status</th>
                <th className="p-3 text-left text-white/60">Action</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id} className={`border-b border-white/5 hover:bg-white/5 ${!msg.is_read ? 'bg-blue-600/10' : ''}`}>
                  <td className="p-3 text-white">{msg.name}</td>
                  <td className="p-3 text-white/80">{msg.email}</td>
                  <td className="p-3 text-white/80">{msg.phone || "Not provided"}</td>
                  <td className="p-3 text-white/80">{msg.subject}</td>
                  <td className="p-3 text-white/80 max-w-xs truncate">{msg.message}</td>
                  <td className="p-3 text-white/80">{new Date(msg.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    {msg.is_read ? (
                      <span className="text-green-400">Read</span>
                    ) : (
                      <span className="text-yellow-400">Unread</span>
                    )}
                  </td>
                  <td className="p-3">
                    {!msg.is_read && (
                      <button
                        onClick={() => markAsRead(msg.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Mark read
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr><td colSpan="8" className="text-center text-white/40 p-8">No messages yet.</td></tr>
              )}
            </tbody>
         </table>
        </div>
      </div>
    </div>
  );
}

export default ContactMessages;