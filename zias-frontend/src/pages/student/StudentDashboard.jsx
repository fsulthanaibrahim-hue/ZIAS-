// src/pages/student/StudentDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/api";
import StudentSidebar from "../../components/StudentSidebar";

function StudentDashboard() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [reviews, setReviews] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await API.post("update-dashboard-access/");
        const studentRes = await API.get("students/me/");
        setStudent(studentRes.data);

        const modulesRes = await API.get("modules/student-modules/");
        const modulesData = modulesRes.data;
        setModules(modulesData);

        const reviewsData = {};
        for (const mod of modulesData) {
          try {
            const reviewRes = await API.get(`week-review/${mod.id}/`);
            reviewsData[mod.id] = reviewRes.data;
          } catch {
            reviewsData[mod.id] = {};
          }
        }
        setReviews(reviewsData);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <StudentSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {student?.username || 'Student'}!</p>
            {student?.course && (
              <p className="text-sm text-gray-500 mt-1">Course: <span className="text-gray-700">{student.course}</span></p>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Learning Modules</h2>
            {modules.length === 0 ? (
              <p className="text-gray-500">No modules assigned to you yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod) => {
                  const isLocked = mod.is_locked || false;
                  const review = reviews[mod.id] || {};
                  const totalScore = review.total_score !== undefined ? review.total_score : null;
                  const starRating = review.star_rating || null;
                  return (
                    <div
                      key={mod.id}
                      className={`relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 ${
                        !isLocked ? 'hover:scale-105 hover:shadow-md cursor-pointer' : 'opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {isLocked ? (
                        <div className="p-5">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800">{mod.title}</h3>
                              <p className="text-gray-500 text-sm mt-1">{mod.content || "No description"}</p>
                              <span className="inline-block mt-3 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">🔒 Locked</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link to={`/student/module/${mod.id}`} className="block p-5">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition">{mod.title}</h3>
                              <p className="text-gray-500 text-sm mt-1">{mod.content || "No description"}</p>
                              {mod.is_common && (
                                <span className="inline-block mt-3 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Foundation Module</span>
                              )}
                              {totalScore !== null && (
                                <div className="mt-2 text-sm">
                                  <span className="text-emerald-600 font-semibold">Score: {totalScore}</span>
                                </div>
                              )}
                              {starRating && (
                                <div className="mt-1 text-sm text-yellow-500">{'⭐'.repeat(starRating)}</div>
                              )}
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;