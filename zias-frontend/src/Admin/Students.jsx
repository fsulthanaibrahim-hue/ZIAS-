import { useEffect, useState } from "react";
import API from "../api/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    course: "",
    batch: "",
    phone: "",
    date_of_birth: "",
  });

  const fetchStudents = () => {
    API.get("students/")
      .then((res) => setStudents(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      API.delete(`students/${id}/`)
        .then(() => fetchStudents())
        .catch((err) => console.error(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      username: formData.username,
      email: formData.email,
      course: formData.course,
      batch: formData.batch,
      phone: formData.phone,
      date_of_birth: formData.date_of_birth || null,
    };
    try {
      if (editingId) {
        await API.patch(`students/${editingId}/`, payload);
      } else {
        await API.post("students/", payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ username: "", email: "", course: "", batch: "", phone: "", date_of_birth: "" });
      fetchStudents();
    } catch (error) {
      if (error.response) {
        alert(`Error ${error.response.status}:\n${JSON.stringify(error.response.data, null, 2)}`);
        console.error(error.response.data);
      } else {
        alert(error.message);
      }
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      username: student.username,
      email: student.email,
      course: student.course,
      batch: student.batch,
      phone: student.phone,
      date_of_birth: student.date_of_birth || "",
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredStudents = students.filter((s) =>
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.courses && s.courses.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const inputClass = `
    w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-[#e6edf3]
    placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/30
    transition-all duration-200 text-sm font-mono
  `;

  // ✅ Avatar: single letter (first character)
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : "?";
  const avatarColors = [
    "from-blue-500 to-blue-700",
    "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700",
    "from-amber-500 to-amber-700",
    "from-rose-500 to-rose-700",
    "from-cyan-500 to-cyan-700",
  ];
  const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="min-h-screen w-screen bg-[#0d1117] text-[#e6edf3]" style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');
        .table-row-hover:hover { background: rgba(56,139,253,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ── Top Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Students</h1>
              <p className="text-[#7d8590] text-xs mt-0.5">
                {students.length} total · {filteredStudents.length} shown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/20 transition-all text-sm w-64"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#7d8590] transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ username: "", email: "", course: "", batch: "", phone: "", date_of_birth: "" });
                setShowForm(true);
              }}
              className="shine flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-[#238636]/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Student
            </button>
          </div>
        </div>

        {/* ── Modal ── (unchanged) */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md"
            onClick={() => setShowForm(false)}
          >
            <form
              onSubmit={handleSubmit}
              className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-md border border-[#30363d] shadow-2xl shadow-black/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#21262d]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#e6edf3]">{editingId ? "Edit Student" : "New Student"}</h3>
                    <p className="text-[#7d8590] text-xs">{editingId ? "Update student information" : "Add a new student to the system"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-[#484f58] hover:text-[#7d8590] transition p-1.5 rounded-lg hover:bg-[#21262d]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Username</label>
                  <input type="text" name="username" placeholder="johndoe" value={formData.username} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
                  <input type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Course</label>
                    <input type="text" name="course" placeholder="e.g. B.Tech" value={formData.course} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Batch</label>
                    <input type="text" name="batch" placeholder="e.g. 2024" value={formData.batch} onChange={handleChange} required className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Phone</label>
                    <input type="text" name="phone" placeholder="+91 00000 00000" value={formData.phone} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Date of Birth</label>
                    <input type="date" name="date_of_birth" value={formData.date_of_birth || ""} onChange={handleChange} className={inputClass} style={{ colorScheme: "dark" }} />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-2 px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="flex-1 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white py-2 rounded-lg transition-all text-sm font-medium shadow-md shadow-[#238636]/20">
                  {editingId ? "Save Changes" : "Add Student"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] py-2 rounded-lg transition-all text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Table ── */}
        <div className="rounded-xl border border-[#21262d] overflow-hidden shadow-xl shadow-black/20">
          <table className="w-full">
            <thead>
              <tr className="bg-[#161b22] border-b border-[#21262d]">
                {["Student", "Email", "Course", "Batch", "Phone", "Date of Birth", "Enrolled Courses", ""].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="table-row-hover transition-colors duration-150 group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(s.username)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {getInitial(s.username)}
                        </div>
                        <span className="text-[#e6edf3] text-sm font-medium">{s.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#7d8590] text-sm font-mono">{s.email}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium px-2.5 py-1 rounded-full">
                        {s.course}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center bg-[#21262d] text-[#7d8590] border border-[#30363d] text-xs font-mono px-2.5 py-1 rounded-full">
                        {s.batch}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#7d8590] text-sm font-mono">{s.phone}</td>
                    <td className="px-4 py-3.5 text-[#7d8590] text-sm font-mono">{s.date_of_birth || "—"}</td>
                    <td className="px-4 py-3.5">
                      {s.courses && s.courses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.courses.map(c => (
                            <span key={c.id} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium px-2 py-0.5 rounded-full">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#484f58] text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() => handleEdit(s)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 border border-transparent hover:border-[#388bfd]/20 transition-all text-xs font-medium"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-xs font-medium"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-[#7d8590] text-sm font-medium">
                        {searchTerm ? "No students match your search" : "No students yet"}
                      </p>
                      <p className="text-[#484f58] text-xs">
                        {searchTerm ? "Try a different keyword" : "Click 'Add Student' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Table Footer */}
          {filteredStudents.length > 0 && (
            <div className="bg-[#161b22] border-t border-[#21262d] px-4 py-2.5 flex items-center justify-between">
              <p className="text-[#484f58] text-xs">
                Showing <span className="text-[#7d8590] font-medium">{filteredStudents.length}</span> of <span className="text-[#7d8590] font-medium">{students.length}</span> students
              </p>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="text-[#388bfd] hover:text-blue-300 text-xs font-medium transition">
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Students;