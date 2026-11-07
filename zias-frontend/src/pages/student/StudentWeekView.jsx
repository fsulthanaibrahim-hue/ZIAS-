import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../../api/api";

function StudentWeekView() {
  const { weekId } = useParams();
  const navigate = useNavigate();
  const [week, setWeek] = useState(null);
  const [days, setDays] = useState([]);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isReviewer, setIsReviewer] = useState(false);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await API.get("users/me/");
        setIsReviewer(userRes.data.is_admin || userRes.data.is_mentor);
        setIsStudent(userRes.data.is_student);

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

  const completeWeek = async () => {
    // Check if all days are completed
    const allCompleted = days.every(day => day.is_completed === true);
    if (!allCompleted) {
      alert("Please complete all days before marking the week as completed.");
      return;
    }

    setCompleting(true);
    try {
      await API.post(`/api/modules/${weekId}/complete/`);
      alert("Week completed successfully! Next week will be unlocked.");
      // Optionally redirect back to modules page
      navigate("/student/modules");
    } catch (err) {
      console.error(err);
      alert("Failed to complete week. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allDaysCompleted = days.length > 0 && days.every(day => day.is_completed === true);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link to="/student/review-sheet" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Back to Review Sheet
          </Link>
          {isReviewer && (
            <button
              onClick={saveReview}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm"
            >
              {saving ? "Saving..." : "💾 Save Review"}
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Week {week?.order || week?.id} – {week?.title}</h1>
          <p className="text-gray-500">{week?.content || "No description."}</p>
        </div>

        {/* Review form (only for reviewers) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Weekly Review</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Reviewer Name</label>
                {isReviewer ? (
                  <input
                    type="text"
                    value={review?.reviewer_name || ""}
                    onChange={(e) => handleReviewChange("reviewer_name", e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-800">{review?.reviewer_name || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Advisor Name</label>
                {isReviewer ? (
                  <input
                    type="text"
                    value={review?.advisor_name || ""}
                    onChange={(e) => handleReviewChange("advisor_name", e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-800">{review?.advisor_name || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Review Date</label>
                {isReviewer ? (
                  <input
                    type="date"
                    value={review?.review_date || ""}
                    onChange={(e) => handleReviewChange("review_date", e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-800">{review?.review_date || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Task Status</label>
                {isReviewer ? (
                  <select
                    value={review?.task_status || ""}
                    onChange={(e) => handleReviewChange("task_status", e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Needs Improvement</option>
                  </select>
                ) : (
                  <p className="text-gray-800">{review?.task_status || "—"}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Feedback</label>
              {isReviewer ? (
                <textarea
                  value={review?.feedback || ""}
                  onChange={(e) => handleReviewChange("feedback", e.target.value)}
                  rows="3"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap">{review?.feedback || "—"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Extra Workouts (YouTube links)</label>
              {isReviewer ? (
                <textarea
                  value={review?.extra_workouts || ""}
                  onChange={(e) => handleReviewChange("extra_workouts", e.target.value)}
                  rows="2"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://youtube.com/..."
                />
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap">{review?.extra_workouts || "—"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">English Review</label>
              {isReviewer ? (
                <textarea
                  value={review?.english_review || ""}
                  onChange={(e) => handleReviewChange("english_review", e.target.value)}
                  rows="2"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap">{review?.english_review || "—"}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Star Rating (1-5)</label>
                {isReviewer ? (
                  <select
                    value={review?.star_rating || ""}
                    onChange={(e) => handleReviewChange("star_rating", parseInt(e.target.value) || null)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    {[1,2,3,4,5].map(r => <option key={r}>{r}</option>)}
                  </select>
                ) : (
                  <p className="text-gray-800">{review?.star_rating ? "⭐".repeat(review.star_rating) : "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Total Score</label>
                {isReviewer ? (
                  <input
                    type="number"
                    value={review?.total_score || ""}
                    onChange={(e) => handleReviewChange("total_score", parseInt(e.target.value) || null)}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-800">{review?.total_score || "—"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Daily tasks */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📌 Daily Tasks</h2>
          {days.length === 0 ? (
            <p className="text-gray-500">No tasks for this week.</p>
          ) : (
            <div className="space-y-4">
              {days.map(day => (
                <div key={day.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={day.is_completed || false}
                      onChange={(e) => toggleDayCompletion(day.id, e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="font-medium text-gray-800">{day.title}</span>
                  </div>
                  {day.tasks?.length > 0 && (
                    <ul className="ml-6 space-y-1 text-sm text-gray-500">
                      {day.tasks.map(task => <li key={task.id}>• {task.title}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complete Week Button - only for students */}
        {isStudent && days.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={completeWeek}
              disabled={completing || !allDaysCompleted}
              className={`px-6 py-2 rounded-lg text-white font-medium transition ${
                allDaysCompleted
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {completing ? "Completing..." : "✅ Complete Week"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentWeekView;