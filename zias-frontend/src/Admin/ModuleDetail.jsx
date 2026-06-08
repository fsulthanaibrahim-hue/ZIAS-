import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

// ---------- Toast component ----------
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
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl ${bgColor} text-white text-sm font-medium max-w-[90vw] sm:max-w-sm`}
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
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-7 mx-4">
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

function ModalWrapper({ onClose, children, maxW = "max-w-md" }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-2 sm:p-4" onClick={onClose}>
      <div className={`bg-white rounded-3xl w-full ${maxW} shadow-2xl max-h-[90vh] overflow-y-auto modal-scroll`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function DayModal({ isOpen, onClose, initialDay, onSave }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialDay?.title || "");
      setContent(initialDay?.content || "");
      if (inputRef.current) inputRef.current.focus();
    }
  }, [isOpen, initialDay]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, content });
    onClose();
  };

  if (!isOpen) return null;
  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm";
  
  return (
    <ModalWrapper onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center px-4 sm:px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{initialDay?.id ? "Edit Day" : "New Day"}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-lg transition-colors">×</button>
        </div>
        <div className="px-4 sm:px-6 py-5 space-y-3.5">
          <input ref={inputRef} type="text" placeholder="Day title (e.g., Day 1: Introduction)" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
          <textarea placeholder="Content / Topics (e.g., What will be covered today...)" value={content} onChange={(e) => setContent(e.target.value)} rows="6" className={`${inputClass} resize-none`} />
        </div>
        <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-gray-100">
          <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors">Save Day</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl transition-colors">Cancel</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function TaskModal({ isOpen, onClose, initialTask, dayId, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTask?.title || "");
      setDescription(initialTask?.description || "");
      setOrder(initialTask?.order || 0);
      if (inputRef.current) inputRef.current.focus();
    }
  }, [isOpen, initialTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, description, order, day: dayId });
    onClose();
  };

  if (!isOpen) return null;
  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm";
  
  return (
    <ModalWrapper onClose={onClose} maxW="max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center px-4 sm:px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{initialTask?.id ? "Edit Task" : "New Task"}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-lg transition-colors">×</button>
        </div>
        <div className="px-4 sm:px-6 py-5 space-y-3.5">
          <input ref={inputRef} type="text" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
          <textarea placeholder="Description / Instructions" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className={`${inputClass} resize-none`} />
          <input type="number" placeholder="Order (optional)" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} className={inputClass} />
        </div>
        <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-gray-100">
          <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors">Save Task</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl transition-colors">Cancel</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ---------- Main component ----------
function ModuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [days, setDays] = useState([]);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState({});
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const hideToast = () => setToast(null);
  
  // Refs to prevent duplicate calls
  const initialFetchDone = useRef(false);
  const isFetching = useRef(false);

  const [dayModal, setDayModal] = useState({ isOpen: false, initialDay: null });
  const [showDayConfirm, setShowDayConfirm] = useState(false);
  const [dayToDelete, setDayToDelete] = useState(null);
  
  const [taskModal, setTaskModal] = useState({ isOpen: false, initialTask: null, dayId: null });
  const [showTaskConfirm, setShowTaskConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch all data in one go - optimized
  const fetchAllData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    
    try {
      // Fetch module, days, and tasks in parallel
      const [moduleRes, daysRes, tasksRes] = await Promise.all([
        API.get(`modules/${id}/`),
        API.get(`days/?module=${id}`),
        API.get(`tasks/`)
      ]);
      
      setModule(moduleRes.data);
      
      const daysArray = daysRes.data.results || daysRes.data;
      const sortedDays = Array.isArray(daysArray) ? daysArray.sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
      setDays(sortedDays);
      
      // Organize tasks by day
      const tasksArray = tasksRes.data.results || tasksRes.data;
      const tasksByDay = {};
      if (Array.isArray(tasksArray)) {
        tasksArray.forEach(task => {
          const dayId = task.day;
          if (!tasksByDay[dayId]) {
            tasksByDay[dayId] = [];
          }
          tasksByDay[dayId].push(task);
        });
        // Sort tasks by order
        Object.keys(tasksByDay).forEach(dayId => {
          tasksByDay[dayId].sort((a, b) => (a.order || 0) - (b.order || 0));
        });
      }
      setTasks(tasksByDay);
      
      // Initialize expanded state - first day expanded by default
      const initialExpanded = {};
      if (sortedDays.length > 0) {
        initialExpanded[sortedDays[0].id] = true;
      }
      setExpandedDays(initialExpanded);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      showToast("Failed to load module data", "error");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [id]);

  // Single initial fetch
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchAllData();
    }
  }, [fetchAllData]);

  const toggleDayExpand = (dayId) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayId]: !prev[dayId]
    }));
  };

  const handleDaySave = async (dayData) => {
    const payload = { module: id, title: dayData.title, content: dayData.content, order: days.length };
    try {
      if (dayModal.initialDay?.id) {
        await API.patch(`days/${dayModal.initialDay.id}/`, payload);
        showToast("Day updated");
      } else {
        if (days.length >= 7) {
          showToast("This week already has 7 days. Cannot add more.", "error");
          return;
        }
        await API.post("days/", payload);
        showToast("Day added");
      }
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast("Error saving day", "error");
    }
  };

  const deleteDay = async () => {
    if (!dayToDelete) return;
    try {
      await API.delete(`days/${dayToDelete.id}/`);
      showToast("Day deleted", "success");
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete day", "error");
    } finally {
      setShowDayConfirm(false);
      setDayToDelete(null);
    }
  };

  const handleTaskSave = async (taskData) => {
    try {
      if (taskModal.initialTask?.id) {
        await API.patch(`tasks/${taskModal.initialTask.id}/`, taskData);
        showToast("Task updated");
      } else {
        await API.post("tasks/", taskData);
        showToast("Task added");
      }
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast("Error saving task", "error");
    }
  };

  const deleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await API.delete(`tasks/${taskToDelete.id}/`);
      showToast("Task deleted", "success");
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete task", "error");
    } finally {
      setShowTaskConfirm(false);
      setTaskToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Module not found.</p>
          <button onClick={() => navigate("/admin/modules")} className="text-emerald-600 hover:text-emerald-700 font-medium">← Back to Modules</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        button, [role="button"] { min-height: 44px; cursor: pointer; }
        .modal-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f1f5f9; }
        .modal-scroll::-webkit-scrollbar { width: 6px; }
        .modal-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .modal-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <ConfirmDeleteModal
        isOpen={showDayConfirm}
        onClose={() => setShowDayConfirm(false)}
        onConfirm={deleteDay}
        title="Delete Day?"
        message={`Are you sure you want to delete "${dayToDelete?.title}" and all its tasks?`}
      />

      <ConfirmDeleteModal
        isOpen={showTaskConfirm}
        onClose={() => setShowTaskConfirm(false)}
        onConfirm={deleteTask}
        title="Delete Task?"
        message={`Are you sure you want to delete "${taskToDelete?.title}"?`}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <button 
              onClick={() => navigate("/admin/modules")} 
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors text-sm sm:text-base w-fit px-2 py-2 -ml-2"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Modules
            </button>

            {/* Mobile Menu Toggle */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Menu
              </button>
            </div>

            {/* Add Day Button */}
            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:flex`}>
              <button
                onClick={() => setDayModal({ isOpen: true, initialDay: null })}
                disabled={days.length >= 7}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto ${
                  days.length >= 7 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg active:scale-95"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Day ({days.length}/7)
              </button>
            </div>
          </div>
          
          {/* Module Info */}
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 break-words">{module.title}</h1>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
                </svg>
                {module.course_name || module.course?.name || "—"}
              </span>
              {module.order && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Week {module.order}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Days with Expand/Collapse */}
        <div className="space-y-4">
          {days.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-center">No days yet. Click "Add Day" to get started.</p>
                <p className="text-gray-300 text-sm">Each day can contain topics (content) and tasks for students.</p>
              </div>
            </div>
          ) : (
            days.map((day, idx) => {
              const dayTasks = tasks[day.id] || [];
              const isExpanded = expandedDays[day.id];
              
              return (
                <div key={day.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Day Header - Click to Expand/Collapse */}
                  <div 
                    className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-50 to-white cursor-pointer hover:bg-emerald-50/50 transition-colors"
                    onClick={() => toggleDayExpand(day.id)}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          <svg className={`w-5 h-5 text-emerald-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-md">
                            {idx + 1}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-800 break-words">
                          {day.title}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          {dayTasks.length} Task{dayTasks.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => setDayModal({ isOpen: true, initialDay: day })}
                          className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Edit Day"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setDayToDelete(day); setShowDayConfirm(true); }}
                          className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete Day"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                      {/* Day Content / Topics */}
                      {day.content && (
                        <div className="px-5 sm:px-6 py-4 bg-gray-50 border-b border-gray-100">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words flex-1">
                              {day.content}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tasks Section */}
                      <div className="px-5 sm:px-6 py-4">
                        {/* Add Task Button */}
                        <button
                          onClick={() => setTaskModal({ isOpen: true, initialTask: null, dayId: day.id })}
                          className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Task
                        </button>

                        {/* Tasks List */}
                        {dayTasks.length === 0 ? (
                          <div className="text-center py-6 bg-gray-50 rounded-xl">
                            <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-gray-400 text-sm">No tasks yet. Click "Add Task" to create one.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dayTasks.map((task, taskIdx) => (
                              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-start gap-3 flex-1">
                                  <span className="text-xs text-gray-400 font-mono mt-0.5">{taskIdx + 1}.</span>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                                    {task.description && (
                                      <p className="text-gray-500 text-xs mt-0.5">{task.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 ml-4">
                                  <button
                                    onClick={() => setTaskModal({ isOpen: true, initialTask: task, dayId: day.id })}
                                    className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                    title="Edit Task"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => { setTaskToDelete(task); setShowTaskConfirm(true); }}
                                    className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                    title="Delete Task"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <DayModal
        isOpen={dayModal.isOpen}
        onClose={() => setDayModal({ isOpen: false, initialDay: null })}
        initialDay={dayModal.initialDay}
        onSave={handleDaySave}
      />

      <TaskModal
        isOpen={taskModal.isOpen}
        onClose={() => setTaskModal({ isOpen: false, initialTask: null, dayId: null })}
        initialTask={taskModal.initialTask}
        dayId={taskModal.dayId}
        onSave={handleTaskSave}
      />
    </div>
  );
}

export default ModuleDetail;