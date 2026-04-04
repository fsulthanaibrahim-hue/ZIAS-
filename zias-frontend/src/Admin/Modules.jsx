import React, { useEffect, useState } from "react";
import API from "../api/api";

// Toast Component (unchanged)
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
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">×</button>
    </div>
  );
}

function Modules() {
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    course: "",
    title: "",
    order: 0,
    content: "",
  });

  // Expanded module (to show days)
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [days, setDays] = useState([]);
  const [showDayForm, setShowDayForm] = useState(false);
  const [editingDayId, setEditingDayId] = useState(null);
  const [dayFormData, setDayFormData] = useState({ title: "", content: "", order: 0 });
  const [currentModuleForDay, setCurrentModuleForDay] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  // Fetch modules and courses
  const fetchModules = () => {
    API.get("modules/")
      .then(res => setModules(res.data))
      .catch(() => showToast("Failed to load modules", "error"));
  };

  const fetchCourses = () => {
    API.get("courses/")
      .then(res => setCourses(res.data))
      .catch(() => showToast("Failed to load courses", "error"));
  };

  const fetchDays = (moduleId) => {
    API.get(`days/?module=${moduleId}`)
      .then(res => setDays(res.data))
      .catch(() => showToast("Failed to load days", "error"));
  };

  useEffect(() => {
    fetchModules();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (expandedModuleId) {
      fetchDays(expandedModuleId);
    } else {
      setDays([]);
      setShowDayForm(false);
      setEditingDayId(null);
    }
  }, [expandedModuleId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredModules = modules.filter(mod =>
    mod.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mod.course_name || mod.course?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFiltered = filteredModules.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedModules = filteredModules.slice(startIndex, startIndex + itemsPerPage);

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

  // Module CRUD
  const handleDelete = (id) => {
    if (window.confirm("Delete this module? This will also delete all its days.")) {
      API.delete(`modules/${id}/`)
        .then(() => {
          fetchModules();
          showToast("Module deleted successfully", "success");
        })
        .catch(() => showToast("Failed to delete module", "error"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      course: formData.course,
      title: formData.title,
      order: parseInt(formData.order) || 0,
      content: formData.content,
    };
    try {
      if (editingId) {
        await API.patch(`modules/${editingId}/`, payload);
        showToast("Module updated successfully", "success");
      } else {
        await API.post("modules/", payload);
        showToast("Module added successfully", "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ course: "", title: "", order: 0, content: "" });
      fetchModules();
    } catch (error) {
      let errorMsg = "Error saving module";
      if (error.response?.data) {
        errorMsg = Object.values(error.response.data).flat().join(", ");
      }
      showToast(errorMsg, "error");
    }
  };

  const handleEdit = (module) => {
    setEditingId(module.id);
    setFormData({
      course: module.course,
      title: module.title,
      order: module.order,
      content: module.content || "",
    });
    setShowForm(true);
  };

  // Day CRUD
  const handleAddDay = (moduleId) => {
    setCurrentModuleForDay(moduleId);
    setEditingDayId(null);
    setDayFormData({ title: "", content: "", order: 0 });
    setShowDayForm(true);
  };

  const handleEditDay = (day) => {
    setEditingDayId(day.id);
    setCurrentModuleForDay(day.module);
    setDayFormData({
      title: day.title,
      content: day.content || "",
      order: day.order,
    });
    setShowDayForm(true);
  };

  const handleDeleteDay = async (dayId) => {
    if (window.confirm("Delete this day?")) {
      try {
        await API.delete(`days/${dayId}/`);
        showToast("Day deleted successfully", "success");
        fetchDays(expandedModuleId);
      } catch (err) {
        showToast("Failed to delete day", "error");
      }
    }
  };

  const handleDaySubmit = async (e) => {
    e.preventDefault();
    const payload = {
      module: currentModuleForDay,
      title: dayFormData.title,
      content: dayFormData.content,
      order: parseInt(dayFormData.order) || 0,
    };
    try {
      if (editingDayId) {
        await API.patch(`days/${editingDayId}/`, payload);
        showToast("Day updated successfully", "success");
      } else {
        await API.post("days/", payload);
        showToast("Day added successfully", "success");
      }
      setShowDayForm(false);
      setEditingDayId(null);
      setDayFormData({ title: "", content: "", order: 0 });
      fetchDays(expandedModuleId);
    } catch (error) {
      let errorMsg = "Error saving day";
      if (error.response?.data) {
        errorMsg = Object.values(error.response.data).flat().join(", ");
      }
      showToast(errorMsg, "error");
    }
  };

  const inputClass = `
    w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-[#e6edf3]
    placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/30
    transition-all duration-200 text-sm
  `;

  return (
    <div className="min-h-screen w-screen bg-[#0d1117] text-[#e6edf3]" style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
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
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* Top Bar (unchanged) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Modules</h1>
              <p className="text-[#7d8590] text-xs mt-0.5">
                {modules.length} total · {filteredModules.length} shown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/20 transition-all text-sm w-64"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#7d8590] transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ course: "", title: "", order: 0, content: "" });
                setShowForm(true);
              }}
              className="shine flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-[#238636]/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Module
            </button>
          </div>
        </div>

        {/* Module Form Modal (unchanged) */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => setShowForm(false)}>
            <form onSubmit={handleSubmit} className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-md border border-[#30363d] shadow-2xl shadow-black/60" onClick={e => e.stopPropagation()}>
              {/* same as before, omitted for brevity but include full modal */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#21262d]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#e6edf3]">{editingId ? "Edit Module" : "New Module"}</h3>
                    <p className="text-[#7d8590] text-xs">{editingId ? "Update module details" : "Add a new module to the system"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-[#484f58] hover:text-[#7d8590] transition p-1.5 rounded-lg hover:bg-[#21262d]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Course</label>
                  <select name="course" value={formData.course} onChange={handleChange} required className={inputClass}>
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Title</label>
                  <input type="text" name="title" placeholder="e.g. Week 1 - Introduction" value={formData.title} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Order</label>
                  <input type="number" name="order" placeholder="0, 1, 2..." value={formData.order} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Content (optional)</label>
                  <textarea name="content" placeholder="Module overview or description" value={formData.content} onChange={handleChange} rows="3" className={`${inputClass} resize-none`} />
                </div>
              </div>

              <div className="flex gap-2 px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="flex-1 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white py-2 rounded-lg transition-all text-sm font-medium shadow-md shadow-[#238636]/20">
                  {editingId ? "Save Changes" : "Add Module"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] py-2 rounded-lg transition-all text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Day Form Modal */}
        {showDayForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => setShowDayForm(false)}>
            <form onSubmit={handleDaySubmit} className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-md border border-[#30363d] shadow-2xl shadow-black/60" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#21262d]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingDayId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#e6edf3]">{editingDayId ? "Edit Day" : "New Day"}</h3>
                    <p className="text-[#7d8590] text-xs">{editingDayId ? "Update day details" : "Add a day to this module"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowDayForm(false)} className="text-[#484f58] hover:text-[#7d8590] transition p-1.5 rounded-lg hover:bg-[#21262d]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Title</label>
                  <input type="text" placeholder="e.g. Day 1 - Getting Started" value={dayFormData.title} onChange={e => setDayFormData({ ...dayFormData, title: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Order</label>
                  <input type="number" placeholder="0, 1, 2..." value={dayFormData.order} onChange={e => setDayFormData({ ...dayFormData, order: parseInt(e.target.value) || 0 })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Content (optional)</label>
                  <textarea placeholder="Day content (HTML or plain text)" value={dayFormData.content} onChange={e => setDayFormData({ ...dayFormData, content: e.target.value })} rows="4" className={`${inputClass} resize-none`} />
                </div>
              </div>

              <div className="flex gap-2 px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="flex-1 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white py-2 rounded-lg transition-all text-sm font-medium shadow-md shadow-[#238636]/20">
                  {editingDayId ? "Save Changes" : "Add Day"}
                </button>
                <button type="button" onClick={() => setShowDayForm(false)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] py-2 rounded-lg transition-all text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modules Table with Expandable Days */}
        <div className="rounded-xl border border-[#21262d] overflow-hidden shadow-xl shadow-black/20">
          <table className="w-full">
            <thead>
              <tr className="bg-[#161b22] border-b border-[#21262d]">
                {["Course", "Title", "Order", "Content", ""].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {paginatedModules.map(mod => (
                <React.Fragment key={mod.id}>
                  <tr className="table-row-hover transition-colors duration-150 group">
                    <td className="px-4 py-3.5">
                      <span className="text-[#e6edf3] text-sm font-medium">{mod.course_name || mod.course?.name || "—"}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[#c9d1d9] text-sm">{mod.title}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center bg-[#21262d] text-[#7d8590] border border-[#30363d] text-xs font-mono px-2.5 py-1 rounded-full">
                        {mod.order}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#7d8590] text-sm truncate max-w-xs">{mod.content || "—"}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button onClick={() => handleEdit(mod)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 border border-transparent hover:border-[#388bfd]/20 transition-all text-xs font-medium" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setExpandedModuleId(expandedModuleId === mod.id ? null : mod.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all text-xs font-medium" title="Days">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Days
                        </button>
                        <button onClick={() => handleDelete(mod.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-xs font-medium" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row for days */}
                  {expandedModuleId === mod.id && (
                    <tr>
                      <td colSpan="5" className="px-4 py-3 bg-[#0d1117]/80">
                        <div className="bg-[#161b22] rounded-lg border border-[#21262d] p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-[#e6edf3]">Days in this module</h4>
                            <button onClick={() => handleAddDay(mod.id)} className="flex items-center gap-1.5 text-xs text-[#388bfd] hover:text-blue-300 transition">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Day
                            </button>
                          </div>
                          {days.length === 0 ? (
                            <p className="text-[#484f58] text-sm">No days yet. Click "Add Day" to create one.</p>
                          ) : (
                            <div className="space-y-2">
                              {days.map(day => (
                                <div key={day.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 flex justify-between items-center">
                                  <div>
                                    <p className="text-[#c9d1d9] text-sm font-medium">{day.title}</p>
                                    <p className="text-[#484f58] text-xs mt-0.5">Order: {day.order}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => handleEditDay(day)} className="px-2 py-1 rounded text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 transition-all text-xs">Edit</button>
                                    <button onClick={() => handleDeleteDay(day.id)} className="px-2 py-1 rounded text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 transition-all text-xs">Delete</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                       </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {paginatedModules.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <p className="text-[#7d8590] text-sm font-medium">
                        {searchTerm ? "No modules match your search" : "No modules yet"}
                      </p>
                      <p className="text-[#484f58] text-xs">
                        {searchTerm ? "Try a different keyword" : "Click 'Add Module' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination & Footer */}
          {paginatedModules.length > 0 && (
            <div className="bg-[#161b22] border-t border-[#21262d] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[#484f58] text-xs">
                Showing{" "}
                <span className="text-[#7d8590] font-medium">
                  {totalFiltered === 0 ? 0 : startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="text-[#7d8590] font-medium">
                  {Math.min(startIndex + itemsPerPage, totalFiltered)}
                </span>{" "}
                of{" "}
                <span className="text-[#7d8590] font-medium">{totalFiltered}</span> modules
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="ml-4 text-[#388bfd] hover:text-blue-300 text-xs font-medium transition">
                    Clear filter
                  </button>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currentPage === 1
                        ? "text-[#484f58] cursor-not-allowed"
                        : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-[#484f58] text-sm">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? "bg-[#388bfd] text-white shadow-md shadow-[#388bfd]/20"
                            : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currentPage === totalPages
                        ? "text-[#484f58] cursor-not-allowed"
                        : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modules;