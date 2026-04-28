// src/pages/mentor/MentorReviewSheet.jsx
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
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

const weekRanges = [
  { label: "Week 0 - 12", start: 1, end: 12 },
  { label: "Week 13 - 16", start: 13, end: 16 },
  { label: "Week 17 - 24", start: 17, end: 24 },
  { label: "Week 25 - 32", start: 25, end: 32 },
  { label: "Week 33 - 40", start: 33, end: 40 },
  { label: "Week 41 - 44", start: 41, end: 44 },
];

function MentorReviewSheet() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student_id");

  const [student, setStudent] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [updating, setUpdating] = useState({});

  // ✅ LABEL IS NOW "Mentor Name"
  const rows = useMemo(() => [
    { label: "Status", field: "task_status" },
    { label: "Project Updates", field: "feedback" },
    { label: "Reviewer Name", field: "reviewer_name" },
    { label: "Mentor Name", field: "advisor_name" },   // <-- changed here
    { label: "Score [20]", field: "total_score" },
    { label: "Extra Workouts Review", field: "extra_workouts" },
    { label: "Review Date", field: "review_date" },
    { label: "English Review", field: "english_review" },
  ], []);

  const fetchMentors = async () => {
    try {
      const res = await API.get("mentors/");
      setMentors(res.data);
    } catch (err) {
      console.error("Failed to load mentors", err);
    }
  };

  const updateMentor = async (weekId, newMentorName) => {
    setUpdating(prev => ({ ...prev, [weekId]: true }));
    try {
      await API.patch(`week-review/${weekId}/`, {
        advisor_name: newMentorName,
        student_id: studentId,
      });
      setReviews(prev => ({
        ...prev,
        [weekId]: { ...prev[weekId], advisor_name: newMentorName },
      }));
    } catch (err) {
      console.error("Failed to update mentor", err);
      alert("Could not update mentor. Please try again.");
    } finally {
      setUpdating(prev => ({ ...prev, [weekId]: false }));
    }
  };

  const getValue = (weekId, field) => {
    const val = reviews[weekId]?.[field];
    if (val === null || val === undefined || val === "") return "—";
    return val;
  };

  useEffect(() => {
    if (!studentId) {
      setError("No student selected.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const studentRes = await API.get(`students/${studentId}/`);
        setStudent(studentRes.data);

        const modulesRes = await API.get(`modules/student-modules/?student_id=${studentId}`);
        let allWeeks = modulesRes.data;
        allWeeks.sort((a, b) => extractWeekNumber(a.title) - extractWeekNumber(b.title));
        setWeeks(allWeeks);

        const reviewsData = {};
        for (const week of allWeeks) {
          try {
            const reviewRes = await API.get(`week-review/${week.id}/?student_id=${studentId}`);
            reviewsData[week.id] = reviewRes.data;
          } catch {
            reviewsData[week.id] = {};
          }
        }
        setReviews(reviewsData);
        await fetchMentors();
      } catch (err) {
        console.error(err);
        setError("Failed to load review data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>;
  if (error) return <div className="text-red-600 text-center p-8">{error}</div>;

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Student Review Sheet</h1>
            <p className="text-gray-500 text-sm mt-1 break-words">
              {student?.full_name || student?.username} • {student?.course} • {student?.batch}
            </p>
          </div>
          <Link to="/mentor/students" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">← Back to Students</Link>
        </div>

        {/* Personal Details with week ranges */}
        <div className="mb-8 bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b font-semibold">Personal Details</div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
              <div><label className="text-gray-500 text-xs">Full Name</label><div>{student?.full_name || student?.username || "—"}</div></div>
              <div><label className="text-gray-500 text-xs">Email</label><div>{student?.email || "—"}</div></div>
              <div><label className="text-gray-500 text-xs">Phone</label><div>{student?.phone || "—"}</div></div>
              <div><label className="text-gray-500 text-xs">Course</label><div>{student?.course || "—"}</div></div>
              <div><label className="text-gray-500 text-xs">Batch</label><div>{student?.batch || "—"}</div></div>
              <div><label className="text-gray-500 text-xs">Guardian</label><div>{student?.guardian_name || "—"}</div></div>
              <div><label className="text-gray-500 text-xs">Guardian Contact</label><div>{student?.guardian_phone || "—"}</div></div>
              <div><label className="text-gray-500 text-xs">Address</label><div>{student?.address || "—"}</div></div>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Week Ranges</h4>
              <div className="flex flex-wrap gap-2">
                {weekRanges.map((range) => <span key={range.label} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">{range.label}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Table with all weeks as columns */}
        <div className="hidden md:block overflow-x-auto rounded-xl border bg-white shadow-sm">
          <div className="min-w-[800px]">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr><th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase w-48">FIELD / WEEK</th>{weeks.map(week => <th key={week.id} className="px-3 py-3 text-left text-sm font-medium min-w-[180px] border-l">{cleanTitle(week.title)}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.field} className="hover:bg-gray-50/40">
                    <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium border-r">{row.label}</td>
                    {weeks.map(week => {
                      if (row.field === "advisor_name") {
                        const currentMentor = reviews[week.id]?.advisor_name || "";
                        return (
                          <td key={week.id} className="px-3 py-2 border-l align-top">
                            <select value={currentMentor} onChange={(e) => updateMentor(week.id, e.target.value)} disabled={updating[week.id]} className="w-full px-2 py-1 text-sm border rounded-md">
                              <option value="">— Select Mentor —</option>
                              {mentors.map(mentor => <option key={mentor.id} value={mentor.name || mentor.username}>{mentor.name || mentor.username}</option>)}
                            </select>
                          </td>
                        );
                      }
                      return <td key={week.id} className="px-3 py-2 border-l align-top"><div className="whitespace-pre-wrap text-sm">{getValue(week.id, row.field)}</div></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile view (cards) */}
        <div className="md:hidden space-y-6">
          {weeks.map(week => (
            <div key={week.id} className="bg-white rounded-xl border p-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-3">{cleanTitle(week.title)}</h2>
              {rows.map(row => {
                if (row.field === "advisor_name") {
                  const currentMentor = reviews[week.id]?.advisor_name || "";
                  return (
                    <div key={row.field} className="mb-3">
                      <label className="text-xs font-medium uppercase text-gray-500">{row.label}</label>
                      <select value={currentMentor} onChange={(e) => updateMentor(week.id, e.target.value)} disabled={updating[week.id]} className="w-full mt-1 px-2 py-1 text-sm border rounded-md">
                        <option value="">— Select Mentor —</option>
                        {mentors.map(mentor => <option key={mentor.id} value={mentor.name || mentor.username}>{mentor.name || mentor.username}</option>)}
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={row.field} className="mb-3">
                    <label className="text-xs font-medium uppercase text-gray-500">{row.label}</label>
                    <div className="text-sm mt-1">{getValue(week.id, row.field)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {weeks.length === 0 && <div className="text-center py-12 bg-white rounded-xl">No weeks available.</div>}
      </div>
    </div>
  );
}

export default MentorReviewSheet;