// src/pages/student/StudentReviewSheet.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

// Clean title: remove "Week X – " etc.
const cleanTitle = (title) => {
  if (!title) return "";
  const pattern = /^week\s+\d+\s*[–:\-]\s*/i;
  return title.replace(pattern, "").trim();
};

function StudentReviewSheet() {
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isReviewer, setIsReviewer] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await API.get("users/me/");
        setIsReviewer(userRes.data.is_admin || userRes.data.is_mentor);

        const modulesRes = await API.get("modules/student-modules/");
        const sorted = [...modulesRes.data].sort((a, b) => a.order - b.order);
        setWeeks(sorted);

        const reviewsData = {};
        for (const week of sorted) {
          try {
            const reviewRes = await API.get(`week-review/${week.id}/`);
            reviewsData[week.id] = reviewRes.data;
          } catch {
            reviewsData[week.id] = {};
          }
        }
        setReviews(reviewsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (weekId, field, value) => {
    setReviews(prev => ({
      ...prev,
      [weekId]: { ...prev[weekId], [field]: value }
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const week of weeks) {
        const rev = reviews[week.id];
        if (rev && Object.keys(rev).length) {
          await API.put(`week-review/${week.id}/`, rev);
        }
      }
      alert("All reviews saved!");
    } catch (err) {
      console.error(err);
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(weeks.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const currentWeeks = weeks.slice(start, start + rowsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-6">
      <div className="max-w-full overflow-x-auto">
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">📊 Weekly Review Sheet</h1>
          <div className="flex gap-3">
            {isReviewer && (
              <button
                onClick={saveAll}
                disabled={saving}
                className="bg-[#238636] hover:bg-[#2ea043] px-4 py-1.5 rounded text-sm"
              >
                {saving ? "Saving..." : "💾 Save All"}
              </button>
            )}
            <Link to="/student/dashboard" className="text-[#7d8590] hover:text-white text-sm">
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Excel‑style table */}
        <table className="w-full text-sm border-collapse border border-[#21262d]">
          <thead className="bg-[#161b22]">
            <tr>
              <th className="border border-[#21262d] p-2">Week</th>
              <th className="border border-[#21262d] p-2">Reviewer Name</th>
              <th className="border border-[#21262d] p-2">Advisor Name</th>
              <th className="border border-[#21262d] p-2">Review Date</th>
              <th className="border border-[#21262d] p-2">Task Status</th>
              <th className="border border-[#21262d] p-2">Feedback</th>
              <th className="border border-[#21262d] p-2">Extra Workouts</th>
              <th className="border border-[#21262d] p-2">English Review</th>
              <th className="border border-[#21262d] p-2">⭐ Rating</th>
              <th className="border border-[#21262d] p-2">Total Score</th>
            </tr>
          </thead>
          <tbody>
            {currentWeeks.map((week, idx) => {
              const weekNumber = start + idx + 1;
              const rev = reviews[week.id] || {};
              const title = cleanTitle(week.title);
              return (
                <tr key={week.id} className="hover:bg-[#161b22]/50">
                  <td className="border border-[#21262d] p-2 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📘</span>
                      <div>
                        <div>Week {weekNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-[#21262d] p-2">
                    {/* {isReviewer ? (
                      <input
                        type="text"
                        value={rev.reviewer_name || ""}
                        onChange={(e) => handleChange(week.id, "reviewer_name", e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      />
                    ) : (rev.reviewer_name || "—")} */}
                  </td>
                  <td className="border border-[#21262d] p-2">
                    {/* {isReviewer ? (
                      <input
                        type="text"
                        value={rev.advisor_name || ""}
                        onChange={(e) => handleChange(week.id, "advisor_name", e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      />
                    ) : (rev.advisor_name || "—")} */}
                  </td>
                  <td className="border border-[#21262d] p-2">
                    {/* {isReviewer ? (
                      <input
                        type="date"
                        value={rev.review_date || ""}
                        onChange={(e) => handleChange(week.id, "review_date", e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      />
                    ) : (rev.review_date || "—")} */}
                  </td>
                  <td className="border border-[#21262d] p-2">
                    {/* {isReviewer ? (
                      <select
                        value={rev.task_status || ""}
                        onChange={(e) => handleChange(week.id, "task_status", e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      >
                        <option value="">Select</option>
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Needs Improvement</option>
                      </select>
                    ) : (rev.task_status || "—")} */}
                  </td>
                  <td className="border border-[#21262d] p-2">
                    {/* {isReviewer ? (
                      <textarea
                        value={rev.feedback || ""}
                        onChange={(e) => handleChange(week.id, "feedback", e.target.value)}
                        rows="2"
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      />
                    ) : (rev.feedback || "—")} */}
                  </td>
                  <td className="border border-[#21262d] p-2">
                    {/* {isReviewer ? (
                      <textarea
                        value={rev.extra_workouts || ""}
                        onChange={(e) => handleChange(week.id, "extra_workouts", e.target.value)}
                        rows="2"
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                        placeholder="YouTube links"
                      />
                    ) : (rev.extra_workouts || "—")} */}
                  </td>
                  <td className="border border-[#21262d] p-2">
                    {/* {isReviewer ? (
                      <textarea
                        value={rev.english_review || ""}
                        onChange={(e) => handleChange(week.id, "english_review", e.target.value)}
                        rows="2"
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      />
                    ) : (rev.english_review || "—")} */}
                  </td>
                  <td className="border border-[#21262d] p-2 text-center">
                    {/* {isReviewer ? (
                      <select
                        value={rev.star_rating || ""}
                        onChange={(e) => handleChange(week.id, "star_rating", parseInt(e.target.value) || null)}
                        className="bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      >
                        <option value="">Select</option>
                        {[1,2,3,4,5].map(r => <option key={r}>{r}</option>)}
                      </select>
                    ) : (rev.star_rating ? "⭐".repeat(rev.star_rating) : "—")} */}
                  </td>
                  <td className="border border-[#21262d] p-2 text-center">
                    {/* {isReviewer ? (
                      <input
                        type="number"
                        value={rev.total_score || ""}
                        onChange={(e) => handleChange(week.id, "total_score", parseInt(e.target.value) || null)}
                        className="w-20 bg-[#0d1117] border border-[#21262d] rounded px-2 py-1 text-center"
                      />
                    ) : (rev.total_score || "—")} */}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-[#21262d] disabled:opacity-50 hover:bg-[#21262d]"
            >
              « First
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-[#21262d] disabled:opacity-50 hover:bg-[#21262d]"
            >
              Previous
            </button>
            <span className="text-[#7d8590]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-[#21262d] disabled:opacity-50 hover:bg-[#21262d]"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-[#21262d] disabled:opacity-50 hover:bg-[#21262d]"
            >
              Last »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentReviewSheet;