import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/api';

const ContactMessageDetail = () => {
  const { id } = useParams();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await API.get(`contact-messages/${id}/`);
        setMessage(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessage();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!message) return <div className="p-8 text-center">Message not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Contact Message Details</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-3">
        <div><span className="font-semibold">Name:</span> {message.name || '—'}</div>
        <div><span className="font-semibold">Email:</span> {message.email}</div>
        <div><span className="font-semibold">Subject:</span> {message.subject || '—'}</div>
        <div><span className="font-semibold">Message:</span> <p className="mt-1">{message.message}</p></div>
        <div><span className="font-semibold">Received:</span> {new Date(message.created_at).toLocaleString()}</div>
      </div>
    </div>
  );
};

export default ContactMessageDetail;