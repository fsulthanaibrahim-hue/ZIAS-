// src/pages/mentor/MentorReviewSheetRange.jsx – full admin-style range view (mentor editable)
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
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

// Helper to calculate total score (0‑35) and star rating
const calculateTotalAndStars = (reviewScore, extra, english, video) => {
  const safeReview = Math.min(20, Math.max(0, reviewScore || 0));
  const safeExtra = Math.min(5, Math.max(0, extra || 0));
  const safeEnglish = Math.min(5, Math.max(0, english || 0));
  const safeVideo = Math.min(5, Math.max(0, video || 0));
  const total = safeReview + safeExtra + safeEnglish + safeVideo;
  const finalTotal = Math.min(35, Math.max(0, total));
  let stars = 1;
  if (finalTotal >= 29) stars = 5;
  else if (finalTotal >= 22) stars = 4;
  else if (finalTotal >= 15) stars = 3;
  else if (finalTotal >= 8) stars = 2;
  else stars = 1;
  return { total: finalTotal, stars };
};

function MentorReviewSheetRange() {
  const { start, end } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentId = searchParams.get("student_id");

  const [student, setStudent] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [originalReviews, setOriginalReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const dataFetched = useRef(false);

  // All rows (same as MentorReviewEdit)
  const rows = [
    { label: "Status", field: "task_status", type: "text", editable: false },
    { label: "Project Updates", field: "feedback", type: "textarea", editable: false },
    { label: "Review Score (0-20)", field: "review_score", type: "number", editable: false },
    { label: "Reviewer Name", field: "reviewer_name", type: "text", editable: false },
    { label: "Mentor Name", field: "advisor_name", type: "text", editable: true },
    { label: "Extra Workouts Review", field: "extra_workouts", type: "select", options: ["Completed", "Need Improvement", "Not Completed"], editable: true },
    { label: "Extra Workouts Mark (0-5)", field: "extra_workouts_mark", type: "number", min: 0, max: 5, step: 1, editable: true },
    { label: "Review Date", field: "review_date", type: "date", editable: true },
    { label: "Progress Video Link", field: "progress_video", type: "url", editable: true },
    { label: "Progress Video Mark (0-5)", field: "progress_video_mark", type: "number", min: 0, max: 5, step: 1, editable: true },
    { label: "English Score (0-5)", field: "english_score", type: "number", min: 0, max: 5, step: 1, editable: true },
  ];

  const editableFields = rows.filter(r => r.editable).map(r => r.field);

  // Compute total and stars for each week
  const getWeekComputed = (weekId) => {
    const data = reviews[weekId] || {};
    const review = data.review_score || 0;
    const extra = data.extra_workouts_mark || 0;
    const english = data.english_score || 0;
    const video = data.progress_video_mark || 0;
    return calculateTotalAndStars(review, extra, english, video);
  };

  const handleFieldChange = (weekId, field, value) => {
    const row = rows.find(r => r.field === field);
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
    setReviews(prev => ({
      ...prev,
      [weekId]: { ...prev[weekId], [field]: processed },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const promises = [];
    for (const week of weeks) {
      const weekId = week.id;
      const original = originalReviews[weekId] || {};
      const current = reviews[weekId] || {};
      const changes = {};
      for (const field of editableFields) {
        let origVal = original[field];
        let currVal = current[field];
        if (origVal === null || origVal === undefined) origVal = "";
        if (currVal === null || currVal === undefined) currVal = "";
        if (origVal !== currVal) {
          changes[field] = currVal;
        }
      }
      if (Object.keys(changes).length > 0) {
        promises.push(
          API.patch(`week-review/${weekId}/?student_id=${studentId}`, changes)
            .catch(err => {
              console.error(`Error updating week ${weekId}:`, err.response?.data);
              throw err;
            })
        );
      }
    }
    if (promises.length === 0) {
      toast("No changes to save.", { icon: "ℹ️" });
      setSaving(false);
      return;
    }
    try {
      await Promise.all(promises);
      toast.success("Changes saved successfully!");
      // Refresh all reviews
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
    } catch (err) {
      console.error("Save failed", err);
      toast.error("Failed to save changes. Please try again.");
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Load student
  useEffect(() => {
    if (!studentId) {
      navigate("/mentor/students");
      return;
    }
    const fetchStudent = async () => {
      try {
        const res = await API.get(`students/${studentId}/`);
        setStudent(res.data);
      } catch {
        toast.error("Failed to load student");
        setError("Failed to load student");
      }
    };
    fetchStudent();
  }, [studentId, navigate]);

  // Load weeks (filtered by range) and reviews
  useEffect(() => {
    if (!studentId) return;
    if (!dataFetched.current) {
      dataFetched.current = true;
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
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
  }, [studentId, start, end]);

  const renderCell = (weekId, row) => {
    let value = reviews[weekId]?.[row.field] ?? "";
    if (row.type === "number" && (value === null || value === undefined || value === "")) value = "";
    if (row.type === "number" && typeof value === "number") value = value.toString();
    const isEditable = row.editable === true;
    const onChange = (val) => handleFieldChange(weekId, row.field, val);
    const inputClass = "w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none";

    if (!isEditable) {
      let displayValue = value;
      if (row.type === "number" && displayValue === "") displayValue = "—";
      if (row.field === "progress_video" && displayValue && displayValue !== "—") {
        return <a href={displayValue} target="_blank" rel="noopener noreferrer" className="text-green-600 underline break-all">Link</a>;
      }
      return <div className="text-gray-800 text-sm py-1 px-1 whitespace-pre-wrap break-words">{displayValue === "" ? "—" : displayValue}</div>;
    }

    // Editable rows
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
          value={value === "" ? "" : value}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
        />
      );
    }
    if (row.type === "date") {
      return <input type="date" value={value} onChange={e => onChange(e.target.value)} className={inputClass} />;
    }
    if (row.type === "url") {
      return <input type="url" value={value} onChange={e => onChange(e.target.value)} className={inputClass} placeholder="https://" />;
    }
    // text (Mentor Name)
    return <input type="text" value={value} onChange={e => onChange(e.target.value)} className={inputClass} />;
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-gray-50 text-red-600 flex items-center justify-center p-8 text-center">{error}</div>;

  // Star display component
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

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Weeks {start} – {end}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {student?.full_name || student?.username} • {student?.course} • {student?.batch}
            </p>
            <p className="text-xs text-amber-600 mt-1">✏️ Editable: Mentor Name, Extra Workouts Review, Extra Workouts Mark, Review Date, Progress Video Link, Progress Video Mark, English Score</p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/mentor/review-sheet?student_id=${studentId}`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              ← Back to Full Sheet
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 border-b">
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
                  return <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                    <input type="number" value={total} readOnly className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm cursor-default" />
                  </td>;
                })}
              </tr>
              {/* Star Rating row */}
              <tr className="hover:bg-gray-50/40">
                <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">Star Rating</td>
                {weeks.map(week => {
                  const { stars } = getWeekComputed(week.id);
                  return <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                    <StarDisplay value={stars} />
                  </td>;
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
                    <div><StarDisplay value={stars} /></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {weeks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500">No weeks found in this range.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MentorReviewSheetRange;