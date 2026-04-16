// src/pages/student/StudentWeekView.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../api/api";

function StudentWeekView() {
  const { weekId } = useParams();
  const [week, setWeek] = useState(null);
  const [days, setDays] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchWeekData = async () => {
      try {
        const weekRes = await API.get(`modules/${weekId}/`);
        setWeek(weekRes.data);

        const daysRes = await API.get(`days/?module=${weekId}`);
        const daysData = daysRes.data;

        // Fetch tasks for each day
        const enrichedDays = await Promise.all(
          daysData.map(async (day) => {
            const tasksRes = await API.get(`tasks/?day=${day.id}`);
            return { ...day, tasks: tasksRes.data };
          })
        );
        setDays(enrichedDays);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeekData();
  }, [weekId]);

  const toggleDayCompletion = async (dayId, completed) => {
    try {
      await API.patch(`days/${dayId}/`, { is_completed: completed });
      setDays(prev =>
        prev.map(day => (day.id === dayId ? { ...day, is_completed: completed } : day))
      );
    } catch (err) {
      console.error("Failed to update day", err);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    // Here you would save notes to backend (e.g., via a StudentWeekNote model)
    alert("Notes saved (backend integration pending)");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!week) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        Week not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/student/review-sheet" className="text-[#7d8590] hover:text-white text-sm">
            ← Back to Review Sheet
          </Link>
          <button
            onClick={saveNotes}
            disabled={saving}
            className="bg-[#238636] hover:bg-[#2ea043] px-4 py-1.5 rounded text-sm"
          >
            {saving ? "Saving..." : "💾 Save Notes"}
          </button>
        </div>

        {/* Week Title */}
        <div className="bg-[#161b22] rounded-xl border border-[#21262d] p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Week {week.order || week.id} – {week.title}</h1>
          <p className="text-[#7d8590]">{week.content || "No description available."}</p>
        </div>

        {/* Daily Tasks Table */}
        <div className="bg-[#161b22] rounded-xl border border-[#21262d] p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📌 Daily Tasks</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#21262d]">
                  <th className="text-left py-2 px-2">Completed</th>
                  <th className="text-left py-2 px-2">Day</th>
                  <th className="text-left py-2 px-2">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {days.map(day => (
                  <tr key={day.id} className="border-b border-[#21262d]/50">
                    <td className="py-2 px-2 w-10">
                      <input
                        type="checkbox"
                        checked={day.is_completed || false}
                        onChange={(e) => toggleDayCompletion(day.id, e.target.checked)}
                        className="w-4 h-4 rounded border-[#30363d] accent-emerald-500"
                      />
                    </td>
                    <td className="py-2 px-2 font-medium">{day.title}</td>
                    <td className="py-2 px-2 text-[#7d8590]">
                      {day.tasks?.map(task => task.title).join(", ") || "No tasks"}
                    </td>
                  </tr>
                ))}
                {days.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-[#7d8590]">No days available.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-[#161b22] rounded-xl border border-[#21262d] p-6">
          <h2 className="text-lg font-semibold mb-4">📝 Review Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="5"
            placeholder="Write your review notes, tasks completed, challenges faced, and areas to improve..."
            className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-[#e6edf3] focus:outline-none focus:border-[#388bfd]"
          />
        </div>
      </div>
    </div>
  );
}

export default StudentWeekView;