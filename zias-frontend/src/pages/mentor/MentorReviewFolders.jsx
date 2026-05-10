// src/pages/mentor/MentorReviewFolders.jsx – final with delete entry and refresh work doc
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_REVIEW_SHEET_URL = "";

// --------------------------------------------------------------
// Modal for adding week folder (same as admin side)
// --------------------------------------------------------------
function AddWeekModal({ isOpen, onClose, batchStudents, batchName, onCreate, creating }) {
  const [folderName, setFolderName] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    if (isOpen && batchStudents.length) {
      setSelectedStudents(batchStudents.map(s => s.id));
      setSelectAll(true);
    }
  }, [isOpen, batchStudents]);

  if (!isOpen) return null;

  const handleSelectAllChange = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedStudents(batchStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleStudentToggle = (studentId) => {
    let newSelected;
    if (selectedStudents.includes(studentId)) {
      newSelected = selectedStudents.filter(id => id !== studentId);
    } else {
      newSelected = [...selectedStudents, studentId];
    }
    setSelectedStudents(newSelected);
    setSelectAll(newSelected.length === batchStudents.length);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName.trim() || !reviewDate) {
      alert("Folder name and review date are required.");
      return;
    }
    if (selectedStudents.length === 0) {
      alert("Select at least one student.");
      return;
    }
    onCreate(folderName.trim(), reviewDate, selectedStudents);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Add Week Folder – {batchName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Folder Name *</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g., May 1st Week"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Review Date *</label>
            <input
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Students</label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAllChange} />
                Select all
              </label>
            </div>
            {batchStudents.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4 border border-dashed rounded-lg">
                No students assigned to this batch.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                {batchStudents.map(student => (
                  <label key={student.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                    />
                    {student.displayName}
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">{selectedStudents.length} selected</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={creating || batchStudents.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Week Folder"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------------
// Main component
// --------------------------------------------------------------
function MentorReviewFolders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [allFolders, setAllFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [folderSearchTerm, setFolderSearchTerm] = useState("");
  const [entriesSearchTerm, setEntriesSearchTerm] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [reviewersList, setReviewersList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [creatingWeek, setCreatingWeek] = useState(false);
  const [refreshingDocId, setRefreshingDocId] = useState(null);

  // Fetch reviewers for dropdown
  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const res = await API.get("/reviewers/");
        const reviewers = res.data.results || res.data;
        const names = reviewers.map(rev => rev.full_name || rev.name || rev.user?.full_name || rev.username || `Reviewer ${rev.id}`);
        setReviewersList([...new Set(names)]);
      } catch (err) {
        if (err.response?.status !== 403) console.error("Failed to fetch reviewers", err);
        setReviewersList([]);
      }
    };
    if (!authLoading && user) fetchReviewers();
  }, [authLoading, user]);

  // Fetch mentor's students (for modal)
  const fetchMentorStudents = async () => {
    try {
      const mentorRes = await API.get("/mentors/me/");
      const mentorId = mentorRes.data.id;
      const studentsRes = await API.get(`/students/?mentor=${mentorId}`);
      const students = studentsRes.data.results || studentsRes.data || [];
      const mapped = students.map(s => ({
        id: s.id,
        displayName: s.full_name || s.user?.username || `Student ${s.id}`,
        course: s.course,
      }));
      setStudentsList(mapped);
    } catch (err) {
      console.error("Failed to fetch mentor's students", err);
      setStudentsList([]);
    }
  };

  // Fetch folders
  const fetchMentorFolders = async () => {
    setLoading(true);
    setError(null);
    try {
      const mentorRes = await API.get("/mentors/me/");
      const mentorId = mentorRes.data.id;
      const studentsRes = await API.get(`/students/?mentor=${mentorId}`);
      const students = studentsRes.data.results || studentsRes.data;
      const studentIds = students.map(s => s.id);
      if (studentIds.length === 0) {
        setAllFolders([]);
        setError("No students assigned to you. Please contact the admin.");
        setLoading(false);
        return;
      }
      const query = studentIds.map(id => `student=${id}`).join('&');
      const foldersRes = await API.get(`/review-folders/?${query}`);
      setAllFolders(foldersRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load folders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Auth check and fetch data
  useEffect(() => {
    if (authLoading) return;
    const token = localStorage.getItem("access_token");
    if (!user && !token) {
      navigate("/login");
    } else if (user) {
      fetchMentorFolders();
      fetchMentorStudents();
    } else {
      setLoading(false);
    }
  }, [user, authLoading, navigate]);

  // Group folders by week_folder
  const foldersMap = allFolders
    .filter(f => f.week_folder)
    .reduce((acc, f) => {
      const name = f.week_folder;
      if (!acc[name]) {
        acc[name] = {
          name,
          type: "Folder",
          people: f.created_by?.username || "Mentor",
          modified: f.review_date,
          source: "Review",
          entries: [],
        };
      }
      acc[name].entries.push(f);
      if (f.review_date > acc[name].modified) acc[name].modified = f.review_date;
      return acc;
    }, {});

  const folderList = Object.values(foldersMap)
    .filter(folder => folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.modified) - new Date(a.modified));

  const rawEntries = selectedFolder ? foldersMap[selectedFolder]?.entries || [] : [];
  const filteredEntries = rawEntries.filter(entry => {
    if (!entriesSearchTerm && !selectedWeek) return true;
    const matchesSearch = !entriesSearchTerm ||
      entry.student_name?.toLowerCase().includes(entriesSearchTerm.toLowerCase()) ||
      entry.week?.toString().toLowerCase().includes(entriesSearchTerm.toLowerCase());
    const matchesWeek = !selectedWeek || entry.week?.toString() === selectedWeek;
    return matchesSearch && matchesWeek;
  });

  // ----- Helper to fetch work doc from module -----
  const getWorkDocForWeek = async (studentId, weekNumber) => {
    try {
      const modulesRes = await API.get(`/modules/student-modules/?student_id=${studentId}`);
      let modules = modulesRes.data.results || modulesRes.data;
      if (!Array.isArray(modules)) modules = [];
      const weekNum = Number(weekNumber);
      const theModule = modules.find(m => m.order === weekNumber);
      if (theModule && theModule.work_document_url) return theModule.work_document_url;
      if (theModule && theModule.content) {
        const urlMatch = theModule.content.match(/https?:\/\/[^\s]+/);
        if (urlMatch) return urlMatch[0];
      }
      return "";
    } catch {
      return "";
    }
  };

  // ----- Refresh work document for an existing entry -----
  const refreshWorkDoc = async (entryId, studentId, weekNumber) => {
    setRefreshingDocId(entryId);
    try {
      const newUrl = await getWorkDocForWeek(studentId, weekNumber);
      if (!newUrl) {
        alert("No work document found for this student/week.");
        return;
      }
      await API.patch(`/review-folders/${entryId}/`, { work_documents: newUrl });
      await fetchMentorFolders();
      alert("Work document refreshed successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to refresh work document.");
    } finally {
      setRefreshingDocId(null);
    }
  };

  // ----- Folder actions (rename / delete) -----
  const editFolder = async (oldName) => {
    const newName = prompt("Enter new folder name:", oldName);
    if (!newName || newName.trim() === "" || newName === oldName) return;
    const folderData = folderList.find(f => f.name === oldName);
    const entries = folderData?.entries || [];
    if (entries.length === 0) {
      alert("No entries to rename.");
      return;
    }
    try {
      for (const entry of entries) {
        await API.patch(`/review-folders/${entry.id}/`, { week_folder: newName.trim() });
      }
      if (selectedFolder === oldName) setSelectedFolder(newName.trim());
      await fetchMentorFolders();
      alert(`Folder renamed to "${newName}"`);
    } catch (err) {
      console.error(err);
      alert("Failed to rename folder.");
    }
  };

  const deleteFolder = async (folderName) => {
    if (!window.confirm(`Delete folder "${folderName}" and all its entries? This cannot be undone.`)) return;
    const folderData = folderList.find(f => f.name === folderName);
    const entries = folderData?.entries || [];
    try {
      for (const entry of entries) {
        await API.delete(`/review-folders/${entry.id}/`);
      }
      if (selectedFolder === folderName) setSelectedFolder(null);
      await fetchMentorFolders();
      alert(`Folder "${folderName}" deleted.`);
    } catch (err) {
      console.error(err);
      alert("Failed to delete folder.");
    }
  };

  // ----- Create week folder -----
  const getDefaultReviewSheetFromModule = async (studentId, weekNumber) => {
    try {
      const modulesRes = await API.get(`/modules/student-modules/?student_id=${studentId}`);
      const modules = modulesRes.data.results || modulesRes.data;
      const theModule = modules.find(m => m.order === weekNumber);
      return theModule?.review_sheet_template || "";
    } catch {
      return "";
    }
  };

  const ensureWeekReviewExists = async (studentId, weekNumber) => {
    try {
      const modulesRes = await API.get(`/modules/student-modules/?student_id=${studentId}`);
      const modules = modulesRes.data.results || modulesRes.data;
      const moduleObj = modules.find(m => m.order === weekNumber);
      if (!moduleObj) return false;
      const moduleId = moduleObj.id;
      try {
        const checkRes = await API.get(`week-review/${moduleId}/?student_id=${studentId}`);
        if (checkRes.data && checkRes.data.id) return true;
      } catch (err) {
        if (err.response?.status !== 404) return false;
      }
      await API.post("/week-review/", {
        student: studentId,
        module: moduleId,
        task_status: "Pending",
        feedback: "",
        reviewer_name: "",
        advisor_name: "",
        extra_workouts: "Not Completed",
        review_date: new Date().toISOString().split("T")[0],
        english_score: 0,
        extra_workouts_mark: 0,
        progress_video: "",
        progress_video_mark: 0,
        review_score: 0,
        english_review: "",
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleAddWeekForBatch = async (folderName, reviewDate, selectedStudentIds) => {
    setCreatingWeek(true);
    let successCount = 0;
    let errorCount = 0;
    for (const studentId of selectedStudentIds) {
      try {
        const student = studentsList.find(s => s.id === studentId);
        const currentCourse = student?.course || "—";
        const studentReviews = allFolders.filter(f => f.student === studentId && f.week != null);
        let maxWeek = 0;
        let previousReviewSheet = "";
        if (studentReviews.length > 0) {
          const sorted = [...studentReviews].sort((a, b) => parseInt(b.week,10) - parseInt(a.week,10));
          const latest = sorted[0];
          maxWeek = parseInt(latest.week,10);
          previousReviewSheet = latest.review_sheet || "";
        }
        let newWeek = maxWeek + 1;
        const workDocUrl = await getWorkDocForWeek(studentId, newWeek);
        let reviewSheetValue = previousReviewSheet || DEFAULT_REVIEW_SHEET_URL;
        await API.post("/review-folders/", {
          student: studentId,
          week_folder: folderName,
          week: String(newWeek),
          course: currentCourse,
          review_date: reviewDate,
          work_documents: workDocUrl,
          review_sheet: reviewSheetValue,
          industry_expert: "",
          meeting_link: "",
          is_done: false,
        });
        await ensureWeekReviewExists(studentId, newWeek);
        successCount++;
      } catch (err) {
        errorCount++;
        console.error(err);
      }
    }
    alert(`Created ${successCount} entries for "${folderName}" (${errorCount} failed)`);
    setShowAddWeekModal(false);
    await fetchMentorFolders();
    setCreatingWeek(false);
  };

  // ----- Entry actions (edit/delete/toggle) -----
  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditData({
      review_date: entry.review_date || "",
      week: entry.week?.toString() || "",
      industry_expert: entry.industry_expert || "",
      meeting_link: entry.meeting_link || "",
      time_started: entry.time_started || "",
      time_ended: entry.time_ended || "",
      work_documents: entry.work_documents || "",
      review_sheet: entry.review_sheet || "",
      is_done: entry.is_done || false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const saveEdit = async (id) => {
    const payload = {};
    const original = rawEntries.find(e => e.id === id);
    if (!original) return;
    for (const key in editData) {
      let newVal = editData[key];
      let oldVal = original[key] !== undefined && original[key] !== null ? original[key] : "";
      if (key === "week") {
        newVal = newVal ? Number(newVal) : null;
        oldVal = oldVal ? Number(oldVal) : null;
      }
      if (newVal !== oldVal) payload[key] = newVal;
    }
    if (Object.keys(payload).length === 0) {
      cancelEdit();
      return;
    }
    try {
      await API.patch(`/review-folders/${id}/`, payload);
      await fetchMentorFolders();
      cancelEdit();
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const deleteEntry = async (id) => {
    if (window.confirm("Delete this entry?")) {
      try {
        await API.delete(`/review-folders/${id}/`);
        await fetchMentorFolders();
        alert("Entry deleted successfully.");
      } catch (err) {
        alert("Failed to delete entry.");
      }
    }
  };

  const toggleDone = async (id, newValue) => {
    try {
      await API.patch(`/review-folders/${id}/`, { is_done: newValue });
      await fetchMentorFolders();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const renderLink = (url, label) => {
    if (!url) return "—";
    return /^https?:\/\//i.test(url) ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">{label}</a>
    ) : (
      <span className="break-all">{url}</span>
    );
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 whitespace-pre-line">{error}</div>;
  }

  const Icons = {
    Edit: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>),
    Delete: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>),
    Save: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>),
    Cancel: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>),
    Refresh: () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">My Students' Review Folders</h1>
      <p className="text-gray-500 text-sm mb-6">Click a folder to view/edit entries.</p>

      {!selectedFolder ? (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search folders..."
                value={folderSearchTerm}
                onChange={(e) => setFolderSearchTerm(e.target.value)}
                className="w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => setShowAddWeekModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Add Week Folder
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">People</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {folderList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400">No folders found for your students.</td>
                  </tr>
                ) : (
                  folderList.map((folder) => (
                    <tr key={folder.name} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedFolder(folder.name)}>
                      <td className="px-4 py-3 text-sm text-blue-600 hover:underline">📁 {folder.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Folder</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{folder.people}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{folder.modified}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{folder.source}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={(e) => { e.stopPropagation(); editFolder(folder.name); }} className="text-blue-600 hover:text-blue-800"><Icons.Edit /></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.name); }} className="text-red-600 hover:text-red-800"><Icons.Delete /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <button onClick={() => setSelectedFolder(null)} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm">← Back to all folders</button>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search student or week..."
                value={entriesSearchTerm}
                onChange={(e) => setEntriesSearchTerm(e.target.value)}
                className="w-48 border border-gray-300 rounded-lg px-3 py-1 text-sm"
              />
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              >
                <option value="">All Weeks</option>
                {[...new Set(rawEntries.map(e => e.week))].filter(w => w != null).sort().map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Week</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Review Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Reviewer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Work Doc</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Meeting Link</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Review Sheet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Start Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">End Time</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.student_name || entry.student?.full_name || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === entry.id ? <input type="number" name="week" value={editData.week} onChange={handleChange} className="w-20 border rounded px-2 py-1 text-sm" /> : `Week ${entry.week}`}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === entry.id ? <input type="date" name="review_date" value={editData.review_date} onChange={handleChange} className="w-32 border rounded px-2 py-1 text-sm" /> : entry.review_date || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === entry.id ? (
                        reviewersList.length > 0 ? (
                          <select name="industry_expert" value={editData.industry_expert} onChange={handleChange} className="w-36 border rounded px-2 py-1 text-sm">
                            <option value="">— Select Reviewer —</option>
                            {reviewersList.map((name) => <option key={name} value={name}>{name}</option>)}
                          </select>
                        ) : (
                          <input type="text" name="industry_expert" value={editData.industry_expert} onChange={handleChange} className="w-36 border rounded px-2 py-1 text-sm" placeholder="Reviewer name" />
                        )
                      ) : entry.industry_expert || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === entry.id ? <input type="url" name="work_documents" value={editData.work_documents} onChange={handleChange} className="w-36 border rounded px-2 py-1 text-sm" /> : renderLink(entry.work_documents, "Doc")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === entry.id ? <input type="url" name="meeting_link" value={editData.meeting_link} onChange={handleChange} className="w-36 border rounded px-2 py-1 text-sm" /> : renderLink(entry.meeting_link, "Meeting")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === entry.id ? <input type="url" name="review_sheet" value={editData.review_sheet} onChange={handleChange} className="w-36 border rounded px-2 py-1 text-sm" /> : renderLink(entry.review_sheet, "Sheet")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === entry.id ? <input type="time" name="time_started" value={editData.time_started} onChange={handleChange} className="w-28 border rounded px-2 py-1 text-sm" /> : entry.time_started || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === entry.id ? <input type="time" name="time_ended" value={editData.time_ended} onChange={handleChange} className="w-28 border rounded px-2 py-1 text-sm" /> : entry.time_ended || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === entry.id ? (
                        <label className="flex items-center justify-center gap-1 cursor-pointer">
                          <input type="checkbox" name="is_done" checked={editData.is_done} onChange={handleChange} />
                          <span className="text-xs">{editData.is_done ? "Completed" : "Pending"}</span>
                        </label>
                      ) : (
                        <button onClick={() => toggleDone(entry.id, !entry.is_done)} className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${entry.is_done ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}`}>
                          {entry.is_done ? "Completed" : "Pending"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === entry.id ? (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => saveEdit(entry.id)} className="text-green-600 hover:text-green-800"><Icons.Save /></button>
                          <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-800"><Icons.Cancel /></button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => startEdit(entry)} className="text-blue-600 hover:text-blue-800"><Icons.Edit /></button>
                          <button onClick={() => deleteEntry(entry.id)} className="text-red-600 hover:text-red-800"><Icons.Delete /></button>

                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Week Modal */}
      <AddWeekModal
        isOpen={showAddWeekModal}
        onClose={() => setShowAddWeekModal(false)}
        batchStudents={studentsList}
        batchName="My Students"
        onCreate={handleAddWeekForBatch}
        creating={creatingWeek}
      />
    </div>
  );
}

export default MentorReviewFolders;