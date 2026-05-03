// src/Admin/Modules.jsx – dynamic week dropdown + course filter from URL
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/api";

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

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-7 mx-4" style={{ animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModuleDeleteModal({ isOpen, onClose, onConfirm, moduleTitle }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-7 mx-4" style={{ animation: "modalIn 0.2s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Module?</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          <span className="font-semibold text-gray-700">"{moduleTitle}"</span> and all its days & tasks will be permanently removed.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, variant = "blue" }) {
  const variants = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    gray: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${variants[variant]}`}>
      {children}
    </span>
  );
}

const ModalWrapper = ({ onClose, children, maxW = "max-w-lg" }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
    <div className={`bg-white rounded-3xl w-full ${maxW} shadow-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// Day Modal
function DayModal({ isOpen, onClose, initialDay, onSave }) {
  const [title, setTitle] = useState(initialDay?.title || "");
  const [content, setContent] = useState(initialDay?.content || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, content });
    onClose();
  };

  if (!isOpen) return null;
  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm";
  return (
    <ModalWrapper onClose={onClose} maxW="max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{initialDay?.id ? "Edit Day" : "New Day"}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-lg">×</button>
        </div>
        <div className="px-6 py-5 space-y-3.5">
          <input ref={inputRef} type="text" placeholder="Day title" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
          <textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} rows="4" className={`${inputClass} resize-none`} />
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors">Save Day</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl">Cancel</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// Task Modal
function TaskModal({ isOpen, onClose, initialTask, onSave }) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [order, setOrder] = useState(initialTask?.order || 0);
  const [description, setDescription] = useState(initialTask?.description || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, order: parseInt(order), description });
    onClose();
  };

  if (!isOpen) return null;
  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm";
  return (
    <ModalWrapper onClose={onClose} maxW="max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{initialTask?.id ? "Edit Task" : "New Task"}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-lg">×</button>
        </div>
        <div className="px-6 py-5 space-y-3.5">
          <input ref={inputRef} type="text" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
          <input type="number" placeholder="Order" value={order} onChange={(e) => setOrder(e.target.value)} required className={inputClass} />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className={`${inputClass} resize-none`} />
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors">Save Task</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl">Cancel</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function Modules() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get("course_id");

  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ course: "", title: "", content: "", is_common: true, order: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [daysByModule, setDaysByModule] = useState({});
  const [dayModal, setDayModal] = useState({ isOpen: false, initialDay: null, moduleId: null });

  const [expandedDayId, setExpandedDayId] = useState(null);
  const [tasksByDay, setTasksByDay] = useState({});
  const [taskModal, setTaskModal] = useState({ isOpen: false, initialTask: null, dayId: null });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Delete confirmation states
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [showModuleConfirmModal, setShowModuleConfirmModal] = useState(false);
  const [dayToDelete, setDayToDelete] = useState(null);
  const [showDayConfirmModal, setShowDayConfirmModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showTaskConfirmModal, setShowTaskConfirmModal] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const hideToast = () => setToast(null);
  const fetched = useRef(false);

  // Dynamic week options based on selected course's duration
  const [weekOptions, setWeekOptions] = useState([]);
  const maxWeeksDefault = 52;

  const getCourseDuration = (courseId) => {
    const course = courses.find(c => c.id == courseId);
    return course?.duration ? parseInt(course.duration) : maxWeeksDefault;
  };

  // When course selection changes, update weekOptions
  useEffect(() => {
    if (moduleForm.course) {
      const duration = getCourseDuration(moduleForm.course);
      const options = Array.from({ length: duration }, (_, i) => i + 1);
      setWeekOptions(options);
      if (moduleForm.order && parseInt(moduleForm.order) > duration) {
        setModuleForm(prev => ({ ...prev, order: "" }));
      }
    } else {
      setWeekOptions(Array.from({ length: maxWeeksDefault }, (_, i) => i + 1));
    }
  }, [moduleForm.course, courses]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  const fetchModules = () =>
    API.get("modules/")
      .then(res => {
        const modulesArray = res.data.results || res.data;
        setModules(Array.isArray(modulesArray) ? modulesArray : []);
      })
      .catch(() => showToast("Failed to load modules", "error"))
      .finally(() => setLoading(false));

  const fetchCourses = () =>
    API.get("courses/")
      .then(res => {
        const coursesArray = res.data.results || res.data;
        setCourses(Array.isArray(coursesArray) ? coursesArray : []);
      })
      .catch(() => showToast("Failed to load courses", "error"));

  const fetchDays = async (moduleId) => {
    const numId = Number(moduleId);
    if (isNaN(numId)) return;
    try {
      const res = await API.get(`days/?module=${numId}`);
      const daysArray = res.data.results || res.data;
      setDaysByModule(prev => ({ ...prev, [numId]: daysArray }));
    } catch { showToast("Failed to load days", "error"); }
  };

  const fetchTasks = async (dayId) => {
    const numId = Number(dayId);
    if (isNaN(numId)) return;
    try {
      const res = await API.get(`tasks/?day=${numId}`);
      const tasksArray = res.data.results || res.data;
      setTasksByDay(prev => ({ ...prev, [numId]: tasksArray }));
    } catch { showToast("Failed to load tasks", "error"); }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    Promise.all([fetchModules(), fetchCourses()]).catch(() => {});
  }, []);

  useEffect(() => {
    if (expandedModuleId != null) {
      const numId = Number(expandedModuleId);
      if (!daysByModule[numId]) fetchDays(numId);
    }
  }, [expandedModuleId]);

  useEffect(() => {
    if (expandedDayId != null) {
      const numId = Number(expandedDayId);
      if (!tasksByDay[numId]) fetchTasks(numId);
    }
  }, [expandedDayId]);

  const resetModuleForm = () => {
    setModuleForm({ course: "", title: "", content: "", is_common: true, order: "" });
  };

  const openAddModuleModal = () => {
    setEditingModule(null);
    resetModuleForm();
    setShowModuleModal(true);
  };
  const openEditModuleModal = (mod) => {
    setEditingModule(mod);
    const courseId = mod.course;
    const duration = getCourseDuration(courseId);
    setWeekOptions(Array.from({ length: duration }, (_, i) => i + 1));
    setModuleForm({
      course: mod.course,
      title: mod.title,
      content: mod.content || "",
      is_common: mod.is_common ?? true,
      order: mod.order ? mod.order.toString() : ""
    });
    setShowModuleModal(true);
  };

  const handleDeleteClick = (moduleId, moduleTitle) => {
    setModuleToDelete({ id: moduleId, title: moduleTitle });
    setShowModuleConfirmModal(true);
  };
  const confirmDeleteModule = async () => {
    if (!moduleToDelete) return;
    try {
      await API.delete(`modules/${moduleToDelete.id}/`);
      showToast("Module deleted", "success");
      if (Number(expandedModuleId) === Number(moduleToDelete.id)) setExpandedModuleId(null);
      setDaysByModule({});
      fetchModules();
    } catch { showToast("Failed to delete module", "error"); }
    finally { setShowModuleConfirmModal(false); setModuleToDelete(null); }
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
        showToast("Module updated");
      } else {
        await API.post("modules/", payload);
        showToast("Module added");
      }
      setShowModuleModal(false);
      setEditingModule(null);
      resetModuleForm();
      setExpandedModuleId(null);
      setExpandedDayId(null);
      setDaysByModule({});
      setTasksByDay({});
      fetchModules();
    } catch { showToast("Error saving module", "error"); }
  };

  const handleDaySave = async (dayData) => {
    const { title, content } = dayData;
    const moduleId = Number(dayModal.moduleId);
    if (!moduleId) return;
    const payload = { module: moduleId, title, content, order: 0 };
    try {
      if (dayModal.initialDay?.id) {
        await API.patch(`days/${dayModal.initialDay.id}/`, payload);
        showToast("Day updated");
      } else {
        await API.post("days/", payload);
        showToast("Day added");
      }
      if (expandedModuleId) fetchDays(Number(expandedModuleId));
    } catch { showToast("Error saving day", "error"); }
  };

  const openAddDayModal = (moduleId) => {
    setDayModal({ isOpen: true, initialDay: null, moduleId: Number(moduleId) });
  };
  const openEditDayModal = (day) => {
    setDayModal({ isOpen: true, initialDay: day, moduleId: Number(day.module) });
  };

  const handleDeleteDayClick = (dayId, dayTitle) => {
    setDayToDelete({ id: dayId, title: dayTitle });
    setShowDayConfirmModal(true);
  };
  const confirmDeleteDay = async () => {
    if (!dayToDelete) return;
    try {
      await API.delete(`days/${dayToDelete.id}/`);
      showToast("Day deleted", "success");
      if (expandedModuleId) fetchDays(Number(expandedModuleId));
    } catch { showToast("Delete failed", "error"); }
    finally { setShowDayConfirmModal(false); setDayToDelete(null); }
  };

  const toggleDayCompletion = async (dayId, completed) => {
    try {
      await API.patch(`days/${dayId}/`, { is_completed: completed });
      showToast(completed ? "Day completed" : "Day marked incomplete");
      if (expandedModuleId) fetchDays(Number(expandedModuleId));
    } catch { showToast("Failed to update", "error"); }
  };

  const handleTaskSave = async (taskData) => {
    const dayId = Number(taskModal.dayId);
    if (!dayId) return;
    const payload = { day: dayId, title: taskData.title, order: taskData.order, description: taskData.description };
    try {
      if (taskModal.initialTask?.id) {
        await API.patch(`tasks/${taskModal.initialTask.id}/`, payload);
        showToast("Task updated");
      } else {
        await API.post("tasks/", payload);
        showToast("Task added");
      }
      if (expandedDayId) fetchTasks(expandedDayId);
    } catch { showToast("Error saving task", "error"); }
  };

  const openAddTaskModal = (dayId) => {
    setTaskModal({ isOpen: true, initialTask: null, dayId: Number(dayId) });
  };
  const openEditTaskModal = (task) => {
    setTaskModal({ isOpen: true, initialTask: task, dayId: Number(task.day) });
  };

  const handleDeleteTaskClick = (taskId, taskTitle) => {
    setTaskToDelete({ id: taskId, title: taskTitle });
    setShowTaskConfirmModal(true);
  };
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await API.delete(`tasks/${taskToDelete.id}/`);
      showToast("Task deleted", "success");
      if (expandedDayId) fetchTasks(expandedDayId);
    } catch { showToast("Delete failed", "error"); }
    finally { setShowTaskConfirmModal(false); setTaskToDelete(null); }
  };

  // Filter modules: by search term AND by course_id from URL
  let filteredModules = modules.filter(mod => {
    const matchSearch = mod.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mod.course_name || mod.course?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchCourse = courseIdFromUrl ? (mod.course == courseIdFromUrl) : true;
    return matchSearch && matchCourse;
  });

  const totalFiltered = filteredModules.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedModules = filteredModules.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push("..."); pages.push(totalPages); }
    else if (currentPage >= totalPages - 2) { pages.push(1); pages.push("..."); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
    else { pages.push(1); pages.push("..."); for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); pages.push("..."); pages.push(totalPages); }
    return pages;
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm";
  const isAdmin = user?.is_admin === true;

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading modules…</p>
        </div>
      </div>
    );
  }

  // Get course name for display if filtered
  const filteredCourseName = courseIdFromUrl
    ? courses.find(c => c.id == courseIdFromUrl)?.name
    : null;

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800" style={{ fontFamily: "'DM Sans', 'Geist', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.10); }
        .module-card { animation: fadeUp 0.3s ease both; }
        .week-pill { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .task-chip { background: #f0fdf4; border: 1px solid #d1fae5; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <ConfirmModuleDeleteModal
        isOpen={showModuleConfirmModal}
        onClose={() => setShowModuleConfirmModal(false)}
        onConfirm={confirmDeleteModule}
        moduleTitle={moduleToDelete?.title}
      />
      <ConfirmDeleteModal
        isOpen={showDayConfirmModal}
        onClose={() => setShowDayConfirmModal(false)}
        onConfirm={confirmDeleteDay}
        title="Delete Day?"
        message={`Are you sure you want to delete "${dayToDelete?.title}"? All tasks inside will be deleted.`}
      />
      <ConfirmDeleteModal
        isOpen={showTaskConfirmModal}
        onClose={() => setShowTaskConfirmModal(false)}
        onConfirm={confirmDeleteTask}
        title="Delete Task?"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
      />

      {/* Module Modal */}
      {showModuleModal && (
        <ModalWrapper onClose={() => setShowModuleModal(false)}>
          <form onSubmit={handleModuleSubmit}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
              <div><h3 className="text-base font-bold">{editingModule ? "Edit Module" : "New Module"}</h3><p className="text-xs text-gray-400">Fill in the module details</p></div>
              <button type="button" onClick={() => setShowModuleModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-lg">×</button>
            </div>
            <div className="px-6 py-5 space-y-3.5">
              <select value={moduleForm.course} onChange={e => setModuleForm({ ...moduleForm, course: e.target.value })} required className={inputClass}>
                <option value="">Select Course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="text" placeholder="Module title" value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} required className={inputClass} />
              <select value={moduleForm.order} onChange={e => setModuleForm({ ...moduleForm, order: e.target.value })} className={inputClass}>
                <option value="">Select Week (optional)</option>
                {weekOptions.map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
              <textarea placeholder="Content (optional)" value={moduleForm.content} onChange={e => setModuleForm({ ...moduleForm, content: e.target.value })} rows="3" className={`${inputClass} resize-none`} />
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-emerald-50">
                <input type="checkbox" checked={moduleForm.is_common} onChange={(e) => setModuleForm({ ...moduleForm, is_common: e.target.checked })} className="w-4 h-4 rounded border-gray-300 accent-emerald-500" />
                <div><p className="text-sm font-medium text-gray-700">Foundation Module</p><p className="text-xs text-gray-400">Visible to all students (weeks 1–8)</p></div>
              </label>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
              <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-medium text-sm">Save Module</button>
              <button type="button" onClick={() => setShowModuleModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl">Cancel</button>
            </div>
          </form>
        </ModalWrapper>
      )}

      <DayModal isOpen={dayModal.isOpen} onClose={() => setDayModal({ isOpen: false, initialDay: null, moduleId: null })} initialDay={dayModal.initialDay} onSave={handleDaySave} />
      <TaskModal isOpen={taskModal.isOpen} onClose={() => setTaskModal({ isOpen: false, initialTask: null, dayId: null })} initialTask={taskModal.initialTask} onSave={handleTaskSave} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header with back button if filtered */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              {courseIdFromUrl && (
                <button
                  onClick={() => navigate("/admin/courses")}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back to Courses
                </button>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-2">Modules</h1>
            {courseIdFromUrl && filteredCourseName && (
              <p className="text-gray-500 text-sm mt-1">Showing modules for <span className="font-medium">{filteredCourseName}</span></p>
            )}
            <p className="text-gray-400 text-sm mt-0.5">{filteredModules.length} total · {filteredModules.length} shown</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
              <input type="text" placeholder="Search modules…" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64 bg-white border border-gray-200 rounded-xl pl-10 pr-9 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm shadow-sm" />
              {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">✕</button>}
            </div>
            <button onClick={openAddModuleModal} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/30 transition-all active:scale-95">+ Add Module</button>
          </div>
        </div>

        {/* Card Grid */}
        {paginatedModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center"><svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg></div>
            <p className="text-gray-400 font-medium">No modules found</p>
            {searchTerm && <button onClick={() => setSearchTerm("")} className="text-emerald-500 text-sm hover:underline">Clear search</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {paginatedModules.map((mod, idx) => (
              <ModuleCard
                key={mod.id}
                mod={mod}
                idx={idx}
                isAdmin={isAdmin}
                expandedModuleId={expandedModuleId}
                setExpandedModuleId={setExpandedModuleId}
                expandedDayId={expandedDayId}
                setExpandedDayId={setExpandedDayId}
                daysByModule={daysByModule}
                tasksByDay={tasksByDay}
                openEditModuleModal={openEditModuleModal}
                handleDeleteClick={handleDeleteClick}
                openAddDayModal={openAddDayModal}
                openEditDayModal={openEditDayModal}
                handleDeleteDayClick={handleDeleteDayClick}
                toggleDayCompletion={toggleDayCompletion}
                openAddTaskModal={openAddTaskModal}
                openEditTaskModal={openEditTaskModal}
                handleDeleteTaskClick={handleDeleteTaskClick}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {paginatedModules.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white rounded-2xl border border-gray-200 px-5 py-3.5 shadow-sm">
            <p className="text-gray-400 text-xs">Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered}</p>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100">←</button>
              {getPageNumbers().map((p, i) => p === "..." ? <span key={i} className="px-2 py-1.5 text-gray-400">…</span> : <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === p ? "bg-emerald-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>{p}</button>)}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ModuleCard (unchanged from original)
function ModuleCard({
  mod, idx, isAdmin,
  expandedModuleId, setExpandedModuleId,
  expandedDayId, setExpandedDayId,
  daysByModule, tasksByDay,
  openEditModuleModal, handleDeleteClick,
  openAddDayModal, openEditDayModal, handleDeleteDayClick, toggleDayCompletion,
  openAddTaskModal, openEditTaskModal, handleDeleteTaskClick
}) {
  const modIdNum = Number(mod.id);
  const isExpanded = expandedModuleId === modIdNum;
  const days = daysByModule[modIdNum] || [];
  const dayCount = days.length;

  const accents = [
    { border: "border-t-emerald-400", icon: "bg-emerald-100 text-emerald-600" },
    { border: "border-t-blue-400", icon: "bg-blue-100 text-blue-600" },
    { border: "border-t-violet-400", icon: "bg-violet-100 text-violet-600" },
    { border: "border-t-amber-400", icon: "bg-amber-100 text-amber-600" },
    { border: "border-t-rose-400", icon: "bg-rose-100 text-rose-600" },
    { border: "border-t-cyan-400", icon: "bg-cyan-100 text-cyan-600" },
  ];
  const accent = accents[(typeof mod.course === "number" ? mod.course : parseInt(mod.course) || 0) % accents.length];

  return (
    <div className={`module-card bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden card-hover border-t-4 ${accent.border} flex flex-col`} style={{ animationDelay: `${idx * 0.05}s` }}>
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {mod.order && <span className="week-pill text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">W{mod.order}</span>}
            <Badge variant={mod.is_common ? "blue" : "purple"}>{mod.is_common ? "Foundation" : "Custom"}</Badge>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => openEditModuleModal(mod)} title="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button onClick={() => handleDeleteClick(mod.id, mod.title)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1.5">{mod.title}</h3>
        <p className="text-xs text-gray-400 font-medium mb-3">{mod.course_name || mod.course?.name || "No Course"}</p>
        {mod.content && <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{mod.content}</p>}
      </div>

      <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50/60">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {isExpanded && dayCount > 0 ? `${dayCount} day${dayCount !== 1 ? "s" : ""}` : "Days"}
        </div>
        <button onClick={() => setExpandedModuleId(isExpanded ? null : modIdNum)} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
          {isExpanded ? "Hide" : "View Days"}
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      <div className="grid transition-all duration-300 ease-in-out" style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            {mod.content && (
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Week Content</p>
                <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap">{mod.content}</p>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Days</p>
              <button onClick={() => openAddDayModal(mod.id)} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>Add Day
              </button>
            </div>
            {days.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-4">No days yet. Add one above.</p>
            ) : (
              <div className="space-y-2">
                {days.map(day => (
                  <DayItem
                    key={day.id}
                    day={day}
                    isAdmin={isAdmin}
                    expandedDayId={expandedDayId}
                    setExpandedDayId={setExpandedDayId}
                    tasksByDay={tasksByDay}
                    openEditDayModal={openEditDayModal}
                    handleDeleteDayClick={handleDeleteDayClick}
                    toggleDayCompletion={toggleDayCompletion}
                    openAddTaskModal={openAddTaskModal}
                    openEditTaskModal={openEditTaskModal}
                    handleDeleteTaskClick={handleDeleteTaskClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayItem({ day, isAdmin, expandedDayId, setExpandedDayId, tasksByDay, openEditDayModal, handleDeleteDayClick, toggleDayCompletion, openAddTaskModal, openEditTaskModal, handleDeleteTaskClick }) {
  const dayIdNum = Number(day.id);
  const isExpanded = expandedDayId === dayIdNum;
  const tasks = tasksByDay[dayIdNum] || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedDayId(isExpanded ? null : dayIdNum)}>
        {!isAdmin && (
          <input type="checkbox" checked={day.is_completed || false} onChange={(e) => { e.stopPropagation(); toggleDayCompletion(day.id, e.target.checked); }} className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer shrink-0" />
        )}
        <p className={`flex-1 text-sm font-medium ${day.is_completed ? "line-through text-gray-400" : "text-gray-800"}`}>{day.title}</p>
        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          <button onClick={() => openEditDayModal(day)} className="p-1 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 text-[10px] transition-colors">Edit</button>
          <button onClick={() => handleDeleteDayClick(day.id, day.title)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 text-[10px] transition-colors">Del</button>
        </div>
        <svg className={`w-3 h-3 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
      </div>
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 py-3">
          {day.content && (
            <div className="mb-2 pb-2 border-b border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Day Content</p>
              <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap">{day.content}</p>
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tasks</p>
            <button onClick={() => openAddTaskModal(day.id)} className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>Add Task
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-gray-400 text-[11px] text-center py-2">No tasks yet.</p>
          ) : (
            <div className="space-y-1.5">
              {tasks.map(task => (
                <div key={task.id} className="task-chip rounded-lg px-3 py-2 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-xs font-semibold truncate">{task.title}</p>
                    {task.description && <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-2">{task.description}</p>}
                    <p className="text-gray-400 text-[10px] mt-0.5">#{task.order}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button onClick={() => openEditTaskModal(task)} className="p-1 rounded text-gray-400 hover:text-emerald-600 hover:bg-white text-[10px] transition-colors">Edit</button>
                    <button onClick={() => handleDeleteTaskClick(task.id, task.title)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-white text-[10px] transition-colors">Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Modules;