// src/pages/mentor/MentorDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/api";

function MentorDashboard() {
  const [mentor, setMentor] = useState(null);
  const [students, setStudents] = useState([]);
  const [recentFolders, setRecentFolders] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    completedModules: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        const mentorRes = await API.get("mentors/me/", { signal: abortController.signal });
        if (!isMounted) return;
        const mentorData = mentorRes.data;
        setMentor(mentorData);
        const mentorId = mentorData.id;

        const studentsRes = await API.get("students/", {
          params: { mentor: mentorId },
          signal: abortController.signal,
        });
        if (!isMounted) return;
        const studentsList = studentsRes.data;
        setStudents(studentsList);

        const total = studentsList.length;

        let completed = 0;
        try {
          const completedRes = await API.get("/student-modules/", {
            params: { student__mentor: mentorId, is_completed: true },
            signal: abortController.signal,
          });
          completed = completedRes.data.length;
        } catch {
          for (const student of studentsList) {
            const res = await API.get("/student-modules/", {
              params: { student: student.id, is_completed: true },
              signal: abortController.signal,
            });
            completed += res.data.length;
          }
        }

        let active = 0;
        for (const student of studentsList) {
          const res = await API.get("/student-modules/", {
            params: { student: student.id, is_completed: true },
            signal: abortController.signal,
          });
          if (res.data.length > 0) active++;
        }

        try {
          const foldersRes = await API.get("/review-folders/", {
            params: { student__mentor: mentorId, ordering: "-created_at", limit: 5 },
            signal: abortController.signal,
          });
          let folders = foldersRes.data || [];
          if (folders.length > 5) folders = folders.slice(0, 5);
          setRecentFolders(folders);
        } catch (err) {
          console.error("Failed to fetch recent folders", err);
        }

        if (!isMounted) return;
        setStats({
          totalStudents: total,
          activeStudents: active,
          completedModules: completed,
        });
      } catch (err) {
        if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [navigate]);

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Mentor Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {mentor?.user?.username || "Mentor"}!
          </p>
          {mentor?.expertise && (
            <p className="text-sm text-gray-500 mt-1">Expertise: {mentor.expertise}</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-800">{stats.totalStudents}</div>
                <div className="text-gray-500 text-sm mt-1">Assigned Students</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5m4-14a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-600">{stats.activeStudents}</div>
                <div className="text-gray-500 text-sm mt-1">Active Students</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.completedModules}</div>
                <div className="text-gray-500 text-sm mt-1">Completed Modules</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Students Table – without Action column */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Recent Students</h2>
              <Link to="/mentor/students" className="text-sm text-green-600 hover:text-green-700 font-medium">
                View all
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.slice(0, 5).map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.full_name || student.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.course || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.batch || "—"}</td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-400">No students assigned yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Recent Folders Widget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/mentor/students" className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                View All Students
              </Link>
              <Link to="/mentor/modules" className="block w-full text-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition">
                Manage Modules
              </Link>
              <Link to="/mentor/chat" className="block w-full text-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition">
                Go to Chat
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-semibold text-gray-800">Recent Review Folders</h3>
              <Link to="/mentor/review-folders" className="text-xs text-green-600 hover:text-green-700">
                View all
              </Link>
            </div>
            {recentFolders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No review folders yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentFolders.slice(0, 4).map(folder => (
                  <div key={folder.id} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {folder.student_name || "Student"}
                      </p>
                      <p className="text-xs text-gray-500">Week {folder.week || "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      folder.is_done ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {folder.is_done ? "Completed" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mentor Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-md font-semibold text-gray-800 mb-3">Mentor Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Username:</span> {mentor?.user?.username}</p>
            <p><span className="font-medium">Email:</span> {mentor?.user?.email}</p>
            <p><span className="font-medium">Expertise:</span> {mentor?.expertise || "—"}</p>
            <p><span className="font-medium">Batch:</span> {mentor?.batch || "—"}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default MentorDashboard;