import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { toast } from 'react-hot-toast';

// Helper to turn any API error into a user‑friendly message (never 5xx)
const getFriendlyErrorMessage = (err, defaultMsg = "An error occurred") => {
  if (!err?.response) {
    return "Network error. Please check your connection.";
  }
  const status = err.response.status;
  if (status >= 500) {
    return "Service temporarily unavailable. Please try again later.";
  }
  if (status === 404) {
    return "Message not found.";
  }
  if (status === 400) {
    return "Invalid request. Please try again.";
  }
  if (status === 401 || status === 403) {
    return "You are not authorized to view this message.";
  }
  return err.response?.data?.detail || err.response?.data?.message || defaultMsg;
};

const ContactMessageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMessage();
  }, [id]);

  const fetchMessage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`contact-messages/${id}/`);
      setMessage(res.data);
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err, "Failed to load message");
      setError(friendlyMsg);
      toast.error(friendlyMsg);
      console.warn(err); // log for debugging, never shown to user
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (message?.is_read) return;
    setUpdating(true);
    try {
      await API.patch(`contact-messages/${id}/`, { is_read: true });
      setMessage(prev => ({ ...prev, is_read: true }));
      toast.success('Marked as read');
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err, "Failed to mark as read");
      toast.error(friendlyMsg);
    } finally {
      setUpdating(false);
    }
  };

  const handleReply = () => {
    if (!message?.email) return;
    window.location.href = `mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject || 'Contact Message')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || "Message not found."}</p>
        <button
          onClick={() => navigate('/admin/messages')}
          className="mt-4 text-emerald-600 hover:underline"
        >
          ← Back to Messages
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/messages')}
          className="text-gray-600 hover:text-gray-900 transition flex items-center gap-1"
        >
          ← Back to Messages
        </button>
        <div className="flex-1" />
        {!message.is_read && (
          <button
            onClick={markAsRead}
            disabled={updating}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Mark as read'}
          </button>
        )}
        <button
          onClick={handleReply}
          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition"
        >
          Reply via email
        </button>
      </div>

      {/* Message card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h1 className="text-xl font-bold text-gray-800">Contact Message</h1>
          <div className="flex flex-wrap gap-3 mt-1">
            <span className={`text-xs px-2 py-1 rounded-full ${message.is_read ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {message.is_read ? 'Read' : 'Unread'}
            </span>
            <span className="text-xs text-gray-500">Received {new Date(message.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="text-gray-800 mt-0.5">{message.name || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <a href={`mailto:${message.email}`} className="text-emerald-600 hover:underline mt-0.5">
              {message.email}
            </a>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Subject</label>
            <p className="text-gray-800 mt-0.5">{message.subject || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Message</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap">
              {message.message}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactMessageDetail;