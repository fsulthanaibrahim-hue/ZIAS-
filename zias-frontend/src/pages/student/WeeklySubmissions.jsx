// src/pages/student/WeeklySubmissions.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

const WeeklySubmissions = ({ weekId, studentId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ link: '', notes: '' });

  // Unique feature: Weekly Vibes
  const [weeklyVibes, setWeeklyVibes] = useState({
    mood: '😊',
    highlight: '',
    rating: 3,
  });
  const [vibesSaved, setVibesSaved] = useState(false);
  const [savingVibes, setSavingVibes] = useState(false);

  const submissionTypes = [
    { value: 'github', label: 'GitHub Repository', placeholder: 'https://github.com/...' },
    { value: 'progress_video', label: 'Weekly Progress Video', placeholder: 'https://youtube.com/...' },
  ];

  const moods = ['😊', '😐', '😢'];

  useEffect(() => {
    if (weekId) fetchSubmissions();
    loadWeeklyVibes();
  }, [weekId]);

  const loadWeeklyVibes = () => {
    const key = `weekly_vibes_${weekId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setWeeklyVibes(JSON.parse(saved));
      setVibesSaved(true);
    }
  };

  const saveWeeklyVibes = () => {
    if (!weeklyVibes.highlight.trim()) {
      toast.error('Please write a highlight of your week.');
      return;
    }
    setSavingVibes(true);
    const key = `weekly_vibes_${weekId}`;
    localStorage.setItem(key, JSON.stringify(weeklyVibes));
    setVibesSaved(true);
    toast.success('Weekly vibes saved!');
    setSavingVibes(false);
  };

  const updateVibes = (field, value) => {
    setWeeklyVibes(prev => ({ ...prev, [field]: value }));
    if (vibesSaved) setVibesSaved(false); // mark as unsaved after change
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      let url = `submissions/?week_id=${weekId}`;
      if (studentId) url += `&student_id=${studentId}`;
      const res = await API.get(url);
      const data = Array.isArray(res.data) ? res.data : [];
      setSubmissions(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load submissions');
      setSubmissions([]);
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
      fetchSubmissions();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed');
    }
  };

  const getSubmissionForType = (type) => {
    if (!Array.isArray(submissions)) return null;
    return submissions.find(s => s.submission_type === type);
  };

  if (loading) return <div className="text-sm text-gray-400">Loading submissions...</div>;

  return (
    <div>
      <h4 className="text-md font-medium text-gray-700 mb-3">📌 Weekly Submissions</h4>

      {/* Original submission cards (GitHub + Progress Video) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {submissionTypes.map((type) => {
          const existing = getSubmissionForType(type.value);
          return (
            <div key={type.value} className="border rounded-lg p-3 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">{type.label}</span>
                {existing?.reviewed && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Reviewed</span>}
              </div>
              {existing ? (
                <div className="mt-2 text-sm space-y-1">
                  <div><span className="text-gray-500">Link:</span>{' '}
                    <a href={existing.link} target="_blank" rel="noopener noreferrer" className="text-green-600 underline break-all">
                      {existing.link.length > 40 ? existing.link.substring(0,40)+'…' : existing.link}
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
                  <input type="url" placeholder={type.placeholder} value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full border rounded px-2 py-1 text-sm" required />
                  <textarea placeholder="Optional notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border rounded px-2 py-1 text-sm" rows="2" />
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

      {/* 🎉 UNIQUE FEATURE: Weekly Vibes */}
      <div className="border rounded-lg p-3 bg-white shadow-sm">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-700">🎵 Weekly Vibes</span>
          {vibesSaved && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Saved</span>}
        </div>
        <div className="mt-2 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">How was your week?</label>
            <div className="flex gap-2">
              {moods.map(m => (
                <button
                  key={m}
                  onClick={() => updateVibes('mood', m)}
                  className={`text-2xl p-1 transition ${weeklyVibes.mood === m ? 'scale-110 bg-gray-100 rounded-full' : 'opacity-60'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">One highlight ✨</label>
            <input
              type="text"
              placeholder="e.g., 'Finished the project ahead of time'"
              value={weeklyVibes.highlight}
              onChange={e => updateVibes('highlight', e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rate this week (1–5)</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(r => (
                <button
                  key={r}
                  onClick={() => updateVibes('rating', r)}
                  className={`px-3 py-1 rounded text-sm ${weeklyVibes.rating === r ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {r}★
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={saveWeeklyVibes}
            disabled={savingVibes}
            className="mt-1 w-full bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded text-sm transition"
          >
            {savingVibes ? 'Saving...' : (vibesSaved ? 'Update Vibes' : 'Save Vibes')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeeklySubmissions;