// src/pages/student/StudentReviewSheet.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

const cleanTitle = (title) => {
  if (!title) return "";
  const pattern = /^week\s+\d+\s*[–:\-]\s*/i;
  return title.replace(pattern, "").trim();
};

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
  const [updates, setUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedWeekId, setExpandedWeekId] = useState(null);

  const saveField = useCallback(async (weekId, field, value) => {
    try {
      let url = `week-review/${weekId}/`;
      const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";
      if (isReviewer && selectedStudentId) url += `?student_id=${selectedStudentId}`;
      await API.patch(url, { [field]: value });
    } catch (err) { console.error("Auto-save failed", err); }
  }, [userRole, selectedStudentId]);

  const debouncedSave = useCallback(debounce(saveField, 800), [saveField]);

  const handleChange = (weekId, field, value) => {
    setReviews(prev => ({ ...prev, [weekId]: { ...prev[weekId], [field]: value } }));
    debouncedSave(weekId, field, value);
  };

  const fetchUpdates = async (weekReviewId) => {
    try {
      const res = await API.get(`week-updates/?week_review=${weekReviewId}`);
      setUpdates(prev => ({ ...prev, [weekReviewId]: res.data }));
    } catch (err) { console.error(err); }
  };

  const addUpdate = async (weekReviewId) => {
    try {
      const res = await API.post("week-updates/", {
        week_review: weekReviewId,
        update_text: "",
        extra_score: null,
        created_by: userRole,
      });
      setUpdates(prev => ({ ...prev, [weekReviewId]: [...(prev[weekReviewId] || []), res.data] }));
    } catch (err) { console.error(err); }
  };

  const updateUpdate = async (updateId, field, value) => {
    try {
      await API.patch(`week-updates/${updateId}/`, { [field]: value });
      for (const [wrId, updList] of Object.entries(updates)) {
        if (updList.some(u => u.id === updateId)) { fetchUpdates(parseInt(wrId)); break; }
      }
    } catch (err) { console.error(err); }
  };

  const deleteUpdate = async (updateId) => {
    if (!window.confirm("Delete this update?")) return;
    try {
      await API.delete(`week-updates/${updateId}/`);
      for (const [wrId, updList] of Object.entries(updates)) {
        if (updList.some(u => u.id === updateId)) { fetchUpdates(parseInt(wrId)); break; }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRes = await API.get("users/me/");
        const user = userRes.data;
        if (user.is_admin) setUserRole("admin");
        else if (user.is_mentor) setUserRole("mentor");
        else if (user.is_reviewer) setUserRole("reviewer");
        else setUserRole("student");
        const canReview = user.is_admin || user.is_mentor || user.is_reviewer;
        if (canReview) {
          const studentsRes = await API.get("students/list/");
          setStudents(studentsRes.data);
          if (studentsRes.data.length > 0) {
            const queryParams = new URLSearchParams(window.location.search);
            const studentIdParam = queryParams.get('student_id');
            if (studentIdParam) {
              const id = parseInt(studentIdParam);
              setSelectedStudentId(studentsRes.data.some(s => s.id === id) ? id : studentsRes.data[0].id);
            } else setSelectedStudentId(studentsRes.data[0].id);
          }
        } else setSelectedStudentId(null);
      } catch (err) { console.error(err); }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";
      if (isReviewer && !selectedStudentId) return;
      setLoading(true);
      setError(null);
      try {
        let modulesUrl = "modules/student-modules/";
        if (isReviewer && selectedStudentId) modulesUrl += `?student_id=${selectedStudentId}`;
        const modulesRes = await API.get(modulesUrl);
        const sorted = [...modulesRes.data].sort((a, b) => a.order - b.order);
        setWeeks(sorted);
        const reviewsData = {};
        for (const week of sorted) {
          let reviewUrl = `week-review/${week.id}/`;
          if (isReviewer && selectedStudentId) reviewUrl += `?student_id=${selectedStudentId}`;
          try {
            const reviewRes = await API.get(reviewUrl);
            reviewsData[week.id] = reviewRes.data;
            if (reviewRes.data.id) await fetchUpdates(reviewRes.data.id);
          } catch { reviewsData[week.id] = {}; }
        }
        setReviews(reviewsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load review data. Please check if you have modules assigned.");
      } finally { setLoading(false); }
    };
    fetchData();
  }, [selectedStudentId, userRole]);

  const totalPages = Math.ceil(weeks.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const currentWeeks = weeks.slice(start, start + rowsPerPage);

  let dashboardLink = "/student/dashboard";
  if (userRole === "admin") dashboardLink = "/admin/dashboard";
  else if (userRole === "mentor") dashboardLink = "/mentor/dashboard";
  else if (userRole === "reviewer") dashboardLink = "/reviewer/dashboard";

  if (loading) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-[#0d1117] text-red-400 flex items-center justify-center p-8 text-center">{error}</div>;

  const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-6">
      <div className="max-w-full overflow-x-auto">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-bold">📊 Weekly Review Sheet</h1>
          <div className="flex gap-3 items-center">
            {isReviewer && students.length > 0 && (
              <select value={selectedStudentId || ""} onChange={(e) => setSelectedStudentId(parseInt(e.target.value))} className="bg-[#161b22] border border-[#21262d] rounded px-3 py-1.5 text-sm">
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.username})</option>)}
              </select>
            )}
            <select value={rowsPerPage} onChange={(e) => setRowsPerPage(parseInt(e.target.value))} className="bg-[#161b22] border border-[#21262d] rounded px-2 py-1 text-sm">
              <option value={10}>10 rows</option><option value={20}>20 rows</option><option value={44}>44 rows</option>
            </select>
            <Link to={dashboardLink} className="text-[#7d8590] hover:text-white text-sm">← Dashboard</Link>
          </div>
        </div>

        <table className="w-full text-sm border-collapse border border-[#21262d]">
          <thead className="bg-[#161b22]">
            <tr>
              <th className="border border-[#21262d] p-2">Week</th>
              <th className="border border-[#21262d] p-2">Reviewer Name</th>
              <th className="border border-[#21262d] p-2">Advisor Name</th>
              <th className="border border-[#21262d] p-2">Review Date</th>
              <th className="border border-[#21262d] p-2">Marks(0-100)</th>
              <th className="border border-[#21262d] p-2">Feedback</th>
              <th className="border border-[#21262d] p-2">Extra Workouts</th>
              <th className="border border-[#21262d] p-2">English Review</th>
              <th className="border border-[#21262d] p-2">⭐ Rating</th>
            </tr>
          </thead>
          <tbody>
            {currentWeeks.map((week, idx) => {
              const weekNumber = start + idx + 1;
              const rev = reviews[week.id] || {};
              const title = cleanTitle(week.title);
              const weekReviewId = rev.id;
              const weekUpdates = weekReviewId ? (updates[weekReviewId] || []) : [];
              return (
                <React.Fragment key={week.id}>
                  <tr className="hover:bg-[#161b22]/50">
                    <td className="border border-[#21262d] p-2 font-medium"><div className="flex items-center gap-2"><span className="text-base">📘</span><div>Week {weekNumber}</div></div></td>
                    <td className="border border-[#21262d] p-2">{isReviewer ? <input type="text" value={rev.reviewer_name || ""} onChange={(e) => handleChange(week.id, "reviewer_name", e.target.value)} className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1" /> : (rev.reviewer_name || "—")}</td>
                    <td className="border border-[#21262d] p-2">{isReviewer ? <input type="text" value={rev.advisor_name || ""} onChange={(e) => handleChange(week.id, "advisor_name", e.target.value)} className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1" /> : (rev.advisor_name || "—")}</td>
                    <td className="border border-[#21262d] p-2">{isReviewer ? <input type="date" value={rev.review_date || ""} onChange={(e) => handleChange(week.id, "review_date", e.target.value)} className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1" /> : (rev.review_date || "—")}</td>
                    <td className="border border-[#21262d] p-2">{isReviewer ? <input type="number" min="0" max="100" step="1" value={rev.total_score ?? ""} onChange={(e) => handleChange(week.id, "total_score", e.target.value === "" ? null : parseInt(e.target.value))} className="w-20 bg-[#0d1117] border border-[#21262d] rounded px-2 py-1 text-center" /> : (rev.total_score !== undefined && rev.total_score !== null ? rev.total_score : "—")}</td>
                    <td className="border border-[#21262d] p-2">{isReviewer ? <textarea value={rev.feedback || ""} onChange={(e) => handleChange(week.id, "feedback", e.target.value)} rows="2" className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1" /> : (rev.feedback || "—")}</td>
                    <td className="border border-[#21262d] p-2">{isReviewer ? <textarea value={rev.extra_workouts || ""} onChange={(e) => handleChange(week.id, "extra_workouts", e.target.value)} rows="2" className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1" placeholder="YouTube links" /> : (rev.extra_workouts || "—")}</td>
                    <td className="border border-[#21262d] p-2">{isReviewer ? <textarea value={rev.english_review || ""} onChange={(e) => handleChange(week.id, "english_review", e.target.value)} rows="2" className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1" /> : (rev.english_review || "—")}</td>
                    <td className="border border-[#21262d] p-2 text-center">{isReviewer ? <select value={rev.star_rating ?? ""} onChange={(e) => handleChange(week.id, "star_rating", e.target.value === "" ? null : parseInt(e.target.value))} className="bg-[#0d1117] border border-[#21262d] rounded px-2 py-1"><option value="">Select</option>{[1,2,3,4,5].map(r => <option key={r}>{r}</option>)}</select> : (rev.star_rating ? "⭐".repeat(rev.star_rating) : "—")}</td>
                  </tr>
                  <tr>
                    <td colSpan="9" className="p-0">
                      <div className="border-t border-[#21262d] bg-[#0d1117]/50">
                        <div className="p-3 flex justify-between items-center">
                          <button onClick={() => setExpandedWeekId(expandedWeekId === week.id ? null : week.id)} className="text-xs text-[#7d8590] hover:text-white">{expandedWeekId === week.id ? "▼ Hide Updates" : "▶ Show Updates"}</button>
                          {isReviewer && weekReviewId && <button onClick={() => addUpdate(weekReviewId)} className="text-xs bg-[#238636] hover:bg-[#2ea043] px-2 py-1 rounded">+ Add Update</button>}
                        </div>
                        {expandedWeekId === week.id && (
                          <div className="px-3 pb-3">
                            {weekUpdates.length === 0 && <p className="text-[#7d8590] text-xs">No updates yet. Click "Add Update".</p>}
                            {weekUpdates.map(upd => (
                              <div key={upd.id} className="border-l-2 border-[#21262d] pl-3 mb-2 flex flex-wrap gap-2 items-start">
                                <div className="flex-1"><textarea value={upd.update_text} onChange={(e) => updateUpdate(upd.id, "update_text", e.target.value)} rows="2" className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1 text-xs" placeholder="Update notes..." /></div>
                                <div className="w-24"><input type="number" placeholder="Score" value={upd.extra_score ?? ""} onChange={(e) => updateUpdate(upd.id, "extra_score", e.target.value ? parseInt(e.target.value) : null)} className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1 text-xs" /></div>
                                <div className="text-[#7d8590] text-xs whitespace-nowrap">{new Date(upd.update_date).toLocaleDateString()}</div>
                                {isReviewer && <button onClick={() => deleteUpdate(upd.id)} className="text-red-400 hover:text-red-300 text-xs">🗑</button>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
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