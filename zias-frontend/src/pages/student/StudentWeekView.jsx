// src/pages/student/StudentWeekView.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../api/api";

function StudentWeekView() {
  const { weekId } = useParams();
  const [week, setWeek] = useState(null);
  const [days, setDays] = useState([]);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isReviewer, setIsReviewer] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await API.get("users/me/");
        setIsReviewer(userRes.data.is_admin || userRes.data.is_mentor);

        const weekRes = await API.get(`modules/${weekId}/`);
        setWeek(weekRes.data);

        const daysRes = await API.get(`days/?module=${weekId}`);
        const daysData = daysRes.data;
        const enrichedDays = await Promise.all(
          daysData.map(async (day) => {
            const tasksRes = await API.get(`tasks/?day=${day.id}`);
            return { ...day, tasks: tasksRes.data };
          })
        );
        setDays(enrichedDays);

        const reviewRes = await API.get(`week-review/${weekId}/`);
        setReview(reviewRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [weekId]);

  const handleReviewChange = (field, value) => {
    setReview(prev => ({ ...prev, [field]: value }));
  };

  const saveReview = async () => {
    setSaving(true);
    try {
      await API.put(`week-review/${weekId}/`, review);
      alert("Review saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save review.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDayCompletion = async (dayId, completed) => {
    try {
      await API.patch(`days/${dayId}/`, { is_completed: completed });
      setDays(prev => prev.map(d => d.id === dayId ? { ...d, is_completed: completed } : d));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link to="/student/review-sheet" className="text-[#7d8590] hover:text-white text-sm">
            ← Back to Review Sheet
          </Link>
          {isReviewer && (
            <button
              onClick={saveReview}
              disabled={saving}
              className="bg-[#238636] hover:bg-[#2ea043] px-4 py-1.5 rounded text-sm"
            >
              {saving ? "Saving..." : "💾 Save Review"}
            </button>
          )}
        </div>

        <div className="bg-[#161b22] rounded-xl border border-[#21262d] p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Week {week?.order || week?.id} – {week?.title}</h1>
          <p className="text-[#7d8590]">{week?.content || "No description."}</p>
        </div>

        {/* Review form */}
        <div className="bg-[#161b22] rounded-xl border border-[#21262d] p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📋 Weekly Review</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#7d8590] mb-1">Reviewer Name</label>
                {isReviewer ? (
                  <input
                    type="text"
                    value={review?.reviewer_name || ""}
                    onChange={(e) => handleReviewChange("reviewer_name", e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2"
                  />
                ) : (
                  <p className="text-[#e6edf3]">{review?.reviewer_name || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-[#7d8590] mb-1">Advisor Name</label>
                {isReviewer ? (
                  <input
                    type="text"
                    value={review?.advisor_name || ""}
                    onChange={(e) => handleReviewChange("advisor_name", e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2"
                  />
                ) : (
                  <p className="text-[#e6edf3]">{review?.advisor_name || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-[#7d8590] mb-1">Review Date</label>
                {isReviewer ? (
                  <input
                    type="date"
                    value={review?.review_date || ""}
                    onChange={(e) => handleReviewChange("review_date", e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2"
                  />
                ) : (
                  <p className="text-[#e6edf3]">{review?.review_date || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-[#7d8590] mb-1">Task Status</label>
                {isReviewer ? (
                  <select
                    value={review?.task_status || ""}
                    onChange={(e) => handleReviewChange("task_status", e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2"
                  >
                    <option value="">Select</option>
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Needs Improvement</option>
                  </select>
                ) : (
                  <p className="text-[#e6edf3]">{review?.task_status || "—"}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#7d8590] mb-1">Feedback</label>
              {isReviewer ? (
                <textarea
                  value={review?.feedback || ""}
                  onChange={(e) => handleReviewChange("feedback", e.target.value)}
                  rows="3"
                  className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2"
                />
              ) : (
                <p className="text-[#e6edf3] whitespace-pre-wrap">{review?.feedback || "—"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-[#7d8590] mb-1">Extra Workouts (YouTube links)</label>
              {isReviewer ? (
                <textarea
                  value={review?.extra_workouts || ""}
                  onChange={(e) => handleReviewChange("extra_workouts", e.target.value)}
                  rows="2"
                  className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2"
                  placeholder="https://youtube.com/..."
                />
              ) : (
                <p className="text-[#e6edf3] whitespace-pre-wrap">{review?.extra_workouts || "—"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-[#7d8590] mb-1">English Review</label>
              {isReviewer ? (
                <textarea
                  value={review?.english_review || ""}
                  onChange={(e) => handleReviewChange("english_review", e.target.value)}
                  rows="2"
                  className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2"
                />
              ) : (
                <p className="text-[#e6edf3] whitespace-pre-wrap">{review?.english_review || "—"}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#7d8590] mb-1">Star Rating (1-5)</label>
                {isReviewer ? (
                  <select
                    value={review?.star_rating || ""}
                    onChange={(e) => handleReviewChange("star_rating", parseInt(e.target.value) || null)}
                    className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2"
                  >
                    <option value="">Select</option>
                    {[1,2,3,4,5].map(r => <option key={r}>{r}</option>)}
                  </select>
                ) : (
                  <p className="text-[#e6edf3]">{review?.star_rating ? "⭐".repeat(review.star_rating) : "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-[#7d8590] mb-1">Total Score</label>
                {isReviewer ? (
                  <input
                    type="number"
                    value={review?.total_score || ""}
                    onChange={(e) => handleReviewChange("total_score", parseInt(e.target.value) || null)}
                    className="w-full bg-[#0d1117] border border-[#21262d] rounded px-3 py-2"
                  />
                ) : (
                  <p className="text-[#e6edf3]">{review?.total_score || "—"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Daily tasks */}
        <div className="bg-[#161b22] rounded-xl border border-[#21262d] p-6">
          <h2 className="text-lg font-semibold mb-4">📌 Daily Tasks</h2>
          {days.length === 0 ? (
            <p className="text-[#7d8590]">No tasks for this week.</p>
          ) : (
            <div className="space-y-4">
              {days.map(day => (
                <div key={day.id} className="border-l-2 border-[#21262d] pl-4">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={day.is_completed || false}
                      onChange={(e) => toggleDayCompletion(day.id, e.target.checked)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <span className="font-medium">{day.title}</span>
                  </div>
                  {day.tasks?.length > 0 && (
                    <ul className="ml-6 space-y-1 text-sm text-[#7d8590]">
                      {day.tasks.map(task => <li key={task.id}>• {task.title}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentWeekView;