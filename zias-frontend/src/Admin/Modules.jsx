// src/Admin/Modules.jsx
import React, { useEffect, useState, useRef } from "react";
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

// Custom confirmation modal for delete
function ConfirmModal({ isOpen, onClose, onConfirm, moduleTitle }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl p-6 mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="text-gray-900 font-medium">{moduleTitle}</span>?<br />
          All its days & tasks will be deleted. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Modules() {
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ 
    course: "", 
    title: "", 
    content: "", 
    is_common: true,
    order: ""          // NEW: week number
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [daysByModule, setDaysByModule] = useState({});
  const [showDayModal, setShowDayModal] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [dayForm, setDayForm] = useState({ module: "", title: "", content: "" });
  const [currentModuleForDay, setCurrentModuleForDay] = useState(null);

  const [expandedDayId, setExpandedDayId] = useState(null);
  const [tasksByDay, setTasksByDay] = useState({});
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ day: "", title: "", description: "", order: 0 });
  const [currentDayForTask, setCurrentDayForTask] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const hideToast = () => setToast(null);

  const fetched = useRef(false);

  // Week options: 1 to 52 (adjustable)
  const maxWeeks = 52;
  const weekOptions = Array.from({ length: maxWeeks }, (_, i) => i + 1);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  const fetchModules = () => {
    API.get("modules/")
      .then(res => setModules(res.data))
      .catch(() => showToast("Failed to load modules", "error"))
      .finally(() => setLoading(false));
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
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    Promise.all([fetchModules(), fetchCourses()]).catch(() => {});
  }, []);

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

  const resetModuleForm = () => {
    setModuleForm({ course: "", title: "", content: "", is_common: true, order: "" });
  };

  const resetDayForm = () => setDayForm({ module: "", title: "", content: "" });
  const resetTaskForm = () => setTaskForm({ day: "", title: "", description: "", order: 0 });

  const openAddModuleModal = () => {
    setEditingModule(null);
    resetModuleForm();
    setShowModuleModal(true);
  };

  const openEditModuleModal = (mod) => {
    setEditingModule(mod);
    setModuleForm({
      course: mod.course,
      title: mod.title,
      content: mod.content || "",
      is_common: mod.is_common ?? true,
      order: mod.order ? mod.order.toString() : "",
    });
    setShowModuleModal(true);
  };

  const handleDeleteClick = (moduleId, moduleTitle) => {
    setModuleToDelete({ id: moduleId, title: moduleTitle });
    setShowConfirmModal(true);
  };

  const confirmDeleteModule = async () => {
    if (!moduleToDelete) return;
    try {
      await API.delete(`modules/${moduleToDelete.id}/`);
      showToast("Module deleted successfully", "success");
      if (expandedModuleId === moduleToDelete.id) setExpandedModuleId(null);
      setDaysByModule(prev => {
        const newState = { ...prev };
        delete newState[moduleToDelete.id];
        return newState;
      });
      fetchModules();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete module", "error");
    } finally {
      setShowConfirmModal(false);
      setModuleToDelete(null);
    }
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    const payload = { 
      course: moduleForm.course, 
      title: moduleForm.title, 
      content: moduleForm.content,
      is_common: moduleForm.is_common,
      order: moduleForm.order ? parseInt(moduleForm.order) : null
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
      setExpandedModuleId(null);
      setExpandedDayId(null);
      setDaysByModule({});
      setTasksByDay({});
      fetchModules();
    } catch (err) {
      showToast("Error saving module", "error");
    }
  };

  const handleDaySubmit = async (e) => {
    e.preventDefault();
    if (!dayForm.module) {
      showToast("Module ID is missing", "error");
      return;
    }
    const payload = { 
      module: dayForm.module, 
      title: dayForm.title, 
      content: dayForm.content,
      order: 0
    };
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
      if (dayForm.module) fetchDays(dayForm.module);
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

  const inputClass = "w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all duration-200 text-sm";
  const smallInputClass = "w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all text-sm";

  const isAdmin = user?.is_admin === true;

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800" style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        .table-row-hover:hover { background: rgba(34,197,94,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
        .scrollbar::-webkit-scrollbar { width: 4px; }
        .scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        @keyframes slide-in-from-top-2 {
          from { opacity:0; transform:translateY(-1rem); }
          to { opacity:1; transform:translateY(0); }
        }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
        /* Mobile card layout for modules */
        @media (max-width: 640px) {
          .modules-table thead { display: none; }
          .modules-table tbody tr.module-row { display: block; margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; background: white; }
          .modules-table tbody td { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; text-align: right; gap: 1rem; }
          .modules-table tbody td:last-child { border-bottom: none; }
          .modules-table tbody td::before { content: attr(data-label); font-weight: 600; color: #6b7280; text-align: left; flex: 1; }
          .modules-table tbody td .action-buttons { margin-left: auto; display: flex; gap: 0.5rem; }
          .day-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .day-actions { margin-top: 0.5rem; }
          .task-item { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
          .task-actions { margin-left: 0; margin-top: 0.25rem; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDeleteModule} moduleTitle={moduleToDelete?.title} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Modules</h1>
              <p className="text-gray-500 text-xs mt-0.5">{modules.length} total · {filteredModules.length} shown</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input type="text" placeholder="Search modules..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all text-sm" />
              {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>}
            </div>
            <button
              onClick={openAddModuleModal}
              className="shine flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Module
            </button>
          </div>
        </div>

        {/* Module Modal – with Week dropdown */}
        {showModuleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setShowModuleModal(false)}>
            <form onSubmit={handleModuleSubmit} className="modal-enter bg-white rounded-2xl w-full max-w-lg border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">{editingModule ? "Edit Module" : "New Module"}</h3>
                <button type="button" onClick={() => setShowModuleModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-4">
                <select value={moduleForm.course} onChange={e => setModuleForm({ ...moduleForm, course: e.target.value })} required className={inputClass}>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="text" placeholder="Title" value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} required className={inputClass} />
                
                {/* Week dropdown */}
                <select value={moduleForm.order} onChange={e => setModuleForm({ ...moduleForm, order: e.target.value })} className={inputClass}>
                  <option value="">Select Week (optional)</option>
                  {weekOptions.map(week => (
                    <option key={week} value={week}>Week {week}</option>
                  ))}
                </select>

                <textarea
                  placeholder="Content (optional)"
                  value={moduleForm.content}
                  onChange={e => setModuleForm({ ...moduleForm, content: e.target.value })}
                  rows="3"
                  className={`${inputClass} resize-none`}
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <input type="checkbox" id="is_common" checked={moduleForm.is_common} onChange={(e) => setModuleForm({ ...moduleForm, is_common: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <label htmlFor="is_common" className="text-sm text-gray-700">Common Module (visible to all students - Foundation Weeks)</label>
                </div>
                <p className="text-gray-400 text-xs -mt-2">✅ Check this for weeks 1-8 (Foundation modules)</p>
              </div>
              <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-gray-200">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Save</button>
                <button type="button" onClick={() => setShowModuleModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Day Modal (unchanged) */}
        {showDayModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setShowDayModal(false)}>
            <form onSubmit={handleDaySubmit} className="modal-enter bg-white rounded-2xl w-full max-w-md border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">{editingDay ? "Edit Day" : "New Day"}</h3>
                <button type="button" onClick={() => setShowDayModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-4">
                <input type="text" placeholder="Title" value={dayForm.title} onChange={e => setDayForm({ ...dayForm, title: e.target.value })} required className={inputClass} />
                <textarea placeholder="Content (HTML/plain text)" value={dayForm.content} onChange={e => setDayForm({ ...dayForm, content: e.target.value })} rows="4" className={`${inputClass} resize-none`} />
              </div>
              <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-gray-200">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Save</button>
                <button type="button" onClick={() => setShowDayModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Task Modal (unchanged) */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setShowTaskModal(false)}>
            <form onSubmit={handleTaskSubmit} className="modal-enter bg-white rounded-2xl w-full max-w-md border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">{editingTask ? "Edit Task" : "New Task"}</h3>
                <button type="button" onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-4">
                <input type="text" placeholder="Title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required className={inputClass} />
                <input type="number" placeholder="Order" value={taskForm.order} onChange={e => setTaskForm({ ...taskForm, order: e.target.value })} required className={inputClass} />
                <textarea placeholder="Description (optional)" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows="3" className={`${inputClass} resize-none`} />
              </div>
              <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-gray-200">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Save</button>
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Main Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="modules-table min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">Week</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">Course</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">Title</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">Type</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">Content</th>
                <th className="px-4 py-3 text-left text-gray-500 text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedModules.map(mod => (
                <React.Fragment key={mod.id}>
                  <tr className="module-row table-row-hover group">
                    <td data-label="Week" className="px-4 py-3 text-gray-800 text-sm">{mod.order ? `Week ${mod.order}` : "—"}</td>
                    <td data-label="Course" className="px-4 py-3 text-gray-800 text-sm">{mod.course_name || mod.course?.name || "—"}</td>
                    <td data-label="Title" className="px-4 py-3 text-gray-700 text-sm break-words">{mod.title}</td>
                    <td data-label="Type" className="px-4 py-3">
                      {mod.is_common ? (
                        <span className="inline-flex bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded-full">Foundation</span>
                      ) : (
                        <span className="inline-flex bg-purple-100 text-purple-700 border border-purple-200 text-xs px-2 py-1 rounded-full">Custom</span>
                      )}
                    </td>
                    <td data-label="Content" className="px-4 py-3 text-gray-500 text-sm break-words max-w-xs">{mod.content || "—"}</td>
                    <td data-label="Actions" className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModuleModal(mod)} className="p-1.5 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setExpandedModuleId(expandedModuleId === mod.id ? null : mod.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50" title="Days">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteClick(mod.id, mod.title)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Days Row (unchanged) */}
                  {expandedModuleId === mod.id && (
                    <tr>
                      <td colSpan="6" className="px-4 py-3 bg-gray-50">
                        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                          {mod.content && (
                            <div className="mb-4 pb-3 border-b border-gray-200">
                              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Week Content</div>
                              <div className="text-gray-700 text-sm whitespace-pre-wrap break-words">{mod.content}</div>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                            <h4 className="text-sm font-semibold text-gray-800">Days</h4>
                            <button
                              onClick={() => {
                                setDayForm({ module: mod.id, title: "", content: "" });
                                setEditingDay(null);
                                setShowDayModal(true);
                              }}
                              className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Day
                            </button>
                          </div>
                          {(daysByModule[mod.id] || []).length === 0 ? (
                            <p className="text-gray-400 text-sm">No days yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {daysByModule[mod.id].map(day => (
                                <div key={day.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                  <div className="bg-white p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer hover:bg-gray-50 day-header" onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}>
                                    <div className="flex items-center gap-3 flex-wrap">
                                      {!isAdmin && (
                                        <input
                                          type="checkbox"
                                          checked={day.is_completed || false}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            toggleDayCompletion(day.id, e.target.checked);
                                          }}
                                          className="w-4 h-4 accent-green-500 cursor-pointer"
                                        />
                                      )}
                                      <p className={`text-sm font-medium break-words ${day.is_completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                                        {day.title}
                                      </p>
                                    </div>
                                    <div className="flex gap-2 day-actions" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => handleEditDay(day)} className="px-2 py-1 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 rounded">Edit</button>
                                      <button onClick={() => handleDeleteDay(day.id)} className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">Delete</button>
                                    </div>
                                  </div>
                                  {expandedDayId === day.id && (
                                    <div className="bg-gray-50 p-3 sm:p-4 pl-4 sm:pl-8 border-t border-gray-200">
                                      {day.content && (
                                        <div className="mb-3 pb-2 border-b border-gray-200">
                                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Day Content</div>
                                          <div className="text-gray-700 text-sm whitespace-pre-wrap break-words">{day.content}</div>
                                        </div>
                                      )}
                                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                                        <h5 className="text-xs font-semibold text-gray-500 uppercase">Tasks</h5>
                                        <button onClick={() => { setCurrentDayForTask(day.id); setEditingTask(null); resetTaskForm(); setTaskForm({ ...taskForm, day: day.id }); setShowTaskModal(true); }} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add Task
                                        </button>
                                      </div>
                                      {(tasksByDay[day.id] || []).length === 0 ? (
                                        <p className="text-gray-400 text-xs">No tasks yet.</p>
                                      ) : (
                                        <div className="space-y-1.5">
                                          {tasksByDay[day.id].map(task => (
                                            <div key={task.id} className="bg-white rounded p-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 task-item border border-gray-100">
                                              <div className="flex-1">
                                                <p className="text-gray-800 text-xs font-medium break-words">{task.title}</p>
                                                {task.description && <p className="text-gray-500 text-[11px] break-words">{task.description}</p>}
                                                <p className="text-gray-400 text-[10px]">Order: {task.order}</p>
                                              </div>
                                              <div className="flex gap-1 task-actions">
                                                <button onClick={() => handleEditTask(task)} className="px-1.5 py-0.5 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 rounded">Edit</button>
                                                <button onClick={() => handleDeleteTask(task.id)} className="px-1.5 py-0.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">Delete</button>
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
                <tr><td colSpan="6" className="text-center py-12 sm:py-20 text-gray-500">No modules found</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination (unchanged) */}
          {paginatedModules.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row justify-between gap-3 items-center">
              <div className="text-gray-500 text-xs">Showing {startIndex+1} to {Math.min(startIndex+itemsPerPage, totalFiltered)} of {totalFiltered} modules</div>
              <div className="flex gap-1 flex-wrap justify-center">
                <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100">←</button>
                {getPageNumbers().map((p, i) => p === "..." ? <span key={i} className="px-2 py-1.5 text-gray-400">...</span> : <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 rounded-lg text-sm ${currentPage===p ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>{p}</button>)}
                <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage===totalPages} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modules;