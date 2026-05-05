// src/pages/reviewer/ReviewerReviewFolders.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function ReviewerReviewFolders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const prevReviewSheets = useRef({});

  useEffect(() => {
    if (user && !user.is_reviewer) {
      navigate("/");
      return;
    }
    fetchFolders();
    const interval = setInterval(() => {
      fetchFolders(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchFolders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const reviewerName = user?.full_name || user?.username;
      const res = await API.get(`/review-folders/?industry_expert=${encodeURIComponent(reviewerName)}`);
      const newFolders = res.data;

      // detect review_sheet changes
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
      setFolders(newFolders);
    } catch (err) {
      console.error(err);
      if (!silent) setError("Failed to load folders.");
    } finally {
      if (!silent) setLoading(false);
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

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow text-sm">
          {toast.message}
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-800">My Review Folders</h1>
      <p className="text-gray-500 text-sm mb-4">Read‑only – you will be notified when a review sheet is updated.</p>
      <div className="bg-white rounded-xl border border-gray-200 shadow overflow-x-auto">
        <table className="min-w-[800px] w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Week Folder</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Week</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Review Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Start Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">End Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Work Doc</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Review Sheet</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {folders.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8 text-gray-400">No folders assigned to you.</td>
              </tr>
            ) : (
              folders.map((folder) => (
                <tr key={folder.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{folder.student_name || folder.student?.full_name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{folder.week_folder}</td>
                  <td className="px-4 py-3 text-sm">{folder.week}</td>
                  <td className="px-4 py-3 text-sm">{folder.review_date || "—"}</td>
                  <td className="px-4 py-3 text-sm">{folder.time_started || "—"}</td>
                  <td className="px-4 py-3 text-sm">{folder.time_ended || "—"}</td>
                  <td className="px-4 py-3 text-sm">{renderLink(folder.work_documents, "Doc")}</td>
                  <td className="px-4 py-3 text-sm">{renderLink(folder.review_sheet, "Sheet")}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${folder.is_done ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {folder.is_done ? "Completed" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReviewerReviewFolders;