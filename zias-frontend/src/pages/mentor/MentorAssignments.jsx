// src/pages/mentor/MentorAssignments.jsx – optimized (only one API call)
import { useEffect, useState, useRef, useCallback } from "react";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function MentorAssignments() {
  const { user } = useAuth();
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const fetchedRef = useRef(false);

  const fetchAssignments = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/review-assignments/");
      let data = res.data;
      if (data?.results && Array.isArray(data.results)) data = data.results;
      else if (!Array.isArray(data)) data = [];
      setAllData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Only fetch once on mount and when user.id changes, but prevent duplicate if already fetched
  useEffect(() => {
    if (user?.id && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchAssignments();
    } else if (!user?.id) {
      setLoading(false);
    }
  }, [user?.id, fetchAssignments]);

  useEffect(() => {
    if (!allData.length) {
      setFilteredData([]);
      return;
    }
    let filtered = allData;
    if (filter !== "all") {
      filtered = allData.filter(a => {
        const status = a.status === "pending" ? "pending approval" : a.status;
        return status === filter;
      });
    }
    setFilteredData(filtered);
  }, [allData, filter]);

  const getStatusBadge = (status) => {
    const classes = {
      "pending approval": "bg-yellow-100 text-yellow-800",
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      assigned: "bg-blue-100 text-blue-800",
    };
    return classes[status] || "bg-gray-100 text-gray-800";
  };

  const handleAccept = async (id) => {
    try {
      await API.post(`/review-assignments/${id}/accept/`);
      await fetchAssignments();
    } catch (err) {
      alert("Failed to accept");
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await API.post(`/review-assignments/${id}/reject/`);
      await fetchAssignments();
    } catch (err) {
      alert("Failed to reject");
      console.error(err);
    }
  };

  const getSuggestedTime = (comments) => {
    if (!comments) return null;
    const match = comments.match(/Suggested time: (.*?)(\n|$)/);
    return match ? match[1] : null;
  };

  if (!user?.id || loading) {
    return <div className="p-8 text-center">Loading assignments...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error}</p>
        <button onClick={fetchAssignments} className="mt-2 bg-gray-200 px-3 py-1 rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Review Assignments</h1>
        <button onClick={fetchAssignments} className="bg-gray-200 px-3 py-1 rounded text-sm">
          Refresh
        </button>
      </div>

      {/* Filter buttons */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {["all", "pending approval", "accepted", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm ${
              filter === f
                ? f === "all"
                  ? "bg-green-600 text-white"
                  : f === "pending approval"
                  ? "bg-yellow-600 text-white"
                  : f === "accepted"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {f === "pending approval" ? "Pending" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reviewer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Review Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Proposed Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Course</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Review Sheet</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">
                  No assignments found
                </td>
              </tr>
            ) : (
              filteredData.map((ass) => {
                const isPending = ass.status === "pending approval" || ass.status === "pending";
                const suggestedTime = getSuggestedTime(ass.comments);
                return (
                  <tr key={ass.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      {ass.student_full_name || ass.student?.full_name || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {ass.reviewer_full_name || ass.reviewer?.full_name || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {ass.review_date || ass.created_at?.split('T')[0] || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {suggestedTime || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">{ass.course || "-"}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(ass.status)}`}>
                        {ass.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {ass.review_sheet ? (
                        <a href={ass.review_sheet} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">
                          Link
                        </a>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {isPending ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(ass.id)}
                            className="text-green-600 text-xs border border-green-300 px-2 py-1 rounded hover:bg-green-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(ass.id)}
                            className="text-red-600 text-xs border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : "-"}
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

export default MentorAssignments;