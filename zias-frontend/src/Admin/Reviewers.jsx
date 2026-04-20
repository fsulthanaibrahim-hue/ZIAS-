// src/Admin/Reviewers.jsx
import { useEffect, useState, useRef } from "react";
import API from "../api/api";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" 
    ? "bg-emerald-500/90" 
    : type === "error" 
    ? "bg-red-500/90" 
    : "bg-blue-500/90";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md text-white text-sm font-medium animate-in slide-in-from-top-2 max-w-[90vw] sm:max-w-md">
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

function Reviewers() {
  const [reviewers, setReviewers] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewingReviewer, setViewingReviewer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    department: "",
    qualification: "",
    experience: "",
    batch: "",
  });

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  // Ref to prevent double fetching in Strict Mode
  const initialFetchDone = useRef(false);

  const fetchReviewers = () => {
    API.get("reviewers/")
      .then(res => setReviewers(res.data))
      .catch(err => {
        console.error(err);
        showToast("Failed to load reviewers", "error");
      });
  };

  const fetchBatches = () => {
    API.get("batches/")
      .then(res => setBatchesList(res.data))
      .catch(() => showToast("Failed to load batches", "error"));
  };

  // Combined initial fetch – runs only once thanks to the ref
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchReviewers();
    fetchBatches();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure?")) {
      API.delete(`reviewers/${id}/`)
        .then(() => {
          fetchReviewers();
          showToast("Reviewer deleted successfully", "success");
        })
        .catch(err => {
          console.error(err);
          showToast("Failed to delete reviewer", "error");
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      username: formData.username,
      email: formData.email,
      department: formData.department,
      qualification: formData.qualification || null,
      experience: formData.experience || null,
      batch: formData.batch || null,
    };
    try {
      if (editingId) {
        await API.patch(`reviewers/${editingId}/`, payload);
        showToast("Reviewer updated successfully", "success");
      } else {
        await API.post("reviewers/", payload);
        showToast("Reviewer added successfully", "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ username: "", email: "", department: "", qualification: "", experience: "", batch: "" });
      fetchReviewers();
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.username 
          ? error.response.data.username 
          : Object.values(error.response.data).flat().join(", ");
        showToast(`Error: ${errorMsg}`, "error");
        console.error(error.response.data);
      } else {
        showToast(error.message, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (reviewer) => {
    setEditingId(reviewer.id);
    setFormData({
      username: reviewer.username,
      email: reviewer.email,
      department: reviewer.department,
      qualification: reviewer.qualification || "",
      experience: reviewer.experience || "",
      batch: reviewer.batch || "",
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredReviewers = reviewers.filter(r =>
    r.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalFiltered = filteredReviewers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReviewers = filteredReviewers.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const inputClass = `
    w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-[#e6edf3]
    placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/30
    transition-all duration-200 text-sm
  `;
  const readOnlyClass = `
    w-full bg-[#0d1117]/50 border border-[#30363d]/50 rounded-lg px-4 py-2.5 text-[#7d8590]
    cursor-not-allowed text-sm
  `;

  const getInitials = (name) => (name || "?")[0].toUpperCase();
  const avatarColors = [
    "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700", "from-amber-500 to-amber-700",
    "from-rose-500 to-rose-700", "from-cyan-500 to-cyan-700",
  ];
  const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  const getBatchName = (batchId) => {
    const batch = batchesList.find(b => b.id === batchId);
    return batch ? batch.name : "—";
  };

  return (
    <div className="min-h-screen w-full bg-[#0d1117] text-[#e6edf3]">
      <style>{`
        .table-row-hover:hover { background: rgba(56,139,253,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
        @keyframes slide-in-from-top-2 {
          from { opacity:0; transform:translateY(-1rem); }
          to { opacity:1; transform:translateY(0); }
        }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
        /* Mobile card layout for small screens */
        @media (max-width: 640px) {
          .reviewer-table thead { display: none; }
          .reviewer-table tbody tr { display: block; margin-bottom: 1rem; border: 1px solid #21262d; border-radius: 0.75rem; background: #0d1117; }
          .reviewer-table tbody td { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #21262d; text-align: right; }
          .reviewer-table tbody td:last-child { border-bottom: none; }
          .reviewer-table tbody td::before { content: attr(data-label); font-weight: 600; color: #7d8590; margin-right: 1rem; text-align: left; flex: 1; }
          .reviewer-table tbody td .action-buttons { margin-left: auto; display: flex; gap: 0.5rem; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">

        {/* Top Bar - Responsive stacking */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Reviewers</h1>
              <p className="text-[#7d8590] text-xs mt-0.5">
                {reviewers.length} total · {filteredReviewers.length} shown
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search - full width on mobile */}
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search reviewers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/20 transition-all text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#7d8590] transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Add Button - full width on mobile */}
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ username: "", email: "", department: "", qualification: "", experience: "", batch: "" });
                setShowForm(true);
              }}
              className="shine flex items-center justify-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-[#238636]/20 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Reviewer
            </button>
          </div>
        </div>

        {/* Add/Edit Modal - fully responsive */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md p-4"
            onClick={() => setShowForm(false)}
          >
            <form
              onSubmit={handleSubmit}
              className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-md border border-[#30363d] shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-[#161b22] z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-[#21262d]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#e6edf3]">{editingId ? "Edit Reviewer" : "New Reviewer"}</h3>
                    <p className="text-[#7d8590] text-xs">{editingId ? "Update reviewer information" : "Add a new reviewer to the system"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-[#484f58] hover:text-[#7d8590] transition p-1.5 rounded-lg hover:bg-[#21262d]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Username</label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Qualification</label>
                  <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} className={inputClass} placeholder="e.g. B.Tech, MBA" />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Experience (years)</label>
                  <input type="text" name="experience" value={formData.experience} onChange={handleChange} className={inputClass} placeholder="e.g. 5 years" />
                </div>
              </div>

              <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-[#21262d]">
                <button type="submit" disabled={submitting} className="flex-1 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white py-2 rounded-lg transition-all text-sm font-medium shadow-md shadow-[#238636]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Save Changes" : "Add Reviewer")}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] py-2 rounded-lg transition-all text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviewers Table / Card Layout with Pagination */}
        <div className="overflow-hidden rounded-xl border border-[#21262d] shadow-xl shadow-black/20">
          <table className="reviewer-table min-w-full">
            <thead className="bg-[#161b22] border-b border-[#21262d]">
              <tr>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Reviewer</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Department</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {paginatedReviewers.length > 0 ? (
                paginatedReviewers.map((r) => (
                  <tr key={r.id} className="table-row-hover transition-colors duration-150 group">
                    <td data-label="Reviewer" className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(r.username)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {getInitials(r.username)}
                        </div>
                        <button
                          onClick={() => setViewingReviewer(r)}
                          className="text-[#e6edf3] text-sm font-medium hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          {r.username}
                        </button>
                      </div>
                    </td>
                    <td data-label="Email" className="px-4 py-3 text-[#7d8590] text-sm font-mono break-all">
                      {r.email}
                    </td>
                    <td data-label="Department" className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-medium px-2 py-1 rounded-full">
                        {r.department}
                      </span>
                    </td>
                    <td data-label="Actions" className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(r)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 border border-transparent hover:border-[#388bfd]/20 transition-all text-xs font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-xs font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-12 sm:py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-[#7d8590] text-sm font-medium">
                        {searchTerm ? "No reviewers match your search" : "No reviewers yet"}
                      </p>
                      <p className="text-[#484f58] text-xs">
                        {searchTerm ? "Try a different keyword" : "Click 'Add Reviewer' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalFiltered > 0 && (
            <div className="bg-[#161b22] border-t border-[#21262d] px-4 py-3 flex flex-col sm:flex-row justify-between gap-3 items-center">
              <div className="text-[#484f58] text-xs">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered} reviewers
              </div>
              <div className="flex gap-1 flex-wrap justify-center">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-[#484f58] text-[#7d8590] hover:bg-[#21262d] disabled:hover:bg-transparent">←</button>
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? <span key={idx} className="px-2 py-1.5 text-[#484f58]">...</span> : (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === page ? "bg-[#388bfd] text-white shadow-md shadow-[#388bfd]/20" : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}>{page}</button>
                  )
                )}
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-[#484f58] text-[#7d8590] hover:bg-[#21262d] disabled:hover:bg-transparent">→</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal - fully responsive */}
      {viewingReviewer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md p-4" onClick={() => setViewingReviewer(null)}>
          <div className="bg-[#161b22] rounded-2xl w-full max-w-2xl border border-[#30363d] shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#161b22] z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-[#21262d]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#e6edf3]">Reviewer Details</h3>
                  <p className="text-[#7d8590] text-xs">View all information</p>
                </div>
              </div>
              <button type="button" onClick={() => setViewingReviewer(null)} className="text-[#484f58] hover:text-[#7d8590] transition p-1.5 rounded-lg hover:bg-[#21262d]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 sm:px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Username</label><input type="text" value={viewingReviewer.username || ""} readOnly className={readOnlyClass} /></div>
                <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Email</label><input type="text" value={viewingReviewer.email || ""} readOnly className={readOnlyClass} /></div>
                <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Department</label><input type="text" value={viewingReviewer.department || ""} readOnly className={readOnlyClass} /></div>
                <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Qualification</label><input type="text" value={viewingReviewer.qualification || "—"} readOnly className={readOnlyClass} /></div>
                <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Experience</label><input type="text" value={viewingReviewer.experience || "—"} readOnly className={readOnlyClass} /></div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-[#161b22] px-4 sm:px-6 py-4 border-t border-[#21262d] flex justify-end">
              <button onClick={() => setViewingReviewer(null)} className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] px-5 py-2 rounded-lg transition-all text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviewers;