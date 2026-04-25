// src/pages/reviewer/ReviewerReviewFolders.jsx
import React, { useEffect, useState } from "react";
import API from "../../api/api";

function ReviewerReviewFolders() {
  const [allFolders, setAllFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [folderSearchTerm, setFolderSearchTerm] = useState("");
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchAllFolders();
  }, []);

  const fetchAllFolders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/review-folders/");
      setAllFolders(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load review folders.");
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

  const folderList = Object.values(foldersMap)
    .filter(folder => folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.modified) - new Date(a.modified));

  const rawEntries = selectedFolder ? foldersMap[selectedFolder]?.entries || [] : [];
  const uniqueWeeks = [...new Set(rawEntries.map(e => e.week).filter(w => w))].sort().reverse();
  const filteredEntries = rawEntries.filter(entry => {
    if (!searchTerm && !selectedWeek) return true;
    const matchesSearch = !searchTerm || 
      entry.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.week?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWeek = !selectedWeek || entry.week === selectedWeek;
    return matchesSearch && matchesWeek;
  });

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen w-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Review Folders (Read‑only)</h1>
          <p className="text-gray-500 text-xs sm:text-sm">View weekly review folders – no editing allowed</p>
        </div>

        {/* Folder list view */}
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
                  <button
                    onClick={() => setFolderSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
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
                  </tr>
                </thead>
                <tbody>
                  {folderList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                        No folders found.
                      </td>
                    </tr>
                  ) : (
                    folderList.map(folder => (
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
          </div>
        )}

        {/* Entries table (read‑only) */}
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
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button onClick={() => setSelectedFolder(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                  ← Back
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <div className="min-w-[800px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Doc</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry Expert</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meet Link</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Sheet</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                          No matching entries found.
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.review_date}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.student_name}</td>
                          <td className="px-4 py-3 text-sm">{entry.week || "—"}</td>
                          <td className="px-4 py-3 text-sm">{renderLink(entry.work_documents, "Work Doc")}</td>
                          <td className="px-4 py-3 text-sm">{entry.industry_expert || "—"}</td>
                          <td className="px-4 py-3 text-sm">{renderLink(entry.meeting_link, "Meet Link")}</td>
                          <td className="px-4 py-3 text-sm">{renderLink(entry.review_sheet, "Sheet")}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.is_done ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {entry.is_done ? "Done" : "Pending"}
                            </span>
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

export default ReviewerReviewFolders;