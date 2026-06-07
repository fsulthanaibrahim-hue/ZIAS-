import React, { useState, useEffect, useRef } from "react";
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
  const [loadingTasks, setLoadingTasks] = useState({});
  
  const fetchedRef = useRef(false);
  const isMounted = useRef(true);
  const currentModuleId = useRef(moduleId);

  // Helper to extract array from DRF response
  const extractArray = (response) => {
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data : [];
  };

  // Fetch module and days
  const fetchModuleAndDays = async () => {
    // Only fetch if moduleId changed
    if (currentModuleId.current !== moduleId) {
      currentModuleId.current = moduleId;
      fetchedRef.current = false;
    }
    
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    try {
      // Fetch module and days in PARALLEL
      const [moduleRes, daysRes] = await Promise.all([
        API.get(`/modules/${moduleId}/`),
        API.get(`/days/?module=${moduleId}`)
      ]);
      
      if (!isMounted.current) return;
      
      // Set module data
      setModuleData(moduleRes.data);
      
      // Process days
      let daysArray = extractArray(daysRes);
      daysArray.sort((a, b) => (a.order || 0) - (b.order || 0));
      setDays(daysArray);
      
    } catch (err) {
      console.error("Error fetching module details:", err);
      if (isMounted.current) {
        setError("Failed to load module content. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Fetch data only when moduleId changes
  useEffect(() => {
    if (moduleId) {
      // Reset states
      setModuleData(null);
      setDays([]);
      setTasksByDay({});
      setExpandedDayId(null);
      setError(null);
      setLoading(true);
      
      // Fetch new data
      fetchModuleAndDays();
    }
    
    return () => {
      isMounted.current = true;
    };
  }, [moduleId]);

  // Fetch tasks ONLY when a day is expanded
  const fetchTasksForDay = async (dayId) => {
    if (tasksByDay[dayId] || loadingTasks[dayId]) return;
    
    setLoadingTasks(prev => ({ ...prev, [dayId]: true }));
    
    try {
      const tasksRes = await API.get(`/tasks/?day=${dayId}`);
      let tasks = extractArray(tasksRes);
      tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (isMounted.current) {
        setTasksByDay(prev => ({ ...prev, [dayId]: tasks }));
      }
    } catch (err) {
      console.error(`Failed to load tasks for day ${dayId}`, err);
      if (isMounted.current) {
        setTasksByDay(prev => ({ ...prev, [dayId]: [] }));
      }
    } finally {
      if (isMounted.current) {
        setLoadingTasks(prev => ({ ...prev, [dayId]: false }));
      }
    }
  };

  const toggleDay = (dayId) => {
    if (expandedDayId === dayId) {
      setExpandedDayId(null);
    } else {
      setExpandedDayId(dayId);
      fetchTasksForDay(dayId);
    }
  };

  // Helper to get day number
  const getDayNumber = (day, idx) => {
    return day.order || idx + 1;
  };

  // Toggle day completion
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

  // Clean title helper
  const cleanTitle = (title) => {
    if (!title) return "";
    return title.replace(/^Day\s+\d+[\s:–-]+/i, "").trim();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading module...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">⚠️ {error}</div>
            <button 
              onClick={() => {
                fetchedRef.current = false;
                setLoading(true);
                setError(null);
                fetchModuleAndDays();
              }}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!moduleData) {
    return (
      <div className="flex h-screen">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-gray-500 text-lg mb-2">Module not found</div>
            <Link to="/student/modules" className="text-green-600 hover:underline">
              ← Back to modules
            </Link>
          </div>
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
              <p className="text-gray-500">No days found for this module.</p>
              <p className="text-gray-400 text-sm mt-2">This module doesn't have any content yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {days.map((day, idx) => {
                const isExpanded = expandedDayId === day.id;
                const dayNumber = getDayNumber(day, idx);
                const displayTitle = cleanTitle(day.title) || `Day ${dayNumber}`;
                const tasks = tasksByDay[day.id] || [];
                const isLoadingTasks = loadingTasks[day.id];

                return (
                  <div key={day.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center p-4 gap-3">
                      <input
                        type="checkbox"
                        checked={day.is_completed || false}
                        onChange={() => toggleDayCompletion(day.id, day.is_completed, dayNumber)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-green-600 shrink-0"
                      />
                      <div
                        className="flex-1 cursor-pointer hover:text-green-700 transition-colors"
                        onClick={() => toggleDay(day.id)}
                      >
                        <h2 className="text-lg font-semibold text-gray-800">
                          {displayTitle}
                        </h2>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 cursor-pointer ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        onClick={() => toggleDay(day.id)}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

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
                          {isLoadingTasks ? (
                            <div className="flex justify-center py-4">
                              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : tasks.length === 0 ? (
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