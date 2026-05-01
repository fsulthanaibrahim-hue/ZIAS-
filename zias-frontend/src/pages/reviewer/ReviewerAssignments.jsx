// src/pages/reviewer/ReviewerAssignments.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";
import toast from "react-hot-toast";

function ReviewerAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await API.get("/review-assignments/");
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (id, action) => {
    let comments = "";
    if (selectedTime) {
      comments = `Suggested time: ${selectedTime}`;
    }
    try {
      await API.patch(`/review-assignments/${id}/`, {
        status: action,
        comments: comments,
      });
      toast.success(`Assignment ${action}`);
      setRespondingId(null);
      setSelectedTime("");
      fetchAssignments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to respond");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Review Assignments</h1>
      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No assignments yet.
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((ass) => (
            <div key={ass.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Student</p>
                  <p className="font-medium text-gray-800">{ass.student_name}</p>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="text-gray-700">{ass.course || "—"}</p>
                  <p className="text-sm text-gray-500">Review Sheet</p>
                  <a
                    href={ass.review_sheet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline text-sm break-all"
                  >
                    {ass.review_sheet || "—"}
                  </a>
                  <p className="text-sm text-gray-500 mt-2">Assigned on</p>
                  <p className="text-sm text-gray-600">{new Date(ass.review_assigned).toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-2">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      ass.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : ass.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {ass.status.toUpperCase()}
                  </span>
                  {ass.comments && (
                    <>
                      <p className="text-sm text-gray-500 mt-2">Comments</p>
                      <p className="text-sm text-gray-600">{ass.comments}</p>
                    </>
                  )}
                </div>

                {ass.status === "pending" && (
                  <div className="mt-2 md:mt-0">
                    {respondingId === ass.id ? (
                      <div className="space-y-3">
                        <input
                          type="datetime-local"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResponse(ass.id, "accepted")}
                            className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleResponse(ass.id, "rejected")}
                            className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => setRespondingId(null)}
                            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingId(ass.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Respond
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewerAssignments;