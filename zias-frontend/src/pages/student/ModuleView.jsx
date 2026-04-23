// src/pages/student/ModuleView.jsx (light theme)
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../api/api";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-emerald-600" : "bg-red-600";
  const icon = type === "success" ? "✓" : "✕";

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">×</button>
    </div>
  );
}

function ModuleView() {
  const { moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDayId, setExpandedDayId] = useState(null);
  const [tasksByDay, setTasksByDay] = useState({});
  const [toast, setToast] = useState(null);
  const [completing, setCompleting] = useState(false);
  const showToast = (msg, type) => setToast({ message: msg, type });
  const hideToast = () => setToast(null);

  const fetchModule = async () => {
    try {
      const res = await API.get(`modules/${moduleId}/`);
      setModule(res.data);
    } catch (err) {
      showToast("Failed to load module", "error");
    }
  };

  const fetchDays = async () => {
    try {
      const res = await API.get(`days/?module=${moduleId}`);
      setDays(res.data);
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

  const toggleDayCompletion = async (dayId, completed) => {
    try {
      await API.patch(`days/${dayId}/`, { is_completed: completed });
      showToast(completed ? "Day marked as completed" : "Day marked as incomplete", "success");
      await fetchDays();
    } catch (err) {
      showToast("Failed to update", "error");
    }
  };

  const toggleTaskCompletion = async (taskId, completed) => {
    try {
      await API.patch(`tasks/${taskId}/`, { is_completed: completed });
      showToast(completed ? "Task completed" : "Task uncompleted", "success");
      if (expandedDayId) fetchTasks(expandedDayId);
    } catch (err) {
      showToast("Failed to update task", "error");
    }
  };

  const completeModule = async () => {
    setCompleting(true);
    try {
      await API.post(`modules/${moduleId}/complete/`);
      showToast("Module completed! Next module will unlock.", "success");
      setTimeout(() => window.location.href = "/student/dashboard", 2000);
    } catch (err) {
      showToast("Failed to mark module as completed", "error");
    } finally {
      setCompleting(false);
    }
  };

  const allDaysCompleted = days.length > 0 && days.every(day => day.is_completed === true);
  const isModuleCompleted = module?.is_completed || false;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchModule();
      await fetchDays();
      setLoading(false);
    };
    loadData();
  }, [moduleId]);

  useEffect(() => {
    if (expandedDayId) {
      fetchTasks(expandedDayId);
    }
  }, [expandedDayId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 flex items-center justify-center">
        Module not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-4xl mx-auto">
        <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{module.title}</h1>
          {module.content && (
            <div className="mt-3 text-gray-600 whitespace-pre-wrap">{module.content}</div>
          )}
          {module.is_common && (
            <span className="inline-block mt-3 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Foundation Module
            </span>
          )}
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">Days</h2>
        {days.length === 0 ? (
          <p className="text-gray-500">No days available for this module.</p>
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={day.is_completed || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleDayCompletion(day.id, e.target.checked);
                      }}
                      className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">{day.title}</h3>
                      <p className="text-xs text-gray-400">Order: {day.order}</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedDayId === day.id ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {expandedDayId === day.id && (
                  <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50">
                    {day.content && (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Day Content</div>
                        <div className="text-gray-700 text-sm whitespace-pre-wrap">{day.content}</div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Tasks</h4>
                      {(tasksByDay[day.id] || []).length === 0 ? (
                        <p className="text-gray-400 text-sm">No tasks for this day.</p>
                      ) : (
                        <div className="space-y-2">
                          {tasksByDay[day.id].map((task) => (
                            <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={task.is_completed || false}
                                onChange={(e) => toggleTaskCompletion(task.id, e.target.checked)}
                                className="mt-0.5 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <p className="text-gray-800 text-sm font-medium">{task.title}</p>
                                {task.description && (
                                  <p className="text-gray-500 text-xs mt-1">{task.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isModuleCompleted && allDaysCompleted && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={completeModule}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded-lg transition shadow-sm"
            >
              {completing ? "Completing..." : "Complete Module"}
            </button>
          </div>
        )}

        {isModuleCompleted && (
          <div className="mt-8 text-center text-emerald-600 font-medium">
            ✅ Module completed successfully!
          </div>
        )}
      </div>
    </div>
  );
}

export default ModuleView;