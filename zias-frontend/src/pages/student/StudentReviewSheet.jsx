// src/pages/student/StudentReviewSheet.jsx
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

// Helper: clean module title (remove "Week X – " etc.)
const cleanTitle = (title) => {
  if (!title) return "";
  const pattern = /^week\s+\d+\s*[–:\-]\s*/i;
  return title.replace(pattern, "").trim();
};

// Debounce function – waits 800ms after last change before saving
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function StudentReviewSheet() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [isReviewer, setIsReviewer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // -------- Auto‑save function (sends PATCH request) --------
  const saveField = async (weekId, field, value) => {
    try {
      // Use PATCH to update only the changed field
      await API.patch(`week-review/${weekId}/`, { [field]: value });
      console.log(`Auto-saved: week ${weekId}, ${field} = ${value}`);
    } catch (err) {
      console.error("Auto-save failed", err);
      // You could show a small toast here if desired
    }
  };

  // Debounced version of saveField (waits 800ms after typing stops)
  const debouncedSave = useCallback(debounce(saveField, 800), []);

  // -------- Handle input change: update local state + trigger auto‑save --------
  const handleChange = (weekId, field, value) => {
    // 1. Update local state immediately (so UI feels responsive)
    setReviews(prev => ({
      ...prev,
      [weekId]: { ...prev[weekId], [field]: value }
    }));
    // 2. Schedule auto‑save after 800ms
    debouncedSave(weekId, field, value);
  };

  // -------- Fetch user role and student list --------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRes = await API.get("users/me/");
        const user = userRes.data;
        const canReview = user.is_admin || user.is_mentor || user.is_reviewer;
        setIsReviewer(canReview);
        if (canReview) {
          const studentsRes = await API.get("students/list/");
          setStudents(studentsRes.data);
          if (studentsRes.data.length > 0) {
            // Check URL query parameter ?student_id=...
            const queryParams = new URLSearchParams(window.location.search);
            const studentIdParam = queryParams.get('student_id');
            if (studentIdParam) {
              const id = parseInt(studentIdParam);
              if (studentsRes.data.some(s => s.id === id)) {
                setSelectedStudentId(id);
              } else {
                setSelectedStudentId(studentsRes.data[0].id);
              }
            } else {
              setSelectedStudentId(studentsRes.data[0].id);
            }
          }
        } else {
          setSelectedStudentId(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // -------- Fetch weeks and reviews when selected student changes --------
  useEffect(() => {
    const fetchData = async () => {
      if (isReviewer && !selectedStudentId) return;
      setLoading(true);
      try {
        let modulesUrl = "modules/student-modules/";
        if (isReviewer && selectedStudentId) {
          modulesUrl += `?student_id=${selectedStudentId}`;
        }
        const modulesRes = await API.get(modulesUrl);
        const sorted = [...modulesRes.data].sort((a, b) => a.order - b.order);
        setWeeks(sorted);

        const reviewsData = {};
        for (const week of sorted) {
          let reviewUrl = `week-review/${week.id}/`;
          if (isReviewer && selectedStudentId) {
            reviewUrl += `?student_id=${selectedStudentId}`;
          }
          try {
            const reviewRes = await API.get(reviewUrl);
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
  }, [selectedStudentId, isReviewer]);

  // Pagination
  const totalPages = Math.ceil(weeks.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const currentWeeks = weeks.slice(start, start + rowsPerPage);

  // Determine dashboard link
  let dashboardLink = "/student/dashboard";
  if (isReviewer) {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.is_admin) dashboardLink = "/admin/dashboard";
    else if (user?.is_mentor) dashboardLink = "/mentor/dashboard";
    else if (user?.is_reviewer) dashboardLink = "/reviewer/dashboard";
  }

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
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-bold">📊 Weekly Review Sheet</h1>
          <div className="flex gap-3 items-center">
            {isReviewer && students.length > 0 && (
              <select
                value={selectedStudentId || ""}
                onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
                className="bg-[#161b22] border border-[#21262d] rounded px-3 py-1.5 text-sm"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.username})</option>
                ))}
              </select>
            )}
            <Link to={dashboardLink} className="text-[#7d8590] hover:text-white text-sm">
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Spreadsheet table */}
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
              const isEditable = isReviewer;
              return (
                <tr key={week.id} className="hover:bg-[#161b22]/50">
                  <td className="border border-[#21262d] p-2 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📘</span>
                      <div>
                        <div>Week {weekNumber}</div>
                        <div className="text-[#7d8590] text-xs">{title}</div>
                      </div>
                    </div>
                  </td>
                  {/* Reviewer Name */}
                  <td className="border border-[#21262d] p-2">
                    {isEditable ? (
                      <input
                        type="text"
                        value={rev.reviewer_name || ""}
                        onChange={(e) => handleChange(week.id, "reviewer_name", e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      />
                    ) : (rev.reviewer_name || "—")}
                  </td>
                  {/* Advisor Name */}
                  <td className="border border-[#21262d] p-2">
                    {isEditable ? (
                      <input
                        type="text"
                        value={rev.advisor_name || ""}
                        onChange={(e) => handleChange(week.id, "advisor_name", e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      />
                    ) : (rev.advisor_name || "—")}
                  </td>
                  {/* Review Date */}
                  <td className="border border-[#21262d] p-2">
                    {isEditable ? (
                      <input
                        type="date"
                        value={rev.review_date || ""}
                        onChange={(e) => handleChange(week.id, "review_date", e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      />
                    ) : (rev.review_date || "—")}
                  </td>
                  {/* Task Status */}
                  <td className="border border-[#21262d] p-2">
                    {isEditable ? (
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
                    ) : (rev.task_status || "—")}
                  </td>
                  {/* Feedback */}
                  <td className="border border-[#21262d] p-2">
                    {isEditable ? (
                      <textarea
                        value={rev.feedback || ""}
                        onChange={(e) => handleChange(week.id, "feedback", e.target.value)}
                        rows="2"
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      />
                    ) : (rev.feedback || "—")}
                  </td>
                  {/* Extra Workouts */}
                  <td className="border border-[#21262d] p-2">
                    {isEditable ? (
                      <textarea
                        value={rev.extra_workouts || ""}
                        onChange={(e) => handleChange(week.id, "extra_workouts", e.target.value)}
                        rows="2"
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                        placeholder="YouTube links"
                      />
                    ) : (rev.extra_workouts || "—")}
                  </td>
                  {/* English Review */}
                  <td className="border border-[#21262d] p-2">
                    {isEditable ? (
                      <textarea
                        value={rev.english_review || ""}
                        onChange={(e) => handleChange(week.id, "english_review", e.target.value)}
                        rows="2"
                        className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      />
                    ) : (rev.english_review || "—")}
                  </td>
                  {/* Star Rating */}
                  <td className="border border-[#21262d] p-2 text-center">
                    {isEditable ? (
                      <select
                        value={rev.star_rating || ""}
                        onChange={(e) => handleChange(week.id, "star_rating", parseInt(e.target.value) || null)}
                        className="bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"
                      >
                        <option value="">Select</option>
                        {[1,2,3,4,5].map(r => <option key={r}>{r}</option>)}
                      </select>
                    ) : (rev.star_rating ? "⭐".repeat(rev.star_rating) : "—")}
                  </td>
                  {/* Total Score */}
                  <td className="border border-[#21262d] p-2 text-center">
                    {isEditable ? (
                      <input
                        type="number"
                        value={rev.total_score || ""}
                        onChange={(e) => handleChange(week.id, "total_score", parseInt(e.target.value) || null)}
                        className="w-20 bg-[#0d1117] border border-[#21262d] rounded px-2 py-1 text-center"
                      />
                    ) : (rev.total_score || "—")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1 rounded border border-[#21262d] disabled:opacity-50 hover:bg-[#21262d]">« First</button>
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 rounded border border-[#21262d] disabled:opacity-50 hover:bg-[#21262d]">Previous</button>
            <span className="text-[#7d8590]">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-[#21262d] disabled:opacity-50 hover:bg-[#21262d]">Next</button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-[#21262d] disabled:opacity-50 hover:bg-[#21262d]">Last »</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentReviewSheet;