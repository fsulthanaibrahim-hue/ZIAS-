import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

const MentorSubmissionReview = ({ studentId, weekId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [studentId, weekId]);

  const fetchSubmissions = async () => {
    try {
      const res = await API.get(`submissions/?student_id=${studentId}&week_id=${weekId}`);
      setSubmissions(res.data);
    } catch (err) {
      toast.error('Failed to load submissions');
    }
  };

  const handleMarkChange = (id, marks) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, marks: parseInt(marks) || 0 } : s));
  };

  const handleFeedbackChange = (id, feedback) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, mentor_feedback: feedback } : s));
  };

  const handleReviewedToggle = (id, reviewed) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, reviewed } : s));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const updates = submissions.map(s => ({
      id: s.id,
      marks: s.marks,
      mentor_feedback: s.mentor_feedback,
      reviewed: s.reviewed,
    }));
    try {
      await API.post('submissions/bulk-update/', { updates });
      toast.success('All submissions saved');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Review Submissions</h3>
        <button onClick={handleSaveAll} disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>
      <div className="space-y-4">
        {submissions.map(sub => (
          <div key={sub.id} className="border-b pb-3">
            <div className="flex justify-between">
              <span className="font-medium">{sub.submission_type_display}</span>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sub.reviewed} onChange={(e) => handleReviewedToggle(sub.id, e.target.checked)} />
                Reviewed
              </label>
            </div>
            <div className="text-sm text-gray-600 break-all">
              <a href={sub.link} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">{sub.link}</a>
            </div>
            {sub.notes && <div className="text-sm text-gray-500 mt-1">Note: {sub.notes}</div>}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-xs text-gray-500">Marks (0-5)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={sub.marks || ''}
                  onChange={(e) => handleMarkChange(sub.id, e.target.value)}
                  className="border rounded px-2 py-1 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Feedback</label>
                <input
                  type="text"
                  value={sub.mentor_feedback || ''}
                  onChange={(e) => handleFeedbackChange(sub.id, e.target.value)}
                  className="border rounded px-2 py-1 w-full text-sm"
                />
              </div>
            </div>
          </div>
        ))}
        {submissions.length === 0 && <div className="text-gray-400 text-center py-4">No submissions yet</div>}
      </div>
    </div>
  );
};

export default MentorSubmissionReview;