// src/pages/student/WeeklySubmissions.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

const WeeklySubmissions = ({ weekId, studentId }) => {
  const [submissions, setSubmissions] = useState([]); // ✅ always an array
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ link: '', notes: '' });

  const submissionTypes = [
    { value: 'github', label: 'GitHub Repository', placeholder: 'https://github.com/...' },
    { value: 'typing', label: 'Typing Club Progress', placeholder: 'https://typingclub.com/...' },
    { value: 'tech_seminar', label: 'Tech Seminar Video', placeholder: 'https://youtube.com/...' },
    { value: 'progress_video', label: 'Weekly Progress Video', placeholder: 'https://youtube.com/...' },
  ];

  useEffect(() => {
    if (weekId) fetchSubmissions();
  }, [weekId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      let url = `submissions/?week_id=${weekId}`;
      if (studentId) url += `&student_id=${studentId}`;
      const res = await API.get(url);
      // ✅ ensure res.data is an array
      const data = Array.isArray(res.data) ? res.data : [];
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions', err);
      toast.error('Failed to load submissions');
      setSubmissions([]); // ✅ prevent non-array errors
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (type) => {
    if (!formData.link) {
      toast.error('Please provide a link');
      return;
    }
    try {
      await API.post('submissions/', {
        week: weekId,
        submission_type: type,
        link: formData.link,
        notes: formData.notes,
      });
      toast.success(`${type} submitted successfully`);
      setEditing(null);
      setFormData({ link: '', notes: '' });
      fetchSubmissions(); // refresh
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed');
    }
  };

  const getSubmissionForType = (type) => {
    // ✅ submissions is guaranteed to be an array
    if (!Array.isArray(submissions)) return null;
    return submissions.find(s => s.submission_type === type);
  };

  if (loading) return <div className="text-sm text-gray-400">Loading submissions...</div>;

  return (
    <div>
      <h4 className="text-md font-medium text-gray-700 mb-3">📌 Weekly Submissions</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {submissionTypes.map((type) => {
          const existing = getSubmissionForType(type.value);
          return (
            <div key={type.value} className="border rounded-lg p-3 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">{type.label}</span>
                {existing?.reviewed && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Reviewed</span>
                )}
              </div>
              {existing ? (
                <div className="mt-2 text-sm space-y-1">
                  <div>
                    <span className="text-gray-500">Link:</span>{' '}
                    <a href={existing.link} target="_blank" rel="noopener noreferrer" className="text-green-600 underline break-all">
                      {existing.link.length > 40 ? existing.link.substring(0, 40) + '…' : existing.link}
                    </a>
                  </div>
                  {existing.notes && <div><span className="text-gray-500">Notes:</span> {existing.notes}</div>}
                  <div className="text-xs text-gray-400">Submitted: {new Date(existing.submitted_at).toLocaleDateString()}</div>
                  {existing.reviewed && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <div><span className="font-medium">Marks:</span> {existing.marks}/5</div>
                      <div><span className="font-medium">Feedback:</span> {existing.mentor_feedback || '—'}</div>
                    </div>
                  )}
                </div>
              ) : editing === type.value ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="url"
                    placeholder={type.placeholder}
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm"
                    required
                  />
                  <textarea
                    placeholder="Optional notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows="2"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleSubmit(type.value)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Submit</button>
                    <button onClick={() => setEditing(null)} className="bg-gray-300 px-3 py-1 rounded text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditing(type.value)} className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <span>+ Add {type.label}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklySubmissions;