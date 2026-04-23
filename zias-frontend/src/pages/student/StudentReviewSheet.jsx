// src/pages/student/StudentReviewSheet.jsx
import React, { useEffect, useState } from "react";
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

  useEffect(() => {
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

  // For mentors: always use the student_id from URL (if any)
  // For admin/reviewer: fetch student list only if no student_id in URL
  useEffect(() => {
    const isReviewer = userRole === "admin" || userRole === "mentor" || userRole === "reviewer";
    if (!isReviewer) return;

    if (studentIdFromUrl) {
      setSelectedStudentId(parseInt(studentIdFromUrl));
      return;
    }

    // Only admins/reviewers (without specific student) need the dropdown
    if (userRole === "admin" || userRole === "reviewer") {
      const fetchStudents = async () => {
        try {
          const res = await API.get("students/list/");
          setStudents(res.data);
          if (res.data.length) setSelectedStudentId(res.data[0].id);
        } catch (err) {
          console.error(err);
        }
      };
      fetchStudents();
    }
  }, [userRole, studentIdFromUrl]);

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

  const isStudent = userRole === "student";
  const isMentor = userRole === "mentor";
  const isAdminOrReviewer = userRole === "admin" || userRole === "reviewer";
  const showDropdown = isAdminOrReviewer && !studentIdFromUrl && students.length > 0;

  const rows = [
    { label: "Status", field: "task_status" },
    { label: "Project Updates", field: "feedback" },
    { label: "Reviewer Name", field: "reviewer_name" },
    { label: "Advisor Name", field: "advisor_name" },
    { label: "Score [20]", field: "total_score" },
    { label: "Extra Workouts Review", field: "extra_workouts" },
    { label: "Review Date", field: "review_date" },
    { label: "English Review", field: "english_review" },
  ];

  const renderCell = (weekId, row) => {
    const value = reviews[weekId]?.[row.field] ?? "";
    return <div className="whitespace-pre-wrap break-words px-2 py-1">{value || "—"}</div>;
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

  // Common content: table and back button
  const content = (
    <main className={`${isStudent ? "flex-1" : ""} p-4 sm:p-6 overflow-x-auto`}>
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
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase w-48">FIELD / WEEK</th>
                  {weeks.map(week => (
                    <th key={week.id} className="px-3 py-3 text-left text-gray-800 text-sm font-medium min-w-[200px] border-l border-gray-200">
                      {cleanTitle(week.title)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map(row => (
                  <tr key={row.field} className="hover:bg-gray-50/40">
                    <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">{row.label}</td>
                    {weeks.map(week => (
                      <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">{renderCell(week.id, row)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ONLY for students – personal details, range links, tip */}
        {isStudent && (
          <>
            <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Personal Details</h3>
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
              💡 Your weekly progress report.
              {weeks.length < 44 && (
                <div className="mt-1 text-amber-600">⚠️ Only {weeks.length} weeks available. Please create weeks 1‑44 in the admin panel.</div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );

  return isStudent ? (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      {content}
    </div>
  ) : (
    <div className="min-h-screen bg-gray-50">{content}</div>
  );
}

export default StudentReviewSheet;