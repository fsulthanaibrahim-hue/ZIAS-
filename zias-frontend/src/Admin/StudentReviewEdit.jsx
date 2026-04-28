// src/Admin/StudentReviewEdit.jsx
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/api";

let initialDataFetched = false;

const extractWeekNumber = (module) => {
  if (module.order) return parseInt(module.order, 10);
  const match = module.title?.match(/Week\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 9999;
};

const cleanTitle = (title) => {
  if (!title) return "";
  const pattern = /^week\s+\d+\s*[–:\-]\s*/i;
  return title.replace(pattern, "").trim();
};

function StudentReviewEdit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentId = searchParams.get("student_id");
  const rangeParam = searchParams.get("range") || "0-12";

  const [student, setStudent] = useState(null);
  const [allWeeks, setAllWeeks] = useState([]);
  const [filteredWeeks, setFilteredWeeks] = useState([]);
  const [originalReviews, setOriginalReviews] = useState({});
  const [editedReviews, setEditedReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const dataFetched = useRef(false);
  
  const [reviewersList, setReviewersList] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);

  const parseRange = (range) => {
    const parts = range.split("-");
    return parts.length === 2 ? [parseInt(parts[0], 10), parseInt(parts[1], 10)] : [0, 999];
  };
  const [rangeMin, rangeMax] = parseRange(rangeParam);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to generate english_review text from score
  const generateEnglishReview = (score) => {
    const num = parseFloat(score);
    if (isNaN(num)) return "";
    if (num >= 18) return "Excellent - Outstanding performance";
    if (num >= 15) return "Good - Above average";
    if (num >= 12) return "Satisfactory - Average";
    if (num >= 8) return "Needs improvement - Below average";
    if (num >= 0) return "Poor - Requires significant effort";
    return "";
  };

  // Auto‑update english_review when english_score changes
  useEffect(() => {
    let updated = false;
    const newEdits = { ...editedReviews };
    for (const weekId in newEdits) {
      const score = newEdits[weekId]?.english_score;
      if (score !== undefined && score !== "" && score !== null) {
        const newReview = generateEnglishReview(score);
        if (newEdits[weekId]?.english_review !== newReview) {
          newEdits[weekId].english_review = newReview;
          updated = true;
        }
      }
    }
    if (updated) {
      setEditedReviews(newEdits);
    }
  }, [editedReviews]); // runs after any change; only updates if score changed

  // Fetch reviewers and mentors
  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        let reviewerNames = [];
        try {
          const res = await API.get("/reviewers/");
          reviewerNames = res.data.map((rev) => {
            let name = rev.name || rev.user?.username || rev.username;
            if (!name) return "";
            name = name.charAt(0).toUpperCase() + name.slice(1);
            return `${name} Sir`;
          });
        } catch (err) {
          const usersRes = await API.get("/users/?is_reviewer=true");
          reviewerNames = usersRes.data.map((user) => {
            let name = user.full_name || user.username;
            if (!name) return "";
            name = name.charAt(0).toUpperCase() + name.slice(1);
            return `${name} Sir`;
          });
        }
        const uniqueNames = [...new Set(reviewerNames.filter((n) => n && n !== " Sir"))];
        setReviewersList(uniqueNames);
      } catch (err) {
        setReviewersList([]);
      }
    };

    const fetchMentors = async () => {
      try {
        const res = await API.get("/mentors/");
        const names = res.data
          .map((mentor) => {
            let name = mentor.full_name || mentor.username;
            if (!name) return "";
            name = name.charAt(0).toUpperCase() + name.slice(1);
            return name;
          })
          .filter(Boolean);
        setMentorsList(names);
      } catch (err) {
        setMentorsList([]);
      }
    };

    fetchReviewers();
    fetchMentors();
  }, []);

  const rows = useMemo(
    () => [
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
      {
        label: "Mentor Name",
        field: "advisor_name",
        type: "select",
        options: mentorsList.length ? mentorsList : ["No mentors available"],
      },
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
    ],
    [reviewersList, mentorsList]
  );

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
          let weeksData = modulesRes.data;
          weeksData.sort((a, b) => extractWeekNumber(a) - extractWeekNumber(b));
          setAllWeeks(weeksData);

          const reviewsData = {};
          const editsData = {};
          for (const week of weeksData) {
            try {
              const reviewRes = await API.get(`week-review/${week.id}/?student_id=${studentId}`);
              reviewsData[week.id] = reviewRes.data;
              editsData[week.id] = { ...reviewRes.data };
            } catch {
              reviewsData[week.id] = {};
              editsData[week.id] = {};
            }
          }
          setOriginalReviews(reviewsData);
          setEditedReviews(editsData);
        } catch (err) {
          setError("Failed to load review data.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [studentId]);

  useEffect(() => {
    if (allWeeks.length === 0) return;
    const filtered = allWeeks.filter((week) => {
      const weekNum = extractWeekNumber(week);
      return weekNum >= rangeMin && weekNum <= rangeMax;
    });
    setFilteredWeeks(filtered);
  }, [allWeeks, rangeMin, rangeMax]);

  const handleRangeClick = (range) => {
    setSearchParams({ student_id: studentId, range });
  };

  const handleFieldChange = (weekId, field, value) => {
    setEditedReviews((prev) => ({
      ...prev,
      [weekId]: { ...prev[weekId], [field]: value },
    }));
  };

  const renderCell = (weekId, row) => {
    let value = editedReviews[weekId]?.[row.field] ?? "";
    if (row.type === "number" && (value === null || value === undefined || value === "")) {
      value = "";
    }
    if (row.type === "number" && typeof value === "number") {
      value = value.toString();
    }
    const onChange = (val) => handleFieldChange(weekId, row.field, val);

    if (row.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
        >
          <option value="">—</option>
          {row.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            placeholder={row.placeholder || ""}
          />
          {row.field === "english_score" && editedReviews[weekId]?.english_review && (
            <div className="mt-1 text-xs text-gray-500">
              📝 {editedReviews[weekId].english_review}
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

  const handleSaveAll = async () => {
    setSaving(true);
    const promises = [];
    for (const week of filteredWeeks) {
      const weekId = week.id;
      const original = originalReviews[weekId] || {};
      const edited = editedReviews[weekId] || {};
      const changes = {};
      for (const row of rows) {
        const field = row.field;
        if (original[field] !== edited[field]) {
          changes[field] = edited[field];
        }
      }
      // Also include english_review if it was auto‑generated and differs from original
      if (edited.english_review !== original.english_review) {
        changes.english_review = edited.english_review;
      }
      if (Object.keys(changes).length > 0) {
        promises.push(
          API.patch(`week-review/${weekId}/?student_id=${studentId}`, changes)
        );
      }
    }
    if (promises.length === 0) {
      showToast("No changes to save", "info");
      setSaving(false);
      return;
    }
    try {
      await Promise.all(promises);
      showToast("All changes saved successfully", "success");
      const newOriginal = {};
      for (const week of filteredWeeks) {
        const weekId = week.id;
        newOriginal[weekId] = { ...editedReviews[weekId] };
      }
      setOriginalReviews((prev) => ({ ...prev, ...newOriginal }));
    } catch (err) {
      console.error(err);
      showToast("Failed to save some changes", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error)
    return (
      <div className="min-h-screen bg-gray-50 text-red-600 flex items-center justify-center p-8 text-center">
        {error}
      </div>
    );
  if (!student)
    return (
      <div className="min-h-screen bg-gray-50 text-center p-8">Student not found</div>
    );

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toastMessage.msg}
        </div>
      )}
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Edit Review Sheet</h1>
            <p className="text-gray-500 text-sm mt-1">
              {student?.full_name || student?.username} • {student?.course} • {student?.batch}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Showing weeks {rangeMin} – {rangeMax}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/admin/review-sheets")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              ← Back
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase w-48">
                  FIELD / WEEK
                </th>
                {filteredWeeks.map((week) => (
                  <th
                    key={week.id}
                    className="px-3 py-3 text-left text-gray-800 text-sm font-medium min-w-[200px] border-l border-gray-200"
                  >
                    {cleanTitle(week.title)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.field} className="hover:bg-gray-50/40">
                  <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">
                    {row.label}
                  </td>
                  {filteredWeeks.map((week) => (
                    <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                      {renderCell(week.id, row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-6">
          {filteredWeeks.map((week) => (
            <div
              key={week.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                {cleanTitle(week.title)}
              </h2>
              <div className="space-y-3">
                {rows.map((row) => (
                  <div key={row.field} className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                      {row.label}
                    </label>
                    <div>{renderCell(week.id, row)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Personal Details – clickable ranges */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Personal Details</h3>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span
              onClick={() => handleRangeClick("0-12")}
              className={`cursor-pointer hover:text-green-600 transition-colors ${
                rangeParam === "0-12" ? "text-green-600 font-semibold" : ""
              }`}
            >
              Week 0 - 12
            </span>
            <span
              onClick={() => handleRangeClick("13-16")}
              className={`cursor-pointer hover:text-green-600 transition-colors ${
                rangeParam === "13-16" ? "text-green-600 font-semibold" : ""
              }`}
            >
              Week 13 - 16
            </span>
            <span
              onClick={() => handleRangeClick("17-24")}
              className={`cursor-pointer hover:text-green-600 transition-colors ${
                rangeParam === "17-24" ? "text-green-600 font-semibold" : ""
              }`}
            >
              Week 17 - 24
            </span>
            <span
              onClick={() => handleRangeClick("25-32")}
              className={`cursor-pointer hover:text-green-600 transition-colors ${
                rangeParam === "25-32" ? "text-green-600 font-semibold" : ""
              }`}
            >
              Week 25 - 32
            </span>
            <span
              onClick={() => handleRangeClick("33-40")}
              className={`cursor-pointer hover:text-green-600 transition-colors ${
                rangeParam === "33-40" ? "text-green-600 font-semibold" : ""
              }`}
            >
              Week 33 - 40
            </span>
            <span
              onClick={() => handleRangeClick("41-44")}
              className={`cursor-pointer hover:text-green-600 transition-colors ${
                rangeParam === "41-44" ? "text-green-600 font-semibold" : ""
              }`}
            >
              Week 41 - 44
            </span>
          </div>
        </div>
        <div className="mt-4 text-right text-gray-400 text-xs">
          💡 Edit any cell, then click "Save All Changes" to apply.
        </div>
      </div>
    </div>
  );
}

export default StudentReviewEdit;