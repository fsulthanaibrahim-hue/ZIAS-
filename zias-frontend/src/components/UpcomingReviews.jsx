import { useEffect, useState } from "react";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";

function UpcomingReviews({ role }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await API.get("/review-assignments/");
        setAssignments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const handleResponse = async (id, action) => {
    try {
      await API.patch(`/review-assignments/${id}/`, { status: action });
      // Refresh list
      const res = await API.get("/review-assignments/");
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading upcoming reviews...</div>;

  if (assignments.length === 0) {
    return <div className="text-gray-500 text-sm">No upcoming reviews.</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold text-gray-800">
        {role === "reviewer" ? "Upcoming Reviews" : "Assigned Reviews"}
      </h3>
      {assignments.map((ass) => (
        <div key={ass.id} className="bg-white border rounded-lg p-3 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{ass.student_name}</p>
              <p className="text-sm text-gray-500">Course: {ass.course}</p>
              <p className="text-sm text-gray-500">Review Sheet: <a href={ass.review_sheet} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Link</a></p>
              <p className="text-xs text-gray-400">Assigned: {new Date(ass.created_at).toLocaleDateString()}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${ass.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ass.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {ass.status}
              </span>
            </div>
            {role === "reviewer" && ass.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => handleResponse(ass.id, "accepted")} className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">Accept</button>
                <button onClick={() => handleResponse(ass.id, "rejected")} className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">Reject</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default UpcomingReviews;