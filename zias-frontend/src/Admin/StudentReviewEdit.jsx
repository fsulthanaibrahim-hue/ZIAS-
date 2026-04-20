// src/Admin/StudentReviewEdit.jsx
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/api";

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

function StudentReviewEdit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentId = searchParams.get("student_id");

  const [student, setStudent] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const saveField = useCallback(async (weekId, field, value) => {
    try {
      await API.patch(`week-review/${weekId}/?student_id=${studentId}`, { [field]: value });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  }, [studentId]);

  const debouncedSave = useCallback(debounce(saveField, 800), [saveField]);

  const handleChange = (weekId, field, value) => {
    setReviews(prev => ({ ...prev, [weekId]: { ...prev[weekId], [field]: value } }));
    debouncedSave(weekId, field, value);
  };

  useEffect(() => {
    if (!studentId) {
      navigate("/admin/review-sheets");
      return;
    }
    const fetchStudent = async () => {
      try {
        const res = await API.get(`students/${studentId}/`);
        setStudent(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load student");
      }
    };
    fetchStudent();
  }, [studentId, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
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
      } catch (err) {
        console.error(err);
        setError("Failed to load review data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  // Status options exactly match backend choices
  const rows = [
    { label: "Status", field: "task_status", type: "select", options: ["Not Started", "In Progress", "Completed", "Needs Improvement"] },
    { label: "Project Updates", field: "feedback", type: "textarea", rows: 2 },
    { label: "Reviewer Name", field: "reviewer_name", type: "text", placeholder: "Reviewer" },
    { label: "Advisor Name", field: "advisor_name", type: "text", placeholder: "Advisor" },
    { label: "Score [20]", field: "total_score", type: "number", placeholder: "0-20" },
    { label: "Extra Workouts Review", field: "extra_workouts", type: "textarea", rows: 2 },
    { label: "Review Date", field: "review_date", type: "date" },
    { label: "English Review", field: "english_review", type: "textarea", rows: 2 },
  ];

  const renderCell = (weekId, row) => {
    const value = reviews[weekId]?.[row.field] ?? "";
    const onChange = (val) => handleChange(weekId, row.field, val);

    if (row.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:border-[#388bfd] outline-none"
        >
          <option value="">—</option>
          {row.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    if (row.type === "textarea") {
      return (
        <textarea
          rows={row.rows || 2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:border-[#388bfd] outline-none resize-vertical"
          placeholder={row.placeholder || ""}
        />
      );
    }
    if (row.type === "number") {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:border-[#388bfd] outline-none"
          placeholder={row.placeholder || ""}
        />
      );
    }
    if (row.type === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:border-[#388bfd] outline-none"
          style={{ colorScheme: "dark" }}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-sm text-[#e6edf3] focus:border-[#388bfd] outline-none"
        placeholder={row.placeholder || ""}
      />
    );
  };

  if (loading) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-[#0d1117] text-red-400 flex items-center justify-center p-8 text-center">{error}</div>;

  return (
    <div className="min-h-screen w-full bg-[#0d1117] text-[#e6edf3] font-sans">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Edit Review Sheet</h1>
            <p className="text-[#7d8590] text-sm mt-1">
              {student?.full_name || student?.username} • {student?.course} • {student?.batch}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/review-sheets")}
            className="bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            ← Back
          </button>
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
          <div className="flex flex-wrap gap-4 text-xs text-[#7d8590]">
            <span>Week 0 - 12</span><span>Week 13 - 16</span><span>Week 17 - 24</span>
            <span>Week 25 - 32</span><span>Week 33 - 40</span><span>Week 41 - 44</span>
          </div>
        </div>
        <div className="mt-4 text-right text-[#484f58] text-xs">💡 Click any cell to edit. Changes auto‑save.</div>
      </div>
    </div>
  );
}

export default StudentReviewEdit;