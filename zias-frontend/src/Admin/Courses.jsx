// src/Admin/Courses.jsx
import { useEffect, useState } from "react";
import API from "../api/api";

// Module-level flag to prevent double fetching in React Strict Mode
let initialDataFetched = false;

// Toast Component
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
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2 max-w-[90vw] sm:max-w-md`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

// Custom confirmation modal for delete
function ConfirmModal({ isOpen, onClose, onConfirm, courseName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md p-4">
      <div className="bg-[#161b22] rounded-2xl max-w-md w-full border border-[#30363d] shadow-2xl shadow-black/60 p-6 mx-4">
        <h3 className="text-lg font-semibold text-[#e6edf3] mb-2">Confirm Delete</h3>
        <p className="text-[#7d8590] mb-6">
          Are you sure you want to delete <span className="text-white font-medium">{courseName}</span>?<br />
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] hover:text-white transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Courses() {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({ name: "", description: "", duration: "" });

  // Delete confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  const fetchCourses = () => {
    API.get("courses/")
      .then(res => setCourses(res.data))
      .catch(() => showToast("Failed to load courses", "error"));
  };

  // Initial fetch – runs only once (module‑level flag prevents double call in Strict Mode)
  useEffect(() => {
    if (!initialDataFetched) {
      initialDataFetched = true;
      fetchCourses();
    }
  }, []);

  // No extra fetch when form opens – the list is already loaded

  const filteredCourses = courses.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.duration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalFiltered = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDeleteClick = (courseId, courseName) => {
    setCourseToDelete({ id: courseId, name: courseName });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await API.delete(`courses/${courseToDelete.id}/`);
      fetchCourses();
      showToast("Course deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete course", "error");
    } finally {
      setShowConfirmModal(false);
      setCourseToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.patch(`courses/${editingId}/`, formData);
        showToast("Course updated successfully", "success");
      } else {
        await API.post("courses/", formData);
        showToast("Course added successfully", "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", description: "", duration: "" });
      fetchCourses();
    } catch (err) {
      let errorMsg = "Error saving course";
      if (err.response?.data) {
        errorMsg = Object.values(err.response.data).flat().join(", ");
      }
      showToast(errorMsg, "error");
    }
  };

  const handleEdit = (course) => {
    setEditingId(course.id);
    setFormData({ name: course.name, description: course.description || "", duration: course.duration || "" });
    setShowForm(true);
  };

  const inputClass = `
    w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-[#e6edf3]
    placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/30
    transition-all duration-200 text-sm
  `;

  const CourseIcon = () => (
    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  return (
    <div className="min-h-screen w-full bg-[#0d1117] text-[#e6edf3]" style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');
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
        /* Mobile card layout */
        @media (max-width: 640px) {
          .courses-table thead { display: none; }
          .courses-table tbody tr { display: block; margin-bottom: 1rem; border: 1px solid #21262d; border-radius: 0.75rem; background: #0d1117; }
          .courses-table tbody td { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #21262d; text-align: right; gap: 1rem; }
          .courses-table tbody td:last-child { border-bottom: none; }
          .courses-table tbody td::before { content: attr(data-label); font-weight: 600; color: #7d8590; text-align: left; flex: 1; }
          .courses-table tbody td .action-buttons { margin-left: auto; display: flex; gap: 0.5rem; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} courseName={courseToDelete?.name} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">

        {/* Top Bar - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <CourseIcon />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Courses</h1>
              <p className="text-[#7d8590] text-xs mt-0.5">
                {courses.length} total · {filteredCourses.length} shown
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
                placeholder="Search courses..."
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
                setFormData({ name: "", description: "", duration: "" });
                setShowForm(true);
              }}
              className="shine flex items-center justify-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-[#238636]/20 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Course
            </button>
          </div>
        </div>

        {/* Modal - Responsive */}
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
                    <CourseIcon />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#e6edf3]">{editingId ? "Edit Course" : "New Course"}</h3>
                    <p className="text-[#7d8590] text-xs">{editingId ? "Update course details" : "Create a new course"}</p>
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
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Course Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Full Stack Development"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    placeholder="e.g. 6 months"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea
                    name="description"
                    placeholder="Course description..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="flex-1 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white py-2 rounded-lg transition-all text-sm font-medium shadow-md shadow-[#238636]/20">
                  {editingId ? "Save Changes" : "Add Course"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] py-2 rounded-lg transition-all text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Courses Table with responsive card layout and pagination */}
        <div className="overflow-hidden rounded-xl border border-[#21262d] shadow-xl shadow-black/20">
          <table className="courses-table min-w-full">
            <thead className="bg-[#161b22] border-b border-[#21262d]">
              <tr>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Course</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Duration</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Description</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {paginatedCourses.length > 0 ? (
                paginatedCourses.map((c) => (
                  <tr key={c.id} className="table-row-hover transition-colors duration-150 group">
                    <td data-label="Course" className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                          <CourseIcon />
                        </div>
                        <span className="text-[#e6edf3] text-sm font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td data-label="Duration" className="px-4 py-3">
                      {c.duration ? (
                        <span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-medium px-2 py-1 rounded-full">
                          {c.duration}
                        </span>
                      ) : <span className="text-[#484f58] text-xs">—</span>}
                    </td>
                    <td data-label="Description" className="px-4 py-3 text-[#7d8590] text-sm break-words">
                      {c.description || "—"}
                    </td>
                    <td data-label="Actions" className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 border border-transparent hover:border-[#388bfd]/20 transition-all text-xs font-medium"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(c.id, c.name)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-xs font-medium"
                          title="Delete"
                        >
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
                        <CourseIcon />
                      </div>
                      <p className="text-[#7d8590] text-sm font-medium">
                        {searchTerm ? "No courses match your search" : "No courses yet"}
                      </p>
                      <p className="text-[#484f58] text-xs">
                        {searchTerm ? "Try a different keyword" : "Click 'Add Course' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalFiltered > 0 && (
            <div className="bg-[#161b22] border-t border-[#21262d] px-4 py-3 flex flex-col sm:flex-row justify-between gap-3 items-center">
              <div className="text-[#484f58] text-xs">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered} courses
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
    </div>
  );
}

export default Courses;