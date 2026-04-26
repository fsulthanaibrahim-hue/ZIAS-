// src/pages/reviewer/ReviewerDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/api";

function ReviewerDashboard() {
  const [reviewer, setReviewer] = useState(null);
  const [students, setStudents] = useState([]);
  const [recentFolders, setRecentFolders] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    completedReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        // Get reviewer profile
        const reviewerRes = await API.get("reviewers/me/", { signal: abortController.signal });
        if (!isMounted) return;
        const reviewerData = reviewerRes.data;
        setReviewer(reviewerData);

        // Fetch students assigned to this reviewer (via batch/course)
        const studentsRes = await API.get("students/", {
          params: { course: reviewerData.course }, // adjust based on your filter
          signal: abortController.signal,
        });
        if (!isMounted) return;
        const studentsList = studentsRes.data;
        setStudents(studentsList);
        setStats((prev) => ({ ...prev, totalStudents: studentsList.length }));

        // Fetch review folders (for these students)
        let allFolders = [];
        for (const student of studentsList) {
          const foldersRes = await API.get("/review-folders/", {
            params: { student: student.id },
            signal: abortController.signal,
          });
          allFolders = [...allFolders, ...foldersRes.data];
        }
        setStats({
          totalStudents: studentsList.length,
          pendingReviews: allFolders.filter(f => !f.is_done).length,
          completedReviews: allFolders.filter(f => f.is_done).length,
        });
        // Take recent 5 folders
        const sorted = allFolders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentFolders(sorted.slice(0, 5));
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
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Reviewer Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {reviewer?.user?.username || "Reviewer"}!
          </p>
          {reviewer?.department && (
            <p className="text-sm text-gray-500 mt-1">Department: {reviewer.department}</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-800">{stats.totalStudents}</div>
                <div className="text-gray-500 text-sm mt-1">Total Students</div>
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
                <div className="text-3xl font-bold text-amber-600">{stats.pendingReviews}</div>
                <div className="text-gray-500 text-sm mt-1">Pending Reviews</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.completedReviews}</div>
                <div className="text-gray-500 text-sm mt-1">Completed Reviews</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Students Table (like mentor dashboard) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Recent Students</h2>
              <Link to="/reviewer/students" className="text-sm text-green-600 hover:text-green-700 font-medium">
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
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-400">
                      No students assigned to you yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Account Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/reviewer/review-folders"
                className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Browse All Review Folders
              </Link>
              <Link
                to="/reviewer/students"
                className="block w-full text-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
              >
                View My Students
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Account Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Qualification:</span> {reviewer?.qualification || "—"}</p>
              <p><span className="font-medium">Experience:</span> {reviewer?.experience || "—"} years</p>
              <p><span className="font-medium">Batch assigned:</span> {reviewer?.batch || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ReviewerDashboard;