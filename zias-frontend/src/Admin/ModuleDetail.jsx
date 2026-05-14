// src/Admin/ModuleDetail.jsx – with icon buttons for edit/delete
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

// ---------- Toast & Modal components (unchanged) ----------
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-white rounded-3xl w-full ${maxW} shadow-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
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
    <ModalWrapper onClose={onClose}>
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

// ---------- Main component with icon buttons ----------
function ModuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const hideToast = () => setToast(null);

  const [dayModal, setDayModal] = useState({ isOpen: false, initialDay: null });
  const [taskModal, setTaskModal] = useState({ isOpen: false, initialTask: null, dayId: null });
  const [expandedDayId, setExpandedDayId] = useState(null);
  const [tasksByDay, setTasksByDay] = useState({});
  const [showDayConfirm, setShowDayConfirm] = useState(false);
  const [dayToDelete, setDayToDelete] = useState(null);
  const [showTaskConfirm, setShowTaskConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    fetchModule();
    fetchDays();
  }, [id]);

  const fetchModule = async () => {
    try {
      const res = await API.get(`modules/${id}/`);
      setModule(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load module", "error");
    }
  };

  const fetchDays = async () => {
    try {
      const res = await API.get(`days/?module=${id}`);
      const daysArray = res.data.results || res.data;
      setDays(Array.isArray(daysArray) ? daysArray : []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load days", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (dayId) => {
    try {
      const res = await API.get(`tasks/?day=${dayId}`);
      const tasksArray = res.data.results || res.data;
      setTasksByDay(prev => ({ ...prev, [dayId]: tasksArray }));
    } catch (err) {
      console.error(err);
      showToast("Failed to load tasks", "error");
    }
  };

  const handleDaySave = async (dayData) => {
    const payload = { module: id, title: dayData.title, content: dayData.content, order: 0 };
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
      fetchDays();
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
      fetchDays();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete day", "error");
    } finally {
      setShowDayConfirm(false);
      setDayToDelete(null);
    }
  };

  const handleTaskSave = async (taskData) => {
    const dayId = taskModal.dayId;
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
      if (expandedDayId) fetchTasks(expandedDayId);
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
      <div className="p-8 text-center">
        <p>Module not found.</p>
        <button onClick={() => navigate("/admin/modules")} className="mt-4 text-emerald-600">← Back to Modules</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmDeleteModal
        isOpen={showDayConfirm}
        onClose={() => setShowDayConfirm(false)}
        onConfirm={deleteDay}
        title="Delete Day?"
        message={`Are you sure you want to delete "${dayToDelete?.title}"? This will also delete all its tasks.`}
      />
      <ConfirmDeleteModal
        isOpen={showTaskConfirm}
        onClose={() => setShowTaskConfirm(false)}
        onConfirm={deleteTask}
        title="Delete Task?"
        message={`Are you sure you want to delete "${taskToDelete?.title}"?`}
      />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate("/admin/modules")} className="text-emerald-600 hover:underline">← Back to Modules</button>
          <h1 className="text-2xl font-bold text-gray-800">{module.title}</h1>
        </div>

        <div className="mb-6">
          <p className="text-gray-500">Course: {module.course_name || module.course?.name || "—"}</p>
          {module.order && <p className="text-gray-500">Week: {module.order}</p>}
          {module.content && <div className="mt-2 p-3 bg-white rounded-xl border"><p className="text-gray-700 whitespace-pre-wrap">{module.content}</p></div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Days ({days.length}/7)</h2>
            <button
              onClick={() => setDayModal({ isOpen: true, initialDay: null })}
              disabled={days.length >= 7}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${days.length >= 7 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
            >
              + Add Day
            </button>
          </div>

          {days.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No days yet. Add your first day above.</p>
          ) : (
            <div className="space-y-3">
              {days.map((day, idx) => {
                const tasks = tasksByDay[day.id] || [];
                const isExpanded = expandedDayId === day.id;
                return (
                  <div key={day.id} className="border rounded-xl overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        if (isExpanded) setExpandedDayId(null);
                        else {
                          setExpandedDayId(day.id);
                          if (!tasksByDay[day.id]) fetchTasks(day.id);
                        }
                      }}
                    >
                      <div className="flex-1">
                        <p className="font-medium">Day {idx + 1}: {day.title}</p>
                        {day.content && <p className="text-gray-500 text-sm mt-1">{day.content}</p>}
                      </div>
                      <div className="flex gap-3">
                        {/* Edit icon */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setDayModal({ isOpen: true, initialDay: day }); }}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Edit day"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {/* Delete icon */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setDayToDelete(day); setShowDayConfirm(true); }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete day"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-3 bg-gray-50 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-bold text-gray-500 uppercase">Tasks</p>
                          <button
                            onClick={() => setTaskModal({ isOpen: true, initialTask: null, dayId: day.id })}
                            className="text-xs font-semibold text-emerald-600"
                          >
                            + Add Task
                          </button>
                        </div>
                        {tasks.length === 0 ? (
                          <p className="text-gray-400 text-sm">No tasks yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {tasks.map(task => (
                              <div key={task.id} className="bg-white p-3 rounded-lg border flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{task.title}</p>
                                  {task.description && <p className="text-gray-500 text-xs mt-0.5">{task.description}</p>}
                                  <p className="text-gray-400 text-xs mt-0.5">Order: {task.order}</p>
                                </div>
                                <div className="flex gap-3">
                                  {/* Edit icon for task */}
                                  <button
                                    onClick={() => setTaskModal({ isOpen: true, initialTask: task, dayId: day.id })}
                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                    title="Edit task"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  {/* Delete icon for task */}
                                  <button
                                    onClick={() => { setTaskToDelete(task); setShowTaskConfirm(true); }}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title="Delete task"
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
                    )}
                  </div>
                );
              })}
            </div>
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
        onSave={handleTaskSave}
      />
    </div>
  );
}

export default ModuleDetail;