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
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0d1117] text-[#e6edf3]" style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        .table-row-hover:hover { background: rgba(56,139,253,0.04); }
        /* Mobile card layout */
        @media (max-width: 640px) {
          .review-table thead { display: none; }
          .review-table tbody tr { display: block; margin-bottom: 1rem; border: 1px solid #21262d; border-radius: 0.75rem; background: #0d1117; }
          .review-table tbody td { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #21262d; text-align: right; gap: 1rem; }
          .review-table tbody td:last-child { border-bottom: none; }
          .review-table tbody td::before { content: attr(data-label); font-weight: 600; color: #7d8590; text-align: left; flex: 1; }
          .review-table tbody td .action-button { margin-left: auto; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Student Review Sheets</h1>
              <p className="text-[#7d8590] text-xs mt-0.5">
                {students.length} total · {filteredStudents.length} shown
              </p>
            </div>
          </div>

          {/* Search - full width on mobile */}
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-all text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#7d8590]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Table with responsive card layout */}
        <div className="overflow-hidden rounded-xl border border-[#21262d] shadow-xl shadow-black/20">
          <table className="review-table min-w-full">
            <thead className="bg-[#161b22] border-b border-[#21262d]">
              <tr>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Name</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Username</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Course</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Batch</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="table-row-hover transition-colors duration-150 group">
                  <td data-label="Name" className="px-4 py-3 text-[#e6edf3] text-sm break-words">
                    {student.name}
                  </td>
                  <td data-label="Username" className="px-4 py-3 text-[#7d8590] text-sm">
                    @{student.username}
                  </td>
                  <td data-label="Email" className="px-4 py-3 text-[#7d8590] text-sm break-all">
                    {student.email || "—"}
                  </td>
                  <td data-label="Course" className="px-4 py-3 text-[#7d8590] text-sm">
                    {student.course || "—"}
                  </td>
                  <td data-label="Batch" className="px-4 py-3 text-[#7d8590] text-sm">
                    {student.batch_name || student.batch || "—"}
                  </td>
                  <td data-label="Action" className="px-4 py-3">
                    <Link
                      to={`/student/review-sheet?student_id=${student.id}`}
                      className="inline-flex items-center gap-1 bg-[#238636] hover:bg-[#2ea043] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shadow-md shadow-[#238636]/20"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Sheet
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 sm:py-20 text-[#7d8590]">
                    {search ? "No students match your search" : "No students found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Footer stats */}
          {filteredStudents.length > 0 && (
            <div className="bg-[#161b22] border-t border-[#21262d] px-4 py-3">
              <p className="text-[#484f58] text-xs">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewSheets;