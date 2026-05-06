// src/pages/student/StudentReviewSheetRange.jsx – with student‑editable progress video link
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import API from "../../api/api";
import StudentSidebar from "../../components/StudentSidebar";

const extractWeekNumber = (title) => {
  const match = title?.match(/Week\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 9999;
};

const cleanTitle = (title) => {
  if (!title) return "";
  const pattern = /^week\s+\d+\s*[–:\-]\s*/i;
  return title.replace(pattern, "").trim();
};

// Helper to compute total score (0‑35) and star rating from three 0‑5 marks
const computeTotalAndStars = (extra, english, video) => {
  const extraNum = Number(extra) || 0;
  const englishNum = Number(english) || 0;
  const videoNum = Number(video) || 0;
  const sum = Math.min(5, Math.max(0, extraNum)) +
              Math.min(5, Math.max(0, englishNum)) +
              Math.min(5, Math.max(0, videoNum));
  const total = Math.round((sum * 35) / 15);
  const finalTotal = Math.min(35, Math.max(0, total));
  let stars = 1;
  if (finalTotal >= 29) stars = 5;
  else if (finalTotal >= 22) stars = 4;
  else if (finalTotal >= 15) stars = 3;
  else if (finalTotal >= 8) stars = 2;
  else stars = 1;
  return { total: finalTotal, stars };
};

// Star rating display component (reusable)
const StarDisplay = ({ value }) => {
  const fullStars = value;
  const emptyStars = 5 - fullStars;
  return (
    <div className="flex gap-1">
      {[...Array(fullStars)].map((_, i) => <span key={i} className="text-yellow-500 text-lg">★</span>)}
      {[...Array(emptyStars)].map((_, i) => <span key={i} className="text-gray-300 text-lg">★</span>)}
      <span className="ml-2 text-xs text-gray-500">({value}/5)</span>
    </div>
  );
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

  // Save a single field to the backend (auto‑save for reviewers)
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

  // For students, we will save immediately (no debounce)
  const saveStudentField = async (weekId, field, value) => {
    try {
      await API.patch(`week-review/${weekId}/?student_id=${selectedStudentId}`, { [field]: value });
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleChange = (weekId, field, value) => {
    // Update local state
    setReviews(prev => ({ ...prev, [weekId]: { ...prev[weekId], [field]: value } }));
    // Save to backend
    if (userRole === "student") {
      saveStudentField(weekId, field, value);
    } else {
      debouncedSave(weekId, field, value);
    }
  };

  // Updates logic (unchanged)
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

  // Determine user role and, for reviewers, fetch students
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRes = await API.get("users/me/");
        const user = userRes.data;
        if (user.is_admin) setUserRole("admin");
        else if (user.is_mentor) setUserRole("mentor");
        else if (user.is_reviewer) setUserRole("reviewer");
        else setUserRole("student");
      } catch (err) { console.error(err); }
    };
    fetchUser();
  }, []);

  // For reviewers, fetch students list
  useEffect(() => {
    const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";
    if (!isReviewer) return;
    if (studentIdParam) {
      setSelectedStudentId(parseInt(studentIdParam));
      return;
    }
    const fetchStudents = async () => {
      try {
        const res = await API.get("students/list/");
        setStudents(res.data);
        if (res.data.length) setSelectedStudentId(res.data[0].id);
      } catch (err) { console.error(err); }
    };
    fetchStudents();
  }, [userRole, studentIdParam]);

  // Fetch weeks and reviews
  useEffect(() => {
    const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";
    if (isReviewer && !selectedStudentId) return;
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        let modulesUrl = "modules/student-modules/";
        if (isReviewer && selectedStudentId) modulesUrl += `?student_id=${selectedStudentId}`;
        const modulesRes = await API.get(modulesUrl);
        let allWeeks = modulesRes.data;
        const startNum = parseInt(start, 10);
        const endNum = parseInt(end, 10);
        allWeeks = allWeeks.filter(week => {
          const num = extractWeekNumber(week.title);
          return num >= startNum && num <= endNum;
        });
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
        setError("Failed to load review data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedStudentId, userRole, start, end]);

  const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";
  const isStudent = userRole === "student";

  // Row definitions – add rows for total score and star rating later (computed)
  const rows = [
    { key: "link_to_task_folder", label: "Link to Task Folder", type: "text", placeholder: "Paste folder link here", editableForStudent: true },
    { key: "status", label: "Status", type: "select", options: ["Task Completed", "In Progress", "Not Started", "Blocked"], editableForStudent: false },
    { key: "project_updates", label: "Project Updates", type: "textarea", rows: 2, editableForStudent: false },
    { key: "next_week_task", label: "Next Week Task", type: "textarea", rows: 2, editableForStudent: false },
    { key: "reviewer_name", label: "Reviewer Name", type: "text", placeholder: "e.g. Rizan sir", editableForStudent: false },
    { key: "advisor_name", label: "Advisor Name", type: "text", placeholder: "e.g. Aleema", editableForStudent: false },
    { key: "score_20", label: "Score [20]", type: "number", placeholder: "0-20", editableForStudent: false },
    { key: "extra_workouts_review", label: "Extra Workouts Review", type: "textarea", rows: 2, editableForStudent: false },
    { key: "score_10", label: "Score [10]", type: "number", placeholder: "0-10", editableForStudent: false },
    { key: "progress_video", label: "Progress Video", type: "text", placeholder: "YouTube link", editableForStudent: true }, // ✅ Student can edit this
    { key: "review_date", label: "Review Date", type: "date", editableForStudent: false },
    { key: "english_review", label: "English Review", type: "textarea", rows: 2, editableForStudent: false },
    { key: "score_20_english", label: "Score [20]", type: "number", placeholder: "0-20", editableForStudent: false },
  ];

  // Helper to get week's computed total and stars
  const getWeekComputed = (weekId) => {
    const extra = reviews[weekId]?.extra_workouts_mark;
    const english = reviews[weekId]?.english_score;
    const video = reviews[weekId]?.progress_video_mark;
    return computeTotalAndStars(extra, english, video);
  };

  // Render a single cell (editable based on user role and row.editableForStudent)
  const renderCell = (weekId, row) => {
    const value = reviews[weekId]?.[row.key] ?? "";
    // Determine if editable
    let editable = false;
    if (isReviewer) {
      editable = true; // Reviewers can edit everything
    } else if (isStudent && row.editableForStudent) {
      editable = true; // Students can only edit specific fields (e.g., progress_video)
    }

    if (!editable) {
      // Read‑only display
      if (row.type === "select") return <div className="px-2 py-1 text-gray-700">{value || "—"}</div>;
      if (row.type === "textarea") return <div className="whitespace-pre-wrap break-words px-2 py-1 text-gray-700">{value || "—"}</div>;
      if (row.type === "number") return <div className="px-2 py-1 text-gray-700">{value !== "" ? value : "—"}</div>;
      if (row.type === "date") return <div className="px-2 py-1 text-gray-700">{value || "—"}</div>;
      if (row.key === "progress_video" && value) {
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-green-600 underline break-all">Link</a>;
      }
      return <div className="px-2 py-1 text-gray-700">{value || "—"}</div>;
    }

    // Editable input
    if (row.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(weekId, row.key, e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
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
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-vertical"
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
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
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
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
        />
      );
    }
    // text or url
    return (
      <input
        type={row.key === "progress_video" ? "url" : "text"}
        value={value}
        onChange={(e) => handleChange(weekId, row.key, e.target.value)}
        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
        placeholder={row.placeholder || ""}
      />
    );
  };

  let dashboardLink = "/student/dashboard";
  if (userRole === "admin") dashboardLink = "/admin/dashboard";
  else if (userRole === "mentor") dashboardLink = "/mentor/dashboard";
  else if (userRole === "reviewer") dashboardLink = "/reviewer/dashboard";

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-gray-50 text-red-600 flex items-center justify-center p-8 text-center">{error}</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      <StudentSidebar />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
                Weeks {start} – {end}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
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
                  className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-green-500"
                >
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.username})</option>)}
                </select>
              )}
              <Link to={dashboardLink} className="bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition">
                ← Dashboard
              </Link>
              <Link
                to={isReviewer && selectedStudentId ? `/student/review-sheet?student_id=${selectedStudentId}` : "/student/review-sheet"}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                All Weeks
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase w-48">
                    FIELD / WEEK
                  </th>
                  {weeks.map(week => {
                    return (
                      <th
                        key={week.id}
                        className="px-3 py-3 text-left text-gray-800 text-sm font-medium min-w-[200px] border-l border-gray-200"
                      >
                        {cleanTitle(week.title)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map(row => (
                  <tr key={row.key} className="hover:bg-gray-50/40">
                    <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">
                      {row.label}
                    </td>
                    {weeks.map(week => (
                      <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                        {renderCell(week.id, row)}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Total Score row (computed) */}
                <tr className="hover:bg-gray-50/40">
                  <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">
                    Total Score (out of 35)
                  </td>
                  {weeks.map(week => {
                    const { total } = getWeekComputed(week.id);
                    return <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                      <div className="px-2 py-1">{total}</div>
                    </td>;
                  })}
                </tr>
                {/* Star Rating row (computed) */}
                <tr className="hover:bg-gray-50/40">
                  <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">
                    Star Rating
                  </td>
                  {weeks.map(week => {
                    const { stars } = getWeekComputed(week.id);
                    return <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                      <div className="px-2 py-1"><StarDisplay value={stars} /></div>
                    </td>;
                  })}
                </tr>
                {/* Updates row (unchanged) */}
                <tr className="hover:bg-gray-50/40">
                  <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">
                    Updates & Extra Scores
                  </td>
                  {weeks.map(week => {
                    const rev = reviews[week.id] || {};
                    const weekReviewId = rev.id;
                    const weekUpdates = weekReviewId ? (updates[weekReviewId] || []) : [];
                    const isExpanded = expandedWeekId === week.id;
                    return (
                      <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                        {isReviewer && weekReviewId && (
                          <button
                            onClick={() => addUpdate(weekReviewId)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded mb-2 shadow-sm"
                          >
                            + Add Update
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedWeekId(isExpanded ? null : week.id)}
                          className="text-xs text-gray-500 hover:text-gray-800 mb-2 block"
                        >
                          {isExpanded ? "▼ Hide Updates" : "▶ Show Updates"}
                        </button>
                        {isExpanded && (
                          <div className="space-y-2">
                            {weekUpdates.length === 0 && <p className="text-gray-500 text-xs">No updates yet.</p>}
                            {weekUpdates.map(upd => (
                              <div key={upd.id} className="border-l-2 border-gray-200 pl-2 mb-2">
                                {isReviewer ? (
                                  <>
                                    <textarea
                                      value={upd.update_text}
                                      onChange={(e) => updateUpdate(upd.id, "update_text", e.target.value)}
                                      rows="2"
                                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800"
                                      placeholder="Update notes..."
                                    />
                                    <div className="flex gap-2 mt-1">
                                      <input
                                        type="number"
                                        placeholder="Extra score"
                                        value={upd.extra_score ?? ""}
                                        onChange={(e) => updateUpdate(upd.id, "extra_score", e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800"
                                      />
                                      <span className="text-gray-400 text-xs">{new Date(upd.update_date).toLocaleDateString()}</span>
                                      <button onClick={() => deleteUpdate(upd.id)} className="text-red-500 hover:text-red-700 text-xs">🗑</button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-xs whitespace-pre-wrap break-words text-gray-700">{upd.update_text || "—"}</div>
                                    {upd.extra_score && <div className="text-xs text-green-600">+{upd.extra_score} pts</div>}
                                    <div className="text-gray-400 text-xs">{new Date(upd.update_date).toLocaleDateString()}</div>
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

          <div className="mt-4 text-right text-gray-400 text-xs">
            💡 {isStudent ? "You can edit the Progress Video link." : "Click any cell to edit. Changes auto‑save."}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentReviewSheetRange;