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
    <div className="min-h-screen bg-[#0f1623] py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#1a2538] rounded-xl border border-white/10 p-5 sm:p-6 md:p-8 shadow-xl">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">
            Send Message to All Users
          </h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/70 text-sm sm:text-base mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm sm:text-base mb-1.5">
                Message
              </label>
              <textarea
                rows="6"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors text-sm sm:text-base resize-vertical"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
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
                ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                : 'bg-red-600/20 text-red-400 border border-red-500/30'
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