// src/Admin/ReviewSheets.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

function ReviewSheets() {
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
    <div className="min-h-screen bg-[#0d1117] p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">📊 Student Review Sheets</h1>
        <input
          type="text"
          placeholder="Search by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#161b22] border border-[#21262d] rounded-lg px-4 py-2 text-sm text-white"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-[#e6edf3]">
          <thead className="bg-[#161b22] text-[#7d8590]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-b border-[#21262d] hover:bg-[#161b22]/50">
                <td className="px-4 py-3">{student.name}</td>
                <td className="px-4 py-3">@{student.username}</td>
                <td className="px-4 py-3">{student.email || "—"}</td>
                <td className="px-4 py-3">{student.course || "—"}</td>
                <td className="px-4 py-3">{student.batch || "—"}</td>
                <td className="px-4 py-3">
                  <Link
                    to={`/student/review-sheet?student_id=${student.id}`}
                    className="bg-[#238636] hover:bg-[#2ea043] text-white px-3 py-1 rounded text-xs inline-flex items-center gap-1"
                  >
                    📄 View Review Sheet
                  </Link>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-[#7d8590]">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReviewSheets;