// src/pages/student/StudentReviewSheetRange.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import API from "../../api/api";

const extractWeekNumber = (title) => {
  const match = title?.match(/Week\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 9999;
};

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

function StudentReviewSheetRange() {
  const { start, end } = useParams();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("student_id");
  const [selectedStudentId, setSelectedStudentId] = useState(studentIdParam ? parseInt(studentIdParam) : null);
  const [students, setStudents] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [expandedWeekId, setExpandedWeekId] = useState(null);
  const [updates, setUpdates] = useState({});

  const saveField = useCallback(async (weekId, field, value) => {
    try {
      let url = `week-review/${weekId}/`;
      const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";
      if (isReviewer && selectedStudentId) url += `?student_id=${selectedStudentId}`;
      await API.patch(url, { [field]: value });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
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

  // Load user & student list
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
          if (!selectedStudentId && studentsRes.data.length) {
            setSelectedStudentId(studentsRes.data[0].id);
          }
        } else setSelectedStudentId(null);
      } catch (err) { console.error(err); }
    };
    fetchUser();
  }, []);

  // Load weeks and reviews for the given range
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
        let allWeeks = modulesRes.data;
        // Filter by week number range
        const startNum = parseInt(start, 10);
        const endNum = parseInt(end, 10);
        allWeeks = allWeeks.filter(week => {
          const num = extractWeekNumber(week.title);
          return num >= startNum && num <= endNum;
        });
        // Sort by week number
        allWeeks.sort((a, b) => extractWeekNumber(a.title) - extractWeekNumber(b.title));
        setWeeks(allWeeks);

        const reviewsData = {};
        for (const week of allWeeks) {
          let reviewUrl = `week-review/${week.id}/`;
          if (isReviewer && selectedStudentId) reviewUrl += `?student_id=${selectedStudentId}`;
          try {
            const reviewRes = await API.get(reviewUrl);
            reviewsData[week.id] = reviewRes.data;
            if (reviewRes.data.id) await fetchUpdates(reviewRes.data.id);
          } catch {
            reviewsData[week.id] = {};
          }
        }
        setReviews(reviewsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load week data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedStudentId, userRole, start, end]);

  const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";
  const isEditable = isReviewer;

  const rows = [
    { key: "link_to_task_folder", label: "Link to Task Folder", type: "text", placeholder: "Paste folder link here" },
    { key: "status", label: "Status", type: "select", options: ["Task Completed", "In Progress", "Not Started", "Blocked"] },
    { key: "project_updates", label: "Project Updates", type: "textarea", rows: 2 },
    { key: "next_week_task", label: "Next Week Task", type: "textarea", rows: 2 },
    { key: "reviewer_name", label: "Reviewer Name", type: "text", placeholder: "e.g. Rizan sir" },
    { key: "advisor_name", label: "Advisor Name", type: "text", placeholder: "e.g. Aleema" },
    { key: "score_20", label: "Score [20]", type: "number", placeholder: "0-20" },
    { key: "extra_workouts_review", label: "Extra Workouts Review", type: "textarea", rows: 2 },
    { key: "score_10", label: "Score [10]", type: "number", placeholder: "0-10" },
    { key: "progress_video", label: "Progress Video", type: "text", placeholder: "YouTube link" },
    { key: "review_date", label: "Review Date", type: "date" },
    { key: "english_review", label: "English Review", type: "textarea", rows: 2 },
    { key: "score_20_english", label: "Score [20]", type: "number", placeholder: "0-20" },
  ];

  const renderCell = (weekId, row) => {
    const value = reviews[weekId]?.[row.key] ?? "";
    if (!isEditable) {
      if (row.type === "select") return <div className="px-2 py-1">{value || "—"}</div>;
      if (row.type === "textarea") return <div className="whitespace-pre-wrap break-words px-2 py-1">{value || "—"}</div>;
      if (row.type === "date") return <div className="px-2 py-1">{value || "—"}</div>;
      return <div className="px-2 py-1">{value || "—"}</div>;
    }

    if (row.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(weekId, row.key, e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:border-[#388bfd] outline-none"
        >
          <option value="">—</option>
          {row.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    if (row.type === "textarea") {
      return (
        <textarea
          rows={row.rows || 2}
          value={value}
          onChange={(e) => handleChange(weekId, row.key, e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:border-[#388bfd] outline-none resize-vertical"
          placeholder={row.placeholder || ""}
        />
      );
    }
    if (row.type === "number") {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleChange(weekId, row.key, e.target.value ? parseInt(e.target.value) : null)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:border-[#388bfd] outline-none"
          placeholder={row.placeholder || ""}
        />
      );
    }
    if (row.type === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => handleChange(weekId, row.key, e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:border-[#388bfd] outline-none"
          style={{ colorScheme: "dark" }}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(weekId, row.key, e.target.value)}
        className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:border-[#388bfd] outline-none"
        placeholder={row.placeholder || ""}
      />
    );
  };

  let dashboardLink = "/student/dashboard";
  if (userRole === "admin") dashboardLink = "/admin/dashboard";
  else if (userRole === "mentor") dashboardLink = "/mentor/dashboard";
  else if (userRole === "reviewer") dashboardLink = "/reviewer/dashboard";

  if (loading) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-[#0d1117] text-red-400 flex items-center justify-center p-8 text-center">{error}</div>;

  return (
    <div className="min-h-screen w-full bg-[#0d1117] text-[#e6edf3] font-sans">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">
              Weeks {start} – {end}
            </h1>
            <p className="text-[#7d8590] text-sm mt-1">
              {isReviewer && selectedStudentId
                ? students.find(s => s.id === selectedStudentId)?.name || "Select student"
                : "Your Weekly Progress"}
            </p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            {isReviewer && students.length > 0 && (
              <select
                value={selectedStudentId || ""}
                onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
                className="bg-[#161b22] border border-[#21262d] rounded-lg px-3 py-1.5 text-sm"
              >
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.username})</option>)}
              </select>
            )}
            <Link to={dashboardLink} className="bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              ← Dashboard
            </Link>
            <Link
              to={isReviewer && selectedStudentId ? `/student/review-sheet?student_id=${selectedStudentId}` : "/student/review-sheet"}
              className="bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              All Weeks
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#21262d] shadow-xl shadow-black/20">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#161b22] border-b border-[#21262d]">
              <tr>
                <th className="sticky left-0 bg-[#161b22] z-10 px-4 py-3 text-left text-[#7d8590] text-xs font-semibold uppercase w-48">
                  FIELD / WEEK
                </th>
                {weeks.map(week => {
                  const weekNum = extractWeekNumber(week.title);
                  return (
                    <th
                      key={week.id}
                      className="px-3 py-3 text-left text-[#e6edf3] text-sm font-medium min-w-[200px] border-l border-[#21262d]"
                    >
                      {cleanTitle(week.title)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {rows.map(row => (
                <tr key={row.key} className="hover:bg-[#161b22]/40">
                  <td className="sticky left-0 bg-[#0d1117] px-4 py-3 text-[#7d8590] text-sm font-medium border-r border-[#21262d]">
                    {row.label}
                  </td>
                  {weeks.map(week => (
                    <td key={week.id} className="px-3 py-2 border-l border-[#21262d] align-top">
                      {renderCell(week.id, row)}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Updates row */}
              <tr className="hover:bg-[#161b22]/40">
                <td className="sticky left-0 bg-[#0d1117] px-4 py-3 text-[#7d8590] text-sm font-medium border-r border-[#21262d]">
                  Updates & Extra Scores
                </td>
                {weeks.map(week => {
                  const rev = reviews[week.id] || {};
                  const weekReviewId = rev.id;
                  const weekUpdates = weekReviewId ? (updates[weekReviewId] || []) : [];
                  const isExpanded = expandedWeekId === week.id;
                  return (
                    <td key={week.id} className="px-3 py-2 border-l border-[#21262d] align-top">
                      {isReviewer && weekReviewId && (
                        <button
                          onClick={() => addUpdate(weekReviewId)}
                          className="text-xs bg-[#238636] hover:bg-[#2ea043] px-2 py-1 rounded mb-2"
                        >
                          + Add Update
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedWeekId(isExpanded ? null : week.id)}
                        className="text-xs text-[#7d8590] hover:text-white mb-2 block"
                      >
                        {isExpanded ? "▼ Hide Updates" : "▶ Show Updates"}
                      </button>
                      {isExpanded && (
                        <div className="space-y-2">
                          {weekUpdates.length === 0 && <p className="text-[#7d8590] text-xs">No updates yet.</p>}
                          {weekUpdates.map(upd => (
                            <div key={upd.id} className="border-l-2 border-[#21262d] pl-2 mb-2">
                              {isReviewer ? (
                                <>
                                  <textarea
                                    value={upd.update_text}
                                    onChange={(e) => updateUpdate(upd.id, "update_text", e.target.value)}
                                    rows="2"
                                    className="w-full bg-[#0d1117] border border-[#21262d] rounded px-2 py-1 text-xs"
                                    placeholder="Update notes..."
                                  />
                                  <div className="flex gap-2 mt-1">
                                    <input
                                      type="number"
                                      placeholder="Extra score"
                                      value={upd.extra_score ?? ""}
                                      onChange={(e) => updateUpdate(upd.id, "extra_score", e.target.value ? parseInt(e.target.value) : null)}
                                      className="w-24 bg-[#0d1117] border border-[#21262d] rounded px-2 py-1 text-xs"
                                    />
                                    <span className="text-[#484f58] text-xs">{new Date(upd.update_date).toLocaleDateString()}</span>
                                    <button onClick={() => deleteUpdate(upd.id)} className="text-red-400 hover:text-red-300 text-xs">🗑</button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="text-xs whitespace-pre-wrap break-words">{upd.update_text || "—"}</div>
                                  {upd.extra_score && <div className="text-xs text-emerald-400">+{upd.extra_score} pts</div>}
                                  <div className="text-[#484f58] text-xs">{new Date(upd.update_date).toLocaleDateString()}</div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-right text-[#484f58] text-xs">
          💡 {isReviewer ? "Click any cell to edit. Changes auto‑save." : "View‑only mode."}
        </div>
      </div>
    </div>
  );
}

export default StudentReviewSheetRange;