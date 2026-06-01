import { useEffect, useState } from "react";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function MentorAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await API.get("/review-assignments/");
      let data = res.data;
      if (data?.results && Array.isArray(data.results)) data = data.results;
      else if (!Array.isArray(data)) data = [];
      console.log("Mentor assignments fetched:", data);
      setAssignments(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const getSuggestedTime = (comments) => {
    if (!comments) return null;
    const match = comments.match(/Suggested time: (.*?)(\n|$)/);
    return match ? match[1] : null;
  };

  const handleAccept = async (id) => {
    try {
      await API.post(`/review-assignments/${id}/accept/`);
      fetchAssignments();
    } catch (err) {
      alert("Failed to accept");
    }
  };

  const handleReject = async (id) => {
    try {
      await API.post(`/review-assignments/${id}/reject/`);
      fetchAssignments();
    } catch (err) {
      alert("Failed to reject");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading assignments...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <h1 className="text-2xl font-bold mb-4">My Review Assignments</h1>
      <button onClick={fetchAssignments} className="bg-gray-200 px-3 py-1 rounded text-sm mb-4">⟳ Refresh</button>

      {assignments.length === 0 ? (
        <div className="text-center py-8 bg-white rounded shadow">No assignments found for you.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Student</th>
                <th className="px-4 py-2 text-left">Reviewer</th>
                <th className="px-4 py-2 text-left">Course</th>
                <th className="px-4 py-2 text-left">Review Date</th>
                <th className="px-4 py-2 text-left">Proposed Time</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(ass => {
                const suggestedTime = getSuggestedTime(ass.comments);
                const isPending = ass.status === "pending approval";
                return (
                  <tr key={ass.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{ass.student_full_name || "—"}</td>
                    <td className="px-4 py-2">{ass.reviewer_full_name || "—"}</td>
                    <td className="px-4 py-2">{ass.course || "—"}</td>
                    <td className="px-4 py-2">{ass.review_date || ass.created_at?.split("T")[0] || "—"}</td>
                    <td className="px-4 py-2">{suggestedTime || "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ass.status === "pending approval" ? "bg-yellow-100 text-yellow-800" :
                        ass.status === "accepted" ? "bg-green-100 text-green-800" :
                        ass.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {ass.status === "pending approval" ? "Pending Approval" : ass.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {isPending ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleAccept(ass.id)} className="text-green-600 border border-green-300 px-2 py-1 rounded text-xs">Accept</button>
                          <button onClick={() => handleReject(ass.id)} className="text-red-600 border border-red-300 px-2 py-1 rounded text-xs">Reject</button>
                        </div>
                      ) : ass.status === "assigned" ? "Waiting for reviewer" : ass.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MentorAssignments;