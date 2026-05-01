import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../../api/api";

// Helper functions
const formatTime = (datetimeValue) => {
  if (!datetimeValue) return "";
  if (datetimeValue.includes("T")) return datetimeValue.split("T")[1].slice(0, 5);
  return datetimeValue.slice(0, 5);
};

const combineDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  return `${dateStr}T${timeStr}:00`;
};

// SVG Icons
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const CancelIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Auto‑fetch work document from modules
const fetchModuleUrl = async (studentId, weekNumber) => {
  if (!studentId || !weekNumber) return "";
  try {
    const studentRes = await API.get(`/students/${studentId}/`);
    const courseId = studentRes.data.course;
    if (!courseId) return "";
    const modulesRes = await API.get(`/modules/?course=${courseId}`);
    const module = modulesRes.data.find(m => m.week_number === weekNumber);
    return module?.work_document_url || "";
  } catch (err) {
    console.error("Failed to fetch module URL", err);
    return "";
  }
};

// Static list of industry experts (reviewers)
const staticReviewers = [
  { id: 1, full_name: "Akif Sir", username: "akif" },
  { id: 2, full_name: "Rizan Sir", username: "rizan" },
  { id: 3, full_name: "Prameesh Sir", username: "prameesh" },
];

export default function ReviewTracker() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderFromUrl = searchParams.get("folder");

  const [reviews, setReviews] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [reviewersList] = useState(staticReviewers);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [folderOptions, setFolderOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [toast, setToast] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    student: "", review_date: "", week: "", work_documents: "", industry_expert: "",
    meeting_link: "", review_sheet: "", time_started: "", time_ended: "", is_done: false,
  });
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const hasFetched = useRef(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reviewsRes, studentsRes] = await Promise.all([
        API.get("/review-folders/"),
        API.get("/students/"),
      ]);
      setReviews(reviewsRes.data);
      setStudentsList(studentsRes.data);

      const folders = [...new Set(reviewsRes.data.map(r => r.week_folder).filter(f => f && f.trim() !== ""))];
      setFolderOptions(folders);

      if (folderFromUrl && folders.includes(folderFromUrl)) {
        setSelectedFolder(folderFromUrl);
      } else if (folders.length > 0 && !selectedFolder) {
        setSelectedFolder(folders[0]);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, []);

  // Filter reviews by selected folder
  const folderReviews = reviews.filter(r => r.week_folder === selectedFolder);
  const filteredReviews = folderReviews.filter(review => {
    const studentName = review.student_name || "";
    const weekStr = review.week?.toString() || "";
    const term = searchTerm.toLowerCase();
    return studentName.toLowerCase().includes(term) || weekStr.includes(term);
  });

  const total = folderReviews.length;
  const doneCount = folderReviews.filter(r => r.is_done).length;
  const pendingCount = total - doneCount;
  const completionRate = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  // Inline edit handlers
  const startEdit = (review) => {
    setEditingId(review.id);
    setEditData({
      review_date: review.review_date || "",
      week: review.week?.toString() || "",
      work_documents: review.work_documents || "",
      industry_expert: review.industry_expert || "",
      meeting_link: review.meeting_link || "",
      review_sheet: review.review_sheet || "",
      time_started: formatTime(review.time_started),
      time_ended: formatTime(review.time_ended),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleWeekChange = async (newWeek, studentId) => {
    if (!studentId || !newWeek || newWeek < 1) return;
    setFetchingUrl(true);
    const url = await fetchModuleUrl(studentId, newWeek);
    if (url) setEditData(prev => ({ ...prev, week: newWeek, work_documents: url }));
    else setEditData(prev => ({ ...prev, week: newWeek }));
    setFetchingUrl(false);
  };

  const saveEdit = async (id) => {
    const review = reviews.find(r => r.id === id);
    if (!review) return;

    const payload = {
      review_date: editData.review_date,
      week: editData.week ? parseInt(editData.week, 10) : 0,
      work_documents: editData.work_documents,
      industry_expert: editData.industry_expert,
      meeting_link: editData.meeting_link,
      review_sheet: editData.review_sheet,
    };
    const baseDate = editData.review_date || review.review_date;
    if (baseDate && editData.time_started) payload.time_started = combineDateTime(baseDate, editData.time_started);
    if (baseDate && editData.time_ended) payload.time_ended = combineDateTime(baseDate, editData.time_ended);

    try {
      await API.patch(`/review-folders/${id}/`, payload);
      await fetchData();
      showToast("Review updated");
      cancelEdit();
    } catch (err) {
      showToast("Update failed", "error");
    }
  };

  const toggleDone = async (id, currentStatus) => {
    try {
      await API.patch(`/review-folders/${id}/`, { is_done: !currentStatus });
      await fetchData();
      showToast(`Status changed to ${!currentStatus ? "Done" : "Pending"}`);
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this entry permanently?")) return;
    try {
      await API.delete(`/review-folders/${id}/`);
      await fetchData();
      showToast("Deleted");
    } catch (err) {
      showToast("Delete failed", "error");
    }
  };

  // Create new entry
  const handleCreateChange = (e) => {
    setNewEntry({ ...newEntry, [e.target.name]: e.target.value });
  };

  const handleCreateWeekBlur = async () => {
    if (!newEntry.student || !newEntry.week) return;
    setFetchingUrl(true);
    const url = await fetchModuleUrl(parseInt(newEntry.student, 10), parseInt(newEntry.week, 10));
    if (url) setNewEntry(prev => ({ ...prev, work_documents: url }));
    setFetchingUrl(false);
  };

  const createNewEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.student || !newEntry.review_date || !newEntry.week) {
      showToast("Student, date and week are required", "error");
      return;
    }
    if (!selectedFolder) {
      showToast("Please select a folder first", "error");
      return;
    }
    const payload = {
      student: parseInt(newEntry.student, 10),
      review_date: newEntry.review_date,
      week: parseInt(newEntry.week, 10),
      week_folder: selectedFolder,
      work_documents: newEntry.work_documents,
      industry_expert: newEntry.industry_expert,
      meeting_link: newEntry.meeting_link,
      review_sheet: newEntry.review_sheet,
      is_done: false,
    };
    if (newEntry.time_started && newEntry.review_date) payload.time_started = combineDateTime(newEntry.review_date, newEntry.time_started);
    if (newEntry.time_ended && newEntry.review_date) payload.time_ended = combineDateTime(newEntry.review_date, newEntry.time_ended);

    try {
      await API.post("/review-folders/", payload);
      await fetchData();
      setShowCreateForm(false);
      setNewEntry({
        student: "", review_date: "", week: "", work_documents: "", industry_expert: "",
        meeting_link: "", review_sheet: "", time_started: "", time_ended: "", is_done: false,
      });
      showToast("Entry added");
    } catch (err) {
      showToast("Failed to create", "error");
    }
  };

  const handleFolderChange = (e) => {
    const newFolder = e.target.value;
    setSelectedFolder(newFolder);
    setSearchParams({ folder: newFolder });
  };

  const getReviewerName = (user) => {
    return user.full_name || user.name || user.username || `Reviewer ${user.id}`;
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white ${toast.type === "error" ? "bg-red-500" : "bg-green-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              📋 {selectedFolder || "Select a folder"}
            </h1>
            <p className="text-gray-500 text-sm">Only entries from <strong>{selectedFolder || "selected folder"}</strong> are shown</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/mentor/review-folder")} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium">← Back to Folders</button>
            <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add Review</button>
          </div>
        </div>

        {folderOptions.length > 0 && (
          <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Select Folder:</span>
              <select value={selectedFolder} onChange={handleFolderChange} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                {folderOptions.map(folder => <option key={folder} value={folder}>{folder}</option>)}
              </select>
            </div>
            <div className="text-sm text-gray-500">{total} entry{total !== 1 ? "s" : ""} in this folder</div>
          </div>
        )}

        {!selectedFolder && folderOptions.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-700">
            No folders yet. Go to Review Folders page to create one.
          </div>
        )}

        {selectedFolder && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="text-gray-500 text-sm">Total Reviews</div><div className="text-3xl font-bold text-gray-800">{total}</div></div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="text-green-600 text-sm">✅ Done</div><div className="text-3xl font-bold text-green-700">{doneCount}</div></div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="text-amber-600 text-sm">🔄 Pending</div><div className="text-3xl font-bold text-amber-600">{pendingCount}</div></div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="text-indigo-600 text-sm">📈 Completion</div><div className="text-3xl font-bold text-indigo-600">{completionRate}%</div></div>
            </div>

            {/* Search */}
            <div className="mb-5">
              <input type="text" placeholder="Search by student or week..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <div className="bg-white rounded-xl border p-5 mb-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">➕ Add review entry to {selectedFolder}</h2>
                <form onSubmit={createNewEntry} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select name="student" value={newEntry.student} onChange={handleCreateChange} required className="border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select Student</option>
                    {studentsList.map(s => <option key={s.id} value={s.id}>{s.full_name || s.username}</option>)}
                  </select>
                  <input type="date" name="review_date" value={newEntry.review_date} onChange={handleCreateChange} required className="border rounded-lg px-3 py-2 text-sm" />
                  <div>
                    <input type="number" name="week" value={newEntry.week} onChange={handleCreateChange} onBlur={handleCreateWeekBlur} required placeholder="Week number" className="border rounded-lg px-3 py-2 text-sm w-full" />
                    {fetchingUrl && <span className="text-xs text-gray-400">Fetching...</span>}
                  </div>
                  <input type="text" name="work_documents" value={newEntry.work_documents} onChange={handleCreateChange} placeholder="Work doc URL" className="border rounded-lg px-3 py-2 text-sm" readOnly={!!newEntry.work_documents} />
                  <select name="industry_expert" value={newEntry.industry_expert} onChange={handleCreateChange} className="border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select Industry Expert (Reviewer)</option>
                    {reviewersList.map(reviewer => <option key={reviewer.id} value={getReviewerName(reviewer)}>{getReviewerName(reviewer)}</option>)}
                  </select>
                  <input type="text" name="meeting_link" value={newEntry.meeting_link} onChange={handleCreateChange} placeholder="Meet link" className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="text" name="review_sheet" value={newEntry.review_sheet} onChange={handleCreateChange} placeholder="Review sheet URL" className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="time" name="time_started" value={newEntry.time_started} onChange={handleCreateChange} className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="time" name="time_ended" value={newEntry.time_ended} onChange={handleCreateChange} className="border rounded-lg px-3 py-2 text-sm" />
                  <div className="md:col-span-2 flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Create</button>
                    <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-200 px-4 py-2 rounded-lg text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Main Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <div className="min-w-[1200px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Week</th>
                      <th className="px-4 py-3 text-left">Work Doc</th>
                      <th className="px-4 py-3 text-left">Industry Expert</th>
                      <th className="px-4 py-3 text-left">Meet Link</th>
                      <th className="px-4 py-3 text-left">Review Remarks</th>
                      <th className="px-4 py-3 text-left">Time Started</th>
                      <th className="px-4 py-3 text-left">Time Ended</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-8 text-gray-400">
                          No entries in this folder.
                        </td>
                      </tr>
                    ) : (
                      filteredReviews.map((review) => (
                        <tr key={review.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {editingId === review.id ? (
                              <input type="date" name="review_date" value={editData.review_date} onChange={handleEditChange} className="border rounded px-1 py-0.5 w-28" />
                            ) : (review.review_date || "—")}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{review.student_name || "—"}</td>
                          <td className="px-4 py-3 text-sm">
                            {editingId === review.id ? (
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={async () => { const newWeek = Math.max(1, (parseInt(editData.week) || 1) - 1); await handleWeekChange(newWeek, review.student); }} className="px-2 py-1 bg-gray-200 rounded text-xs" disabled={fetchingUrl}>←</button>
                                <input type="number" name="week" value={editData.week} onChange={handleEditChange} onBlur={async (e) => { const newWeek = parseInt(e.target.value, 10); if (!isNaN(newWeek) && newWeek > 0) await handleWeekChange(newWeek, review.student); }} className="border rounded px-1 py-0.5 w-16 text-center" />
                                <button type="button" onClick={async () => { const newWeek = (parseInt(editData.week) || 1) + 1; await handleWeekChange(newWeek, review.student); }} className="px-2 py-1 bg-gray-200 rounded text-xs" disabled={fetchingUrl}>→</button>
                                {fetchingUrl && <span className="text-xs text-gray-400 ml-1">⏳</span>}
                              </div>
                            ) : (review.week || "—")}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {editingId === review.id ? (
                              <input type="text" name="work_documents" value={editData.work_documents} onChange={handleEditChange} className="border rounded px-1 py-0.5 w-32" readOnly={!!editData.work_documents} />
                            ) : (
                              review.work_documents ? <a href={review.work_documents} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Doc</a> : "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {editingId === review.id ? (
                              <select name="industry_expert" value={editData.industry_expert || ""} onChange={handleEditChange} className="border rounded px-1 py-0.5 w-28">
                                <option value="">—</option>
                                {reviewersList.map(reviewer => <option key={reviewer.id} value={getReviewerName(reviewer)}>{getReviewerName(reviewer)}</option>)}
                              </select>
                            ) : (review.industry_expert || "—")}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {editingId === review.id ? (
                              <input type="text" name="meeting_link" value={editData.meeting_link} onChange={handleEditChange} className="border rounded px-1 py-0.5 w-32" />
                            ) : (
                              review.meeting_link ? <a href={review.meeting_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Meet</a> : "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {editingId === review.id ? (
                              <input type="text" name="review_sheet" value={editData.review_sheet} onChange={handleEditChange} className="border rounded px-1 py-0.5 w-36" />
                            ) : (
                              review.review_sheet ? <a href={review.review_sheet} target="_blank" rel="noreferrer" className="text-green-600 hover:underline">Sheet</a> : "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {editingId === review.id ? (
                              <input type="time" name="time_started" value={editData.time_started} onChange={handleEditChange} className="border rounded px-1 py-0.5 w-24" />
                            ) : (formatTime(review.time_started) || "—")}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {editingId === review.id ? (
                              <input type="time" name="time_ended" value={editData.time_ended} onChange={handleEditChange} className="border rounded px-1 py-0.5 w-24" />
                            ) : (formatTime(review.time_ended) || "—")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => toggleDone(review.id, review.is_done)} className={`px-3 py-1 rounded-full text-xs font-semibold ${review.is_done ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                              {review.is_done ? "Done" : "Pending"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {editingId === review.id ? (
                              <div className="flex gap-2 justify-center">
                                <button onClick={() => saveEdit(review.id)} className="text-green-600 hover:text-green-800"><SaveIcon /></button>
                                <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700"><CancelIcon /></button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-center">
                                <button onClick={() => startEdit(review)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                <button onClick={() => deleteEntry(review.id)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}