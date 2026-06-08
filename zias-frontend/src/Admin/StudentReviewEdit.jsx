import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/api";

// Module-level caches (persist across component remounts)
let globalDataCache = {
  student: null,
  weeks: null,
  reviews: null,
  fetched: false,
  loadingPromise: null
};

let staticDataCache = null;
let staticDataPromise = null;

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

function StudentReviewEdit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentId = searchParams.get("student_id");
  const rangeParam = searchParams.get("range") || "0-12";

  const [student, setStudent] = useState(() => globalDataCache.student);
  const [allWeeks, setAllWeeks] = useState(() => globalDataCache.weeks || []);
  const [filteredWeeks, setFilteredWeeks] = useState([]);
  const [originalReviews, setOriginalReviews] = useState(() => globalDataCache.reviews || {});
  const [editedReviews, setEditedReviews] = useState(() => globalDataCache.reviews || {});
  const [loading, setLoading] = useState(!globalDataCache.fetched);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

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

  const generateEnglishReview = (score) => {
    const num = parseFloat(score);
    if (isNaN(num)) return "";
    const scaled = num * 4;
    if (scaled >= 18) return "Excellent - Outstanding performance";
    if (scaled >= 15) return "Good - Above average";
    if (scaled >= 12) return "Satisfactory - Average";
    if (scaled >= 8) return "Needs improvement - Below average";
    return "Poor - Requires significant effort";
  };

  // Auto English review
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
    if (updated) setEditedReviews(newEdits);
  }, [editedReviews]);

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

  // ✅ Fetch static data (reviewers/mentors) - only once globally
  useEffect(() => {
    const fetchStaticData = async () => {
      if (staticDataCache) {
        setReviewersList(staticDataCache.reviewers);
        setMentorsList(staticDataCache.mentors);
        return;
      }
      
      if (staticDataPromise) {
        const data = await staticDataPromise;
        setReviewersList(data.reviewers);
        setMentorsList(data.mentors);
        return;
      }

      staticDataPromise = (async () => {
        try {
          const [reviewersRes, mentorsRes] = await Promise.all([
            API.get("reviewers/"),
            API.get("mentors/")
          ]);

          let reviewers = Array.isArray(reviewersRes.data) ? reviewersRes.data : (reviewersRes.data?.results || []);
          let mentors = Array.isArray(mentorsRes.data) ? mentorsRes.data : (mentorsRes.data?.results || []);

          const reviewerNames = reviewers.map(rev => {
            let name = rev.full_name || rev.name || rev.user?.full_name || rev.user?.username || rev.username;
            if (!name) name = `Reviewer #${rev.id}`;
            if (name && name !== `Reviewer #${rev.id}`) name = name.charAt(0).toUpperCase() + name.slice(1);
            return `${name} Sir`;
          });

          const mentorNames = mentors.map(ment => {
            let name = ment.full_name || ment.name || ment.user?.full_name || ment.user?.username || ment.username;
            if (!name) name = `Mentor #${ment.id}`;
            if (name && name !== `Mentor #${ment.id}`) name = name.charAt(0).toUpperCase() + name.slice(1);
            return name;
          });

          const finalReviewers = reviewerNames.length ? [...new Set(reviewerNames)] : ["No reviewers available"];
          const finalMentors = mentorNames.length ? [...new Set(mentorNames)] : ["No mentors available"];

          staticDataCache = { reviewers: finalReviewers, mentors: finalMentors };
          return staticDataCache;
        } catch (err) {
          return { reviewers: ["No reviewers available"], mentors: ["No mentors available"] };
        } finally {
          staticDataPromise = null;
        }
      })();
      
      const data = await staticDataPromise;
      setReviewersList(data.reviewers);
      setMentorsList(data.mentors);
    };

    fetchStaticData();
  }, []);

  const rows = useMemo(
    () => [
      { label: "Status", field: "task_status", type: "select", options: ["Task Completed", "Task Need Improvement", "Task Critical", "Task Not Completed"] },
      { label: "Project Updates", field: "feedback", type: "textarea", rows: 2 },
      { label: "Review Score (0-20)", field: "review_score", type: "number", min: 0, max: 20, step: 1 },
      { label: "Reviewer Name", field: "reviewer_name", type: "select", options: reviewersList },
      { label: "Mentor Name", field: "advisor_name", type: "select", options: mentorsList },
      { label: "Extra Workouts Review", field: "extra_workouts", type: "select", options: ["Completed", "Need Improvement", "Not Completed"] },
      { label: "Extra Workouts Mark (0-5)", field: "extra_workouts_mark", type: "number", min: 0, max: 5, step: 1 },
      { label: "Review Date", field: "review_date", type: "date" },
      { label: "Progress Video Link", field: "progress_video", type: "url" },
      { label: "Progress Video Mark (0-5)", field: "progress_video_mark", type: "number", min: 0, max: 5, step: 1 },
      { label: "English Score (0-5)", field: "english_score", type: "number", min: 0, max: 5, step: 1 },
    ],
    [reviewersList, mentorsList]
  );

  // ✅ Fetch main data - uses global cache to prevent duplicate calls
  useEffect(() => {
    if (!studentId) {
      navigate("/admin/review-sheets");
      return;
    }

    const fetchMainData = async () => {
      // If already fetched and cached, use cache
      if (globalDataCache.fetched && globalDataCache.weeks) {
        setStudent(globalDataCache.student);
        setAllWeeks(globalDataCache.weeks);
        setOriginalReviews(globalDataCache.reviews || {});
        setEditedReviews(globalDataCache.reviews || {});
        setLoading(false);
        return;
      }
      
      // If already loading, wait for the existing promise
      if (globalDataCache.loadingPromise) {
        setLoading(true);
        const data = await globalDataCache.loadingPromise;
        setStudent(data.student);
        setAllWeeks(data.weeks);
        setOriginalReviews(data.reviews);
        setEditedReviews(data.reviews);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      globalDataCache.loadingPromise = (async () => {
        try {
          // Fetch student and modules in parallel
          const [studentRes, modulesRes] = await Promise.all([
            API.get(`students/${studentId}/`),
            API.get(`modules/student-modules/?student_id=${studentId}`)
          ]);

          const studentData = studentRes.data;
          let weeksData = modulesRes.data;
          weeksData.sort((a, b) => extractWeekNumber(a) - extractWeekNumber(b));

          // Batch fetch all reviews in parallel
          const reviewPromises = weeksData.map(week => 
            API.get(`week-review/${week.id}/?student_id=${studentId}`)
              .then(res => ({ weekId: week.id, data: res.data }))
              .catch(() => ({ weekId: week.id, data: {} }))
          );

          const reviewsResults = await Promise.all(reviewPromises);

          const reviewsData = {};
          reviewsResults.forEach(({ weekId, data }) => {
            reviewsData[weekId] = data;
          });

          const result = {
            student: studentData,
            weeks: weeksData,
            reviews: reviewsData
          };
          
          globalDataCache = {
            ...result,
            fetched: true,
            loadingPromise: null
          };
          
          return result;
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Failed to load review data.");
          globalDataCache.loadingPromise = null;
          throw err;
        }
      })();

      try {
        const data = await globalDataCache.loadingPromise;
        setStudent(data.student);
        setAllWeeks(data.weeks);
        setOriginalReviews(data.reviews);
        setEditedReviews(data.reviews);
      } catch (err) {
        // Error already handled
      } finally {
        setLoading(false);
      }
    };

    fetchMainData();
  }, [studentId, navigate]);

  useEffect(() => {
    if (!allWeeks.length) return;
    const filtered = allWeeks.filter(week => {
      const weekNum = extractWeekNumber(week);
      return weekNum >= rangeMin && weekNum <= rangeMax;
    });
    setFilteredWeeks(filtered);
  }, [allWeeks, rangeMin, rangeMax]);

  const handleRangeClick = (range) => {
    setSearchParams({ student_id: studentId, range });
  };

  const handleFieldChange = (weekId, field, value) => {
    let processedValue = value;
    if (typeof value === "string" && (field.includes("mark") || field.includes("score"))) {
      processedValue = value === "" ? "" : Number(value);
    }
    setEditedReviews(prev => ({
      ...prev,
      [weekId]: { ...prev[weekId], [field]: processedValue },
    }));
  };

  const renderCell = (weekId, row) => {
    let value = editedReviews[weekId]?.[row.field] ?? "";
    if (row.type === "number" && (value === null || value === undefined || value === "")) value = "";
    if (row.type === "number" && typeof value === "number") value = value.toString();
    const onChange = (val) => handleFieldChange(weekId, row.field, val);
    const inputClass = "w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none";

    if (row.type === "select") {
      return (
        <select value={value} onChange={e => onChange(e.target.value)} className={inputClass}>
          <option value="">—</option>
          {row.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    if (row.type === "textarea") {
      return <textarea rows={row.rows || 2} value={value} onChange={e => onChange(e.target.value)} className={`${inputClass} resize-vertical`} />;
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
            onChange={e => {
              const newVal = e.target.value === "" ? "" : parseFloat(e.target.value);
              if (newVal !== "" && (newVal < row.min || newVal > row.max)) return;
              onChange(newVal === "" ? "" : newVal);
            }}
            className={inputClass}
          />
          {row.field === "english_score" && editedReviews[weekId]?.english_review && (
            <div className="mt-1 text-xs text-gray-500">📝 {editedReviews[weekId].english_review}</div>
          )}
        </div>
      );
    }
    if (row.type === "date") {
      return <input type="date" value={value} onChange={e => onChange(e.target.value)} className={inputClass} />;
    }
    if (row.type === "url") {
      return <input type="url" value={value} onChange={e => onChange(e.target.value)} className={inputClass} placeholder="https://" />;
    }
    return <input type="text" value={value} onChange={e => onChange(e.target.value)} className={inputClass} />;
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const promises = [];
    const allowedFields = [
      "task_status", "feedback", "reviewer_name", "advisor_name",
      "extra_workouts", "review_date", "english_score",
      "review_score", "extra_workouts_mark", "progress_video", "progress_video_mark", "english_review"
    ];

    for (const week of filteredWeeks) {
      const weekId = week.id;
      const original = originalReviews[weekId] || {};
      const edited = editedReviews[weekId] || {};
      const changes = {};

      for (const row of rows) {
        const field = row.field;
        if (!allowedFields.includes(field)) continue;

        let originalValue = original[field];
        let editedValue = edited[field];

        if (row.type === "number") {
          if (editedValue === "" || editedValue === undefined || editedValue === null) editedValue = null;
          else editedValue = Number(editedValue);
          if (originalValue === "" || originalValue === undefined || originalValue === null) originalValue = null;
          else originalValue = Number(originalValue);
        }

        if (row.type === "url" && editedValue === null) editedValue = "";
        if (originalValue !== editedValue) {
          changes[field] = editedValue;
        }
      }

      if (edited.english_review !== original.english_review) {
        changes.english_review = edited.english_review;
      }

      if (Object.keys(changes).length) {
        promises.push(
          API.patch(`week-review/${weekId}/?student_id=${studentId}`, changes)
            .then(res => ({ weekId, success: true, data: res.data }))
            .catch(err => {
              console.error(`Error updating week ${weekId}:`, err.response?.data);
              throw { weekId, error: err };
            })
        );
      }
    }

    if (!promises.length) {
      showToast("No changes to save", "info");
      setSaving(false);
      return;
    }

    try {
      const results = await Promise.all(promises);
      showToast(`Successfully saved ${results.length} week(s)`, "success");

      const newOriginal = { ...originalReviews };
      const newEdited = { ...editedReviews };

      for (const result of results) {
        if (result.success) {
          newOriginal[result.weekId] = result.data;
          newEdited[result.weekId] = { ...result.data };
        }
      }

      // Update global cache
      globalDataCache.reviews = newOriginal;

      setOriginalReviews(newOriginal);
      setEditedReviews(newEdited);
    } catch (err) {
      console.error(err);
      let errorMsg = "Failed to save some changes.";
      if (err.error?.response?.data) {
        const errorData = err.error.response.data;
        if (typeof errorData === "object") {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey) errorMsg = `${firstKey}: ${errorData[firstKey]}`;
        } else if (typeof errorData === "string") {
          errorMsg = errorData;
        }
      }
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="fixed inset-0 bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-gray-50 text-red-600 flex items-center justify-center">{error}</div>;
  if (!student) return <div className="min-h-screen bg-gray-50 text-center p-8">Student not found</div>;

  const getWeekTotalAndStars = (weekId) => {
    const review = editedReviews[weekId]?.review_score || 0;
    const extra = editedReviews[weekId]?.extra_workouts_mark || 0;
    const english = editedReviews[weekId]?.english_score || 0;
    const video = editedReviews[weekId]?.progress_video_mark || 0;
    return calculateTotalAndStars(review, extra, english, video);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans">
      {toastMessage && <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toastMessage.msg}</div>}
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Edit Review Sheet</h1>
            <p className="text-gray-500 text-sm">{student?.full_name || student?.username} • {student?.course} • {student?.batch}</p>
            <p className="text-gray-400 text-xs">Showing weeks {rangeMin} – {rangeMax}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/admin/review-sheets")} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">← Back</button>
            <button onClick={handleSaveAll} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase w-48">FIELD / WEEK</th>
                {filteredWeeks.map(week => (
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
                  {filteredWeeks.map(week => (
                    <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                      {renderCell(week.id, row)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr key="total_row" className="hover:bg-gray-50/40">
                <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">Total Score (out of 35)</td>
                {filteredWeeks.map(week => {
                  const { total } = getWeekTotalAndStars(week.id);
                  return (
                    <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                      <input type="number" value={total} readOnly className="w-full bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm cursor-default" />
                    </td>
                  );
                })}
              </tr>
              <tr key="star_row" className="hover:bg-gray-50/40">
                <td className="sticky left-0 bg-white px-4 py-3 text-gray-600 text-sm font-medium border-r border-gray-200">Star Rating</td>
                {filteredWeeks.map(week => {
                  const { stars } = getWeekTotalAndStars(week.id);
                  return (
                    <td key={week.id} className="px-3 py-2 border-l border-gray-200 align-top">
                      <StarDisplay value={stars} />
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-6">
          {filteredWeeks.map(week => {
            const { total, stars } = getWeekTotalAndStars(week.id);
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

        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Week Range Selector</h3>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {["0-12", "13-16", "17-24", "25-32", "33-40", "41-44"].map(range => (
              <span key={range} onClick={() => handleRangeClick(range)} className={`cursor-pointer hover:text-green-600 ${rangeParam === range ? "text-green-600 font-semibold" : ""}`}>
                Week {range.replace("-", " - ")}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 text-right text-gray-400 text-xs">💡 Total = Review Score (0-20) + three marks (0-5 each) → max 35; star rating updates instantly.</div>
      </div>
    </div>
  );
}

export default StudentReviewEdit;