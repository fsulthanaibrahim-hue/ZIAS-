import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";

const DEFAULT_REVIEW_SHEET_URL = "";

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
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${bgColor} text-white text-sm font-medium max-w-[90vw] sm:max-w-md animate-in`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

class SafeTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorInfo: error?.message || "Unknown error" };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Table render error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-600 bg-white rounded-xl border border-gray-200">
          ⚠️ Failed to render entries. Check console for details.
        </div>
      );
    }
    return this.props.children;
  }
}

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

function ReviewFoldersAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.is_admin && !user.is_staff && !user.is_accounts) {
      navigate("/");
    }
  }, [user, navigate]);

  // Data states
  const [allFolders, setAllFolders] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentMap, setStudentMap] = useState(new Map());
  const [studentCourseMap, setStudentCourseMap] = useState(new Map());
  const [mentorsList, setMentorsList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorLogs, setErrorLogs] = useState([]);
  const errorLogsRef = useRef([]);
  const hasFetched = useRef(false);

  // UI states
  const [selectedBatchName, setSelectedBatchName] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [folderSearchTerm, setFolderSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [creatingWeek, setCreatingWeek] = useState(false);

  // Editing states for entries
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Helper functions
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

  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  // API calls
  const getWorkDocForWeek = async (studentId, weekNumber) => {
    try {
      const modulesRes = await API.get(`/modules/student-modules/?student_id=${studentId}`);
      const modules = modulesRes.data.results || modulesRes.data;
      const theModule = modules.find(m => m.order === weekNumber);
      if (theModule && theModule.work_document_url) return theModule.work_document_url;
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

  const getDefaultReviewSheetFromModule = async (studentId, weekNumber) => {
    try {
      const modulesRes = await API.get(`/modules/student-modules/?student_id=${studentId}`);
      const modules = modulesRes.data.results || modulesRes.data;
      const theModule = modules.find(m => m.order === weekNumber);
      
      if (theModule?.review_sheet_template) {
        return theModule.review_sheet_template;
      }
      
      if (theModule?.content) {
        const urlMatch = theModule.content.match(/https?:\/\/[^\s]+(?:\.xlsx|\.xls|\.pdf|\.docx?)/i);
        if (urlMatch) return urlMatch[0];
      }
      
      return "";
    } catch (err) {
      console.error("Error getting default review sheet:", err);
      return "";
    }
  };

  // FIXED: Skip week-review API call since it doesn't exist
  const ensureWeekReviewExists = async (studentId, weekNumber, reviewSheetUrl = "") => {
    // The week-review endpoint doesn't exist, so just return true
    console.log(`Week review creation skipped for student ${studentId}, week ${weekNumber}`);
    return true;
  };

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students/");
      const studentsList = (res.data.results || res.data).map(s => {
        let mentorId = null;
        if (s.mentor) {
          if (typeof s.mentor === 'object' && s.mentor.id) mentorId = s.mentor.id;
          else if (typeof s.mentor === 'number') mentorId = s.mentor;
          else if (typeof s.mentor === 'string' && !isNaN(parseInt(s.mentor))) mentorId = parseInt(s.mentor);
        }
        if (mentorId === null && s.mentor_id) mentorId = s.mentor_id;
        return {
          ...s,
          displayName: s.full_name || s.name || s.username || `Student ${s.id}`,
          currentCourse: s.course_name || s.course || s.program || "—",
          mentor_id: mentorId,
          batch_name: s.batch_name || s.batch,
        };
      });
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

  const fetchMentors = async () => {
    try {
      const res = await API.get("/mentors/");
      setMentorsList(res.data.results || res.data);
    } catch (err) {
      addErrorLog(err, { api: "/mentors/" });
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await API.get("batches/");
      let batchesArray = [];
      if (Array.isArray(res.data)) {
        batchesArray = res.data;
      } else if (res.data && Array.isArray(res.data.results)) {
        batchesArray = res.data.results;
      }
      setBatchesList(batchesArray);
    } catch (err) {
      addErrorLog(err, { api: "batches/" });
      showToast("Failed to load batches", "error");
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
      Promise.all([fetchStudents(), fetchMentors(), fetchBatches(), fetchAllFolders()]);
    }
  }, []);

  // Group batches directly by batch name from students
  const batchGroups = React.useMemo(() => {
    const groups = new Map();
    
    students.forEach(student => {
      const batchName = student.batch_name;
      if (!batchName) return;
      
      if (!groups.has(batchName)) {
        groups.set(batchName, {
          batchName,
          studentIds: [],
          studentNames: [],
          totalStudents: 0,
          mentorName: null,
          mentorId: null
        });
      }
      
      const group = groups.get(batchName);
      group.studentIds.push(student.id);
      group.studentNames.push(student.displayName);
      group.totalStudents = group.studentIds.length;
      
      if (student.mentor_id && !group.mentorName) {
        const mentor = mentorsList.find(m => m.id === student.mentor_id);
        if (mentor) {
          group.mentorName = mentor.full_name || mentor.username;
          group.mentorId = student.mentor_id;
        }
      }
    });
    
    batchesList.forEach(batch => {
      if (!groups.has(batch.name)) {
        groups.set(batch.name, {
          batchName: batch.name,
          studentIds: [],
          studentNames: [],
          totalStudents: 0,
          mentorName: null,
          mentorId: null
        });
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => a.batchName.localeCompare(b.batchName));
  }, [students, mentorsList, batchesList]);

  const filteredBatchGroups = batchGroups.filter(group =>
    group.batchName.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
    (group.mentorName && group.mentorName.toLowerCase().includes(batchSearchTerm.toLowerCase()))
  );

  const getStudentsInBatchByName = (batchName) => {
    return students.filter(s => s.batch_name === batchName);
  };

  const getFoldersForBatch = () => {
    if (!selectedBatchName) return [];
    
    const studentsInBatch = getStudentsInBatchByName(selectedBatchName);
    const studentIds = new Set(studentsInBatch.map(s => s.id));
    
    const folderMap = new Map();
    allFolders.forEach(f => {
      if (studentIds.has(f.student) && f.week_folder) {
        if (!folderMap.has(f.week_folder)) {
          folderMap.set(f.week_folder, {
            name: f.week_folder,
            type: "Folder",
            people: f.created_by?.username || "Admin",
            modified: f.review_date,
            source: "Review",
            entries: [],
          });
        }
        const folder = folderMap.get(f.week_folder);
        folder.entries.push(f);
        if (f.review_date > folder.modified) folder.modified = f.review_date;
      }
    });
    
    return Array.from(folderMap.values())
      .filter(folder => folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
  };

  const allFoldersAggregated = () => {
    const folderMap = allFolders
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
    return Object.values(folderMap)
      .filter(folder => folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
  };

  const foldersToShow = selectedBatchName === null ? allFoldersAggregated() : getFoldersForBatch();

  const editFolder = async (oldName) => {
    const newName = prompt("Enter new folder name:", oldName);
    if (!newName || newName.trim() === "" || newName === oldName) return;
    const folderData = foldersToShow.find(f => f.name === oldName);
    const entries = folderData?.entries || [];
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
    const folderData = foldersToShow.find(f => f.name === folderName);
    const entries = folderData?.entries || [];
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

  const handleAddWeekForBatch = async (folderName, reviewDate, selectedStudentIds) => {
    setCreatingWeek(true);
    let successCount = 0;
    let errorCount = 0;
    
    for (const studentId of selectedStudentIds) {
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
          if (previousCourse && previousCourse !== currentCourse) courseChanged = true;
        }
        
        let newWeek = courseChanged ? 1 : maxWeek + 1;
        
        const workDocUrl = await getWorkDocForWeek(studentId, newWeek);
        let reviewSheetValue = previousReviewSheet;
        if (!reviewSheetValue) {
          const moduleDefault = await getDefaultReviewSheetFromModule(studentId, newWeek);
          reviewSheetValue = moduleDefault || DEFAULT_REVIEW_SHEET_URL;
        }
        
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
        
        // Skip week-review API call - it doesn't exist
        successCount++;
        
      } catch (err) {
        errorCount++;
        addErrorLog(err, { action: "handleAddWeekForBatch", studentId, folderName });
      }
    }
    
    showToast(`Created ${successCount} entries for "${folderName}" (${errorCount} failed)`, successCount > 0 ? "success" : "error");
    setShowAddWeekModal(false);
    await fetchAllFolders();
    if (selectedFolder === folderName) setSelectedFolder(folderName);
    else if (!selectedFolder) setSelectedFolder(null);
    setCreatingWeek(false);
  };

  const handleFolderClick = (folderName, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedFolder(folderName);
  };

  const getCurrentEntries = () => {
    if (!selectedFolder) return [];
    const folderData = foldersToShow.find(f => f.name === selectedFolder);
    if (!folderData) return [];
    let entries = folderData.entries;
    if (selectedBatchName !== null) {
      const studentIdsInBatch = new Set(getStudentsInBatchByName(selectedBatchName).map(s => s.id));
      entries = entries.filter(e => studentIdsInBatch.has(e.student));
    }
    return entries;
  };

  const currentEntries = getCurrentEntries();

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value === "" ? null : value }));
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
    const entry = currentEntries.find(e => e.id === id);
    if (!entry) return;
    const oldExpert = entry.industry_expert;
    const newExpert = editData.industry_expert;
    const studentName = studentMap.get(entry.student) || entry.student_name || "a student";
    const folderName = selectedFolder || entry.week_folder || "review folder";
    const payload = {};
    if (editData.review_date && editData.review_date.trim() !== "") payload.review_date = editData.review_date;
    let weekValue = entry.week;
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

  const toggleDone = async (id, newValue) => {
    const entry = currentEntries.find(e => e.id === id);
    if (!entry) return;
    try {
      await API.patch(`/review-folders/${id}/`, { is_done: newValue });
      
      if (newValue === true && entry.week && entry.week !== "0" && entry.student) {
        try {
          await API.patch(`/students/${entry.student}/`, { last_reviewed_week: entry.week });
        } catch (updateErr) {
          console.warn("Could not update student last_reviewed_week:", updateErr);
        }
      }
      
      await fetchAllFolders();
      showToast(`Status updated to ${newValue ? "Completed" : "Pending"}.`, "success");
    } catch (err) {
      console.error("Toggle done error:", err);
      addErrorLog(err, { action: "toggleDone", id, newValue });
      showToast("Failed to update status. Please try again.", "error");
    }
  };

  const renderLink = (url, label = "Link") => {
    if (!url) return "—";
    const isUrl = /^(https?:\/\/|www\.)/i.test(url);
    if (isUrl) {
      return <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline break-all">{label}</a>;
    }
    return <span className="text-gray-700 break-all">{url}</span>;
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  const EditIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
  const DeleteIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
  const SaveIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>);
  const CancelIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Review Folders (Admin)</h1>
              <p className="text-gray-500 text-xs sm:text-sm">
                {selectedFolder
                  ? `Showing entries for "${selectedFolder}"`
                  : selectedBatchName !== null
                  ? `Batch ${selectedBatchName}`
                  : "Select a batch"}
              </p>
            </div>
            {(selectedBatchName !== null || selectedFolder) && (
              <button
                onClick={() => {
                  setSelectedFolder(null);
                  setSelectedBatchName(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
              >
                ← Back to Batches
              </button>
            )}
          </div>

          {selectedBatchName === null && !selectedFolder && (
            <>
              <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📊</div>
                  <div>
                    <div className="text-sm text-gray-500">Total Students</div>
                    <div className="text-2xl font-bold text-gray-800">{students.length}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Search batches by name (B1, B2...) or mentor name..."
                  value={batchSearchTerm}
                  onChange={(e) => setBatchSearchTerm(e.target.value)}
                  className="w-full sm:w-80 border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredBatchGroups.map((group) => (
                  <div
                    key={group.batchName}
                    onClick={() => setSelectedBatchName(group.batchName)}
                    className="cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-4"
                  >
                    <div className="text-2xl mb-2">👥</div>
                    <div className="text-lg font-semibold text-gray-800">{group.batchName}</div>
                    <div className="text-sm text-gray-500 mt-1">{group.totalStudents} students</div>
                    <div className="text-xs text-gray-400 mt-1">
                      👤 {group.mentorName || "No mentor assigned"}
                    </div>
                  </div>
                ))}
                {filteredBatchGroups.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    No batches match your search.
                  </div>
                )}
              </div>
            </>
          )}

          {selectedBatchName !== null && !selectedFolder && (
            <>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  Batch {selectedBatchName}
                </h2>
                <button
                  onClick={() => setShowAddWeekModal(true)}
                  disabled={getStudentsInBatchByName(selectedBatchName).length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Week Folder
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Search folders..."
                    value={folderSearchTerm}
                    onChange={(e) => setFolderSearchTerm(e.target.value)}
                    className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
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
                    {foldersToShow.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                          No week folders yet. Click '+ Add Week Folder'.
                        </td>
                      </tr>
                    ) : (
                      foldersToShow.map(folder => (
                        <tr key={folder.name} className="hover:bg-gray-50 cursor-pointer" onClick={(e) => handleFolderClick(folder.name, e)}>
                          <td className="px-4 py-3 text-sm text-blue-600">📁 {folder.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">Folder</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{folder.people}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{folder.modified}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{folder.source}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <button onClick={(e) => { e.stopPropagation(); editFolder(folder.name); }} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.name); }} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedFolder && (
            <div>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <button onClick={() => setSelectedFolder(null)} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm">← Back to folders</button>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search student or week..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 border border-gray-300 rounded-lg px-3 py-1 text-sm"
                  />
                </div>
              </div>
              <SafeTable>
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
                      {currentEntries.filter(entry => {
                        if (!searchTerm && !selectedWeek) return true;
                        const matchesSearch = !searchTerm
                          || entry.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
                          || entry.week?.toString().toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesWeek = !selectedWeek || entry.week?.toString() === selectedWeek;
                        return matchesSearch && matchesWeek;
                      }).map(entry => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </SafeTable>
            </div>
          )}
        </div>
      </div>

      {selectedBatchName !== null && !selectedFolder && (
        <AddWeekModal
          isOpen={showAddWeekModal}
          onClose={() => setShowAddWeekModal(false)}
          batchStudents={getStudentsInBatchByName(selectedBatchName)}
          batchName={`Batch ${selectedBatchName}`}
          onCreate={handleAddWeekForBatch}
          creating={creatingWeek}
        />
      )}
    </>
  );
}

export default ReviewFoldersAdmin;