import React, { useState, useEffect } from "react";
import API from "../../api/api";

function ReviewerAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const fetchAssignments = async (url = null) => {
    setLoading(true);
    try {
      const res = url ? await API.get(url) : await API.get("review-assignments/", { params: { limit, offset: 0 } });
      const results = res.data.results || [];   // ✅ extract array
      setAssignments(results);
      setNextUrl(res.data.next);
      setPrevUrl(res.data.previous);
      setTotalCount(res.data.count);

      // Determine current page from offset
      let offset = 0;
      if (res.data.previous) {
        const match = res.data.previous.match(/offset=(\d+)/);
        if (match) offset = parseInt(match[1]);
      } else if (res.data.next) {
        const match = res.data.next.match(/offset=(\d+)/);
        if (match) offset = parseInt(match[1]) - limit;
      }
      setCurrentPage(Math.floor(offset / limit) + 1);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.patch(`review-assignments/${id}/`, { status });
      // Refresh the current page after update
      const offset = (currentPage - 1) * limit;
      await fetchAssignments(`review-assignments/?limit=${limit}&offset=${offset}`);
    } catch (err) {
      console.error(err);
    }
  };

  const goToPage = (url) => {
    if (url) fetchAssignments(url);
  };

  if (loading) return <div className="p-6 text-center">Loading assignments...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Review Assignments</h1>
      {assignments.length === 0 ? (
        <p className="text-gray-500">No assignments found.</p>
      ) : (
        <>
          <div className="space-y-4">
            {assignments.map((ass) => (
              <div key={ass.id} className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">Student: {ass.student_name || ass.student?.full_name || "—"}</p>
                    <p className="text-sm text-gray-600">Course: {ass.course}</p>
                    <p className="text-sm text-gray-600">Mentor: {ass.mentor_name || ass.mentor?.full_name || "—"}</p>
                    {ass.review_sheet && (
                      <p className="text-sm">
                        Review Sheet:{" "}
                        <a href={ass.review_sheet} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                          Link
                        </a>
                      </p>
                    )}
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                        ass.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : ass.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {ass.status.toUpperCase()}
                    </span>
                  </div>
                  {ass.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(ass.id, "accepted")}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(ass.id, "rejected")}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          {(prevUrl || nextUrl) && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => goToPage(prevUrl)}
                disabled={!prevUrl}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {currentPage} of {Math.ceil(totalCount / limit)}
              </span>
              <button
                onClick={() => goToPage(nextUrl)}
                disabled={!nextUrl}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReviewerAssignments;