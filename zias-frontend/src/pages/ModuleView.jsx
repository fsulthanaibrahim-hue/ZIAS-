import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-emerald-500/90" : "bg-red-500/90";
  const icon = type === "success" ? "✓" : "✕";

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2`}>
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
  const showToast = (msg, type) => setToast({ message: msg, type });
  const hideToast = () => setToast(null);

  // Fetch module details
  const fetchModule = async () => {
    try {
      const res = await API.get(`modules/${moduleId}/`);
      setModule(res.data);
    } catch (err) {
      showToast("Failed to load module", "error");
    }
  };

  // Fetch days for this module
  const fetchDays = async () => {
    try {
      const res = await API.get(`days/?module=${moduleId}`);
      setDays(res.data);
    } catch (err) {
      showToast("Failed to load days", "error");
    }
  };

  // Fetch tasks for a specific day
  const fetchTasks = async (dayId) => {
    try {
      const res = await API.get(`tasks/?day=${dayId}`);
      setTasksByDay(prev => ({ ...prev, [dayId]: res.data }));
    } catch (err) {
      showToast("Failed to load tasks", "error");
    }
  };

  // Toggle day completion
  const toggleDayCompletion = async (dayId, completed) => {
    try {
      await API.patch(`days/${dayId}/`, { is_completed: completed });
      showToast(completed ? "Day marked as completed" : "Day marked as incomplete", "success");
      // Refresh days to update checkbox
      fetchDays();
    } catch (err) {
      showToast("Failed to update", "error");
    }
  };

  // Toggle task completion (if you add is_completed to Task model)
  const toggleTaskCompletion = async (taskId, completed) => {
    try {
      await API.patch(`tasks/${taskId}/`, { is_completed: completed });
      showToast(completed ? "Task completed" : "Task uncompleted", "success");
      // Refresh tasks for the current expanded day
      if (expandedDayId) fetchTasks(expandedDayId);
    } catch (err) {
      showToast("Failed to update task", "error");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchModule();
      await fetchDays();
      setLoading(false);
    };
    loadData();
  }, [moduleId]);

  // When a day is expanded, fetch its tasks
  useEffect(() => {
    if (expandedDayId) {
      fetchTasks(expandedDayId);
    }
  }, [expandedDayId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        Module not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link to="/user/dashboard" className="inline-flex items-center gap-2 text-[#7d8590] hover:text-[#e6edf3] mb-6 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Module Header */}
        <div className="bg-[#161b22] rounded-xl border border-[#21262d] p-6 mb-8">
          <h1 className="text-2xl font-bold text-[#e6edf3]">{module.title}</h1>
          {module.content && (
            <div className="mt-3 text-[#7d8590] whitespace-pre-wrap">{module.content}</div>
          )}
          {module.is_common && (
            <span className="inline-block mt-3 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
              Foundation Module
            </span>
          )}
        </div>

        {/* Days List */}
        <h2 className="text-xl font-semibold mb-4">Days</h2>
        {days.length === 0 ? (
          <p className="text-[#7d8590]">No days available for this module.</p>
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.id} className="bg-[#161b22] rounded-xl border border-[#21262d] overflow-hidden">
                {/* Day Header (click to expand) */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#1a2538] transition"
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
                      className="w-4 h-4 rounded bg-[#0d1117] border-[#30363d] accent-emerald-500"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-[#e6edf3]">{day.title}</h3>
                      <p className="text-xs text-[#484f58]">Order: {day.order}</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#484f58] transition-transform duration-200 ${expandedDayId === day.id ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded content: Day content + Tasks */}
                {expandedDayId === day.id && (
                  <div className="p-4 pt-0 border-t border-[#21262d] bg-[#0d1117]/50">
                    {/* Day content */}
                    {day.content && (
                      <div className="mb-4 p-3 bg-[#0d1117] rounded-lg border border-[#21262d]">
                        <div className="text-xs font-semibold text-[#7d8590] uppercase mb-1">Day Content</div>
                        <div className="text-[#c9d1d9] text-sm whitespace-pre-wrap">{day.content}</div>
                      </div>
                    )}

                    {/* Tasks */}
                    <div>
                      <h4 className="text-sm font-semibold text-[#7d8590] uppercase tracking-wider mb-2">Tasks</h4>
                      {(tasksByDay[day.id] || []).length === 0 ? (
                        <p className="text-[#484f58] text-sm">No tasks for this day.</p>
                      ) : (
                        <div className="space-y-2">
                          {tasksByDay[day.id].map((task) => (
                            <div key={task.id} className="bg-[#161b22] rounded-lg p-3 flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={task.is_completed || false}
                                onChange={(e) => toggleTaskCompletion(task.id, e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded bg-[#0d1117] border-[#30363d] accent-emerald-500"
                              />
                              <div className="flex-1">
                                <p className="text-[#c9d1d9] text-sm font-medium">{task.title}</p>
                                {task.description && (
                                  <p className="text-[#484f58] text-xs mt-1">{task.description}</p>
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
      </div>
    </div>
  );
}

export default ModuleView;