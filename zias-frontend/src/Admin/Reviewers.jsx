import { useEffect, useState, useRef } from "react";
import API from "../api/api";

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

function ConfirmModal({ isOpen, onClose, onConfirm, reviewerName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl p-6 mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="text-gray-900 font-medium">{reviewerName}</span>?<br />
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Reviewers() {
  const [reviewers, setReviewers] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewingReviewer, setViewingReviewer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // ✅ Fix: Separate form data state properly
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    qualification: "",
    experience: "",
  });
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reviewerToDelete, setReviewerToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);
  const initialFetchDone = useRef(false);

  const extractArray = (response) => {
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data : [];
  };

  const fetchReviewers = async () => {
    try {
      const res = await API.get("reviewers/");
      const reviewersArray = extractArray(res);
      console.log("Fetched reviewers:", reviewersArray);
      setReviewers(reviewersArray);
    } catch (err) {
      console.error(err);
      showToast("Failed to load reviewers", "error");
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await API.get("courses/");
      const coursesArray = extractArray(res);
      setCoursesList(coursesArray);
    } catch (err) {
      console.error(err);
      showToast("Failed to load courses", "error");
    }
  };

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchReviewers();
    fetchCourses();
  }, []);

  const handleDeleteClick = (reviewerId, reviewerName) => {
    setReviewerToDelete({ id: reviewerId, name: reviewerName });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!reviewerToDelete) return;
    try {
      await API.delete(`reviewers/${reviewerToDelete.id}/`);
      await fetchReviewers();
      showToast("Reviewer deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete reviewer", "error");
    } finally {
      setShowConfirmModal(false);
      setReviewerToDelete(null);
    }
  };

  // ✅ Fix: Properly handle form submission without resetting before API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Get the current experience value from formData
    let experienceValue = null;
    if (formData.experience && formData.experience !== "" && formData.experience !== "0") {
      experienceValue = parseInt(formData.experience);
      if (isNaN(experienceValue)) experienceValue = null;
    }
    
    console.log("📝 Current formData:", formData);
    console.log("🎯 Experience value being sent:", experienceValue);
    
    const payload = {
      full_name: formData.name,
      email: formData.email,
      department: formData.department,
      qualification: formData.qualification || null,
      experience: experienceValue,
      batch: null,
      course: formData.department,
    };
    
    console.log("🚀 Sending payload:", JSON.stringify(payload, null, 2));
    
    try {
      if (editingId) {
        await API.patch(`reviewers/${editingId}/`, payload);
        showToast("Reviewer updated successfully", "success");
      } else {
        await API.post("reviewers/", payload);
        showToast("Reviewer added successfully", "success");
      }
      
      // ✅ Only reset form AFTER successful API call
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", email: "", department: "", qualification: "", experience: "" });
      await fetchReviewers();
      setCurrentPage(1);
    } catch (error) {
      console.error("❌ API error:", error);
      console.error("Error response:", error.response?.data);
      let errorMsg = "Unknown error";
      if (error.response?.data) {
        const data = error.response.data;
        if (data.email) errorMsg = Array.isArray(data.email) ? data.email[0] : data.email;
        else if (data.detail) errorMsg = data.detail;
        else if (data.error) errorMsg = data.error;
        else if (typeof data === 'string') errorMsg = data;
      }
      showToast(`Error: ${errorMsg}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (reviewer) => {
    console.log("✏️ Editing reviewer:", reviewer);
    setEditingId(reviewer.id);
    // Check all possible experience field names
    let expValue = reviewer.experience || reviewer.years_of_experience || reviewer.exp_years || "";
    setFormData({
      name: reviewer.full_name || reviewer.username || "",
      email: reviewer.email || "",
      department: reviewer.department || reviewer.course || "",
      qualification: reviewer.qualification || "",
      experience: expValue ? expValue.toString() : "",
    });
    setShowForm(true);
    setMobileMenuOpen(false);
  };

  // ✅ Fix: Proper handleChange to preserve values
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`🔄 Changing ${name} to:`, value);
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  // Helper to get experience value from reviewer
  const getExperienceValue = (reviewer) => {
    const exp = reviewer.experience || 
                reviewer.years_of_experience || 
                reviewer.exp_years || 
                reviewer.total_experience ||
                reviewer.experience_years;
    
    if (typeof exp === 'string') {
      const parsed = parseInt(exp);
      return isNaN(parsed) ? null : parsed;
    }
    return exp ? exp : null;
  };

  const filteredReviewers = reviewers.filter(r =>
    (r.full_name || r.username)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.department || "")?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const inputClass = `
    w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800
    placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30
    transition-all duration-200 text-sm
  `;

  const getInitials = (name) => (name || "?")[0].toUpperCase();
  const avatarColors = [
    "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700", "from-amber-500 to-amber-700",
    "from-rose-500 to-rose-700", "from-cyan-500 to-cyan-700",
  ];
  const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800">
      <style>{`
        .table-row-hover:hover { background: rgba(34,197,94,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
        @keyframes slide-in-from-top-2 {
          from { opacity:0; transform:translateY(-1rem); }
          to { opacity:1; transform:translateY(0); }
        }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
        
        @media (max-width: 768px) {
          .reviewer-table thead { display: none; }
          .reviewer-table tbody tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          .reviewer-table tbody td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.875rem 1rem;
            border-bottom: 1px solid #e5e7eb;
            text-align: right;
            gap: 1rem;
            flex-wrap: wrap;
          }
          .reviewer-table tbody td:last-child { border-bottom: none; }
          .reviewer-table tbody td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #059669;
            background: #ecfdf5;
            padding: 0.25rem 0.75rem;
            border-radius: 2rem;
            font-size: 0.7rem;
            letter-spacing: 0.03em;
            text-align: left;
            flex-shrink: 0;
            min-width: 110px;
          }
          button, [role="button"], .tap-target { min-height: 44px; cursor: pointer; }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
          .reviewer-table td { padding: 0.75rem 0.5rem; }
        }
        
        .modal-scroll { scrollbar-width: thin; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} reviewerName={reviewerToDelete?.name} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 tracking-tight">Reviewers</h1>
              <p className="text-gray-500 text-xs mt-0.5">
                {reviewers.length} total · {filteredReviewers.length} shown
              </p>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </button>
          </div>

          {/* Controls */}
          <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition-all duration-300`}>
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search reviewers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", email: "", department: "", qualification: "", experience: "" });
                setShowForm(true);
                setMobileMenuOpen(false);
              }}
              className="shine flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Reviewer
            </button>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-2 sm:p-4"
            onClick={() => setShowForm(false)}
          >
            <form
              onSubmit={handleSubmit}
              className="modal-enter bg-white rounded-2xl w-full max-w-md border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto modal-scroll"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{editingId ? "Edit Reviewer" : "New Reviewer"}</h3>
                    <p className="text-gray-500 text-xs">{editingId ? "Update reviewer information" : "Add a new reviewer to the system"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-4">
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="Enter full name" />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="reviewer@example.com" />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Department (Course) *</label>
                  <select name="department" value={formData.department} onChange={handleChange} required className={inputClass}>
                    <option value="">Select a course</option>
                    {coursesList.map(course => (
                      <option key={course.id} value={course.name}>{course.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Qualification</label>
                  <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} className={inputClass} placeholder="e.g. B.Tech, MBA" />
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Experience (years)</label>
                  <input 
                    type="number" 
                    name="experience" 
                    value={formData.experience} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="e.g. 5" 
                    min="0" 
                    step="1"
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter number of years of experience</p>
                </div>
              </div>
              <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-gray-200">
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Save Changes" : "Add Reviewer")}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-all text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviewers Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="reviewer-table min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Reviewer</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Email</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Department</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Experience</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedReviewers.length > 0 ? (
                  paginatedReviewers.map((r) => {
                    const displayName = r.full_name || r.username;
                    const experienceValue = getExperienceValue(r);
                    return (
                      <tr key={r.id} className="table-row-hover transition-colors duration-150 group">
                        <td data-label="Reviewer" className="px-3 sm:px-4 py-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(displayName)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                              {getInitials(displayName)}
                            </div>
                            <button 
                              onClick={() => setViewingReviewer(r)} 
                              className="text-gray-800 text-xs sm:text-sm font-medium hover:text-green-600 transition-colors cursor-pointer break-words flex-1 text-left"
                            >
                              {displayName}
                            </button>
                          </div>
                        </td>
                        <td data-label="Email" className="px-3 sm:px-4 py-3 text-gray-500 text-xs sm:text-sm break-all">{r.email}</td>
                        <td data-label="Department" className="px-3 sm:px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 border border-purple-200 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full">
                            {r.department || r.course || "—"}
                          </span>
                        </td>
                        <td data-label="Experience" className="px-3 sm:px-4 py-3">
                          {experienceValue && experienceValue > 0 ? (
                            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 border border-blue-200 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full">
                              {experienceValue} {experienceValue === 1 ? 'year' : 'years'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td data-label="Actions" className="px-3 sm:px-4 py-3">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <button 
                              onClick={() => handleEdit(r)} 
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all text-[11px] sm:text-xs font-medium"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(r.id, displayName)} 
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-[11px] sm:text-xs font-medium"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">{searchTerm ? "No reviewers match your search" : "No reviewers yet"}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalFiltered > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row justify-between gap-3 items-center">
              <div className="text-gray-500 text-xs text-center sm:text-left">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered} reviewers
              </div>
              <div className="flex gap-1 flex-wrap justify-center">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                  disabled={currentPage === 1} 
                  className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100 disabled:hover:bg-transparent transition-colors"
                >
                  ←
                </button>
                {getPageNumbers().map((page, idx) => 
                  page === "..." ? 
                    <span key={idx} className="px-2 py-1.5 text-gray-400">...</span> : 
                    <button 
                      key={page} 
                      onClick={() => setCurrentPage(page)} 
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        currentPage === page 
                          ? "bg-green-600 text-white shadow-sm" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                )}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                  disabled={currentPage === totalPages} 
                  className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100 disabled:hover:bg-transparent transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewingReviewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-2 sm:p-4" onClick={() => setViewingReviewer(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto modal-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(viewingReviewer.full_name || viewingReviewer.username)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Reviewer Details</h3>
                  <p className="text-gray-500 text-xs">View all information</p>
                </div>
              </div>
              <button onClick={() => setViewingReviewer(null)} className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 sm:px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-gray-500 text-xs mb-1">Full Name</label>
                  <p className="text-gray-800 text-sm font-medium break-words">{viewingReviewer.full_name || viewingReviewer.username || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-gray-500 text-xs mb-1">Email</label>
                  <p className="text-gray-800 text-sm break-words">{viewingReviewer.email || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-gray-500 text-xs mb-1">Department (Course)</label>
                  <p className="text-gray-800 text-sm">{viewingReviewer.department || viewingReviewer.course || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-gray-500 text-xs mb-1">Qualification</label>
                  <p className="text-gray-800 text-sm">{viewingReviewer.qualification || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-gray-500 text-xs mb-1">Experience</label>
                  <p className="text-gray-800 text-sm">
                    {getExperienceValue(viewingReviewer) ? 
                      `${getExperienceValue(viewingReviewer)} ${getExperienceValue(viewingReviewer) === 1 ? 'year' : 'years'}` : 
                      "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => setViewingReviewer(null)} className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 hover:text-gray-800 px-5 py-2 rounded-lg transition-all text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviewers;