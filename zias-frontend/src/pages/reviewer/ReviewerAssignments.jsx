// src/pages/reviewer/ReviewerAssignments.jsx – fully corrected
import { useEffect, useState } from "react";
import API from "../../api/api";

function ReviewerAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await API.get("/review-assignments/");
      let data = res.data;
      if (data && data.results && Array.isArray(data.results)) data = data.results;
      else if (!Array.isArray(data)) data = [];
      setAssignments(data);
    } catch (err) {
      console.error(err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleAccept = async (id) => {
    if (!window.confirm("Accept this assignment?")) return;
    setActionLoading(id);
    try {
      await API.post(`/review-assignments/${id}/accept/`);
      await fetchAssignments();
      alert("Assignment accepted");
    } catch (err) {
      alert("Failed to accept: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const comments = prompt("Optional reason for rejection:") || "";
    setActionLoading(id);
    try {
      await API.post(`/review-assignments/${id}/reject/`, { comments });
      await fetchAssignments();
      alert("Assignment rejected");
    } catch (err) {
      alert("Failed to reject: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = assignments.filter(a => {
    if (filter === "all") return true;
    if (filter === "pending") {
      return a.status === "pending approval" || a.status === "assigned";
    }
    return a.status === filter;
  });

  const getStatusBadge = (status) => {
    const classes = {
      'pending approval': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    if (status === 'pending approval') return 'Pending Approval';
    if (status === 'assigned') return 'Assigned';
    return status;
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Review Assignments</h1>
        <button onClick={fetchAssignments} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">⟳ Refresh</button>
      </div>
      <div className="mb-4 flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")} className={`px-3 py-1 rounded text-sm ${filter === "all" ? "bg-green-600 text-white" : "bg-gray-200"}`}>All</button>
        <button onClick={() => setFilter("pending")} className={`px-3 py-1 rounded text-sm ${filter === "pending" ? "bg-yellow-600 text-white" : "bg-gray-200"}`}>Pending</button>
        <button onClick={() => setFilter("accepted")} className={`px-3 py-1 rounded text-sm ${filter === "accepted" ? "bg-green-600 text-white" : "bg-gray-200"}`}>Accepted</button>
        <button onClick={() => setFilter("rejected")} className={`px-3 py-1 rounded text-sm ${filter === "rejected" ? "bg-red-600 text-white" : "bg-gray-200"}`}>Rejected</button>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Mentor</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Course</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Review Sheet</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">No assignments found</td>
              </tr>
            ) : (
              filtered.map(ass => (
                <tr key={ass.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{ass.student_full_name || ass.student?.full_name || "—"}</td>
                  <td className="px-4 py-2 text-sm">{ass.mentor_full_name || ass.mentor?.full_name || "—"}</td>
                  <td className="px-4 py-2 text-sm">{ass.course || "—"}</td>
                  <td className="px-4 py-2 text-sm">
                    {ass.review_sheet ? <a href={ass.review_sheet} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">Link</a> : "—"}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(ass.status)}`}>
                      {getStatusText(ass.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {(ass.status === "pending approval" || ass.status === "assigned") && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(ass.id)}
                          disabled={actionLoading === ass.id}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === ass.id ? "..." : "Accept"}
                        </button>
                        <button
                          onClick={() => handleReject(ass.id)}
                          disabled={actionLoading === ass.id}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading === ass.id ? "..." : "Reject"}
                        </button>
                      </div>
                    )}
                    {ass.status === 'accepted' && <span className="text-green-600 text-sm">✓ Accepted</span>}
                    {ass.status === 'rejected' && <span className="text-red-600 text-sm">✗ Rejected</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReviewerAssignments;