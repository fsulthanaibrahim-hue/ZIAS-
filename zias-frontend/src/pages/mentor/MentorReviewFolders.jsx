import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function MentorReviewFolders() {
  const { user } = useAuth();
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

  useEffect(() => {
    if (!user) return;
    if (!user.is_mentor) {
      navigate("/");
      return;
    }
    fetchMentorFolders();
  }, [user, navigate]);

  const fetchMentorFolders = async () => {
    setLoading(true);
    try {
      // 1. Get all students under this mentor
      const studentsRes = await API.get(`/students/?mentor_id=${user.id}`);
      const studentIds = studentsRes.data.results?.map(s => s.id) || [];
      if (studentIds.length === 0) {
        setAllFolders([]);
        setLoading(false);
        return;
      }
      // 2. Fetch all review folders for those students
      const query = studentIds.map(id => `student_id=${id}`).join('&');
      const foldersRes = await API.get(`/review-folders/?${query}`);
      setAllFolders(foldersRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load review folders.");
    } finally {
      setLoading(false);
    }
  };

  // Build folder list (same as admin)
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

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditData({
      review_date: entry.review_date || "",
      week: entry.week || "",
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
      if (editData[key] !== (original[key] || "")) {
        payload[key] = editData[key];
      }
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
      console.error(err);
      alert("Update failed");
    }
  };

  const toggleDone = async (id, newValue) => {
    try {
      await API.patch(`/review-folders/${id}/`, { is_done: newValue });
      await fetchMentorFolders();
    } catch (err) {
      console.error(err);
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

  const inputClass = "border border-gray-300 rounded px-2 py-1 text-sm w-full";

  if (!user) return <div className="p-8 text-center">Loading user...</div>;
  if (loading) return <div className="p-8 text-center">Loading folders...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">My Students' Review Folders</h1>
      <p className="text-gray-500 text-sm mb-6">Click a folder to view/edit entries (same as admin).</p>

      {!selectedFolder ? (
        // Folder grid view
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
              </tr>
            </thead>
            <tbody>
              {folderList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-400">No folders found for your students.</td>
                </tr>
              ) : (
                folderList.map((folder) => (
                  <tr key={folder.name} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedFolder(folder.name)}>
                    <td className="px-4 py-3 text-sm text-blue-600 hover:underline">📁 {folder.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Folder</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{folder.people}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{folder.modified}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{folder.source}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // Entries table view
        <div>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
            >
              ← Back to all folders
            </button>
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
                {[...new Set(rawEntries.map(e => e.week))].sort().map(w => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Meeting Link</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Start Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">End Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Work Doc</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Review Sheet</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-4 py-8 text-center text-gray-400">No entries found.</td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.student_name || entry.student?.full_name || "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === entry.id ? (
                          <input type="number" name="week" value={editData.week} onChange={handleChange} className="w-20 border rounded px-2 py-1 text-sm" />
                        ) : (
                          `Week ${entry.week}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === entry.id ? (
                          <input type="date" name="review_date" value={editData.review_date} onChange={handleChange} className="w-32 border rounded px-2 py-1 text-sm" />
                        ) : (
                          entry.review_date || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === entry.id ? (
                          <input type="text" name="industry_expert" value={editData.industry_expert} onChange={handleChange} className="w-36 border rounded px-2 py-1 text-sm" />
                        ) : (
                          entry.industry_expert || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === entry.id ? (
                          <input type="url" name="meeting_link" value={editData.meeting_link} onChange={handleChange} className="w-36 border rounded px-2 py-1 text-sm" />
                        ) : (
                          renderLink(entry.meeting_link, "Meeting")
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === entry.id ? (
                          <input type="time" name="time_started" value={editData.time_started} onChange={handleChange} className="w-28 border rounded px-2 py-1 text-sm" />
                        ) : (
                          entry.time_started || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === entry.id ? (
                          <input type="time" name="time_ended" value={editData.time_ended} onChange={handleChange} className="w-28 border rounded px-2 py-1 text-sm" />
                        ) : (
                          entry.time_ended || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === entry.id ? (
                          <input type="url" name="work_documents" value={editData.work_documents} onChange={handleChange} className="w-36 border rounded px-2 py-1 text-sm" />
                        ) : (
                          renderLink(entry.work_documents, "Doc")
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === entry.id ? (
                          <input type="url" name="review_sheet" value={editData.review_sheet} onChange={handleChange} className="w-36 border rounded px-2 py-1 text-sm" />
                        ) : (
                          renderLink(entry.review_sheet, "Sheet")
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleDone(entry.id, !entry.is_done)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                            entry.is_done
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }`}
                        >
                          {entry.is_done ? "Completed" : "Pending"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingId === entry.id ? (
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => saveEdit(entry.id)} className="text-green-600 hover:text-green-800">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-800">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(entry)} className="text-blue-600 hover:text-blue-800">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
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
  );
}

export default MentorReviewFolders;