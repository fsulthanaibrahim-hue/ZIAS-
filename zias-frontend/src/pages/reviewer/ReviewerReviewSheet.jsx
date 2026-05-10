// src/pages/reviewer/ReviewerReviewSheet.jsx – working save (no bulk endpoint)
import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
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

const calculateTotalAndStars = (reviewScore, extra, english, video) => {
  const safeReview = Math.min(20, Math.max(0, reviewScore || 0));
  const safeExtra = Math.min(5, Math.max(0, extra || 0));
  const safeEnglish = Math.min(5, Math.max(0, english || 0));
  const safeVideo = Math.min(5, Math.max(0, video || 0));
  const total = safeReview + safeExtra + safeEnglish + safeVideo;
  const finalTotal = Math.min(35, Math.max(0, total));
  let stars = 0;
  if (finalTotal >= 29) stars = 5;
  else if (finalTotal >= 22) stars = 4;
  else if (finalTotal >= 15) stars = 3;
  else if (finalTotal >= 8) stars = 2;
  else if (finalTotal >= 1) stars = 1;
  return { total: finalTotal, stars };
};

function ReviewerReviewSheet() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const studentId = searchParams.get("student_id");

  const stateStudent = location.state || {};
  const studentName = stateStudent.studentName || "Student";
  const studentCourse = stateStudent.studentCourse || "";
  const studentBatch = stateStudent.studentBatch || "";

  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [originalReviews, setOriginalReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const dataFetched = useRef(false);

  // Only editable fields for reviewers
  const rows = useMemo(() => [
    { label: "Status", field: "task_status", type: "select", options: ["Task Completed", "Task Need Improvement", "Task Critical", "Task Not Completed"], editable: true },
    { label: "Project Updates", field: "feedback", type: "textarea", editable: true },
    { label: "Review Score (0-20)", field: "review_score", type: "number", min: 0, max: 20, step: 1, editable: true },
    { label: "Reviewer Name", field: "reviewer_name", type: "text", editable: true },
    { label: "Mentor Name", field: "advisor_name", type: "text", editable: false },
    { label: "Extra Workouts Review", field: "extra_workouts", type: "select", options: ["Completed", "Need Improvement", "Not Completed"], editable: false },
    { label: "Extra Workouts Mark (0-5)", field: "extra_workouts_mark", type: "number", min: 0, max: 5, step: 1, editable: false },
    { label: "Review Date", field: "review_date", type: "date", editable: false },
    { label: "Progress Video Link", field: "progress_video", type: "url", editable: false },
    { label: "Progress Video Mark (0-5)", field: "progress_video_mark", type: "number", min: 0, max: 5, step: 1, editable: false },
    { label: "English Score (0-5)", field: "english_score", type: "number", min: 0, max: 5, step: 1, editable: false },
    { label: "English Review", field: "english_review", type: "textarea", editable: false },
  ], []);

  const editableFields = rows.filter(r => r.editable).map(r => r.field);

  const getWeekComputed = (weekId) => {
    const data = reviews[weekId] || {};
    const review = data.review_score || 0;
    const extra = data.extra_workouts_mark || 0;
    const english = data.english_score || 0;
    const video = data.progress_video_mark || 0;
    return calculateTotalAndStars(review, extra, english, video);
  };

  const handleChange = (weekId, field, value) => {
    const row = rows.find(r => r.field === field);
    if (!row?.editable) return;
    let processed = value;
    if (row?.type === "number") {
      if (value === "" || value === null || value === undefined) processed = "";
      else {
        let num = parseFloat(value);
        if (isNaN(num)) processed = "";
        else {
          if (row.min !== undefined && num < row.min) num = row.min;
          if (row.max !== undefined && num > row.max) num = row.max;
          processed = num;
        }
      }
    }
    setReviews(prev => ({ ...prev, [weekId]: { ...prev[weekId], [field]: processed } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const errors = [];
    let anySuccess = false;

    for (const week of weeks) {
      const weekId = week.id;
      const original = originalReviews[weekId] || {};
      const current = reviews[weekId] || {};
      const changedFields = {};
      for (const field of editableFields) {
        let origVal = original[field];
        let currVal = current[field];
        if (origVal === null || origVal === undefined) origVal = "";
        if (currVal === null || currVal === undefined) currVal = "";
        if (origVal !== currVal) {
          changedFields[field] = currVal;
        }
      }
      if (Object.keys(changedFields).length === 0) continue;

      try {
        await API.patch(`week-review/${weekId}/?student_id=${studentId}`, changedFields);
        anySuccess = true;
        // Update originalReviews with the new values to avoid re-saving unchanged later
        setOriginalReviews(prev => ({
          ...prev,
          [weekId]: { ...prev[weekId], ...changedFields }
        }));
      } catch (err) {
        console.error(`Failed to save week ${weekId}`, err);
        errors.push(`Week ${week.title || weekId}: ${err.response?.data?.detail || err.message}`);
      }
    }

    if (errors.length > 0) {
      toast.error(`Partial save: ${errors.join(", ")}`);
      setError("Some changes could not be saved.");
    } else if (anySuccess) {
      toast.success("All changes saved successfully!");
    } else {
      toast("No changes to save.", { icon: "ℹ️" });
    }
    setSaving(false);
    // Refresh all reviews to keep consistency
    const freshReviews = {};
    for (const week of weeks) {
      try {
        const res = await API.get(`week-review/${week.id}/?student_id=${studentId}`);
        freshReviews[week.id] = res.data;
      } catch {
        freshReviews[week.id] = {};
      }
    }
    setReviews(freshReviews);
    setOriginalReviews(JSON.parse(JSON.stringify(freshReviews)));
  };

  // Load weeks and reviews
  useEffect(() => {
    if (!studentId) {
      navigate("/reviewer/assignments");
      return;
    }
    if (!dataFetched.current) {
      dataFetched.current = true;
      const fetchData = async () => {
        setLoading(true);
        try {
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
          setOriginalReviews(JSON.parse(JSON.stringify(reviewsData)));
        } catch (err) {
          toast.error("Failed to load review data.");
          setError("Failed to load review data.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [studentId, navigate]);

  const renderCell = (weekId, row) => {
    let value = reviews[weekId]?.[row.field] ?? "";
    if (row.type === "number" && (value === null || value === undefined || value === "")) value = "";
    if (row.type === "number" && typeof value === "number") value = value.toString();
    const isEditable = row.editable === true;
    const onChange = (val) => handleChange(weekId, row.field, val);
    const inputClass = "w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none";

    if (!isEditable) {
      let displayValue = value;
      if (row.type === "number" && displayValue === "") displayValue = "—";
      if (row.field === "progress_video" && displayValue && displayValue !== "—") {
        return <a href={displayValue} target="_blank" rel="noopener noreferrer" className="text-green-600 underline break-all">Link</a>;
      }
      if (row.type === "textarea") {
        return <div className="whitespace-pre-wrap break-words text-gray-800 text-sm">{displayValue === "" ? "—" : displayValue}</div>;
      }
      return <div className="text-gray-800 text-sm py-1 px-1 whitespace-pre-wrap break-words">{displayValue === "" ? "—" : displayValue}</div>;
    }

    if (row.type === "select") {
      return (
        <select value={value} onChange={e => onChange(e.target.value)} className={inputClass}>
          <option value="">—</option>
          {row.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    if (row.type === "textarea") {
      return <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} className={`${inputClass} resize-vertical`} />;
    }
    if (row.type === "number") {
      return (
        <input
          type="number"
          min={row.min}
          max={row.max}
          step={row.step}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
        />
      );
    }
    return <input type="text" value={value} onChange={e => onChange(e.target.value)} className={inputClass} />;
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-gray-50 text-red-600 flex items-center justify-center p-8 text-center">{error}</div>;

  const weekRanges = [
    { label: "Week 0 - 12", start: 1, end: 12 },
    { label: "Week 13 - 16", start: 13, end: 16 },
    { label: "Week 17 - 24", start: 17, end: 24 },
    { label: "Week 25 - 32", start: 25, end: 32 },
    { label: "Week 33 - 40", start: 33, end: 40 },
    { label: "Week 41 - 44", start: 41, end: 44 },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Review Sheet (Reviewer)</h1>
            <p className="text-gray-500 text-sm mt-1">
              {studentName} • {studentCourse} • {studentBatch}
            </p>
            <p className="text-xs text-amber-600 mt-1">✏️ Editable: Status, Project Updates, Review Score, Reviewer Name</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/reviewer/assignments")} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">← Back to Assignments</button>
            <button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase w-48">FIELD / WEEK</th>
                {weeks.map(week => (
                  <th key={week.id} className="px-3 py-3 text-left text-gray-800 text-sm font-medium min-w-[200px] border-l border-gray-200">{cleanTitle(week.title)}</th>
                ))}
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
              {/* Total Score row */}
              <tr className="hover:bg-gray-50/40">
                <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">Total Score (out of 35)</td>
                {weeks.map(week => {
                  const { total } = getWeekComputed(week.id);
                  return (
                    <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                      <input type="number" value={total} readOnly className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm cursor-default" />
                    </td>
                  );
                })}
              </tr>
              {/* Star Rating row */}
              <tr className="hover:bg-gray-50/40">
                <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">Star Rating</td>
                {weeks.map(week => {
                  const { stars } = getWeekComputed(week.id);
                  const full = stars;
                  const empty = 5 - stars;
                  return (
                    <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                      <div className="flex gap-1">
                        {[...Array(full)].map((_, i) => <span key={i} className="text-yellow-500 text-lg">★</span>)}
                        {[...Array(empty)].map((_, i) => <span key={i} className="text-gray-300 text-lg">★</span>)}
                        <span className="ml-2 text-xs text-gray-500">({stars}/5)</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-6">
          {weeks.map(week => {
            const { total, stars } = getWeekComputed(week.id);
            return (
              <div key={week.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">{cleanTitle(week.title)}</h2>
                <div className="space-y-3">
                  {rows.map(row => (
                    <div key={row.field} className="flex flex-col gap-1">
                      <label className="text-gray-500 text-xs font-medium uppercase">{row.label}</label>
                      <div>{renderCell(week.id, row)}</div>
                    </div>
                  ))}
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-medium uppercase">Total Score (out of 35)</label>
                    <div><input type="number" value={total} readOnly className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm cursor-default" /></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-medium uppercase">Star Rating</label>
                    <div>
                      <div className="flex gap-1">
                        {[...Array(stars)].map((_, i) => <span key={i} className="text-yellow-500 text-lg">★</span>)}
                        {[...Array(5 - stars)].map((_, i) => <span key={i} className="text-gray-300 text-lg">★</span>)}
                        <span className="ml-2 text-xs text-gray-500">({stars}/5)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Personal Details */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Personal Details</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            {weekRanges.map(range => (
              <Link key={range.label} to={`/reviewer/review-sheet/range/${range.start}/${range.end}?student_id=${studentId}`} className="text-gray-500 hover:text-green-600 transition">
                {range.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 text-right text-gray-400 text-xs">
          💡 Total Score = Review Score (0‑20) + Extra Workouts Mark (0‑5) + English Score (0‑5) + Progress Video Mark (0‑5) → max 35. Star rating updates automatically.
        </div>
      </div>
    </div>
  );
}

export default ReviewerReviewSheet;