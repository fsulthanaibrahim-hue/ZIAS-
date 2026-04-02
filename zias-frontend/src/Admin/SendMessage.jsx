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
    <div className="min-h-screen bg-[#0f1623] p-8">
      <div className="max-w-2xl mx-auto bg-[#1a2538] rounded-xl p-6 border border-white/10">
        <h1 className="text-2xl font-bold text-white mb-6">Send Message to All Users</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-white/70 mb-1">Message</label>
            <textarea
              rows="6"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send to All Users'}
          </button>
        </form>
        {response && (
          <div className={`mt-4 p-3 rounded-lg ${response.type === 'success' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {response.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default SendMessage;