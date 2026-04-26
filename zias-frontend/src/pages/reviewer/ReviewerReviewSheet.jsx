// src/pages/reviewer/ReviewerReviewSheet.jsx
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function ReviewerReviewSheet() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student_id");

  const [student, setStudent] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingStatus, setSavingStatus] = useState({});
  const [reviewersList, setReviewersList] = useState([]);
  const [reviewersLoading, setReviewersLoading] = useState(true);

  const statusOptions = ["Task Completed", "Task Need Improvement", "Task Critical", "Task Not Completed"];

  const rows = useMemo(() => [
    { label: "Status", field: "task_status", editable: true, type: "select", options: statusOptions },
    { label: "Project Updates", field: "feedback", editable: true, type: "text" },
    { label: "Reviewer Name", field: "reviewer_name", editable: true, type: "select", options: reviewersList.map(r => r.user?.username || r.username || "Unknown") },
    { label: "Advisor Name", field: "advisor_name", editable: false },
    { label: "Score [20]", field: "total_score", editable: true, type: "number", min: 0, max: 20, step: 1 },
    { label: "Extra Workouts Review", field: "extra_workouts", editable: false },
    { label: "Review Date", field: "review_date", editable: false },
    { label: "English Review", field: "english_review", editable: false },
  ], [reviewersList]);

  const weekRanges = [
    { label: "Week 0 - 12", start: 1, end: 12 },
    { label: "Week 13 - 16", start: 13, end: 16 },
    { label: "Week 17 - 24", start: 17, end: 24 },
    { label: "Week 25 - 32", start: 25, end: 32 },
    { label: "Week 33 - 40", start: 33, end: 40 },
    { label: "Week 41 - 44", start: 41, end: 44 },
  ];

  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const res = await API.get("reviewers/");
        setReviewersList(res.data);
      } catch (err) {
        console.error("Failed to fetch reviewers", err);
      } finally {
        setReviewersLoading(false);
      }
    };
    fetchReviewers();
  }, []);

  const saveField = useCallback(async (weekId, field, value) => {
    if (!["task_status", "feedback", "reviewer_name", "total_score"].includes(field)) return;
    setSavingStatus(prev => ({ ...prev, [weekId]: true }));
    try {
      await API.patch(`week-review/${weekId}/?student_id=${studentId}`, { [field]: value });
      const updatedReview = await API.get(`week-review/${weekId}/?student_id=${studentId}`);
      setReviews(prev => ({ ...prev, [weekId]: updatedReview.data }));
    } catch (err) {
      console.error(`Auto-save failed for week ${weekId}, field ${field}`, err);
    } finally {
      setSavingStatus(prev => ({ ...prev, [weekId]: false }));
    }
  }, [studentId]);

  const debouncedSave = useCallback(debounce(saveField, 1000), [saveField]);

  const handleChange = (weekId, field, value) => {
    setReviews(prev => ({
      ...prev,
      [weekId]: { ...prev[weekId], [field]: value }
    }));
    debouncedSave(weekId, field, value);
  };

  const handleScoreBlur = (weekId, value) => {
    let num = parseInt(value, 10);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 20) num = 20;
    if (num !== value) {
      handleChange(weekId, "total_score", num);
    }
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
        if (!Array.isArray(allWeeks)) allWeeks = [];
        allWeeks.sort((a, b) => extractWeekNumber(a.title) - extractWeekNumber(b.title));
        setWeeks(allWeeks);

        const reviewsData = {};
        for (const week of allWeeks) {
          if (!week.id) continue;
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
        setError("Failed to load review data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const getValue = (weekId, field) => {
    const val = reviews[weekId]?.[field];
    if (val === null || val === undefined || val === "") return "";
    return val;
  };

  const renderEditableField = (weekId, row) => {
    const value = getValue(weekId, row.field);
    if (row.type === "select") {
      return (
        <div className="flex items-center gap-1">
          <select
            value={value}
            onChange={(e) => handleChange(weekId, row.field, e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
          >
            <option value="">—</option>
            {row.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {savingStatus[weekId] && <span className="text-xs text-gray-400">Saving...</span>}
        </div>
      );
    }
    if (row.type === "number") {
      return (
        <div>
          <input
            type="number"
            min={row.min}
            max={row.max}
            step={row.step}
            value={value}
            onChange={(e) => handleChange(weekId, row.field, e.target.value)}
            onBlur={(e) => handleScoreBlur(weekId, e.target.value)}
            className="w-24 bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
          />
          {savingStatus[weekId] && <span className="ml-2 text-xs text-gray-400">Saving...</span>}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(weekId, row.field, e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
        />
        {savingStatus[weekId] && <span className="text-xs text-gray-400">Saving...</span>}
      </div>
    );
  };

  const renderReadOnlyField = (weekId, field) => {
    const value = getValue(weekId, field);
    return (
      <div className="whitespace-pre-wrap break-words text-gray-800 text-sm">
        {value === "" ? "—" : value}
      </div>
    );
  };

  if (loading || reviewersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8 text-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Review Sheet (Editable)</h1>
            <p className="text-gray-500 text-sm mt-1 break-words">
              {student?.full_name || student?.username} • {student?.course} • {student?.batch}
            </p>
            <p className="text-xs text-amber-600 mt-1">✏️ Status, Project Updates, Reviewer Name, and Score are editable.</p>
          </div>
          <Link
            to="/reviewer/students"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition text-center"
          >
            ← Back to Students
          </Link>
        </div>

        {weeks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500">No weeks available for this student.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase w-48">
                      FIELD / WEEK
                    </th>
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
                      <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">
                        {row.label}
                      </td>
                      {weeks.map(week => (
                        <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                          {row.editable
                            ? renderEditableField(week.id, row)
                            : renderReadOnlyField(week.id, row.field)}
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
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                    {cleanTitle(week.title)}
                  </h2>
                  <div className="space-y-3">
                    {rows.map(row => (
                      <div key={row.field} className="flex flex-col gap-1">
                        <label className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                          {row.label}
                        </label>
                        {row.editable
                          ? renderEditableField(week.id, row)
                          : renderReadOnlyField(week.id, row.field)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Personal Details Section */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Personal Details</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            {weekRanges.map((range) => (
              <span key={range.label} className="text-gray-500">
                {range.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewerReviewSheet;