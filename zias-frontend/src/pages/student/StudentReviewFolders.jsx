import React, { useEffect, useState, useRef } from "react";
import API from "../../api/api";
import StudentSidebar from "../../components/StudentSidebar";

function StudentReviewFolders() {
  const [allFolders, setAllFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [folderSearchTerm, setFolderSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const isFetched = useRef(false);

  const renderLink = (url, label = "Link") => {
    if (!url) return "—";
    const isUrl = /^(https?:\/\/|www\.)/i.test(url);
    if (isUrl) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800 hover:underline break-all">
          {label}
        </a>
      );
    }
    return <span className="text-gray-700 break-all">{url}</span>;
  };

  useEffect(() => {
    if (isFetched.current) return;
    isFetched.current = true;
    fetchAllFolders();
  }, []);

  const fetchAllFolders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/review-folders/");
      setAllFolders(res.data);
    } catch (err) {
      setError("Failed to load your review folders.");
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

  if (loading) return <div className="text-center p-8 text-gray-500">Loading your review folders...</div>;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Review Folders</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">View your weekly review folders (read only)</p>
            </div>

            {!selectedFolder && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="relative max-w-xs">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search folders..."
                      value={folderSearchTerm}
                      onChange={(e) => setFolderSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    {folderSearchTerm && (
                      <button onClick={() => setFolderSearchTerm("")} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Responsive Folder Table - Mobile optimized */}
                <div className="block sm:hidden">
                  {folderList.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No folders found.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {folderList.map((folder) => (
                        <div
                          key={folder.name}
                          className="p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                          onClick={() => setSelectedFolder(folder.name)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">📁</span>
                                <span className="font-medium text-gray-900 text-sm">{folder.name}</span>
                              </div>
                              <div className="space-y-1 text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Type:</span>
                                  <span>Folder</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">People:</span>
                                  <span>{folder.people}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Modified:</span>
                                  <span>{folder.modified}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-16">Source:</span>
                                  <span>{folder.source}</span>
                                </div>
                              </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Folder Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">People</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {folderList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-gray-400">No folders found.</td>
                        </tr>
                      ) : (
                        folderList.map((folder) => (
                          <tr
                            key={folder.name}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedFolder(folder.name)}
                          >
                            <td className="px-6 py-4 text-sm text-emerald-600 hover:text-emerald-800">📁 {folder.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">Folder</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{folder.people}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{folder.modified}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{folder.source}</td>
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
                    <p className="text-gray-500 text-sm mt-1">
                      {filteredEntries.length} of {rawEntries.length} review{rawEntries.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by week..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          ✕
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedFolder(null)}
                      className="flex items-center justify-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back
                    </button>
                  </div>
                </div>

                {/* Responsive Entries Table - Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  {filteredEntries.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                      No matching entries found.
                    </div>
                  ) : (
                    filteredEntries.map((entry) => (
                      <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-100">
                          <div>
                            <h3 className="font-semibold text-gray-900">{entry.student_name || entry.student?.full_name || "—"}</h3>
                            <p className="text-xs text-gray-500">Week {entry.week || "—"}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.is_done ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {entry.is_done ? "Done" : "Pending"}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Review Date:</span>
                            <span className="text-gray-700">{entry.review_date || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Reviewer:</span>
                            <span className="text-gray-700">{entry.industry_expert || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Work Doc:</span>
                            <span className="text-gray-700">{renderLink(entry.work_documents, "View")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Meeting Link:</span>
                            <span className="text-gray-700">{renderLink(entry.meeting_link, "Join")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Start Time:</span>
                            <span className="text-gray-700">{entry.time_started || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">End Time:</span>
                            <span className="text-gray-700">{entry.time_ended || "—"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Entries Table */}
                <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Doc</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Link</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center py-8 text-gray-400">
                            No matching entries found.
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">{entry.student_name || entry.student?.full_name || "—"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{entry.week || "—"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{entry.review_date || "—"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{entry.industry_expert || "—"}</td>
                            <td className="px-6 py-4 text-sm">{renderLink(entry.work_documents, "Work Doc")}</td>
                            <td className="px-6 py-4 text-sm">{renderLink(entry.meeting_link, "Meeting")}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{entry.time_started || "—"}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{entry.time_ended || "—"}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${entry.is_done ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                {entry.is_done ? "Done" : "Pending"}
                              </span>
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
      </div>
    </div>
  );
}

export default StudentReviewFolders;