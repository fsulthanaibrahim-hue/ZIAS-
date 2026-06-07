import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

function ReviewSheets() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    s.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.course?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 text-gray-800 min-h-screen">
      <style>{`
        .table-row-hover:hover { background: rgba(34,197,94,0.04); }
        
        /* Enhanced Responsive Table Styles */
        @media (max-width: 768px) {
          .review-table thead {
            display: none;
          }
          .review-table tbody tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.75rem;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            transition: all 0.2s;
          }
          .review-table tbody tr:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          .review-table tbody td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.875rem 1rem;
            border-bottom: 1px solid #e5e7eb;
            text-align: right;
            gap: 1rem;
            flex-wrap: wrap;
          }
          .review-table tbody td:last-child {
            border-bottom: none;
          }
          .review-table tbody td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #059669;
            background: #ecfdf5;
            padding: 0.25rem 0.75rem;
            border-radius: 2rem;
            font-size: 0.7rem;
            letter-spacing: 0.03em;
            text-align: left;
            flex-shrink: 0;
            min-width: 100px;
          }
          
          /* Touch-friendly tap targets */
          button, 
          [role="button"],
          .tap-target {
            min-height: 44px;
            cursor: pointer;
          }
          
          /* Action button on mobile */
          .action-button-mobile {
            width: 100%;
            justify-content: center;
          }
        }
        
        /* Tablet optimization */
        @media (min-width: 769px) and (max-width: 1024px) {
          .review-table td {
            padding: 0.75rem 0.5rem;
          }
          .action-buttons {
            display: flex;
            gap: 0.25rem;
          }
        }
        
        /* Animation for loading */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* Header Section - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 tracking-tight">Student Review Sheets</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                {students.length} total · {filteredStudents.length} shown
              </p>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Search
            </button>
          </div>

          {/* Search Input - Responsive */}
          <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:flex relative w-full sm:w-72 md:w-80`}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, username, email or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-9 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm"
            />
            {search && (
              <button 
                onClick={() => setSearch("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <div className="overflow-x-auto">
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
                  <tr key={student.id} className="table-row-hover group transition-colors duration-150">
                    <td className="px-4 py-3 text-gray-800 text-sm font-medium break-words">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      @{student.username}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm break-all">
                      {student.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {student.course || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-gray-50 border border-gray-200 text-gray-600 text-xs font-mono px-2.5 py-1 rounded-full">
                        {student.batch_name || student.batch || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link 
                        to={`/admin/student-review-edit?student_id=${student.id}`} 
                        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Sheet
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500">{search ? "No students match your search" : "No students found"}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredStudents.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
              <p className="text-gray-500 text-xs">Showing {filteredStudents.length} of {students.length} students</p>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-sm">{search ? "No students match your search" : "No students found"}</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Student Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-base">{student.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">@{student.username}</p>
                  </div>
                  <div className="flex gap-1">
                    <Link 
                      to={`/admin/student-review-edit?student_id=${student.id}`}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                  </div>
                </div>
                
                {/* Student Details Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-xs text-gray-700 break-all">{student.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Course</p>
                    <span className="inline-block bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {student.course || "—"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Batch</p>
                    <span className="inline-block bg-gray-50 border border-gray-200 text-gray-600 text-xs font-mono px-2 py-0.5 rounded-full">
                      {student.batch_name || student.batch || "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile Info Footer */}
        {filteredStudents.length > 0 && (
          <div className="mt-4 md:hidden bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-gray-500 text-xs text-center">
              Showing {filteredStudents.length} of {students.length} students
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewSheets;