// src/pages/student/ModuleView.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import StudentSidebar from "../../components/StudentSidebar";
import API from "../../api/api";

function ModuleView() {
  const { moduleId } = useParams();
  const [moduleData, setModuleData] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDayId, setExpandedDayId] = useState(null);
  const [tasksByDay, setTasksByDay] = useState({});

  // Helper to extract array from DRF response
  const extractArray = (response) => {
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data : [];
  };

  // Fetch module and days
  useEffect(() => {
    const fetchModuleDetails = async () => {
      try {
        const moduleRes = await API.get(`/modules/${moduleId}/`);
        setModuleData(moduleRes.data);

        const daysRes = await API.get(`/days/?module=${moduleId}`);
        let daysArray = extractArray(daysRes);
        daysArray.sort((a, b) => (a.order || 0) - (b.order || 0));
        setDays(daysArray);
      } catch (err) {
        console.error(err);
        setError("Failed to load module content.");
      } finally {
        setLoading(false);
      }
    };
    fetchModuleDetails();
  }, [moduleId]);

  // Fetch tasks when a day is expanded
  useEffect(() => {
    if (expandedDayId && !tasksByDay[expandedDayId]) {
      const fetchTasks = async () => {
        try {
          const tasksRes = await API.get(`/tasks/?day=${expandedDayId}`);
          let tasks = extractArray(tasksRes);
          setTasksByDay(prev => ({ ...prev, [expandedDayId]: tasks }));
        } catch (err) {
          console.error(`Failed to load tasks for day ${expandedDayId}`, err);
        }
      };
      fetchTasks();
    }
  }, [expandedDayId, tasksByDay]);

  // Helper to get day number (used in toast)
  const getDayNumber = (day, idx) => {
    return day.order || idx + 1;
  };

  // Toggle day completion with simplified toast messages
  const toggleDayCompletion = async (dayId, currentStatus, dayNumber) => {
    const newStatus = !currentStatus;
    try {
      await API.patch(`/days/${dayId}/`, { is_completed: newStatus });
      // Update local state
      setDays(prevDays =>
        prevDays.map(day =>
          day.id === dayId ? { ...day, is_completed: newStatus } : day
        )
      );
      // Show simple toast message
      if (newStatus) {
        toast.success(`Day ${dayNumber} completed`);
      } else {
        toast.success(`Day ${dayNumber} marked as incomplete`);
      }
    } catch (err) {
      console.error("Failed to update day completion", err);
      toast.error("Could not update completion status. Please try again.");
    }
  };

  // Clean title helper (remove leading "Day X: " if present)
  const cleanTitle = (title) => {
    if (!title) return "";
    return title.replace(/^Day\s+\d+[\s:–-]+/i, "").trim();
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-red-500 p-6">
          {error}
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="flex h-screen">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-gray-500">Module not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <StudentSidebar />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/student/modules" className="text-sm text-green-600 hover:underline inline-block mb-2">
              ← Back to modules
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">{moduleData.title}</h1>
            {moduleData.content && <p className="text-gray-600 mt-2">{moduleData.content}</p>}
          </div>

          {days.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center">
              <p className="text-red-500">No days found for this module.</p>
              <p className="text-gray-400 text-sm mt-2">Please contact your administrator.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {days.map((day, idx) => {
                const isExpanded = expandedDayId === day.id;
                const dayNumber = getDayNumber(day, idx);
                const displayTitle = cleanTitle(day.title) || "Untitled Day";
                const tasks = tasksByDay[day.id] || [];

                return (
                  <div key={day.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center p-4 gap-3">
                      {/* Day completion checkbox with simplified toast */}
                      <input
                        type="checkbox"
                        checked={day.is_completed || false}
                        onChange={() => toggleDayCompletion(day.id, day.is_completed, dayNumber)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-green-600 shrink-0"
                      />
                      {/* Day title – click to expand/collapse */}
                      <div
                        className="flex-1 cursor-pointer hover:text-green-700 transition-colors"
                        onClick={() => setExpandedDayId(isExpanded ? null : day.id)}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">
                           {displayTitle}
                        </h2>
                      </div>
                      {/* Expand/collapse icon */}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 cursor-pointer ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        onClick={() => setExpandedDayId(isExpanded ? null : day.id)}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Expanded section – tasks */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4">
                        {day.content && (
                          <div className="mb-3 pb-2 border-b border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                              Day Content
                            </p>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{day.content}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                            Tasks / Topics
                          </p>
                          {tasks.length === 0 ? (
                            <p className="text-gray-400 text-sm py-2 text-center">No tasks for this day.</p>
                          ) : (
                            <div className="space-y-2">
                              {tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow"
                                >
                                  <p className="text-gray-800 font-medium text-sm">{task.title}</p>
                                  {task.description && (
                                    <p className="text-gray-500 text-xs mt-1">{task.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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

export default ModuleView;