// src/pages/mentor/MentorModuleDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import API from "../../api/api";

function MentorModuleDetail() {
  const { moduleId } = useParams();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("student_id");

  const [module, setModule] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDayId, setExpandedDayId] = useState(null);
  const [tasksByDay, setTasksByDay] = useState({});
  const [studentName, setStudentName] = useState("");
  const [studentProgress, setStudentProgress] = useState(null);
  const [progressError, setProgressError] = useState(false);

  useEffect(() => {
    if (!moduleId) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const modRes = await API.get(`modules/${moduleId}/`);
        setModule(modRes.data);

        const daysRes = await API.get(`days/?module=${moduleId}`);
        const daysArray = daysRes.data.results || daysRes.data;
        setDays(Array.isArray(daysArray) ? daysArray : []);

        if (studentIdParam) {
          try {
            const studentRes = await API.get(`students/${studentIdParam}/`);
            setStudentName(studentRes.data.full_name || studentRes.data.username);
          } catch (e) {
            console.warn("Student name fetch failed", e);
          }

          try {
            const progressRes = await API.get(`module-progress/?student=${studentIdParam}&module=${moduleId}`);
            setStudentProgress(progressRes.data);
          } catch (err) {
            if (err.response?.status === 404) {
              console.warn("Progress endpoint not found (404) – disabling progress display");
              setProgressError(true);
            } else {
              console.error("Progress fetch failed", err);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [moduleId, studentIdParam]);

  const fetchTasksForDay = async (dayId) => {
    if (tasksByDay[dayId]) return;
    try {
      const res = await API.get(`tasks/?day=${dayId}`);
      const tasks = res.data.results || res.data;
      setTasksByDay(prev => ({ ...prev, [dayId]: tasks }));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDay = (dayId) => {
    if (expandedDayId === dayId) {
      setExpandedDayId(null);
    } else {
      setExpandedDayId(dayId);
      if (!tasksByDay[dayId]) fetchTasksForDay(dayId);
    }
  };

  const isTaskCompleted = (taskId) => {
    if (!studentProgress?.task_completions) return false;
    return !!studentProgress.task_completions[taskId];
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
        <Link to="/mentor/modules" className="mt-4 text-emerald-600 inline-block">← Back to Student Modules</Link>
      </div>
    );
  }

  const overallPercent = studentProgress?.overall_percentage ?? null;

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/mentor/modules" className="text-emerald-600 hover:underline">← Back to Student Modules</Link>
            <h1 className="text-2xl font-bold text-gray-800">{module.title}</h1>
          </div>
          {studentIdParam && (
            <div className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm">
              👤 Student: {studentName || `ID ${studentIdParam}`}
            </div>
          )}
        </div>

        {/* Module info card */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <p className="text-gray-500">Course: {module.course_name || module.course?.name || "—"}</p>
          {module.order && <p className="text-gray-500">Week: {module.order}</p>}
          {module.content && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{module.content}</p>
            </div>
          )}
          {studentIdParam && overallPercent !== null && !progressError && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Student's overall progress</span>
                <span>{overallPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${overallPercent}%` }} />
              </div>
            </div>
          )}
          {progressError && studentIdParam && (
            <p className="text-xs text-gray-400 mt-2">ℹ️ Progress tracking not available for this module.</p>
          )}
        </div>

        {/* Days list – without "Day X:" prefix */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Days ({days.length}/7)</h2>
            {studentIdParam && !progressError && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                ✓ = Completed
              </span>
            )}
          </div>

          {days.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No days yet for this module.</p>
          ) : (
            <div className="space-y-3">
              {days.map((day, idx) => {
                const tasks = tasksByDay[day.id] || [];
                const isExpanded = expandedDayId === day.id;
                return (
                  <div key={day.id} className="border rounded-xl overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleDay(day.id)}
                    >
                      <div className="flex-1">
                        {/* Removed "Day X:" prefix – only day.title */}
                        <p className="font-medium">{day.title}</p>
                        {day.content && <p className="text-gray-500 text-sm mt-1">{day.content}</p>}
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {isExpanded && (
                      <div className="p-3 bg-gray-50 border-t">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Tasks</p>
                        {tasks.length === 0 ? (
                          <p className="text-gray-400 text-sm">No tasks yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {tasks.map(task => {
                              const completed = isTaskCompleted(task.id);
                              return (
                                <div
                                  key={task.id}
                                  className="bg-white p-3 rounded-lg border flex justify-between items-start"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {studentIdParam && !progressError && (
                                        <span
                                          className={`inline-block w-5 h-5 rounded-full flex-shrink-0 ${
                                            completed ? "bg-emerald-500 text-white" : "bg-gray-200"
                                          } text-xs text-center leading-5`}
                                        >
                                          {completed ? "✓" : ""}
                                        </span>
                                      )}
                                      <p className="font-medium">{task.title}</p>
                                    </div>
                                    {task.description && (
                                      <p className="text-gray-500 text-xs mt-0.5 ml-7">{task.description}</p>
                                    )}
                                    <p className="text-gray-400 text-xs mt-0.5 ml-7">Order: {task.order}</p>
                                  </div>
                                </div>
                              );
                            })}
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
    </div>
  );
}

export default MentorModuleDetail;