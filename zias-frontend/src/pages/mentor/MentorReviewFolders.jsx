// src/pages/mentor/MentorReviewFolders.jsx
import React, { useEffect, useState } from "react";
import API from "../../api/api";

function MentorReviewFolders() {
  const [allFolders, setAllFolders] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    week_folder: "",
    review_date: "",
    students: [],
  });

  const industryExperts = ["Akif Sir", "Rizan Sir", "Prameesh Sir", "Aleema Ma'am"];

  const renderLink = (url, label = "Link") => {
    if (!url) return "—";
    const isUrl = /^(https?:\/\/|www\.)/i.test(url);
    if (isUrl) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
          {label}
        </a>
      );
    }
    return <span className="text-gray-700">{url}</span>;
  };

  useEffect(() => {
    fetchStudents();
    fetchAllFolders();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students/");
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  const fetchAllFolders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/review-folders/");
      setAllFolders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
  const folderList = Object.values(foldersMap).sort((a, b) => new Date(b.modified) - new Date(a.modified));

  const displayedEntries = selectedFolder ? foldersMap[selectedFolder]?.entries || [] : [];

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

  const createMultipleEntries = async (e) => {
    e.preventDefault();
    if (!createForm.week_folder || !createForm.review_date || createForm.students.length === 0) {
      alert("Please fill folder name, review date and select at least one student.");
      return;
    }
    setCreating(true);
    try {
      for (const studentId of createForm.students) {
        await API.post("/review-folders/", {
          student: studentId,
          week_folder: createForm.week_folder,
          week: "",
          review_date: createForm.review_date,
          work_documents: "",
          industry_expert: "",
          meeting_link: "",
          review_sheet: "",
        });
      }
      alert(`Created ${createForm.students.length} entries for folder "${createForm.week_folder}".`);
      setCreateForm({ week_folder: "", review_date: "", students: [] });
      setShowCreateForm(false);
      await fetchAllFolders();
      setSelectedFolder(createForm.week_folder);
    } catch (err) {
      console.error(err);
      let errorMsg = "Error creating entries.";
      if (err.response && err.response.data) errorMsg = JSON.stringify(err.response.data);
      alert(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditData({
      week: entry.week,
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

  const saveEdit = async (id) => {
    try {
      await API.patch(`/review-folders/${id}/`, editData);
      await fetchAllFolders();
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Failed to update.");
    }
  };

  const deleteEntry = async (id) => {
    if (window.confirm("Delete this entry?")) {
      await API.delete(`/review-folders/${id}/`);
      await fetchAllFolders();
    }
  };

  const deleteFolder = async (folderName) => {
    if (!window.confirm(`Delete folder "${folderName}" and all its entries? This cannot be undone.`)) return;
    const entries = foldersMap[folderName]?.entries || [];
    for (const entry of entries) {
      await API.delete(`/review-folders/${entry.id}/`);
    }
    if (selectedFolder === folderName) setSelectedFolder(null);
    await fetchAllFolders();
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  // SVG Icons (matching Students.jsx)
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Review Folders</h1>
            <p className="text-gray-500 text-sm">Organise weekly reviews like a file manager</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {showCreateForm ? "Cancel" : "+ New Week Folder"}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Create New Week Folder</h2>
            <form onSubmit={createMultipleEntries} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Folder Name (e.g., April 4th Week)</label>
                <input
                  name="week_folder"
                  value={createForm.week_folder}
                  onChange={handleCreateChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., April 4th Week"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Review Date</label>
                <input
                  name="review_date"
                  type="date"
                  value={createForm.review_date}
                  onChange={handleCreateChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Students</label>
                <div className="mb-2">
                  <button type="button" onClick={selectAllStudents} className="text-xs bg-gray-200 px-2 py-1 rounded">Select All</button>
                </div>
                <select
                  multiple
                  size={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={createForm.students}
                  onChange={handleStudentSelection}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.username}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Hold Ctrl (Cmd) to select multiple students.</p>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                  {creating ? "Creating..." : `Create Entries (${createForm.students.length} selected)`}
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Folder List View */}
        {!selectedFolder && (
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
              <tbody className="divide-y divide-gray-100">
                {folderList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                      No folders yet. Click "+ New Week Folder" to create one.
                    </td>
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
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteFolder(folder.name); }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete folder"
                        >
                          <DeleteIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Entries Table for Selected Folder */}
        {selectedFolder && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">📁 {selectedFolder}</h2>
                <p className="text-gray-500 text-sm">
                  {displayedEntries.length} student{displayedEntries.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedFolder(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                ← Back to Folders
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Document</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry Expert</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meet Link</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Remarks</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedEntries.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-400">
                        No entries in this folder.
                      </td>
                    </tr>
                  ) : (
                    displayedEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.review_date}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.student_name}</td>
                        <td className="px-4 py-3 text-sm">
                          {editingId === entry.id ? (
                            <input name="week" value={editData.week || ""} onChange={handleEditChange} className="border border-gray-300 rounded px-1 py-0.5 w-24" />
                          ) : (entry.week || "—")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {editingId === entry.id ? (
                            <input name="work_documents" value={editData.work_documents || ""} onChange={handleEditChange} className="border border-gray-300 rounded px-1 py-0.5 w-36" />
                          ) : renderLink(entry.work_documents, "Work Doc")}
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
                            <input name="meeting_link" value={editData.meeting_link || ""} onChange={handleEditChange} className="border border-gray-300 rounded px-1 py-0.5 w-32" />
                          ) : renderLink(entry.meeting_link, "Meet Link")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {editingId === entry.id ? (
                            <input name="review_sheet" value={editData.review_sheet || ""} onChange={handleEditChange} className="border border-gray-300 rounded px-1 py-0.5 w-40" />
                          ) : renderLink(entry.review_sheet, "Sheet")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.review_status === "Done" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {entry.review_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingId === entry.id ? (
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => saveEdit(entry.id)} className="text-green-600 hover:text-green-800 transition-colors" title="Save">
                                <SaveIcon />
                              </button>
                              <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 transition-colors" title="Cancel">
                                <CancelIcon />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-center">
                              <button onClick={() => startEdit(entry)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Edit">
                                <EditIcon />
                              </button>
                              <button onClick={() => deleteEntry(entry.id)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete">
                                <DeleteIcon />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MentorReviewFolders;