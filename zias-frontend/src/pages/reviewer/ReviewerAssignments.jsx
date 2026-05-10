// src/pages/reviewer/ReviewerAssignments.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

function ReviewerAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [suggestTimeForId, setSuggestTimeForId] = useState(null);
  const [suggestedTime, setSuggestedTime] = useState("");
  const fetchedRef = useRef(false);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/review-assignments/");
      let data = res.data;
      if (data?.results && Array.isArray(data.results)) data = data.results;
      else if (!Array.isArray(data)) data = [];
      setAssignments(data);
    } catch (err) {
      console.error(err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchAssignments();
    }
  }, [fetchAssignments]);

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

  const handleSuggestTime = async (id) => {
    if (!suggestedTime.trim()) {
      alert("Please enter a valid time (e.g., 7:00 PM)");
      return;
    }
    setActionLoading(id);
    try {
      await API.post(`/review-assignments/${id}/suggest_time/`, { proposed_time: suggestedTime });
      alert(`Time suggested: ${suggestedTime}`);
      setSuggestTimeForId(null);
      setSuggestedTime("");
      fetchAssignments();
    } catch (err) {
      alert("Failed to suggest time: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const getSuggestedTime = (comments) => {
    if (!comments) return null;
    const match = comments.match(/Suggested time: (.*?)(\n|$)/);
    return match ? match[1] : null;
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

  if (loading) return <div className="p-8 text-center">Loading assignments...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Review Assignments</h1>
        <button onClick={fetchAssignments} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">⟳ Refresh</button>
      </div>
      <div className="mb-4 flex gap-2 flex-wrap">
        {["all", "pending", "accepted", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded text-sm ${filter === f ? (f === "all" ? "bg-green-600 text-white" : f === "pending" ? "bg-yellow-600 text-white" : f === "accepted" ? "bg-green-600 text-white" : "bg-red-600 text-white") : "bg-gray-200"}`}>
            {f === "pending" ? "Pending" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Mentor</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Course</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Review Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Proposed Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Review Sheet</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-400">No assignments found</td>
              </tr>
            ) : (
              filtered.map(ass => {
                const isPending = ass.status === "pending approval" || ass.status === "assigned";
                const showSuggest = isPending && suggestTimeForId === ass.id;
                const existingTime = getSuggestedTime(ass.comments);
                const studentId = ass.student?.id || ass.student;
                const studentName = ass.student_full_name || ass.student?.full_name || "Student";
                const studentCourse = ass.course || "";
                const studentBatch = ""; // optional
                return (
                  <tr key={ass.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{studentName}</td>
                    <td className="px-4 py-2 text-sm">{ass.mentor_full_name || ass.mentor?.full_name || "—"}</td>
                    <td className="px-4 py-2 text-sm">{studentCourse}</td>
                    <td className="px-4 py-2 text-sm">{ass.review_date || ass.created_at?.split('T')[0] || "—"}</td>
                    <td className="px-4 py-2 text-sm">
                      {showSuggest ? (
                        <input
                          type="text"
                          value={suggestedTime}
                          onChange={(e) => setSuggestedTime(e.target.value)}
                          placeholder="e.g., 7:00 PM"
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-28"
                          autoFocus
                        />
                      ) : (existingTime || "—")}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {studentId ? (
                        <Link
                          to={`/reviewer/review-sheet?student_id=${studentId}`}
                          state={{ studentName, studentCourse, studentBatch }}
                          className="text-green-600 underline"
                        >
                          Link
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(ass.status)}`}>
                        {getStatusText(ass.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {isPending && (
                        <div className="flex flex-col gap-1">
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
                          {!showSuggest ? (
                            <button
                              onClick={() => setSuggestTimeForId(ass.id)}
                              className="text-blue-600 text-xs border border-blue-300 px-2 py-0.5 rounded hover:bg-blue-50"
                            >
                              Suggest Time
                            </button>
                          ) : (
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => handleSuggestTime(ass.id)}
                                disabled={actionLoading === ass.id}
                                className="text-green-600 text-xs border border-green-300 px-2 py-0.5 rounded hover:bg-green-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => { setSuggestTimeForId(null); setSuggestedTime(""); }}
                                className="text-gray-500 text-xs border border-gray-300 px-2 py-0.5 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {ass.status === 'accepted' && <span className="text-green-600 text-sm">✓ Accepted</span>}
                      {ass.status === 'rejected' && <span className="text-red-600 text-sm">✗ Rejected</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReviewerAssignments;