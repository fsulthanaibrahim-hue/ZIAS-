// src/pages/student/StudentReviewSheet.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/api";

function StudentReviewSheet() {
  const [student, setStudent] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await API.get("students/me/");
        setStudent(studentRes.data);

        const modulesRes = await API.get("modules/student-modules/");
        setWeeks(modulesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">📊 Student Review Sheet</h1>
            <p className="text-[#7d8590] text-sm mt-1">
              {student?.full_name || student?.username} • {student?.course || "No Course"}
            </p>
          </div>
          <Link to="/student/dashboard" className="text-[#7d8590] hover:text-white text-sm">
            ← Dashboard
          </Link>
        </div>

        {/* Spreadsheet‑style Table */}
        <div className="overflow-x-auto border border-[#21262d] rounded-lg">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#161b22] border-b border-[#21262d]">
                <th className="px-4 py-3 text-left font-semibold text-[#7d8590] border-r border-[#21262d]">Week</th>
                <th className="px-4 py-3 text-left font-semibold text-[#7d8590] border-r border-[#21262d]">Module Title</th>
                <th className="px-4 py-3 text-left font-semibold text-[#7d8590] border-r border-[#21262d]">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-[#7d8590]">Action</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, idx) => (
                <tr
                  key={week.id}
                  className={`${idx % 2 === 0 ? "bg-[#0d1117]" : "bg-[#161b22]/30"} border-b border-[#21262d] hover:bg-[#1a2538] transition cursor-pointer`}
                  onClick={() => navigate(`/student/week/${week.id}`)}
                >
                  <td className="px-4 py-3 border-r border-[#21262d] font-medium">Week {week.order || idx + 1}</td>
                  <td className="px-4 py-3 border-r border-[#21262d]">{week.title}</td>
                  <td className="px-4 py-3 border-r border-[#21262d]">
                    <span className="text-yellow-400 text-xs">In Progress</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-[#388bfd] hover:text-white">View Details →</button>
                  </td>
                </tr>
              ))}
              {weeks.length === 0 && (
                <tr><td colSpan="4" className="text-center py-8 text-[#7d8590]">No weeks available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentReviewSheet;