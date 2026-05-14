// src/pages/student/StudentReviewSheet.jsx – only current week (based on progress) is editable
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

const computeTotalAndStars = (extra, english, video) => {
  const extraNum = Number(extra) || 0;
  const englishNum = Number(english) || 0;
  const videoNum = Number(video) || 0;
  const sum = Math.min(5, Math.max(0, extraNum)) +
              Math.min(5, Math.max(0, englishNum)) +
              Math.min(5, Math.max(0, videoNum));
  const total = Math.round((sum * 35) / 15);
  const finalTotal = Math.min(35, Math.max(0, total));
  let stars = 0;
  if (finalTotal >= 29) stars = 5;
  else if (finalTotal >= 22) stars = 4;
  else if (finalTotal >= 15) stars = 3;
  else if (finalTotal >= 8) stars = 2;
  else if (finalTotal >= 1) stars = 1;
  return { total: finalTotal, stars };
};

const StarDisplay = ({ value }) => {
  const fullStars = value;
  const emptyStars = 5 - fullStars;
  return (
    <div className="flex gap-1 items-center">
      {[...Array(fullStars)].map((_, i) => (
        <span key={i} className="text-yellow-500 text-lg">★</span>
      ))}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={i + fullStars} className="text-gray-300 text-lg">★</span>
      ))}
      <span className="ml-2 text-xs text-gray-500">({value}/5)</span>
    </div>
  );
};

const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

