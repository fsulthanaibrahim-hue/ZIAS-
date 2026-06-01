import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { toast } from "react-hot-toast";
import { clearAuthStorage } from "../utils/authStorage";

// Helper to turn any API error into a user‑friendly message (never 5xx)
const getFriendlyErrorMessage = (err, defaultMsg = "An error occurred") => {
  if (!err?.response) {
    return "Network error. Please check your connection.";
  }
  const status = err.response.status;
  if (status >= 500) {
    return "Service temporarily unavailable. Please try again later.";
  }
  if (status === 404) {
    return "Course not found.";
  }
  if (status === 400) {
    return "Invalid request. Please check your data.";
  }
  if (status === 401 || status === 403) {
    return "You are not authorized. Please log in again.";
  }
  return err.response?.data?.detail || err.response?.data?.message || defaultMsg;
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success"
    ? "bg-emerald-500"
    : type === "error"
    ? "bg-red-500"
    : "bg-slate-600";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl ${bgColor} text-white text-sm font-medium max-w-sm`}
      style={{ animation: "slideDown 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
      <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-bold shrink-0">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none ml-1">×</button>
    </div>
  );
}

function ConfirmModal({ isOpen, onClose, onConfirm, courseName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-7 mx-4" style={{ animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Course?</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          <span className="font-semibold text-gray-700">"{courseName}"</span> will be permanently removed. This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function extractCoursesArray(response) {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

// ========== SEPARATE MODAL COMPONENT ==========
function CourseFormModal({ isOpen, onClose, editingCourse, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: ""
  });
  const [durationError, setDurationError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCourse) {
      setFormData({
        name: editingCourse.name || "",
        description: editingCourse.description || "",
        duration: editingCourse.duration ? editingCourse.duration.toString() : ""
      });
    } else {
      setFormData({ name: "", description: "", duration: "" });
    }
    setDurationError("");
  }, [editingCourse, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "duration") {
      const num = parseInt(value, 10);
      if (value === "") {
        setFormData(prev => ({ ...prev, duration: "" }));
        setDurationError("");
      } else if (isNaN(num) || num < 0) {
        setDurationError("Duration must be a positive number");
        setFormData(prev => ({ ...prev, duration: value }));
      } else {
        setDurationError("");
        setFormData(prev => ({ ...prev, duration: num.toString() }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let durationValue = null;
    if (formData.duration && formData.duration !== "") {
      const num = parseInt(formData.duration, 10);
      if (isNaN(num) || num <= 0) {
        setDurationError("Duration must be a positive number");
        return;
      }
      durationValue = num;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      duration: durationValue
    };

    setSubmitting(true);
    try {
      if (editingCourse) {
        await API.patch(`courses/${editingCourse.id}/`, payload);
      } else {
        await API.post("courses/", payload);
      }
      onSave(); // refresh parent list
      onClose();
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err, "Error saving course");
      toast.error(friendlyMsg);
      console.warn(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">{editingCourse ? "Edit Course" : "New Course"}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Fill in the course details</p>
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-lg">×</button>
          </div>
          <div className="px-6 py-5 space-y-3.5">
            <input
              name="name"
              type="text"
              placeholder="Course name"
              value={formData.name}
              onChange={handleChange}
              required
              className={inputClass}
            />
            <input
              name="duration"
              type="number"
              placeholder="Duration (weeks)"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              step="1"
              className={inputClass}
            />
            {durationError && <p className="text-red-500 text-xs mt-1">{durationError}</p>}
            <textarea
              name="description"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
            <button type="submit" disabled={submitting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
              {submitting ? (editingCourse ? "Saving..." : "Adding...") : (editingCourse ? "Save Changes" : "Add Course")}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl font-medium text-sm transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== MAIN COURSES COMPONENT ==========
function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg, type = "success") => setToastMsg({ message: msg, type });
  const hideToast = () => setToastMsg(null);

  const fetched = useRef(false);
  const searchInputRef = useRef(null);

  const fetchCourses = useCallback(() => {
    API.get("courses/")
      .then(res => {
        setCourses(extractCoursesArray(res));
      })
      .catch(err => {
        const friendlyMsg = getFriendlyErrorMessage(err, "Failed to load courses");
        showToast(friendlyMsg, "error");
        console.warn(err);
        if (err.response?.status === 401) {
          setTimeout(() => {
            clearAuthStorage();
            window.location.href = "/login";
          }, 1500);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredCourses = Array.isArray(courses)
    ? courses.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.duration?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const totalFiltered = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
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
    return pages;
  };

  const handleDeleteClick = (courseId, courseName) => {
    setCourseToDelete({ id: courseId, name: courseName });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await API.delete(`courses/${courseToDelete.id}/`);
      await fetchCourses();
      showToast("Course deleted successfully", "success");
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err, "Failed to delete course");
      showToast(friendlyMsg, "error");
      console.warn(err);
    } finally {
      setShowConfirmModal(false);
      setCourseToDelete(null);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setShowForm(true);
  };

  const handleAddClick = () => {
    setEditingCourse(null);
    setShowForm(true);
  };

  const handleFormSave = () => {
    fetchCourses();
    showToast(editingCourse ? "Course updated successfully" : "Course added successfully", "success");
  };

  const handleCardClick = (courseId) => {
    navigate(`/admin/modules?course_id=${courseId}`);
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm";

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading courses…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800" style={{ fontFamily: "'DM Sans', 'Geist', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.10); }
        .course-card { animation: fadeUp 0.3s ease both; }
        .duration-pill { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
      `}</style>

      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={hideToast} />}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} courseName={courseToDelete?.name} />

      {/* Separate modal component – no focus loss */}
      <CourseFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        editingCourse={editingCourse}
        onSave={handleFormSave}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Courses</h1>
            <p className="text-gray-400 text-sm mt-0.5">{courses.length} total · {filteredCourses.length} shown</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search courses…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-white border border-gray-200 rounded-xl pl-10 pr-9 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm shadow-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">✕</button>
              )}
            </div>
            <button
              onClick={handleAddClick}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/40 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
              Add Course
            </button>
          </div>
        </div>

        {/* Card Grid */}
        {paginatedCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">No courses found</p>
            {searchTerm && <button onClick={() => setSearchTerm("")} className="text-emerald-500 text-sm hover:underline">Clear search</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {paginatedCourses.map((course, idx) => (
              <div
                key={course.id}
                className="course-card bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden card-hover flex flex-col cursor-pointer"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex-1" onClick={() => handleCardClick(course.id)}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {course.duration && (
                          <span className="duration-pill text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                            {course.duration} week{course.duration !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleEdit(course)} title="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteClick(course.id, course.name)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug mb-1.5">{course.name}</h3>
                    {course.description && (
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{course.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {paginatedCourses.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white rounded-2xl border border-gray-200 px-5 py-3.5 shadow-sm">
            <p className="text-gray-400 text-xs">Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered}</p>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed">←</button>
              {getPageNumbers().map((p, i) =>
                p === "..." ? <span key={i} className="px-2 py-1.5 text-gray-400">…</span> :
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === p ? "bg-emerald-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>{p}</button>
              )}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Courses;
