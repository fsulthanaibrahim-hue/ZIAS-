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
  // ---------- State ----------
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ course: "", title: "", order: 0, content: "", is_common: true });
  const [searchTerm, setSearchTerm] = useState("");

  // Days state (per module)
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [daysByModule, setDaysByModule] = useState({});
  const [showDayModal, setShowDayModal] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [dayForm, setDayForm] = useState({ module: "", title: "", content: "", order: 0 });
  const [currentModuleForDay, setCurrentModuleForDay] = useState(null);

  // Tasks state (per day)
  const [expandedDayId, setExpandedDayId] = useState(null);
  const [tasksByDay, setTasksByDay] = useState({});
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ day: "", title: "", description: "", order: 0 });
  const [currentDayForTask, setCurrentDayForTask] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const hideToast = () => setToast(null);

  // ---------- API calls ----------
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
  const fetchDays = async (moduleId) => {
    try {
      const res = await API.get(`days/?module=${moduleId}`);
      setDaysByModule(prev => ({ ...prev, [moduleId]: res.data }));
    } catch (err) {
      showToast("Failed to load days", "error");
    }
  };
  const fetchTasks = async (dayId) => {
    try {
      const res = await API.get(`tasks/?day=${dayId}`);
      setTasksByDay(prev => ({ ...prev, [dayId]: res.data }));
    } catch (err) {
      showToast("Failed to load tasks", "error");
    }
  };

  useEffect(() => {
    fetchModules();
    fetchCourses();
  }, []);

  // When a module is expanded, fetch its days (only if not already fetched)
  useEffect(() => {
    if (expandedModuleId && !daysByModule[expandedModuleId]) {
      fetchDays(expandedModuleId);
    }
  }, [expandedModuleId, daysByModule]);

  useEffect(() => {
    if (expandedDayId && !tasksByDay[expandedDayId]) {
      fetchTasks(expandedDayId);
    }
  }, [expandedDayId, tasksByDay]);

  // ---------- Helpers ----------
  const resetModuleForm = () => setModuleForm({ course: "", title: "", order: 0, content: "", is_common: true });
  const resetDayForm = () => setDayForm({ module: "", title: "", content: "", order: 0 });
  const resetTaskForm = () => setTaskForm({ day: "", title: "", description: "", order: 0 });

  // ---------- Module CRUD ----------
  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    const payload = { 
      course: moduleForm.course, 
      title: moduleForm.title, 
      order: parseInt(moduleForm.order), 
      content: moduleForm.content,
      is_common: moduleForm.is_common
    };
    try {
      if (editingModule) {
        await API.patch(`modules/${editingModule.id}/`, payload);
        showToast("Module updated", "success");
      } else {
        await API.post("modules/", payload);
        showToast("Module added", "success");
      }
      setShowModuleModal(false);
      setEditingModule(null);
      resetModuleForm();
      // Reset expanded state to avoid stale days
      setExpandedModuleId(null);
      setExpandedDayId(null);
      fetchModules();
    } catch (err) {
      showToast("Error saving module", "error");
    }
  };
  const handleEditModule = (mod) => {
    setEditingModule(mod);
    setModuleForm({
      course: mod.course,
      title: mod.title,
      order: mod.order,
      content: mod.content || "",
      is_common: mod.is_common ?? true,
    });
    setShowModuleModal(true);
  };
  const handleDeleteModule = async (id) => {
    if (!window.confirm("Delete this module? All its days & tasks will be deleted.")) return;
    try {
      await API.delete(`modules/${id}/`);
      showToast("Module deleted", "success");
      // If the deleted module was expanded, reset expanded state
      if (expandedModuleId === id) {
        setExpandedModuleId(null);
      }
      fetchModules();
    } catch (err) {
      showToast("Delete failed", "error");
    }
  };

  // ---------- Day CRUD ----------
  const handleDaySubmit = async (e) => {
    e.preventDefault();
    const payload = { ...dayForm, order: parseInt(dayForm.order) };
    try {
      if (editingDay) {
        await API.patch(`days/${editingDay.id}/`, payload);
        showToast("Day updated", "success");
      } else {
        await API.post("days/", payload);
        showToast("Day added", "success");
      }
      setShowDayModal(false);
      setEditingDay(null);
      resetDayForm();
      // Refresh days for the currently expanded module
      if (expandedModuleId) {
        fetchDays(expandedModuleId);
      }
    } catch (err) {
      showToast("Error saving day", "error");
    }
  };
  const handleEditDay = (day) => {
    setEditingDay(day);
    setDayForm({
      module: day.module,
      title: day.title,
      content: day.content || "",
      order: day.order,
    });
    setShowDayModal(true);
  };
  const handleDeleteDay = async (dayId) => {
    if (!window.confirm("Delete this day? All tasks inside will be deleted.")) return;
    try {
      await API.delete(`days/${dayId}/`);
      showToast("Day deleted", "success");
      if (expandedModuleId) fetchDays(expandedModuleId);
    } catch (err) {
      showToast("Delete failed", "error");
    }
  };
  const toggleDayCompletion = async (dayId, completed) => {
    try {
      await API.patch(`days/${dayId}/`, { is_completed: completed });
      showToast(completed ? "Day completed" : "Day marked incomplete", "success");
      if (expandedModuleId) fetchDays(expandedModuleId);
    } catch (err) {
      showToast("Failed to update", "error");
    }
  };

  // ---------- Task CRUD ----------
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...taskForm, order: parseInt(taskForm.order) };
    try {
      if (editingTask) {
        await API.patch(`tasks/${editingTask.id}/`, payload);
        showToast("Task updated", "success");
      } else {
        await API.post("tasks/", payload);
        showToast("Task added", "success");
      }
      setShowTaskModal(false);
      setEditingTask(null);
      resetTaskForm();
      if (expandedDayId) fetchTasks(expandedDayId);
    } catch (err) {
      showToast("Error saving task", "error");
    }
  };
  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      day: task.day,
      title: task.title,
      description: task.description || "",
      order: task.order,
    });
    setShowTaskModal(true);
  };
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await API.delete(`tasks/${taskId}/`);
      showToast("Task deleted", "success");
      if (expandedDayId) fetchTasks(expandedDayId);
    } catch (err) {
      showToast("Delete failed", "error");
    }
  };

  // ---------- Pagination & filtering ----------
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

  // ---------- UI Helpers ----------
  const inputClass = "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/30 transition-all duration-200 text-sm";
  const smallInputClass = "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-all text-sm";

  return (
    <div className="min-h-screen w-screen bg-[#0d1117] text-[#e6edf3]" style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        .table-row-hover:hover { background: rgba(56,139,253,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
        .scrollbar::-webkit-scrollbar { width: 4px; }
        .scrollbar::-webkit-scrollbar-track { background: transparent; }
        .scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        @keyframes slide-in-from-top-2 {
          from { opacity:0; transform:translateY(-1rem); }
          to { opacity:1; transform:translateY(0); }
        }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Modules</h1>
              <p className="text-[#7d8590] text-xs mt-0.5">{modules.length} total · {filteredModules.length} shown</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input type="text" placeholder="Search modules..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-all text-sm w-64" />
              {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#7d8590]">✕</button>}
            </div>
            <button onClick={() => { setEditingModule(null); resetModuleForm(); setShowModuleModal(true); }} className="shine flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-[#238636]/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Module
            </button>
          </div>
        </div>

        {/* Module Form Modal (same as before) */}
        {showModuleModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => setShowModuleModal(false)}>
            <form onSubmit={handleModuleSubmit} className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-md border border-[#30363d] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#21262d]">
                <h3 className="text-sm font-semibold text-[#e6edf3]">{editingModule ? "Edit Module" : "New Module"}</h3>
                <button type="button" onClick={() => setShowModuleModal(false)} className="text-[#484f58] hover:text-[#7d8590]">✕</button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <select value={moduleForm.course} onChange={e => setModuleForm({ ...moduleForm, course: e.target.value })} required className={inputClass}>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="text" placeholder="Title" value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} required className={inputClass} />
                <input type="number" placeholder="Order" value={moduleForm.order} onChange={e => setModuleForm({ ...moduleForm, order: e.target.value })} required className={inputClass} />
                <textarea placeholder="Content (optional)" value={moduleForm.content} onChange={e => setModuleForm({ ...moduleForm, content: e.target.value })} rows="3" className={`${inputClass} resize-none`} />
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="is_common" checked={moduleForm.is_common} onChange={(e) => setModuleForm({ ...moduleForm, is_common: e.target.checked })} className="w-4 h-4 rounded bg-[#0d1117] border-[#30363d] accent-blue-500" />
                  <label htmlFor="is_common" className="text-sm text-[#c9d1d9]">Common Module (visible to all students - Foundation Weeks)</label>
                </div>
                <p className="text-[#484f58] text-xs -mt-2">✅ Check this for weeks 1-8 (Foundation modules)</p>
              </div>
              <div className="flex gap-2 px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white py-2 rounded-lg">Save</button>
                <button type="button" onClick={() => setShowModuleModal(false)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Day Form Modal */}
        {showDayModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => setShowDayModal(false)}>
            <form onSubmit={handleDaySubmit} className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-md border border-[#30363d] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#21262d]">
                <h3 className="text-sm font-semibold text-[#e6edf3]">{editingDay ? "Edit Day" : "New Day"}</h3>
                <button type="button" onClick={() => setShowDayModal(false)} className="text-[#484f58] hover:text-[#7d8590]">✕</button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <input type="text" placeholder="Title" value={dayForm.title} onChange={e => setDayForm({ ...dayForm, title: e.target.value })} required className={inputClass} />
                <input type="number" placeholder="Order" value={dayForm.order} onChange={e => setDayForm({ ...dayForm, order: e.target.value })} required className={inputClass} />
                <textarea placeholder="Content (HTML/plain text)" value={dayForm.content} onChange={e => setDayForm({ ...dayForm, content: e.target.value })} rows="4" className={`${inputClass} resize-none`} />
              </div>
              <div className="flex gap-2 px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white py-2 rounded-lg">Save</button>
                <button type="button" onClick={() => setShowDayModal(false)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Task Form Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => setShowTaskModal(false)}>
            <form onSubmit={handleTaskSubmit} className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-md border border-[#30363d] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#21262d]">
                <h3 className="text-sm font-semibold text-[#e6edf3]">{editingTask ? "Edit Task" : "New Task"}</h3>
                <button type="button" onClick={() => setShowTaskModal(false)} className="text-[#484f58] hover:text-[#7d8590]">✕</button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <input type="text" placeholder="Title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required className={inputClass} />
                <input type="number" placeholder="Order" value={taskForm.order} onChange={e => setTaskForm({ ...taskForm, order: e.target.value })} required className={inputClass} />
                <textarea placeholder="Description (optional)" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows="3" className={`${inputClass} resize-none`} />
              </div>
              <div className="flex gap-2 px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white py-2 rounded-lg">Save</button>
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Modules Table (Order column removed) */}
        <div className="rounded-xl border border-[#21262d] overflow-hidden shadow-xl shadow-black/20">
          <table className="w-full">
            <thead>
              <tr className="bg-[#161b22] border-b border-[#21262d]">
                <th className="px-4 py-3 text-left text-[#7d8590] text-xs font-semibold uppercase">Course</th>
                <th className="px-4 py-3 text-left text-[#7d8590] text-xs font-semibold uppercase">Title</th>
                <th className="px-4 py-3 text-left text-[#7d8590] text-xs font-semibold uppercase">Type</th>
                <th className="px-4 py-3 text-left text-[#7d8590] text-xs font-semibold uppercase">Content</th>
                <th className="px-4 py-3 text-left text-[#7d8590] text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {paginatedModules.map(mod => (
                <React.Fragment key={mod.id}>
                  <tr className="table-row-hover group">
                    <td className="px-4 py-3.5 text-[#e6edf3] text-sm">{mod.course_name || mod.course?.name || "—"}</td>
                    <td className="px-4 py-3.5 text-[#c9d1d9] text-sm">{mod.title}</td>
                    <td className="px-4 py-3.5">
                      {mod.is_common ? (
                        <span className="inline-flex bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2 py-1 rounded-full">Foundation (Common)</span>
                      ) : (
                        <span className="inline-flex bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-2 py-1 rounded-full">Custom</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#7d8590] text-sm truncate max-w-xs">{mod.content || "—"}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => handleEditModule(mod)} className="p-1.5 rounded-lg text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10" title="Edit"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={() => setExpandedModuleId(expandedModuleId === mod.id ? null : mod.id)} className="p-1.5 rounded-lg text-[#7d8590] hover:text-emerald-400 hover:bg-emerald-500/10" title="Days"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                        <button onClick={() => handleDeleteModule(mod.id)} className="p-1.5 rounded-lg text-[#7d8590] hover:text-red-400 hover:bg-red-500/10" title="Delete"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Days Row (colspan now 5) */}
                  {expandedModuleId === mod.id && (
                    <tr>
                      <td colSpan="5" className="px-4 py-3 bg-[#0d1117]/80">
                        <div className="bg-[#161b22] rounded-lg border border-[#21262d] p-4">
                          {mod.content && (
                            <div className="mb-4 pb-3 border-b border-[#21262d]">
                              <div className="text-xs font-semibold text-[#7d8590] uppercase mb-1">Week Content</div>
                              <div className="text-[#c9d1d9] text-sm whitespace-pre-wrap">{mod.content}</div>
                            </div>
                          )}
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-[#e6edf3]">Days</h4>
                            <button onClick={() => { setCurrentModuleForDay(mod.id); setEditingDay(null); resetDayForm(); setDayForm({ ...dayForm, module: mod.id }); setShowDayModal(true); }} className="text-xs text-[#388bfd] hover:text-blue-300 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Day</button>
                          </div>
                          {(daysByModule[mod.id] || []).length === 0 ? (
                            <p className="text-[#484f58] text-sm">No days yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {daysByModule[mod.id].map(day => (
                                <div key={day.id} className="border border-[#21262d] rounded-lg overflow-hidden">
                                  <div className="bg-[#0d1117] p-3 flex justify-between items-center cursor-pointer hover:bg-[#161b22]" onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}>
                                    <div className="flex items-center gap-3">
                                      <input type="checkbox" checked={day.is_completed || false} onChange={(e) => { e.stopPropagation(); toggleDayCompletion(day.id, e.target.checked); }} className="w-4 h-4 accent-emerald-500" />
                                      <div>
                                        <p className="text-[#c9d1d9] text-sm font-medium">{day.title}</p>
                                        <p className="text-[#484f58] text-xs">Order: {day.order}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => handleEditDay(day)} className="px-2 py-1 text-xs text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 rounded">Edit</button>
                                      <button onClick={() => handleDeleteDay(day.id)} className="px-2 py-1 text-xs text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 rounded">Delete</button>
                                    </div>
                                  </div>
                                  {/* Expanded Tasks Row */}
                                  {expandedDayId === day.id && (
                                    <div className="bg-[#0d1117] p-4 pl-8 border-t border-[#21262d]">
                                      {day.content && (
                                        <div className="mb-3 pb-2 border-b border-[#21262d]">
                                          <div className="text-xs font-semibold text-[#7d8590] uppercase mb-1">Day Content</div>
                                          <div className="text-[#c9d1d9] text-sm whitespace-pre-wrap">{day.content}</div>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center mb-2">
                                        <h5 className="text-xs font-semibold text-[#7d8590] uppercase">Tasks</h5>
                                        <button onClick={() => { setCurrentDayForTask(day.id); setEditingTask(null); resetTaskForm(); setTaskForm({ ...taskForm, day: day.id }); setShowTaskModal(true); }} className="text-xs text-[#388bfd] hover:text-blue-300 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Task</button>
                                      </div>
                                      {(tasksByDay[day.id] || []).length === 0 ? (
                                        <p className="text-[#484f58] text-xs">No tasks yet.</p>
                                      ) : (
                                        <div className="space-y-1.5">
                                          {tasksByDay[day.id].map(task => (
                                            <div key={task.id} className="bg-[#161b22] rounded p-2 flex justify-between items-center">
                                              <div>
                                                <p className="text-[#c9d1d9] text-xs font-medium">{task.title}</p>
                                                {task.description && <p className="text-[#484f58] text-[11px]">{task.description}</p>}
                                                <p className="text-[#484f58] text-[10px]">Order: {task.order}</p>
                                              </div>
                                              <div className="flex gap-1">
                                                <button onClick={() => handleEditTask(task)} className="px-1.5 py-0.5 text-xs text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 rounded">Edit</button>
                                                <button onClick={() => handleDeleteTask(task.id)} className="px-1.5 py-0.5 text-xs text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 rounded">Delete</button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
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
                <tr><td colSpan="5" className="text-center py-20 text-[#7d8590]">No modules found</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {paginatedModules.length > 0 && (
            <div className="bg-[#161b22] border-t border-[#21262d] px-4 py-3 flex flex-col sm:flex-row justify-between gap-3">
              <div className="text-[#484f58] text-xs">Showing {startIndex+1} to {Math.min(startIndex+itemsPerPage, totalFiltered)} of {totalFiltered} modules</div>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-[#484f58] text-[#7d8590] hover:bg-[#21262d]">←</button>
                {getPageNumbers().map((p, i) => p === "..." ? <span key={i} className="px-2 py-1.5 text-[#484f58]">...</span> : <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 rounded-lg text-sm ${currentPage===p ? "bg-[#388bfd] text-white shadow-md" : "text-[#7d8590] hover:bg-[#21262d]"}`}>{p}</button>)}
                <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage===totalPages} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-[#484f58] text-[#7d8590] hover:bg-[#21262d]">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modules;