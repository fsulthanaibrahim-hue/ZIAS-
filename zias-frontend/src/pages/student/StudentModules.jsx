// src/pages/student/StudentModules.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";
import StudentSidebar from "../../components/StudentSidebar";

function StudentModules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        // Fetch modules using the student-modules endpoint (already filtered & unlocked)
        const modulesRes = await API.get("modules/student-modules/");
        const modulesData = modulesRes.data;

        // Enrich modules with progress and review data
        const enrichedModules = await Promise.all(
          modulesData.map(async (mod) => {
            try {
              const daysRes = await API.get(`days/?module=${mod.id}`);
              const days = daysRes.data;
              const completedDays = days.filter(day => day.is_completed).length;
              const progress = days.length > 0 ? (completedDays / days.length) * 100 : 0;

              let review = null;
              try {
                const reviewRes = await API.get(`week-review/${mod.id}/`);
                review = reviewRes.data;
              } catch {
                // No review available
              }

              // Force unlocked for all modules returned by student-modules endpoint
              return { ...mod, is_locked: false, progress, review, totalDays: days.length };
            } catch (err) {
              console.error(`Error fetching details for module ${mod.id}`, err);
              return { ...mod, is_locked: false, progress: 0, review: null, totalDays: 0 };
            }
          })
        );

        const sortedModules = enrichedModules.sort((a, b) => (a.order || a.id) - (b.order || b.id));
        setModules(sortedModules);
      } catch (err) {
        console.error("Failed to fetch modules:", err);
        setError("Could not load modules. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">All Modules</h1>
            <p className="text-gray-500 mt-1">
              Your learning weeks – track progress and access content
            </p>
          </div>

          {/* Modules grid */}
          {modules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-500">No modules assigned to you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((mod) => {
                const progress = mod.progress || 0;
                const starRating = mod.review?.star_rating;
                const totalScore = mod.review?.total_score;

                return (
                  <div
                    key={mod.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md hover:-translate-y-1"
                  >
                    <Link to={`/student/week/${mod.id}`} className="block p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition">
                          {mod.title}
                        </h3>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {progress === 100 ? "✅ Completed" : "In Progress"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                        {mod.content || "No description available."}
                      </p>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Score & rating */}
                      {totalScore !== undefined && totalScore !== null && (
                        <div className="text-sm text-gray-600 mb-2">
                          Score: <span className="text-emerald-600 font-semibold">{totalScore}</span>
                        </div>
                      )}
                      {starRating && (
                        <div className="text-sm text-yellow-500 mb-2">
                          {"⭐".repeat(starRating)}
                        </div>
                      )}

                      <div className="text-green-600 text-sm flex items-center gap-1 mt-2">
                        View Details →
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentModules;