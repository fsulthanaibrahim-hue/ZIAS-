// src/Admin/ReviewFoldersAdmin.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";

// 🔧 Change this to your default review sheet URL if needed
const DEFAULT_REVIEW_SHEET_URL = ""; // e.g., "https://docs.google.com/..."

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success"
    ? "bg-green-600"
    : type === "error"
    ? "bg-red-600"
    : "bg-gray-600";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${bgColor} text-white text-sm font-medium max-w-[90vw] sm:max-w-md`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

function ReviewFoldersAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.is_admin && !user.is_staff) {
      navigate("/");
    }
  }, [user, navigate]);

  const [allFolders, setAllFolders] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentMap, setStudentMap] = useState(new Map());
  const [studentCourseMap, setStudentCourseMap] = useState(new Map());
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [folderSearchTerm, setFolderSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [createMode, setCreateMode] = useState("bulk");
  const [createForm, setCreateForm] = useState({
    week_folder: "",
    review_date: "",
    students: [],
    student: "",
  });
  const [errorLogs, setErrorLogs] = useState([]);
  const errorLogsRef = useRef([]);

  const addErrorLog = (error, context = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message: error?.message || String(error),
      stack: error?.stack,
      context,
    };
    errorLogsRef.current = [...errorLogsRef.current, logEntry];
    setErrorLogs(errorLogsRef.current);
    console.error("📋 ERROR LOG:", logEntry);
  };

  const downloadLogs = () => {
    const dataStr = JSON.stringify(errorLogsRef.current, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_error_log_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Logs downloaded", "success");
  };

  const hasFetched = useRef(false);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  const getWorkDocForWeek = async (studentId, weekNumber) => {
    try {
      const modulesRes = await API.get(`/modules/student-modules/?student_id=${studentId}`);
      const modules = modulesRes.data.results || modulesRes.data;
      const theModule = modules.find(m => m.order === weekNumber);
      if (theModule && theModule.work_document_url) {
        return theModule.work_document_url;
      }
      if (theModule && theModule.content) {
        const urlMatch = theModule.content.match(/https?:\/\/[^\s]+/);
        if (urlMatch) return urlMatch[0];
      }
      return "";
    } catch (err) {
      addErrorLog(err, { action: "getWorkDocForWeek", studentId, weekNumber });
      return "";
    }
  };

  // ✅ NEW: Get a default review sheet for a student from their module (if exists)
  const getDefaultReviewSheetFromModule = async (studentId, weekNumber) => {
    try {
      const modulesRes = await API.get(`/modules/student-modules/?student_id=${studentId}`);
      const modules = modulesRes.data.results || modulesRes.data;
      const theModule = modules.find(m => m.order === weekNumber);
      if (theModule && theModule.review_sheet_template) {
        return theModule.review_sheet_template;
      }
      return "";
    } catch (err) {
      return "";
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students/");
      const studentsList = (res.data.results || res.data).map(s => ({
        ...s,
        displayName: s.full_name || s.name || s.username || `Student ${s.id}`,
        currentCourse: s.course_name || s.course || s.program || "—",
      }));
      setStudents(studentsList);
      const nameMap = new Map();
      const courseMap = new Map();
      studentsList.forEach(s => {
        nameMap.set(s.id, s.displayName);
        courseMap.set(s.id, s.currentCourse);
      });
      setStudentMap(nameMap);
      setStudentCourseMap(courseMap);
    } catch (err) {
      addErrorLog(err, { api: "/students/" });
      showToast("Failed to load students", "error");
    }
  };

  const fetchAllFolders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/review-folders/");
      setAllFolders(res.data);
    } catch (err) {
      addErrorLog(err, { api: "/review-folders/" });
      showToast("Failed to load folders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchStudents().then(() => fetchAllFolders());
    }
  }, []);

  const foldersMap = allFolders
    .filter(f => f.week_folder)
    .reduce((acc, f) => {
      const name = f.week_folder;
      if (!acc[name]) {
        acc[name] = {
          name,
          type: "Folder",
          people: f.created_by?.username || "Admin",
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
    if (!searchTerm && !selectedWeek) return true;
    const matchesSearch = !searchTerm
      || entry.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
      || entry.week?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWeek = !selectedWeek || entry.week?.toString() === selectedWeek;
    return matchesSearch && matchesWeek;
  });

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentSelection = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(parseInt(options[i].value));
    }
    setCreateForm(prev => ({ ...prev, students: selected }));
  };

  const selectAllStudents = () => {
    const allIds = students.map(s => s.id);
    setCreateForm(prev => ({ ...prev, students: allIds }));
  };

  const createSingleEntry = async (e) => {
    e.preventDefault();
    if (!createForm.week_folder || !createForm.review_date || !createForm.student) {
      showToast("Please fill folder name, review date and select a student.", "error");
      return;
    }
    setCreating(true);
    try {
      const studentId = parseInt(createForm.student);
      const currentCourse = studentCourseMap.get(studentId) || "—";
      const studentReviews = allFolders.filter(f => f.student === studentId && f.week != null);
      let maxWeek = 0;
      let previousReviewSheet = "";
      let previousCourse = null;
      let courseChanged = false;
      if (studentReviews.length > 0) {
        const sorted = [...studentReviews].sort((a, b) => parseInt(b.week,10) - parseInt(a.week,10));
        const latest = sorted[0];
        maxWeek = parseInt(latest.week,10);
        previousReviewSheet = latest.review_sheet || "";
        previousCourse = latest.course || "";
        if (previousCourse && previousCourse !== currentCourse) {
          courseChanged = true;
        }
      }
      let newWeek = courseChanged ? 1 : maxWeek + 1;
      const workDocUrl = await getWorkDocForWeek(studentId, newWeek);
      
      // ✅ GUARANTEE review sheet: if previousReviewSheet is empty, try module default, then global default
      let reviewSheetValue = previousReviewSheet;
      if (!reviewSheetValue) {
        const moduleDefault = await getDefaultReviewSheetFromModule(studentId, newWeek);
        reviewSheetValue = moduleDefault || DEFAULT_REVIEW_SHEET_URL;
        if (reviewSheetValue) {
          console.log(`📄 Using default review sheet for student ${studentId} (no previous): ${reviewSheetValue}`);
        } else {
          console.warn(`⚠️ No review sheet found for student ${studentId}`);
        }
      } else {
        console.log(`📄 Using previous review sheet for student ${studentId}: ${reviewSheetValue}`);
      }
      
      await API.post("/review-folders/", {
        student: studentId,
        week_folder: createForm.week_folder,
        week: String(newWeek),
        course: currentCourse,
        review_date: createForm.review_date,
        work_documents: workDocUrl,
        review_sheet: reviewSheetValue,
        industry_expert: "",
        meeting_link: "",
        is_done: false,
      });
      showToast(`Created entry for ${studentMap.get(studentId)} in folder "${createForm.week_folder}".`, "success");
      setCreateForm({ week_folder: "", review_date: "", students: [], student: "" });
      setShowCreateForm(false);
      await fetchAllFolders();
      setSelectedFolder(createForm.week_folder);
    } catch (err) {
      addErrorLog(err, { action: "createSingleEntry", studentId: createForm.student });
      let errorMsg = "Error creating entry.";
      if (err.response && err.response.data) errorMsg = JSON.stringify(err.response.data);
      showToast(errorMsg, "error");
    } finally {
      setCreating(false);
    }
  };

  const createMultipleEntries = async (e) => {
    e.preventDefault();
    if (!createForm.week_folder || !createForm.review_date || createForm.students.length === 0) {
      showToast("Please fill folder name, review date and select at least one student.", "error");
      return;
    }
    setCreating(true);
    let successCount = 0;
    let errorCount = 0;
    try {
      for (const studentId of createForm.students) {
        try {
          const currentCourse = studentCourseMap.get(studentId) || "—";
          const studentReviews = allFolders.filter(f => f.student === studentId && f.week != null);
          let maxWeek = 0;
          let previousReviewSheet = "";
          let previousCourse = null;
          let courseChanged = false;
          if (studentReviews.length > 0) {
            const sorted = [...studentReviews].sort((a, b) => parseInt(b.week,10) - parseInt(a.week,10));
            const latest = sorted[0];
            maxWeek = parseInt(latest.week,10);
            previousReviewSheet = latest.review_sheet || "";
            previousCourse = latest.course || "";
            if (previousCourse && previousCourse !== currentCourse) {
              courseChanged = true;
            }
          }
          let newWeek = courseChanged ? 1 : maxWeek + 1;
          const workDocUrl = await getWorkDocForWeek(studentId, newWeek);
          
          // ✅ GUARANTEE review sheet: fallback chain
          let reviewSheetValue = previousReviewSheet;
          if (!reviewSheetValue) {
            const moduleDefault = await getDefaultReviewSheetFromModule(studentId, newWeek);
            reviewSheetValue = moduleDefault || DEFAULT_REVIEW_SHEET_URL;
            if (reviewSheetValue) {
              console.log(`📄 Using default review sheet for student ${studentId} (no previous): ${reviewSheetValue}`);
            } else {
              console.warn(`⚠️ No review sheet found for student ${studentId}`);
            }
          } else {
            console.log(`📄 Using previous review sheet for student ${studentId}: ${reviewSheetValue}`);
          }
          
          await API.post("/review-folders/", {
            student: studentId,
            week_folder: createForm.week_folder,
            week: String(newWeek),
            course: currentCourse,
            review_date: createForm.review_date,
            work_documents: workDocUrl,
            review_sheet: reviewSheetValue,
            industry_expert: "",
            meeting_link: "",
            is_done: false,
          });
          successCount++;
        } catch (innerErr) {
          errorCount++;
          addErrorLog(innerErr, { action: "createMultipleEntries", studentId });
        }
      }
      showToast(`Created ${successCount} entries for folder "${createForm.week_folder}" (${errorCount} failed)`, successCount > 0 ? "success" : "error");
      setCreateForm({ week_folder: "", review_date: "", students: [], student: "" });
      setShowCreateForm(false);
      await fetchAllFolders();
      setSelectedFolder(createForm.week_folder);
    } catch (err) {
      addErrorLog(err, { action: "createMultipleEntries", studentIds: createForm.students });
      showToast("Error creating entries", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value === "" ? null : value,
    }));
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditData({
      review_date: entry.review_date || "",
      week: entry.week !== null && entry.week !== undefined ? String(entry.week) : "",
      work_documents: entry.work_documents || "",
      industry_expert: entry.industry_expert || "",
      meeting_link: entry.meeting_link || "",
      review_sheet: entry.review_sheet || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const sendChatNotification = async (expertName, studentName, folderName) => {
    try {
      const roomsRes = await API.get("/chat-rooms/");
      const rooms = roomsRes.data;
      const expertRoom = rooms.find(room => 
        (room.reviewer && room.reviewer.user.username === expertName) ||
        (room.mentor && room.mentor.user.username === expertName)
      );
      if (expertRoom) {
        await API.post("/chat-messages/", {
          room: expertRoom.id,
          content: `📌 ${studentName} has been assigned to you for review folder "${folderName}". Please check.`,
        });
        return true;
      }
    } catch (err) {
      addErrorLog(err, { action: "sendChatNotification", expertName, studentName, folderName });
    }
    return false;
  };

  const saveEdit = async (id) => {
    const currentEntry = rawEntries.find(e => e.id === id);
    if (!currentEntry) return;
    const oldExpert = currentEntry.industry_expert;
    const newExpert = editData.industry_expert;
    const studentName = studentMap.get(currentEntry.student) || currentEntry.student_name || "a student";
    const folderName = selectedFolder || currentEntry.week_folder || "review folder";
    const payload = {};
    if (editData.review_date && editData.review_date.trim() !== "") payload.review_date = editData.review_date;
    let weekValue = currentEntry.week;
    if (editData.week !== undefined && editData.week !== null && editData.week.trim() !== "") {
      const parsed = parseInt(editData.week, 10);
      if (!isNaN(parsed) && parsed >= 0) weekValue = parsed;
    }
    if (weekValue === null || weekValue === undefined) weekValue = 0;
    payload.week = weekValue;
    if (editData.work_documents !== undefined) payload.work_documents = editData.work_documents?.trim() || "";
    if (editData.industry_expert !== undefined) payload.industry_expert = editData.industry_expert?.trim() || "";
    if (editData.meeting_link !== undefined) payload.meeting_link = editData.meeting_link?.trim() || "";
    if (editData.review_sheet !== undefined) payload.review_sheet = editData.review_sheet?.trim() || "";
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) delete payload[key];
    });
    try {
      await API.patch(`/review-folders/${id}/`, payload);
      await fetchAllFolders();
      showToast("Entry updated successfully.", "success");
      cancelEdit();
      if (newExpert && newExpert !== oldExpert && newExpert.trim() !== "") {
        const success = await sendChatNotification(newExpert, studentName, folderName);
        if (success) showToast(`Chat message sent to ${newExpert}`, "success");
      }
    } catch (err) {
      addErrorLog(err, { action: "saveEdit", id, payload });
      showToast("Update failed: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message), "error");
    }
  };

  const deleteEntry = async (id) => {
    if (window.confirm("Delete this entry?")) {
      try {
        await API.delete(`/review-folders/${id}/`);
        await fetchAllFolders();
        showToast("Entry deleted successfully.", "success");
      } catch (err) {
        addErrorLog(err, { action: "deleteEntry", id });
        showToast("Failed to delete entry.", "error");
      }
    }
  };

  const editFolder = async (oldName) => {
    const newName = prompt("Enter new folder name:", oldName);
    if (!newName || newName.trim() === "" || newName === oldName) return;
    const entries = foldersMap[oldName]?.entries || [];
    if (entries.length === 0) {
      showToast("No entries to rename.", "error");
      return;
    }
    try {
      for (const entry of entries) {
        await API.patch(`/review-folders/${entry.id}/`, { week_folder: newName.trim() });
      }
      if (selectedFolder === oldName) setSelectedFolder(newName.trim());
      await fetchAllFolders();
      showToast(`Folder renamed to "${newName}"`, "success");
    } catch (err) {
      addErrorLog(err, { action: "editFolder", oldName, newName });
      showToast("Failed to rename folder.", "error");
    }
  };

  const deleteFolder = async (folderName) => {
    if (!window.confirm(`Delete folder "${folderName}" and all its entries? This cannot be undone.`)) return;
    const entries = foldersMap[folderName]?.entries || [];
    try {
      for (const entry of entries) {
        await API.delete(`/review-folders/${entry.id}/`);
      }
      if (selectedFolder === folderName) setSelectedFolder(null);
      await fetchAllFolders();
      showToast(`Folder "${folderName}" deleted.`, "success");
    } catch (err) {
      addErrorLog(err, { action: "deleteFolder", folderName });
      showToast("Failed to delete folder.", "error");
    }
  };

  const toggleDone = async (id, newValue) => {
    const entry = rawEntries.find(e => e.id === id);
    if (!entry) return;
    try {
      await API.patch(`/review-folders/${id}/`, { is_done: newValue });
      if (newValue === true && entry.week && entry.week !== "0" && entry.student) {
        try {
          await API.patch(`/students/${entry.student}/`, { last_reviewed_week: entry.week });
        } catch (updateErr) {
          addErrorLog(updateErr, { action: "updateStudentLastReviewedWeek", studentId: entry.student, week: entry.week });
        }
      }
      await fetchAllFolders();
      showToast(`Status updated to ${newValue ? "Completed" : "Pending"}.`, "success");
    } catch (err) {
      addErrorLog(err, { action: "toggleDone", id, newValue });
      showToast("Failed to update status.", "error");
    }
  };

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

  const renderLink = (url, label = "Link") => {
    if (!url) return "—";
    const isUrl = /^(https?:\/\/|www\.)/i.test(url);
    if (isUrl) {
      return <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline break-all">{label}</a>;
    }
    return <span className="text-gray-700 break-all">{url}</span>;
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Review Folders (Admin)</h1>
              <p className="text-gray-500 text-xs sm:text-sm">
                {selectedFolder ? `Showing entries for "${selectedFolder}"` : "Manage all student review folders"}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={downloadLogs} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium">📥 Download Logs</button>
              <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {showCreateForm ? "Cancel" : "+ New Week Folder"}
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6">
              <div className="flex gap-4 mb-4 border-b pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="createMode" value="bulk" checked={createMode === "bulk"} onChange={() => setCreateMode("bulk")} />
                  <span className="text-sm">Multiple Students</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="createMode" value="single" checked={createMode === "single"} onChange={() => setCreateMode("single")} />
                  <span className="text-sm">Single Student</span>
                </label>
              </div>
              <form onSubmit={createMode === "bulk" ? createMultipleEntries : createSingleEntry} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Folder Name *</label>
                  <input type="text" name="week_folder" value={createForm.week_folder} onChange={handleCreateChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., April 4th Week" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Review Date *</label>
                  <input type="date" name="review_date" value={createForm.review_date} onChange={handleCreateChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                {createMode === "bulk" ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Select Students *</label>
                    <button type="button" onClick={selectAllStudents} className="text-xs bg-gray-200 px-2 py-1 rounded mb-2">Select All</button>
                    <select multiple size={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={createForm.students} onChange={handleStudentSelection}>
                      {students.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Hold Ctrl (Cmd) to select multiple.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Select Student *</label>
                    <select name="student" value={createForm.student} onChange={handleCreateChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="">Choose a student</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                    {creating ? "Creating..." : (createMode === "bulk" ? `Create Entries (${createForm.students.length} selected)` : "Create Entry")}
                  </button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {!selectedFolder ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <input type="text" placeholder="Search folders..." value={folderSearchTerm} onChange={(e) => setFolderSearchTerm(e.target.value)} className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
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
                    <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">No folders found. Click "+ New Week Folder".</td></tr>
                  ) : (
                    folderList.map(folder => (
                      <tr key={folder.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => setSelectedFolder(folder.name)}>📁 {folder.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Folder</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{folder.people}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{folder.modified}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{folder.source}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => editFolder(folder.name)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                            <button onClick={() => deleteFolder(folder.name)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-0">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <button onClick={() => setSelectedFolder(null)} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm">← Back to all folders</button>
                <div className="flex gap-2">
                  <input type="text" placeholder="Search student or week..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 border border-gray-300 rounded-lg px-3 py-1 text-sm" />
                  <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                    <option value="">All Weeks</option>
                    {[...new Set(rawEntries.map(e => e.week))].sort().map(w => <option key={w} value={w}>Week {w}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Doc</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry Expert</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meeting Link</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Sheet</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.length === 0 ? (
                      <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-400">No entries found.</td></tr>
                    ) : (
                      filteredEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{studentMap.get(entry.student) || entry.student_name || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {editingId === entry.id ? (
                              <input type="number" name="week" value={editData.week || ""} onChange={handleEditChange} className="w-20 border border-gray-300 rounded px-2 py-1 text-sm" />
                            ) : `Week ${entry.week}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {editingId === entry.id ? (
                              <input type="date" name="review_date" value={editData.review_date || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                            ) : entry.review_date || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {editingId === entry.id ? (
                              <input type="url" name="work_documents" value={editData.work_documents || ""} onChange={handleEditChange} className="w-36 border border-gray-300 rounded px-2 py-1 text-sm" />
                            ) : renderLink(entry.work_documents, "Work Doc")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {editingId === entry.id ? (
                              <input type="text" name="industry_expert" value={editData.industry_expert || ""} onChange={handleEditChange} className="w-36 border border-gray-300 rounded px-2 py-1 text-sm" />
                            ) : entry.industry_expert || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {editingId === entry.id ? (
                              <input type="url" name="meeting_link" value={editData.meeting_link || ""} onChange={handleEditChange} className="w-36 border border-gray-300 rounded px-2 py-1 text-sm" />
                            ) : renderLink(entry.meeting_link, "Meeting")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {editingId === entry.id ? (
                              <input type="url" name="review_sheet" value={editData.review_sheet || ""} onChange={handleEditChange} className="w-36 border border-gray-300 rounded px-2 py-1 text-sm" />
                            ) : renderLink(entry.review_sheet, "Review Sheet")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => toggleDone(entry.id, !entry.is_done)} className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${entry.is_done ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}`}>
                              {entry.is_done ? "Completed" : "Pending"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {editingId === entry.id ? (
                              <div className="flex gap-2 justify-center">
                                <button onClick={() => saveEdit(entry.id)} className="text-green-600 hover:text-green-800"><SaveIcon /></button>
                                <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-800"><CancelIcon /></button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-center">
                                <button onClick={() => startEdit(entry)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                <button onClick={() => deleteEntry(entry.id)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
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
          )}
        </div>
      </div>
    </>
  );
}

export default ReviewFoldersAdmin;