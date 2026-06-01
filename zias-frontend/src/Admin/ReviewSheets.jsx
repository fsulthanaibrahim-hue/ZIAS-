import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

function ReviewSheets() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const fetched = useRef(false);

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

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 text-gray-800">
      <style>{`
        .table-row-hover:hover { background: rgba(34,197,94,0.04); }
        @media (max-width: 640px) {
          .review-table thead { display: none; }
          .review-table tbody tr { display: block; margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; background: white; }
          .review-table tbody td { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; text-align: right; gap: 1rem; }
          .review-table tbody td:last-child { border-bottom: none; }
          .review-table tbody td::before { content: attr(data-label); font-weight: 600; color: #6b7280; text-align: left; flex: 1; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Student Review Sheets</h1>
              <p className="text-gray-500 text-xs mt-0.5">{students.length} total · {filteredStudents.length} shown</p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 transition-all text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="review-table min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Username</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Course</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Batch</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="table-row-hover group">
                  <td data-label="Name" className="px-4 py-3 text-gray-800 text-sm break-words">{student.name}</td>
                  <td data-label="Username" className="px-4 py-3 text-gray-500 text-sm">@{student.username}</td>
                  <td data-label="Email" className="px-4 py-3 text-gray-500 text-sm break-all">{student.email || "—"}</td>
                  <td data-label="Course" className="px-4 py-3 text-gray-500 text-sm">{student.course || "—"}</td>
                  <td data-label="Batch" className="px-4 py-3 text-gray-500 text-sm">{student.batch_name || student.batch || "—"}</td>
                  <td data-label="Action" className="px-4 py-3">
                    <Link to={`/admin/student-review-edit?student_id=${student.id}`} className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit Sheet
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    {search ? "No students match your search" : "No students found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredStudents.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
              <p className="text-gray-500 text-xs">Showing {filteredStudents.length} of {students.length} students</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewSheets;