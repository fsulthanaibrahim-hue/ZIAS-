// src/Admin/SendMessage.jsx
import { useState } from 'react';
import API from '../api/api';

function SendMessage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    try {
      const res = await API.post('/send-bulk-email/', { subject, message });
      setResponse({ type: 'success', text: res.data.detail });
      setSubject('');
      setMessage('');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to send emails.';
      setResponse({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 md:p-8 shadow-sm">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
            Send Message to All Users
          </h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm sm:text-base mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-colors text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm sm:text-base mb-1.5">
                Message
              </label>
              <textarea
                rows="6"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-colors text-sm sm:text-base resize-vertical"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send to All Users'
              )}
            </button>
          </form>
          {response && (
            <div className={`mt-5 p-3 rounded-lg text-sm sm:text-base ${
              response.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {response.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SendMessage;