function StudentReviewSheet() {
  const [searchParams] = useSearchParams();
  const studentIdFromUrl = searchParams.get("student_id");

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [editingVideoWeek, setEditingVideoWeek] = useState(null);
  const [tempVideoUrl, setTempVideoUrl] = useState("");
  const [savingVideo, setSavingVideo] = useState(false);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(null); // Only editable week for students

  const roleFetched = useRef(false);
  const studentsFetched = useRef(false);
  const dataFetched = useRef(false);

  // Fetch user role
  useEffect(() => {
    if (roleFetched.current) return;
    roleFetched.current = true;
    const fetchUser = async () => {
      try {
        const userRes = await API.get("users/me/");
        const user = userRes.data;
        if (user.is_admin) setUserRole("admin");
        else if (user.is_mentor) setUserRole("mentor");
        else if (user.is_reviewer) setUserRole("reviewer");
        else setUserRole("student");
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // For admin/reviewer/mentor: fetch students list once
  useEffect(() => {
    const isReviewer = userRole === "admin" || userRole === "reviewer" || userRole === "mentor";
    if (!isReviewer || studentsFetched.current) return;
    if (studentIdFromUrl) {
      setSelectedStudentId(parseInt(studentIdFromUrl));
      studentsFetched.current = true;
      return;
    }
    const fetchStudents = async () => {
      try {
        const res = await API.get("students/list/");
        setStudents(res.data);
        if (res.data.length) setSelectedStudentId(res.data[0].id);
      } catch (err) { console.error(err); }
      studentsFetched.current = true;
    };
    fetchStudents();
  }, [userRole, studentIdFromUrl]);

  // Fetch weeks and reviews
  const fetchData = useCallback(async () => {
    if (!userRole) return;
    const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";
    if (isReviewer && !selectedStudentId) return;

    setLoading(true);
    setError(null);
    try {
      let modulesUrl = "modules/student-modules/";
      if (isReviewer && selectedStudentId) modulesUrl += `?student_id=${selectedStudentId}`;
      const modulesRes = await API.get(modulesUrl);
      let allWeeks = modulesRes.data;
      // If response is paginated
      if (allWeeks.results) allWeeks = allWeeks.results;
      allWeeks.sort((a, b) => extractWeekNumber(a.title) - extractWeekNumber(b.title));
      setWeeks(allWeeks);

      // Fetch reviews for each week
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

      // Compute current week for student (only if role is student)
      if (userRole === "student") {
        let lastCompleted = 0;
        for (const week of allWeeks) {
          const weekNum = extractWeekNumber(week.title);
          const review = reviewsData[week.id];
          if (review && review.task_status === "Task Completed") {
            if (weekNum > lastCompleted) lastCompleted = weekNum;
          }
        }
        const current = lastCompleted + 1;
        // Only set if current week exists within the weeks list
        const maxWeek = allWeeks.length ? Math.max(...allWeeks.map(w => extractWeekNumber(w.title))) : 0;
        setCurrentWeekNumber(current <= maxWeek ? current : null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load review data.");
    } finally {
      setLoading(false);
    }
  }, [userRole, selectedStudentId]);

  useEffect(() => {
    if (!userRole) return;
    // Reset dataFetched when student changes for reviewer
    if (userRole !== "student") {
      dataFetched.current = false;
    }
    if (!dataFetched.current) {
      dataFetched.current = true;
      fetchData();
    }
  }, [userRole, selectedStudentId, fetchData]);

  const isStudent = userRole === "student";
  const isAdminOrReviewer = userRole === "admin" || userRole === "reviewer" || userRole === "mentor";
  const showDropdown = isAdminOrReviewer && !studentIdFromUrl && students.length > 0;

  const rows = [
    { label: "Status", field: "task_status" },
    { label: "Project Updates", field: "feedback" },
    { label: "Review Score (0-20)", field: "review_score" },
    { label: "Reviewer Name", field: "reviewer_name" },
    { label: "Mentor Name", field: "advisor_name" },
    { label: "Extra Workouts Review", field: "extra_workouts" },
    { label: "Extra Workouts Mark (0-5)", field: "extra_workouts_mark" },
    { label: "Review Date", field: "review_date" },
    { label: "Progress Video Link", field: "progress_video" },
    { label: "Progress Video Mark (0-5)", field: "progress_video_mark" },
    { label: "English Score (0-5)", field: "english_score" },
    { label: "English Review", field: "english_review" },
  ];

  const saveVideoLink = async (weekId, url) => {
    setSavingVideo(true);
    try {
      let patchUrl = `week-review/${weekId}/`;
      if (isAdminOrReviewer && selectedStudentId) patchUrl += `?student_id=${selectedStudentId}`;
      await API.patch(patchUrl, { progress_video: url });
      setReviews(prev => ({
        ...prev,
        [weekId]: { ...prev[weekId], progress_video: url }
      }));
      setEditingVideoWeek(null);
      setTempVideoUrl("");
    } catch (err) {
      console.error("Failed to update video link", err);
      alert("Failed to update video link. Please try again.");
    } finally {
      setSavingVideo(false);
    }
  };

  // Determine if a week is editable: for students, only the week matching currentWeekNumber
  const isWeekEditable = (weekId) => {
    if (!isStudent) return true; // Admin/mentor/reviewer can edit all
    if (!currentWeekNumber) return false;
    const week = weeks.find(w => w.id === weekId);
    if (!week) return false;
    const weekNum = extractWeekNumber(week.title);
    return weekNum === currentWeekNumber;
  };

  const renderCell = (weekId, row) => {
    const value = reviews[weekId]?.[row.field] ?? "";
    const editable = isWeekEditable(weekId);

    if (isStudent && row.field === "progress_video") {
      if (editingVideoWeek === weekId) {
        return (
          <div className="px-2 py-1">
            <input
              type="url"
              value={tempVideoUrl}
              onChange={(e) => setTempVideoUrl(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              placeholder="https://..."
              autoFocus
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => saveVideoLink(weekId, tempVideoUrl)}
                disabled={savingVideo}
                className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600"
              >
                {savingVideo ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditingVideoWeek(null)}
                className="text-xs bg-gray-300 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="px-2 py-1 flex items-center justify-between gap-2">
          {value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-green-600 underline truncate">Link</a>
          ) : (
            <span className="text-gray-400">—</span>
          )}
          {editable && (
            <button
              onClick={() => {
                setEditingVideoWeek(weekId);
                setTempVideoUrl(value);
              }}
              className="text-gray-500 hover:text-green-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              title="Edit video link"
            >
              <EditIcon />
            </button>
          )}
        </div>
      );
    }

    if (row.field === "progress_video" && value && !isStudent) {
      return <a href={value} target="_blank" rel="noopener noreferrer" className="text-green-600 underline break-all">Link</a>;
    }
    return <div className="whitespace-pre-wrap break-words px-2 py-1">{value || "—"}</div>;
  };

  const getWeekComputed = (weekId) => {
    const extra = reviews[weekId]?.extra_workouts_mark;
    const english = reviews[weekId]?.english_score;
    const video = reviews[weekId]?.progress_video_mark;
    return computeTotalAndStars(extra, english, video);
  };

  let dashboardLink = "/student/dashboard";
  if (userRole === "admin") dashboardLink = "/admin/dashboard";
  else if (userRole === "mentor") dashboardLink = "/mentor/dashboard";
  else if (userRole === "reviewer") dashboardLink = "/reviewer/dashboard";

  if (loading) {
    const spinner = <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />;
    if (isStudent) {
      return (
        <div className="flex min-h-screen bg-gray-50">
          <StudentSidebar />
          <div className="flex-1 flex items-center justify-center">{spinner}</div>
        </div>
      );
    }
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">{spinner}</div>;
  }

  if (error) {
    if (isStudent) {
      return (
        <div className="flex min-h-screen bg-gray-50">
          <StudentSidebar />
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div className="text-red-600">{error}</div>
          </div>
        </div>
      );
    }
    return <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <div className="max-w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Student Review Sheet</h1>
              {selectedStudentId && (students.find(s => s.id === selectedStudentId)?.name || "Student") && (
                <p className="text-gray-500 text-sm mt-1">
                  {students.find(s => s.id === selectedStudentId)?.name || "Student"}
                </p>
              )}
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              {showDropdown && (
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
            </div>
          </div>

          {weeks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-500">No weeks available for this student.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase w-48">FIELD / WEEK</th>
                    {weeks.map(week => {
                      const weekNum = extractWeekNumber(week.title);
                      const isCurrent = isStudent && weekNum === currentWeekNumber;
                      return (
                        <th key={week.id} className="px-3 py-3 text-left text-gray-800 text-sm font-medium min-w-[200px] border-l border-gray-200">
                          {cleanTitle(week.title)}
                          {isStudent && isCurrent && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Current</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {rows.map(row => (
                    <tr key={row.field} className="hover:bg-gray-50/40">
                      <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">{row.label}</td>
                      {weeks.map(week => (
                        <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                          {renderCell(week.id, row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="hover:bg-gray-50/40">
                    <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">Total Score (out of 35)</td>
                    {weeks.map(week => {
                      const { total } = getWeekComputed(week.id);
                      return (
                        <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                          <div className="px-2 py-1">{total}</div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-gray-50/40">
                    <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">Star Rating</td>
                    {weeks.map(week => {
                      const { stars } = getWeekComputed(week.id);
                      return (
                        <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                          <div className="px-2 py-1">
                            <StarDisplay value={stars} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {isStudent && (
            <>
              <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Week Range Links</h3>
                <div className="flex flex-wrap gap-4 text-xs">
                  {[
                    { label: "Week 0 - 12", start: 1, end: 12 },
                    { label: "Week 13 - 16", start: 13, end: 16 },
                    { label: "Week 17 - 24", start: 17, end: 24 },
                    { label: "Week 25 - 32", start: 25, end: 32 },
                    { label: "Week 33 - 40", start: 33, end: 40 },
                    { label: "Week 41 - 44", start: 41, end: 44 },
                  ].map((range) => (
                    <Link
                      key={range.label}
                      to={`/student/review-sheet/range/${range.start}/${range.end}`}
                      className="text-gray-500 hover:text-green-600 transition"
                    >
                      {range.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-right text-gray-400 text-xs">
                💡 Your weekly progress report. <strong>Only the current week (Week {currentWeekNumber || "—"}) is editable.</strong> Click the edit icon next to the video link to update it.
                {currentWeekNumber === null && weeks.length > 0 && (
                  <div className="mt-1 text-amber-600">⚠️ No active week available – all weeks are completed or not started yet.</div>
                )}
                {weeks.length < 44 && (
                  <div className="mt-1 text-amber-600">⚠️ Only {weeks.length} weeks available. Please create weeks 1‑44 in the admin panel.</div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentReviewSheet;