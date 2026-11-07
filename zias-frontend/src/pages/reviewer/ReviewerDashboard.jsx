import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/api";
import { toast } from "react-hot-toast";

function ReviewerDashboard() {
  const [reviewer, setReviewer] = useState(null);
  const [recentFolders, setRecentFolders] = useState([]);
  const [stats, setStats] = useState({
    pendingReviews: 0,
    completedReviews: 0,
  });
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        // Reviewer profile
        const reviewerRes = await API.get("reviewers/me/", { signal: abortController.signal });
        if (!isMounted) return;
        setReviewer(reviewerRes.data);

        // Review folders (for stats + recent list)
        const foldersRes = await API.get("/review-folders/", { signal: abortController.signal });
        if (!isMounted) return;
        const allFolders = foldersRes.data.results || foldersRes.data;
        setStats({
          pendingReviews: allFolders.filter(f => !f.is_done).length,
          completedReviews: allFolders.filter(f => f.is_done).length,
        });
        const sorted = [...allFolders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentFolders(sorted.slice(0, 5));

        // Fetch assignments – only pending/assigned for this section
        const assignmentsRes = await API.get("/review-assignments/", { signal: abortController.signal });
        if (!isMounted) return;
        let assignmentsData = assignmentsRes.data.results || assignmentsRes.data;
        assignmentsData = assignmentsData.filter(a => a.status === "pending approval" || a.status === "assigned");
        setAssignments(assignmentsData);
      } catch (err) {
        if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
        else toast.error("Failed to load dashboard data");
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

  const handleAssignmentAction = async (assignmentId, action) => {
    setActionLoading(assignmentId);
    try {
      await API.post(`/review-assignments/${assignmentId}/${action}/`);
      toast.success(`Assignment ${action}ed successfully`);
      // Refresh assignments
      const res = await API.get("/review-assignments/");
      let assignmentsData = res.data.results || res.data;
      assignmentsData = assignmentsData.filter(a => a.status === "pending approval" || a.status === "assigned");
      setAssignments(assignmentsData);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} assignment`);
    } finally {
      setActionLoading(null);
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

        {/* Upcoming Reviews (Assignments) – compact table */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Upcoming Reviews</h2>
          </div>
          {assignments.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">No upcoming reviews assigned.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((ass) => (
                      <tr key={ass.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ass.student_full_name || ass.student?.full_name || "Student"}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{ass.course || "—"}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ass.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleAssignmentAction(ass.id, "accept")}
                              disabled={actionLoading === ass.id}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50 transition"
                            >
                              {actionLoading === ass.id ? "..." : "Accept"}
                            </button>
                            <button
                              onClick={() => handleAssignmentAction(ass.id, "reject")}
                              disabled={actionLoading === ass.id}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 disabled:opacity-50 transition"
                            >
                              {actionLoading === ass.id ? "..." : "Reject"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
                <Link to="/reviewer/assignments" className="text-sm text-green-600 hover:text-green-700 font-medium">
                  View all assignments →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Recent Review Folders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Recent Review Folders</h2>
              <Link to="/reviewer/review-folders" className="text-sm text-green-600 hover:text-green-700 font-medium">
                View all
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentFolders.map((folder) => (
                  <tr key={folder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {folder.student_name || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{folder.week_folder || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{folder.week || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          folder.is_done
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {folder.is_done ? "Done" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentFolders.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                      No review folders found.
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
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Account Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Qualification:</span> {reviewer?.qualification || "—"}</p>
              <p><span className="font-medium">Experience:</span> {reviewer?.experience || "—"} years</p>
              <p><span className="font-medium">Batch assigned:</span> {reviewer?.batch_name || reviewer?.batch || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ReviewerDashboard;