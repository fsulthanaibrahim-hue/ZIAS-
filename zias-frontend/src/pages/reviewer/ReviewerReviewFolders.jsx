// src/pages/reviewer/ReviewerReviewFolders.jsx – safe version with error handling
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function ReviewerReviewFolders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allFolders, setAllFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [folderSearchTerm, setFolderSearchTerm] = useState("");
  const [entriesSearchTerm, setEntriesSearchTerm] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const prevReviewSheets = useRef({});

  useEffect(() => {
    if (user && !user.is_reviewer) {
      navigate("/");
      return;
    }
    fetchFolders();
    const interval = setInterval(() => fetchFolders(true), 30000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchFolders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const reviewerName = user?.full_name || user?.username;
      const res = await API.get(`/review-folders/?industry_expert=${encodeURIComponent(reviewerName)}`);
      const newFolders = res.data;
      const newSheets = {};
      newFolders.forEach(f => { newSheets[f.id] = f.review_sheet; });
      for (const id in newSheets) {
        const old = prevReviewSheets.current[id];
        const newVal = newSheets[id];
        if (old !== undefined && old !== newVal && newVal) {
          const studentName = newFolders.find(f => f.id === id)?.student_name || "A student";
          setToast({ message: `📄 Review sheet updated for ${studentName}`, id: Date.now() });
          setTimeout(() => setToast(null), 5000);
        }
      }
      prevReviewSheets.current = newSheets;
      setAllFolders(newFolders);
    } catch (err) {
      console.error(err);
      if (!silent) setError("Failed to load folders.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Build folders map (same as before)
  const foldersMap = allFolders
    .filter(f => f.week_folder)
    .reduce((acc, f) => {
      const name = f.week_folder;
      if (!acc[name]) {
        acc[name] = {
          name,
          type: "Folder",
          people: f.created_by?.username || "Reviewer",
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

  const renderLink = (url, label) => {
    if (!url) return "—";
    return /^https?:\/\//i.test(url) ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">{label}</a>
    ) : (
      <span className="break-all">{url}</span>
    );
  };

  // Safe click handlers
  const handleFolderClick = (folderName, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFolder(folderName);
  };

  const handleBackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFolder(null);
  };

  // Error fallback UI – prevents component crash
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  // Loading state
  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow text-sm">
          {toast.message}
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-800">My Review Folders</h1>
      <p className="text-gray-500 text-sm mb-4">Read‑only – click a folder to view entries.</p>

      {!selectedFolder ? (
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
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-400">No folders found.</td>
                </tr>
              ) : (
                folderList.map((folder) => (
                  <tr
                    key={folder.name}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => handleFolderClick(folder.name, e)}
                  >
                    <td className="px-4 py-3 text-sm text-blue-600">📁 {folder.name}</td>
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
        <div>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <button onClick={handleBackClick} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm">
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Doc</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Sheet</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-400">No entries found.</td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.student_name || entry.student?.full_name || "—"}</td>
                      <td className="px-4 py-3 text-sm">Week {entry.week}</td>
                      <td className="px-4 py-3 text-sm">{entry.review_date || "—"}</td>
                      <td className="px-4 py-3 text-sm">{entry.time_started || "—"}</td>
                      <td className="px-4 py-3 text-sm">{entry.time_ended || "—"}</td>
                      <td className="px-4 py-3 text-sm">{renderLink(entry.work_documents, "Doc")}</td>
                      <td className="px-4 py-3 text-sm">{renderLink(entry.review_sheet, "Sheet")}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.is_done ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {entry.is_done ? "Completed" : "Pending"}
                        </span>
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

export default ReviewerReviewFolders;