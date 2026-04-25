// src/pages/mentor/MentorStudents.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

function MentorStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchStudents = async () => {
      try {
        const mentorRes = await API.get("mentors/me/", { signal: abortController.signal });
        if (!isMounted) return;
        const mentorId = mentorRes.data.id;

        const studentsRes = await API.get("students/", {
          params: { mentor: mentorId },
          signal: abortController.signal,
        });
        if (!isMounted) return;
        setStudents(studentsRes.data);
      } catch (err) {
        if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;
        console.error("Failed to fetch students:", err);
        if (isMounted) setError("Could not load students. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudents();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Filter students based on search term (case-insensitive)
  const filteredStudents = students.filter(student =>
    (student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse mt-3"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Students</h1>
          <p className="text-gray-500 text-sm mt-1">
            Students assigned to you ({filteredStudents.length})
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search by name..."
              className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500">
              {searchTerm ? "No students match your search." : "No students assigned to you yet."}
            </p>
            {!searchTerm && (
              <p className="text-gray-400 text-sm mt-2">
                Please contact an administrator to assign students to your mentor profile.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all duration-200"
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
                    to={`/mentor/review-sheet?student_id=${student.id}`}
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

export default MentorStudents;