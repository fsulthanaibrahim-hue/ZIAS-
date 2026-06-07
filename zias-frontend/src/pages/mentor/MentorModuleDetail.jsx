import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import API from "../../api/api";

// Cache for API responses (15 minutes TTL)
const apiCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Helper to get/set cache
const getCachedData = (key) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  apiCache.set(key, { data, timestamp: Date.now() });
};

function MentorModuleView() {
  const { moduleId } = useParams();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("student_id");
  
  const [moduleData, setModuleData] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDayId, setExpandedDayId] = useState(null);
  const [tasksByDay, setTasksByDay] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});
  const [studentName, setStudentName] = useState("");
  
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Helper functions
  const extractArray = useCallback((response) => {
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data : [];
  }, []);

  const getDayNumber = useCallback((day, idx) => day.order || idx + 1, []);
  
  const getCleanTitle = useCallback((title) => {
    if (!title) return "";
    return title.replace(/^Day\s+\d+[\s:–-]+/i, "").trim();
  }, []);

  // Fetch tasks for a specific day with cache
  const fetchTasksForDay = useCallback(async (dayId) => {
    if (tasksByDay[dayId] || loadingTasks[dayId]) return;
    
    const cacheKey = `tasks_day_${dayId}`;
    const cachedTasks = getCachedData(cacheKey);
    
    if (cachedTasks) {
      if (isMountedRef.current) {
        setTasksByDay(prev => ({ ...prev, [dayId]: cachedTasks }));
      }
      return;
    }
    
    setLoadingTasks(prev => ({ ...prev, [dayId]: true }));
    
    // Set timeout for slow requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    try {
      const tasksPromise = API.get(`/tasks/?day=${dayId}`);
      const tasksRes = await Promise.race([tasksPromise, timeoutPromise]);
      const tasks = extractArray(tasksRes);
      tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setCachedData(cacheKey, tasks);
      
      if (isMountedRef.current) {
        setTasksByDay(prev => ({ ...prev, [dayId]: tasks }));
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError' && isMountedRef.current) {
        console.error(`Failed to load tasks for day ${dayId}`, err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingTasks(prev => ({ ...prev, [dayId]: false }));
      }
    }
  }, [tasksByDay, loadingTasks, extractArray]);

  // Toggle day expansion
  const toggleDay = useCallback((dayId) => {
    if (expandedDayId === dayId) {
      setExpandedDayId(null);
    } else {
      setExpandedDayId(dayId);
      fetchTasksForDay(dayId);
    }
  }, [expandedDayId, fetchTasksForDay]);

  // Main data fetch with caching and parallel requests
  useEffect(() => {
    // Cancel previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    isMountedRef.current = true;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      const moduleCacheKey = `module_${moduleId}`;
      const daysCacheKey = `days_module_${moduleId}`;
      
      // Check cache for module and days
      const cachedModule = getCachedData(moduleCacheKey);
      const cachedDays = getCachedData(daysCacheKey);
      
      if (cachedModule && cachedDays) {
        // Use cached data
        setModuleData(cachedModule);
        setDays(cachedDays);
        
        if (studentIdParam && !getCachedData(`student_${studentIdParam}`)) {
          // Fetch student name in background if not cached
          try {
            const studentRes = await API.get(`/students/${studentIdParam}/`, {
              signal: abortControllerRef.current?.signal
            });
            if (isMountedRef.current) {
              setStudentName(studentRes.data.full_name || studentRes.data.username);
              setCachedData(`student_${studentIdParam}`, studentRes.data);
            }
          } catch (err) {
            // Silent fail
          }
        } else if (studentIdParam) {
          const cachedStudent = getCachedData(`student_${studentIdParam}`);
          if (cachedStudent && isMountedRef.current) {
            setStudentName(cachedStudent.full_name || cachedStudent.username);
          }
        }
        
        setLoading(false);
        return;
      }
      
      // Fetch fresh data with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      try {
        // Parallel fetch with timeout
        const [moduleRes, daysRes] = await Promise.race([
          Promise.all([
            API.get(`/modules/${moduleId}/`, { signal: abortControllerRef.current?.signal }),
            API.get(`/days/?module=${moduleId}`, { signal: abortControllerRef.current?.signal })
          ]),
          timeoutPromise
        ]);
        
        if (!isMountedRef.current) return;
        
        // Set module data
        setModuleData(moduleRes.data);
        setCachedData(moduleCacheKey, moduleRes.data);
        
        // Set days data
        let daysArray = extractArray(daysRes);
        daysArray.sort((a, b) => (a.order || 0) - (b.order || 0));
        setDays(daysArray);
        setCachedData(daysCacheKey, daysArray);
        
        // Fetch student name if needed (parallel, don't block)
        if (studentIdParam) {
          API.get(`/students/${studentIdParam}/`, {
            signal: abortControllerRef.current?.signal
          }).then(studentRes => {
            if (isMountedRef.current) {
              setStudentName(studentRes.data.full_name || studentRes.data.username);
              setCachedData(`student_${studentIdParam}`, studentRes.data);
            }
          }).catch(() => {
            if (isMountedRef.current) {
              setStudentName(`Student ID: ${studentIdParam}`);
            }
          });
        }
        
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError' && isMountedRef.current) {
          console.error("Error fetching data:", err);
          setError(err.message === 'Request timeout' 
            ? 'Request timed out. Please check your connection.' 
            : 'Failed to load module content.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [moduleId, studentIdParam, extractArray]);

  // Memoize days render to prevent unnecessary re-renders
  const renderedDays = useMemo(() => {
    if (days.length === 0) return null;
    
    return days.map((day, idx) => {
      const isExpanded = expandedDayId === day.id;
      const dayNumber = getDayNumber(day, idx);
      const cleanTitle = getCleanTitle(day.title);
      const displayTitle = cleanTitle || `Day ${dayNumber}`;
      const tasks = tasksByDay[day.id] || [];
      const isLoadingTasks = loadingTasks[day.id];

      return (
        <div key={day.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleDay(day.id)}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold shadow-sm">
                {dayNumber}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-800 truncate">
                  {displayTitle}
                </h2>
                {day.content && (
                  <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{day.content}</p>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {isExpanded && (
            <div className="border-t border-gray-100 bg-gray-50 p-4">
              {day.content && (
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                    Day Content
                  </p>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{day.content}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Tasks / Topics
                </p>
                
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Loading tasks...</span>
                  </div>
                ) : tasks.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">No tasks for this day.</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-gray-500 text-xs mt-1">{task.description}</p>
                            )}
                          </div>
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
    });
  }, [days, expandedDayId, tasksByDay, loadingTasks, getDayNumber, getCleanTitle, toggleDay]);

  // Loading state with skeleton UI (better UX)
  if (loading && !moduleData) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Skeleton Header */}
          <div className="mb-6">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-full max-w-md bg-gray-200 rounded animate-pulse" />
          </div>
          
          {/* Skeleton Days */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-64 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-screen p-6">
        <div className="bg-red-50 rounded-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">Unable to Load Module</h3>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => {
              // Clear cache and retry
              apiCache.clear();
              window.location.reload();
            }} 
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">Module not found</p>
          <Link to="/mentor/modules" className="text-green-600 hover:underline">
            ← Back to Modules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
            <Link 
              to="/mentor/modules"
              className="text-sm text-green-600 hover:underline inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Modules
            </Link>
            {studentIdParam && studentName && (
              <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
                <span className="text-xs text-gray-500">Student: </span>
                <span className="text-sm font-medium text-gray-700">{studentName}</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{moduleData.title}</h1>
          {moduleData.content && (
            <p className="text-gray-600 mt-2 line-clamp-2">{moduleData.content}</p>
          )}
        </div>

        {/* Days List */}
        {days.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <p className="text-gray-500">No days found for this module.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {renderedDays}
          </div>
        )}
        
        {/* Stats Footer */}
        <div className="mt-4 text-center text-xs text-gray-400">
          📚 {days.length} day(s) • Tasks load when expanded
        </div>
      </div>
    </div>
  );
}

export default MentorModuleView;