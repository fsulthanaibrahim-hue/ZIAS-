// src/pages/reviewer/ReviewerStudents.jsx
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

function ReviewerStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isFetched = useRef(false);   // Prevent double call in StrictMode

  useEffect(() => {
    if (isFetched.current) return;
    isFetched.current = true;

    const fetchStudents = async () => {
      try {
        const res = await API.get("/students/for-reviewer/");
        setStudents(res.data);
      } catch (err) {
        setError("Could not load assigned students.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 text-center text-red-600">{error}</div>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Students</h1>
          <p className="text-gray-500 text-sm mt-1">
            Students assigned to you ({students.length})
          </p>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500">No students assigned for review yet.</p>
            <p className="text-gray-400 text-sm mt-2">
              Please contact an administrator to assign students to your reviewer profile.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center uppercase font-bold text-green-700">
                    {student.username?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {student.full_name || student.username}
                    </h3>
                    <p className="text-xs text-gray-500">{student.course}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link
                    to={`/reviewer/review-sheet?student_id=${student.id}`}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition"
                  >
                    Review Sheet
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default ReviewerStudents;