// src/pages/mentor/MentorReviewFolders.jsx
import React, { useEffect, useState, useRef } from "react";
import API from "../../api/api";

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
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2 max-w-[90vw] sm:max-w-md`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

function MentorReviewFolders() {
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
  const [createForm, setCreateForm] = useState({
    week_folder: "",
    review_date: "",
    students: [],
  });

  const industryExperts = ["Akif Sir", "Rizan Sir", "Prameesh Sir"];
  const hasFetched = useRef(false);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  const getWorkDocForWeek = async (week) => {
    const docs = {
      1: "https://docs.google.com/document/d/1_MODULE_1",
      2: "https://docs.google.com/document/d/2_MODULE_2",
      3: "https://docs.google.com/document/d/3_MODULE_3",
      4: "https://docs.google.com/document/d/4_MODULE_4",
      5: "https://docs.google.com/document/d/5_MODULE_5",
    };
    return docs[week] || "";
  };

  const renderLink = (url, label = "Link") => {
    if (!url) return "—";
    const isUrl = /^(https?:\/\/|www\.)/i.test(url);
    if (isUrl) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline break-all">
          {label}
        </a>
      );
    }
    return <span className="text-gray-700 break-all">{url}</span>;
  };

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students/");
      const studentsWithNames = res.data.map(s => ({
        ...s,
        displayName: s.full_name || s.name || s.username || `Student ${s.id}`,
        currentCourse: s.course_name || s.course || s.program || "—",
      }));
      setStudents(studentsWithNames);
      const nameMap = new Map();
      const courseMap = new Map();
      studentsWithNames.forEach(s => {
        nameMap.set(s.id, s.displayName);
        courseMap.set(s.id, s.currentCourse);
      });
      setStudentMap(nameMap);
      setStudentCourseMap(courseMap);
    } catch (err) {
      console.error("Failed to fetch students", err);
      showToast("Failed to load students", "error");
    }
  };

  const fetchAllFolders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/review-folders/");
      setAllFolders(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load folders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchStudents();
      fetchAllFolders();
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
    if (!searchTerm && !selectedWeek) return true;
    const matchesSearch = !searchTerm
      || entry.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
      || entry.week?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWeek = !selectedWeek || entry.week === selectedWeek;
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

  // ========== CORRECTED createMultipleEntries with numeric week parsing ==========
  const createMultipleEntries = async (e) => {
    e.preventDefault();
    if (!createForm.week_folder || !createForm.review_date || createForm.students.length === 0) {
      showToast("Please fill folder name, review date and select at least one student.", "error");
      return;
    }
    setCreating(true);
    try {
      for (const studentId of createForm.students) {
        // Get all reviews for THIS student only
        const studentReviews = allFolders.filter(f => f.student === studentId && f.week != null);
        console.log(`Student ${studentId} existing weeks:`, studentReviews.map(r => ({ id: r.id, week: r.week, type: typeof r.week })));
        
        let maxWeek = 0;
        let previousReviewSheet = "";
        if (studentReviews.length > 0) {
          // Convert week values to numbers (in case they are strings)
          const weeks = studentReviews.map(r => parseInt(r.week, 10)).filter(w => !isNaN(w));
          if (weeks.length > 0) {
            maxWeek = Math.max(...weeks);
            // Find the latest entry with that max week to copy review sheet
            const latest = studentReviews.find(r => parseInt(r.week, 10) === maxWeek);
            if (latest && latest.review_sheet) {
              previousReviewSheet = latest.review_sheet;
            }
          }
        }
        const newWeek = maxWeek + 1;
        console.log(`Creating week ${newWeek} for student ${studentId}, copying review sheet: "${previousReviewSheet}"`);
        
        const workDocUrl = await getWorkDocForWeek(newWeek);
        await API.post("/review-folders/", {
          student: studentId,
          week_folder: createForm.week_folder,
          week: newWeek,
          review_date: createForm.review_date,
          work_documents: workDocUrl,
          review_sheet: previousReviewSheet,
          industry_expert: "",
          meeting_link: "",
          is_done: false,
        });
      }
      showToast(`Created ${createForm.students.length} entries for folder "${createForm.week_folder}".`, "success");
      setCreateForm({ week_folder: "", review_date: "", students: [] });
      setShowCreateForm(false);
      await fetchAllFolders();
      setSelectedFolder(createForm.week_folder);
    } catch (err) {
      console.error(err);
      let errorMsg = "Error creating entries.";
      if (err.response && err.response.data) errorMsg = JSON.stringify(err.response.data);
      showToast(errorMsg, "error");
    } finally {
      setCreating(false);
    }
  };
  // =====================================================================

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
      const roomsRes = await API.get("chat-rooms/");
      const roomsWithNames = roomsRes.data.map(room => {
        let name = null;
        if (room.other_user_name) name = room.other_user_name;
        else if (room.other_user?.name) name = room.other_user.name;
        else if (room.other_user?.full_name) name = room.other_user.full_name;
        else if (room.other_user?.username) name = room.other_user.username;
        return { room, name };
      });
      let match = roomsWithNames.find(r => r.name === expertName);
      if (!match) match = roomsWithNames.find(r => r.name?.toLowerCase() === expertName.toLowerCase());
      if (!match) {
        const firstWord = expertName.split(" ")[0].toLowerCase();
        match = roomsWithNames.find(r => r.name?.toLowerCase().includes(firstWord));
      }
      if (!match && expertName === "Rizan Sir") {
        const aliases = ["Rizwan", "rizwan", "Rizan", "rizan"];
        for (const alias of aliases) {
          match = roomsWithNames.find(r => r.name?.toLowerCase() === alias.toLowerCase());
          if (match) break;
        }
      }
      if (!match) {
        const words = expertName.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length < 2) continue;
          match = roomsWithNames.find(r => r.name?.toLowerCase().includes(word));
          if (match) break;
        }
      }
      if (!match) {
        showToast(`No existing chat room with ${expertName}. Please start a conversation first.`, "error");
        return false;
      }
      await API.post("chat-messages/", {
        room: match.room.id,
        content: `📌 You have been assigned as industry expert for ${studentName}'s review in folder "${folderName}".`,
      });
      return true;
    } catch (chatErr) {
      console.error(`Failed to send chat message to ${expertName}`, chatErr);
      showToast(`Error sending message to ${expertName}`, "error");
      return false;
    }
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
      if (!isNaN(parsed) && parsed > 0) weekValue = parsed;
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
      console.error(err);
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
        console.error(err);
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
      console.error(err);
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
      console.error(err);
      showToast("Failed to delete folder.", "error");
    }
  };

  const toggleDone = async (id, newValue, e) => {
    if (e) e.preventDefault();
    const entry = rawEntries.find(e => e.id === id);
    if (!entry) return;
    try {
      await API.patch(`/review-folders/${id}/`, { is_done: newValue });
      if (newValue === true && entry.week && entry.week > 0 && entry.student) {
        try {
          await API.patch(`/students/${entry.student}/`, { last_reviewed_week: entry.week });
          console.log(`Student ${entry.student} last_reviewed_week updated to ${entry.week}`);
        } catch (updateErr) {
          console.error("Failed to update student last_reviewed_week", updateErr);
          showToast("Review marked done, but failed to update student week.", "error");
        }
      }
      await fetchAllFolders();
      showToast(`Status updated to ${newValue ? "Done" : "Pending"}.`, "success");
    } catch (err) {
      console.error(err);
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

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Review Folders</h1>
              <p className="text-gray-500 text-xs sm:text-sm">Organise weekly reviews like a file manager</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full sm:w-auto"
            >
              {showCreateForm ? "Cancel" : "+ New Week Folder"}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Create New Week Folder</h2>
              <form onSubmit={createMultipleEntries} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Folder Name (e.g., April 4th Week)</label>
                  <input type="text" name="week_folder" value={createForm.week_folder} onChange={handleCreateChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g., April 4th Week" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Review Date</label>
                  <input type="date" name="review_date" value={createForm.review_date} onChange={handleCreateChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Select Students</label>
                  <div className="mb-2">
                    <button type="button" onClick={selectAllStudents} className="text-xs bg-gray-200 px-2 py-1 rounded">Select All</button>
                  </div>
                  <select multiple size={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={createForm.students} onChange={handleStudentSelection}>
                    {students.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Hold Ctrl (Cmd) to select multiple students.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                    {creating ? "Creating..." : `Create Entries (${createForm.students.length} selected)`}
                  </button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {!selectedFolder && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search folders..."
                    value={folderSearchTerm}
                    onChange={(e) => setFolderSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  />
                  {folderSearchTerm && (
                    <button onClick={() => setFolderSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
                  )}
                </div>
              </div>
              <div className="min-w-[640px]">
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
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                          No folders found. Click "+ New Week Folder" to create one.
                        </td>
                      </tr>
                    ) : (
                      folderList.map(folder => (
                        <tr key={folder.name} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => setSelectedFolder(folder.name)}>
                            📁 {folder.name}
                          </td>
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
            </div>
          )}

          {selectedFolder && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">📁 {selectedFolder}</h2>
                  <p className="text-gray-500 text-sm">
                    {filteredEntries.length} of {rawEntries.length} student{rawEntries.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by student or week..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-56 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" title="Clear">✕</button>
                    )}
                  </div>
                  <button onClick={() => setSelectedFolder(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">← Back</button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <div className="min-w-[950px]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Course</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Document</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry Expert</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meet Link</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Sheet</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="px-4 py-8 text-center text-gray-400">No matching entries found.</td>
                        </tr>
                      ) : (
                        filteredEntries.map(entry => {
                          const courseName = studentCourseMap.get(entry.student) || "—";
                          return (
                            <tr key={entry.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {editingId === entry.id ? (
                                  <input type="date" name="review_date" value={editData.review_date || ""} onChange={handleEditChange} className="border border-gray-300 rounded px-1 py-0.5 w-32" />
                                ) : (entry.review_date || "—")}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {studentMap.get(entry.student) || entry.student_name || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{courseName}</td>
                              <td className="px-4 py-3 text-sm">
                                {editingId === entry.id ? (
                                  <input type="text" name="week" value={editData.week || ""} onChange={handleEditChange} className="border border-gray-300 rounded px-1 py-0.5 w-24" />
                                ) : (entry.week !== null && entry.week !== undefined ? entry.week : "—")}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {editingId === entry.id ? (
                                  <input type="text" name="work_documents" value={editData.work_documents || ""} onChange={handleEditChange} className="border border-gray-300 rounded px-1 py-0.5 w-48" placeholder="Module link" />
                                ) : renderLink(entry.work_documents, "Module")}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {editingId === entry.id ? (
                                  <select name="industry_expert" value={editData.industry_expert || ""} onChange={handleEditChange} className="border border-gray-300 rounded px-1 py-0.5">
                                    <option value="">—</option>
                                    {industryExperts.map(e => <option key={e} value={e}>{e}</option>)}
                                  </select>
                                ) : (entry.industry_expert || "—")}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {editingId === entry.id ? (
                                  <input type="text" name="meeting_link" value={editData.meeting_link || ""} onChange={handleEditChange} className="border border-gray-300 rounded px-1 py-0.5 w-32" />
                                ) : renderLink(entry.meeting_link, "Meet Link")}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {editingId === entry.id ? (
                                  <input type="text" name="review_sheet" value={editData.review_sheet || ""} onChange={handleEditChange} className="border border-gray-300 rounded px-1 py-0.5 w-40" />
                                ) : renderLink(entry.review_sheet, "Sheet")}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => toggleDone(entry.id, !entry.is_done, e)}
                                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors ${entry.is_done ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}`}
                                >
                                  {entry.is_done ? "Done" : "Pending"}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {editingId === entry.id ? (
                                  <div className="flex gap-2 justify-center">
                                    <button onClick={() => saveEdit(entry.id)} className="text-green-600 hover:text-green-800"><SaveIcon /></button>
                                    <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700"><CancelIcon /></button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2 justify-center">
                                    <button onClick={() => startEdit(entry)} className="text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                    <button onClick={() => deleteEntry(entry.id)} className="text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default MentorReviewFolders;