// src/pages/reviewer/ReviewerDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

function ReviewerDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await API.get("students/list/");
        setStudents(res.data);
      } catch (err) {
        console.error("Failed to fetch students", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">📋 Reviewer Dashboard</h1>
          <div className="flex gap-4">
            <Link
              to="/reviewer/profile"
              className="text-[#7d8590] hover:text-white text-sm transition"
            >
              👤 My Profile
            </Link>
            <Link
              to="/login"
              className="text-[#7d8590] hover:text-white text-sm transition"
              onClick={() => localStorage.clear()}
            >
              Logout
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 bg-[#161b22] border border-[#21262d] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#388bfd]"
          />
        </div>

        {/* Student cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-[#161b22] rounded-xl border border-[#21262d] p-5 hover:bg-[#1a2538] transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#238636] flex items-center justify-center text-white font-bold">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{student.name}</h3>
                  <p className="text-[#7d8590] text-xs">@{student.username}</p>
                </div>
              </div>
              <Link
                to={`/student/review-sheet?student_id=${student.id}`}
                className="block text-center bg-[#21262d] hover:bg-[#30363d] rounded-lg px-4 py-2 text-sm transition"
              >
                📊 View Review Sheet
              </Link>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <p className="text-[#7d8590] col-span-full text-center py-8">No students found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewerDashboard;