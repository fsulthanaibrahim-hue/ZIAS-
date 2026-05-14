// src/pages/mentor/MentorReviewEdit.jsx
// ✅ Past and current weeks are editable; future weeks are read‑only.
// ✅ Mentors can now edit: Mentor Name, Extra Workouts Review, Review Date, English Score,
//    Extra Workouts Mark (0-5), Progress Video Mark (0-5).
import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
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

const computeTotalAndStars = (extraMark, englishScore, videoMark) => {
  const extraNum = Number(extraMark) || 0;
  const englishNum = Number(englishScore) || 0;
  const videoNum = Number(videoMark) || 0;
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

const StarDisplay = ({ value }) => (
  <div className="flex gap-1 items-center">
    {[...Array(value)].map((_, i) => <span key={i} className="text-yellow-500 text-lg">★</span>)}
    {[...Array(5 - value)].map((_, i) => <span key={i + value} className="text-gray-300 text-lg">★</span>)}
    <span className="ml-2 text-xs text-gray-500">({value}/5)</span>
  </div>
);

function MentorReviewEdit() {
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
  const [currentWeekNumber, setCurrentWeekNumber] = useState(null);
  const dataFetched = useRef(false);

  const editableFields = [
    "advisor_name", "extra_workouts", "review_date", "english_score",
    "extra_workouts_mark", "progress_video_mark"   // added these two
  ];

  const rows = useMemo(() => [
    { label: "Status", field: "task_status", type: "text", editable: false },
    { label: "Project Updates", field: "feedback", type: "textarea", editable: false },
    { label: "Reviewer Name", field: "reviewer_name", type: "text", editable: false },
    { label: "Mentor Name", field: "advisor_name", type: "text", editable: true },
    { label: "Score [20]", field: "total_score", type: "number", editable: false },
    { label: "Extra Workouts Review", field: "extra_workouts", type: "select", options: ["Completed", "Need Improvement", "Not Completed"], editable: true },
    { label: "Extra Workouts Mark (0-5)", field: "extra_workouts_mark", type: "number", min: 0, max: 5, step: 1, editable: true },
    { label: "Review Date", field: "review_date", type: "date", editable: true },
    { label: "Progress Video Link", field: "progress_video", type: "link", editable: false },
    { label: "Progress Video Mark (0-5)", field: "progress_video_mark", type: "number", min: 0, max: 5, step: 1, editable: true },
    { label: "English Score (0-5)", field: "english_score", type: "number", min: 0, max: 5, step: 1, editable: true },
    { label: "English Review", field: "english_review", type: "textarea", editable: false },
  ], []);

  const computeCurrentWeek = (weeksList, reviewsMap) => {
    let lastCompleted = 0;
    for (const week of weeksList) {
      const weekNum = extractWeekNumber(week.title);
      const review = reviewsMap[week.id];
      if (review && review.task_status === "Task Completed") {
        if (weekNum > lastCompleted) lastCompleted = weekNum;
      }
    }
    const current = lastCompleted + 1;
    const maxWeek = weeksList.length ? Math.max(...weeksList.map(w => extractWeekNumber(w.title))) : 0;
    if (lastCompleted === 0 && weeksList.length > 0) return 1;
    return current <= maxWeek ? current : null;
  };

  const isWeekEditable = (weekId) => {
    if (!currentWeekNumber) return false;
    const week = weeks.find(w => w.id === weekId);
    if (!week) return false;
    const weekNum = extractWeekNumber(week.title);
    return weekNum <= currentWeekNumber;
  };

  const handleChange = (weekId, field, value) => {
    if (!isWeekEditable(weekId)) return;
    const row = rows.find((r) => r.field === field);
    if (row?.type === "number") {
      let num = parseFloat(value);
      if (isNaN(num)) value = "";
      else {
        if (row.min !== undefined && num < row.min) num = row.min;
        if (row.max !== undefined && num > row.max) num = row.max;
        value = num;
      }
    }
    setReviews(prev => ({
      ...prev,
      [weekId]: { ...prev[weekId], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const updates = [];
    for (const week of weeks) {
      const weekId = week.id;
      if (!isWeekEditable(weekId)) continue;
      const original = originalReviews[weekId] || {};
      const current = reviews[weekId] || {};
      const changedFields = {};
      for (const field of editableFields) {
        if (current[field] !== original[field]) {
          changedFields[field] = current[field] ?? "";
        }
      }
      if (Object.keys(changedFields).length > 0) {
        updates.push({ weekId, changedFields });
      }
    }
    if (updates.length === 0) {
      toast("No changes to save.", { icon: "ℹ️" });
      setSaving(false);
      return;
    }
    try {
      for (const update of updates) {
        const patchUrl = `week-review/${update.weekId}/?student_id=${studentId}`;
        await API.patch(patchUrl, update.changedFields);
      }
      const freshReviews = {};
      for (const week of weeks) {
        try {
          const res = await API.get(`week-review/${week.id}/?student_id=${studentId}`);
          freshReviews[week.id] = res.data;
        } catch { freshReviews[week.id] = {}; }
      }
      setReviews(freshReviews);
      setOriginalReviews(JSON.parse(JSON.stringify(freshReviews)));
      const newCurrent = computeCurrentWeek(weeks, freshReviews);
      setCurrentWeekNumber(newCurrent);
      toast.success("Changes saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      const msg = err.response?.data?.detail || err.response?.data?.message || "Failed to save changes.";
      toast.error(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!studentId) { 
      toast.error("No student ID provided.");
      navigate("/mentor/students"); 
      return; 
    }
    const fetchStudent = async () => {
      try {
        const res = await API.get(`students/${studentId}/`);
        setStudent(res.data);
      } catch (err) {
        toast.error("Failed to load student details");
        setError("Failed to load student details");
      }
    };
    fetchStudent();
  }, [studentId, navigate]);

  useEffect(() => {
    if (!studentId) return;
    if (!dataFetched.current) {
      dataFetched.current = true;
      const fetchData = async () => {
        setLoading(true);
        try {
          const modulesRes = await API.get(`modules/student-modules/?student_id=${studentId}`);
          let allWeeks = modulesRes.data;
          if (allWeeks.results) allWeeks = allWeeks.results;
          allWeeks.sort((a, b) => extractWeekNumber(a.title) - extractWeekNumber(b.title));
          setWeeks(allWeeks);
          const reviewsData = {};
          for (const week of allWeeks) {
            try {
              const reviewRes = await API.get(`week-review/${week.id}/?student_id=${studentId}`);
              reviewsData[week.id] = reviewRes.data;
            } catch { reviewsData[week.id] = {}; }
          }
          setReviews(reviewsData);
          setOriginalReviews(JSON.parse(JSON.stringify(reviewsData)));
          const current = computeCurrentWeek(allWeeks, reviewsData);
          setCurrentWeekNumber(current);
        } catch (err) {
          console.error(err);
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
  }, [studentId]);

  const renderCell = (weekId, row) => {
    let value = reviews[weekId]?.[row.field] ?? "";
    if (row.type === "number" && (value === null || value === undefined || value === "")) value = "";
    const editable = row.editable && isWeekEditable(weekId);

    if (row.type === "link" && row.field === "progress_video") {
      if (value && value.startsWith("http")) {
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-green-600 underline text-sm">Link</a>;
      }
      return <span className="text-gray-400 text-sm">—</span>;
    }

    if (!editable) {
      if (row.type === "textarea") return <div className="whitespace-pre-wrap text-gray-800 text-sm">{value || "—"}</div>;
      if (row.type === "select") return <div className="text-gray-800 text-sm">{value || "—"}</div>;
      return <div className="text-gray-800 text-sm">{value || "—"}</div>;
    }

    const onChange = (val) => handleChange(weekId, row.field, val);
    if (row.type === "select") {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded px-2 py-1 text-sm bg-blue-50">
          <option value="">—</option>
          {row.options.map(opt => <option key={opt}>{opt}</option>)}
        </select>
      );
    }
    if (row.type === "textarea") {
      return <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded px-2 py-1 text-sm bg-blue-50" />;
    }
    if (row.type === "number") {
      return (
        <input
          type="number"
          min={row.min}
          max={row.max}
          step={row.step}
          value={value === "" ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm bg-blue-50"
        />
      );
    }
    if (row.type === "date") {
      return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded px-2 py-1 text-sm bg-blue-50" />;
    }
    return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded px-2 py-1 text-sm bg-blue-50" />;
  };

  const getWeekComputed = (weekId) => {
    const extra = reviews[weekId]?.extra_workouts_mark;
    const english = reviews[weekId]?.english_score;
    const video = reviews[weekId]?.progress_video_mark;
    return computeTotalAndStars(extra, english, video);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full" /></div>;
  if (error) return <div className="text-red-600 text-center p-8">{error}</div>;

  const weekRanges = [
    { label: "Week 0 - 12", start: 1, end: 12 },
    { label: "Week 13 - 16", start: 13, end: 16 },
    { label: "Week 17 - 24", start: 17, end: 24 },
    { label: "Week 25 - 32", start: 25, end: 32 },
    { label: "Week 33 - 40", start: 33, end: 40 },
    { label: "Week 41 - 44", start: 41, end: 44 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-full mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold">Edit Review Sheet (Mentor)</h1>
            <p className="text-sm text-gray-500">{student?.full_name || student?.username} • {student?.course} • {student?.batch}</p>
            <p className="text-xs text-amber-600">
              ✏️ <strong>Past and current weeks are editable.</strong> Future weeks are read‑only.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/mentor/students")} className="bg-gray-200 px-4 py-2 rounded-lg">← Back</button>
            <button onClick={handleSave} disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-xl border shadow-sm">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-semibold w-48">FIELD / WEEK</th>
                {weeks.map(week => {
                  const isEditable = isWeekEditable(week.id);
                  return (
                    <th key={week.id} className="px-3 py-3 text-left text-sm font-medium border-l">
                      {cleanTitle(week.title)}
                      {!isEditable && <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Future</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.field} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium border-r">{row.label}</td>
                  {weeks.map(week => (
                    <td key={week.id} className="px-3 py-2 border-l">{renderCell(week.id, row)}</td>
                  ))}
                </tr>
              ))}
              <tr className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium border-r">Total Score (out of 35)</td>
                {weeks.map(week => <td key={week.id} className="px-3 py-2 border-l">{getWeekComputed(week.id).total}</td>)}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium border-r">Star Rating</td>
                {weeks.map(week => <td key={week.id} className="px-3 py-2 border-l"><StarDisplay value={getWeekComputed(week.id).stars} /></td>)}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {weeks.map(week => {
            const isEditable = isWeekEditable(week.id);
            const { total, stars } = getWeekComputed(week.id);
            return (
              <div key={week.id} className="bg-white rounded-xl border p-4">
                <h2 className="text-lg font-semibold mb-3">
                  {cleanTitle(week.title)}
                  {isEditable ? (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Editable</span>
                  ) : (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Future (read-only)</span>
                  )}
                </h2>
                <div className="space-y-3">
                  {rows.map(row => (
                    <div key={row.field}>
                      <label className="text-xs text-gray-500 uppercase">{row.label}</label>
                      <div>{renderCell(week.id, row)}</div>
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Total Score</label>
                    <div>{total}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Star Rating</label>
                    <div><StarDisplay value={stars} /></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold mb-2">Week Range Links</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            {weekRanges.map(range => (
              <Link key={range.label} to={`/mentor/review-sheet/range/${range.start}/${range.end}?student_id=${studentId}`} className="text-gray-500 hover:text-green-600">
                {range.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 text-right text-xs text-gray-400">
          ⭐ Star rating updates automatically.<br />
          🔗 Video links open in new tab.<br />
          ✏️ <strong>Past and current weeks are editable.</strong> Future weeks are read‑only.<br />
          💡 Now mentors can edit Extra Workouts Mark and Progress Video Mark as well.
        </div>
      </div>
    </div>
  );
}

export default MentorReviewEdit;