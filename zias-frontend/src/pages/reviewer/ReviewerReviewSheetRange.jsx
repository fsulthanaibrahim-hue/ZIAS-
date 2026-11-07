import { useEffect, useState } from "react";
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

function ReviewerReviewSheetRange() {
  const { start, end } = useParams();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student_id");

  const [student, setStudent] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          try {
            const reviewRes = await API.get(`week-review/${week.id}/?student_id=${studentId}`);
            reviewsData[week.id] = reviewRes.data;
          } catch {
            reviewsData[week.id] = {};
          }
        }
        setReviews(reviewsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load range review data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, start, end]);

  const renderValue = (weekId, row) => {
    let value = reviews[weekId]?.[row.field] ?? "";
    if (value === "") value = "—";
    return <div className="text-gray-800 text-sm py-1 px-1">{value}</div>;
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-gray-50 text-red-600 flex items-center justify-center p-8 text-center">{error}</div>;

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Weeks {start} – {end} (Read‑only)</h1>
            <p className="text-gray-500 text-sm mt-1">
              {student?.full_name || student?.username} • {student?.course} • {student?.batch}
            </p>
            <p className="text-xs text-gray-500 mt-1">🔍 Reviewer view – all fields are read‑only.</p>
          </div>
          <Link
            to={`/reviewer/review-sheet?student_id=${studentId}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            ← Back to Full Review Sheet
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
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
                    <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                      {renderValue(week.id, row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-6">
          {weeks.map(week => (
            <div key={week.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">{cleanTitle(week.title)}</h2>
              <div className="space-y-3">
                {rows.map(row => (
                  <div key={row.field} className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-medium uppercase tracking-wide">{row.label}</label>
                    <div className="text-gray-800 text-sm">{renderValue(week.id, row)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReviewerReviewSheetRange;