// src/pages/mentor/MentorReviewEdit.jsx
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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

function MentorReviewEdit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentId = searchParams.get("student_id");

  const [student, setStudent] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [originalReviews, setOriginalReviews] = useState({}); // snapshot for comparison
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const dataFetched = useRef(false);

  // Editable fields (same as before)
  const editableFields = ["advisor_name", "extra_workouts", "review_date", "english_score"];

  const rows = useMemo(() => [
    { label: "Status", field: "task_status", type: "text", editable: false },
    { label: "Project Updates", field: "feedback", type: "textarea", editable: false },
    { label: "Reviewer Name", field: "reviewer_name", type: "text", editable: false },
    { label: "Mentor Name", field: "advisor_name", type: "text", editable: true },
    { label: "Score [20]", field: "total_score", type: "number", editable: false },
    { label: "Extra Workouts Review", field: "extra_workouts", type: "select", options: ["Completed", "Need Improvement", "Not Completed"], editable: true },
    { label: "Review Date", field: "review_date", type: "date", editable: true },
    { label: "English Score [20]", field: "english_score", type: "number", placeholder: "0-20", min: 0, max: 20, step: 1, editable: true },
  ], []);

  // Local edit handler – only updates state, NO API call
  const handleChange = (weekId, field, value) => {
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
    setReviews((prev) => ({
      ...prev,
      [weekId]: { ...prev[weekId], [field]: value },
    }));
  };

  // 🔥 ONE bulk API call on save
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    // Collect changes for each week
    const updates = [];
    for (const week of weeks) {
      const weekId = week.id;
      const original = originalReviews[weekId] || {};
      const current = reviews[weekId] || {};
      const changedFields = {};
      for (const field of editableFields) {
        if (current[field] !== original[field]) {
          changedFields[field] = current[field] ?? "";
        }
      }
      if (Object.keys(changedFields).length > 0) {
        updates.push({ week_id: weekId, ...changedFields });
      }
    }

    if (updates.length === 0) {
      toast("No changes to save.", { icon: "ℹ️" });
      setSaving(false);
      return;
    }

    try {
      // Send ONE bulk update request
      await API.post("week-review/bulk-update/", {
        student_id: studentId,
        updates: updates,
      });
      // Refresh reviews to get latest data
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
      toast.success("Changes saved successfully!");
    } catch (err) {
      console.error("Save failed", err);
      toast.error("Failed to save changes. Please try again.");
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Load student, weeks, and reviews (once)
  useEffect(() => {
    if (!studentId) {
      navigate("/mentor/students");
      return;
    }
    const fetchStudent = async () => {
      try {
        const res = await API.get(`students/${studentId}/`);
        setStudent(res.data);
      } catch (err) {
        toast.error("Failed to load student");
        setError("Failed to load student");
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
        setError(null);
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
  }, [studentId]);

  const renderCell = (weekId, row) => {
    let value = reviews[weekId]?.[row.field] ?? "";
    if (row.type === "number" && (value === null || value === undefined || value === "")) {
      value = "";
    }
    const isEditable = row.editable === true;

    if (!isEditable) {
      let displayValue = value;
      if (row.type === "number" && value !== "") displayValue = value;
      if (displayValue === "") displayValue = "—";
      return <div className="text-gray-800 text-sm py-1 px-1">{displayValue}</div>;
    }

    const onChange = (val) => handleChange(weekId, row.field, val);

    if (row.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
        >
          <option value="">—</option>
          {row.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (row.type === "textarea") {
      return (
        <textarea
          rows={row.rows || 2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-vertical"
        />
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
            value={value === "" ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
          />
          {row.field === "english_score" && reviews[weekId]?.english_review && (
            <div className="mt-1 text-xs text-gray-500">
              📝 {reviews[weekId].english_review}
            </div>
          )}
        </div>
      );
    }
    if (row.type === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
        />
      );
    }
    // Text input (Mentor Name)
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
      />
    );
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
            <h1 className="text-xl font-semibold text-gray-800">Edit Review Sheet (Mentor)</h1>
            <p className="text-gray-500 text-sm mt-1">
              {student?.full_name || student?.username} • {student?.course} • {student?.batch}
            </p>
            <p className="text-xs text-amber-600 mt-1">✏️ Editable: Mentor Name, Extra Workouts, Review Date, English Score</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/mentor/students")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              ← Back to Students
            </button>
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
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase w-48">FIELD / WEEK</th>
                {weeks.map(week => <th key={week.id} className="px-3 py-3 text-left text-gray-800 text-sm font-medium min-w-[200px] border-l border-gray-200">{cleanTitle(week.title)}</th>)}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rows.map(row => (
                <tr key={row.field} className="hover:bg-gray-50/40">
                  <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">{row.label}</td>
                  {weeks.map(week => <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">{renderCell(week.id, row)}</td>)}
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
                    <div>{renderCell(week.id, row)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Personal Details Section with clickable links */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Personal Details</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            {weekRanges.map((range) => (
              <Link
                key={range.label}
                to={`/mentor/review-sheet/range/${range.start}/${range.end}?student_id=${studentId}`}
                className="text-gray-500 hover:text-green-600 transition"
              >
                {range.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 text-right text-gray-400 text-xs">
          💡 Editable fields will be saved only when you click "Save Changes".
        </div>
      </div>
    </div>
  );
}

export default MentorReviewEdit;