// src/pages/student/StudentReviewSheet.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

function StudentReviewSheet() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

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

  // For reviewers, fetch student list
  useEffect(() => {
    const fetchStudents = async () => {
      const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";
      if (!isReviewer) return;
      try {
        const res = await API.get("students/list/");
        setStudents(res.data);
        if (res.data.length) {
          const params = new URLSearchParams(window.location.search);
          const idParam = params.get("student_id");
          if (idParam && res.data.some(s => s.id === parseInt(idParam)))
            setSelectedStudentId(parseInt(idParam));
          else
            setSelectedStudentId(res.data[0].id);
        }
      } catch (err) { console.error(err); }
    };
    fetchStudents();
  }, [userRole]);

  // Fetch weeks and reviews
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
        allWeeks.sort((a, b) => extractWeekNumber(a.title) - extractWeekNumber(b.title));
        setWeeks(allWeeks);

        const reviewsData = {};
        for (const week of allWeeks) {
          let reviewUrl = `week-review/${week.id}/`;
          if (isReviewer && selectedStudentId) reviewUrl += `?student_id=${selectedStudentId}`;
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
        setError("Failed to load review data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedStudentId, userRole]);

  const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";

  // Same rows as admin edit, but read‑only
  const rows = [
    { label: "Link to Task Folder", field: "link_to_task_folder" },
    { label: "Status", field: "task_status" },
    { label: "Project Updates", field: "feedback" },
    { label: "Reviewer Name", field: "reviewer_name" },
    { label: "Advisor Name", field: "advisor_name" },
    { label: "Score [20]", field: "total_score" },
    { label: "Extra Workouts Review", field: "extra_workouts" },
    { label: "Progress Video", field: "progress_video" },
    { label: "Review Date", field: "review_date" },
    { label: "English Review", field: "english_review" },
  ];

  const renderCell = (weekId, row) => {
    const value = reviews[weekId]?.[row.field] ?? "";
    if (row.field === "progress_video" && value) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
          Watch Video
        </a>
      );
    }
    return <div className="whitespace-pre-wrap break-words px-2 py-1">{value || "—"}</div>;
  };

  let dashboardLink = "/student/dashboard";
  if (userRole === "admin") dashboardLink = "/admin/dashboard";
  else if (userRole === "mentor") dashboardLink = "/mentor/dashboard";
  else if (userRole === "reviewer") dashboardLink = "/reviewer/dashboard";

  if (loading) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-[#0d1117] text-red-400 flex items-center justify-center p-8 text-center">{error}</div>;

  const weekRanges = [
    { label: "Week 0 - 12", start: 1, end: 12 },
    { label: "Week 13 - 16", start: 13, end: 16 },
    { label: "Week 17 - 24", start: 17, end: 24 },
    { label: "Week 25 - 32", start: 25, end: 32 },
    { label: "Week 33 - 40", start: 33, end: 40 },
    { label: "Week 41 - 44", start: 41, end: 44 },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0d1117] text-[#e6edf3] font-sans">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Student Review Sheet</h1>
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
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#21262d] shadow-xl shadow-black/20">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#161b22] border-b border-[#21262d]">
              <tr>
                <th className="sticky left-0 bg-[#161b22] z-10 px-4 py-3 text-left text-[#7d8590] text-xs font-semibold uppercase w-48">FIELD / WEEK</th>
                {weeks.map(week => (
                  <th key={week.id} className="px-3 py-3 text-left text-[#e6edf3] text-sm font-medium min-w-[200px] border-l border-[#21262d]">
                    {cleanTitle(week.title)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {rows.map(row => (
                <tr key={row.field} className="hover:bg-[#161b22]/40">
                  <td className="sticky left-0 bg-[#0d1117] px-4 py-3 text-[#7d8590] text-sm font-medium border-r border-[#21262d]">{row.label}</td>
                  {weeks.map(week => (
                    <td key={week.id} className="px-3 py-2 border-l border-[#21262d] align-top">{renderCell(week.id, row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-[#161b22] rounded-xl border border-[#21262d] p-4">
          <h3 className="text-sm font-semibold text-[#e6edf3] mb-2">Personal Details</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            {weekRanges.map((range) => {
              const url = isReviewer && selectedStudentId
                ? `/student/review-sheet/range/${range.start}/${range.end}?student_id=${selectedStudentId}`
                : `/student/review-sheet/range/${range.start}/${range.end}`;
              return (
                <Link key={range.label} to={url} className="text-[#7d8590] hover:text-blue-400 transition">
                  {range.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 text-right text-[#484f58] text-xs">
          💡 {isReviewer ? "View‑only mode. Use the admin panel to edit." : "Your weekly progress report."}
          {weeks.length < 44 && (
            <div className="mt-1 text-amber-400">⚠️ Only {weeks.length} weeks available. Please create weeks 1‑44 in the admin panel.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentReviewSheet;