// src/Admin/StudentReviewEdit.jsx
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/api";

let initialDataFetched = false;

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
  const dataFetched = useRef(false);
  
  const [reviewersList, setReviewersList] = useState([]);

  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        let reviewerNames = [];
        try {
          const res = await API.get("/reviewers/");
          reviewerNames = res.data.map(rev => {
            let name = rev.name || rev.user?.username || rev.username;
            if (!name) return "";
            name = name.charAt(0).toUpperCase() + name.slice(1);
            return `${name} Sir`;
          });
        } catch (err) {
          const usersRes = await API.get("/users/?is_reviewer=true");
          reviewerNames = usersRes.data.map(user => {
            let name = user.full_name || user.username;
            if (!name) return "";
            name = name.charAt(0).toUpperCase() + name.slice(1);
            return `${name} Sir`;
          });
        }
        const uniqueNames = [...new Set(reviewerNames.filter(n => n && n !== " Sir"))];
        setReviewersList(uniqueNames);
      } catch (err) {
        setReviewersList([]);
      }
    };
    fetchReviewers();
  }, []);

  const rows = useMemo(() => [
    {
      label: "Status",
      field: "task_status",
      type: "select",
      options: ["Task Completed", "Task Need Improvement", "Task Critical", "Task Not Completed"],
    },
    { label: "Project Updates", field: "feedback", type: "textarea", rows: 2 },
    {
      label: "Reviewer Name",
      field: "reviewer_name",
      type: "select",
      options: reviewersList.length ? reviewersList : ["No reviewers available"],
    },
    { label: "Advisor Name", field: "advisor_name", type: "text", placeholder: "Advisor" },
    {
      label: "Score [20]",
      field: "total_score",
      type: "number",
      placeholder: "0-20",
      min: 0,
      max: 20,
      step: 1,
    },
    {
      label: "Extra Workouts Review",
      field: "extra_workouts",
      type: "select",
      options: ["Completed", "Need Improvement", "Not Completed"],
    },
    { label: "Review Date", field: "review_date", type: "date" },
    {
      label: "English Score [20]",
      field: "english_score",
      type: "number",
      placeholder: "0-20",
      min: 0,
      max: 20,
      step: 1,
    },
  ], [reviewersList]);

  const saveField = useCallback(async (weekId, field, value) => {
    try {
      await API.patch(`week-review/${weekId}/?student_id=${studentId}`, { [field]: value });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  }, [studentId]);

  const debouncedSave = useCallback(debounce(saveField, 800), [saveField]);

  const handleChange = (weekId, field, value) => {
    const row = rows.find((r) => r.field === field);
    if (row?.type === "number") {
      let num = parseFloat(value);
      if (isNaN(num)) {
        value = "";
      } else {
        if (row.min !== undefined && num < row.min) num = row.min;
        if (row.max !== undefined && num > row.max) num = row.max;
        value = num;
      }
    }
    setReviews((prev) => ({
      ...prev,
      [weekId]: { ...prev[weekId], [field]: value },
    }));
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
        setError("Failed to load student");
      }
    };
    fetchStudent();
  }, [studentId, navigate]);

  useEffect(() => {
    if (!studentId) return;
    if (!initialDataFetched && !dataFetched.current) {
      initialDataFetched = true;
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
        } catch (err) {
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
    const onChange = (val) => handleChange(weekId, row.field, val);

    if (row.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
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
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-vertical"
          placeholder={row.placeholder || ""}
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
            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            placeholder={row.placeholder || ""}
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
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
        placeholder={row.placeholder || ""}
      />
    );
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-gray-50 text-red-600 flex items-center justify-center p-8 text-center">{error}</div>;

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Edit Review Sheet</h1>
            <p className="text-gray-500 text-sm mt-1">
              {student?.full_name || student?.username} • {student?.course} • {student?.batch}
            </p>
          </div>
          <button onClick={() => navigate("/admin/review-sheets")} className="bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition">← Back</button>
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

        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Personal Details</h3>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>Week 0 - 12</span><span>Week 13 - 16</span><span>Week 17 - 24</span>
            <span>Week 25 - 32</span><span>Week 33 - 40</span><span>Week 41 - 44</span>
          </div>
        </div>
        <div className="mt-4 text-right text-gray-400 text-xs">💡 Click any cell to edit. Changes auto‑save.</div>
      </div>
    </div>
  );
}

export default StudentReviewEdit;