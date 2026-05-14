// src/pages/reviewer/ReviewerAssignments.jsx
import { useEffect, useState, useRef } from "react";
import API from "../../api/api";

function ReviewerAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestTimeForId, setSuggestTimeForId] = useState(null);
  const [suggestedTime, setSuggestedTime] = useState("");
  const fetchedRef = useRef(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await API.get("/review-assignments/");
      let data = res.data;
      if (data?.results && Array.isArray(data.results)) data = data.results;
      else if (!Array.isArray(data)) data = [];
      console.log("Reviewer assignments fetched:", data);
      setAssignments(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchAssignments();
    }
  }, []);

  const handleSuggestTime = async (id) => {
    if (!suggestedTime.trim()) {
      alert("Please enter a time (e.g., 2:00 PM)");
      return;
    }
    try {
      await API.post(`/review-assignments/${id}/suggest_time/`, { proposed_time: suggestedTime });
      alert(`Time suggested: ${suggestedTime}`);
      setSuggestTimeForId(null);
      setSuggestedTime("");
      fetchAssignments();
    } catch (err) {
      alert("Failed to suggest time: " + (err.response?.data?.detail || err.message));
    }
  };

  const getSuggestedTime = (comments) => {
    if (!comments) return null;
    const match = comments.match(/Suggested time: (.*?)(\n|$)/);
    return match ? match[1] : null;
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
                <th className="px-4 py-2 text-left">Mentor</th>
                <th className="px-4 py-2 text-left">Course</th>
                <th className="px-4 py-2 text-left">Review Date</th>
                <th className="px-4 py-2 text-left">Proposed Time</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((ass) => {
                const existingTime = getSuggestedTime(ass.comments);
                const isAssigned = ass.status === "assigned";
                const showSuggest = isAssigned && suggestTimeForId === ass.id;
                return (
                  <tr key={ass.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{ass.student_full_name || "—"}</td>
                    <td className="px-4 py-2">{ass.mentor_full_name || "—"}</td>
                    <td className="px-4 py-2">{ass.course || "—"}</td>
                    <td className="px-4 py-2">{ass.review_date || ass.created_at?.split("T")[0] || "—"}</td>
                    <td className="px-4 py-2">
                      {showSuggest ? (
                        <input
                          type="text"
                          value={suggestedTime}
                          onChange={(e) => setSuggestedTime(e.target.value)}
                          placeholder="e.g., 2:00 PM"
                          className="border rounded px-2 py-1 w-28 text-sm"
                          autoFocus
                        />
                      ) : (existingTime || "—")}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ass.status === "assigned" ? "bg-blue-100 text-blue-800" :
                        ass.status === "pending approval" ? "bg-yellow-100 text-yellow-800" :
                        ass.status === "accepted" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {ass.status === "pending approval" ? "Pending Approval" : ass.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {isAssigned && (
                        showSuggest ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleSuggestTime(ass.id)} className="bg-green-600 text-white px-2 py-1 rounded text-xs">Save</button>
                            <button onClick={() => { setSuggestTimeForId(null); setSuggestedTime(""); }} className="bg-gray-300 px-2 py-1 rounded text-xs">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setSuggestTimeForId(ass.id)} className="text-blue-600 border border-blue-300 px-2 py-1 rounded text-xs">Suggest Time</button>
                        )
                      )}
                      {ass.status === "pending approval" && <span className="text-yellow-600 text-sm">⏳ Pending mentor</span>}
                      {ass.status === "accepted" && <span className="text-green-600 text-sm">✓ Accepted</span>}
                      {ass.status === "rejected" && <span className="text-red-600 text-sm">✗ Rejected</span>}
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

export default ReviewerAssignments;