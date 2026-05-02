// src/pages/student/ModuleView.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import API from "../../api/api";

function ModuleView() {
  const { moduleId } = useParams();
  const [moduleData, setModuleData] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDayId, setExpandedDayId] = useState(null);

  const extractArray = (response) => {
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
    const fetchModuleDetails = async () => {
      try {
        const moduleRes = await API.get(`/modules/${moduleId}/`);
        setModuleData(moduleRes.data);

        const daysRes = await API.get(`/days/?module=${moduleId}`);
        console.log("Raw days response:", daysRes.data); // 👈 check this
        const daysArray = extractArray(daysRes);
        console.log("Days extracted:", daysArray);
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

  const fetchTasksForDay = async (dayId) => {
    if (expandedDayId === dayId) {
      setExpandedDayId(null);
      return;
    }
    try {
      const tasksRes = await API.get(`/tasks/?day=${dayId}`);
      let tasks = extractArray(tasksRes);
      setDays(prevDays =>
        prevDays.map(day =>
          day.id === dayId ? { ...day, tasks } : day
        )
      );
      setExpandedDayId(dayId);
    } catch (err) {
      console.error(`Failed to load tasks for day ${dayId}`, err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-gray-500">Loading module...</div>
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
            {moduleData.description && <p className="text-gray-600 mt-2">{moduleData.description}</p>}
          </div>

          {days.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center">
              <p className="text-red-500">No days found for this module.</p>
              <p className="text-gray-400 text-sm mt-2">Please contact your administrator.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {days.map((day) => {
                const isExpanded = expandedDayId === day.id;
                const tasks = day.tasks || [];
                return (
                  <div key={day.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition flex justify-between items-center"
                      onClick={() => fetchTasksForDay(day.id)}
                    >
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                          Day {day.day_number || day.order || day.id}: {day.title || "Untitled Day"}
                        </h2>
                        {day.description && <p className="text-sm text-gray-500 mt-1">{day.description}</p>}
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
                      <div className="border-t border-gray-100 p-4">
                        {tasks.length === 0 ? (
                          <p className="text-gray-400 text-sm">No tasks for this day.</p>
                        ) : (
                          <ul className="space-y-2">
                            {tasks.map((task) => (
                              <li key={task.id} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                                <div>
                                  <p className="text-gray-800 font-medium">{task.title}</p>
                                  {task.description && <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>}
                                </div>
                              </li>
                            ))}
                          </ul>
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

export default ModuleView;