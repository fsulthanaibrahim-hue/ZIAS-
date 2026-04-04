import { useEffect, useState } from "react";
import API from "../api/api";

// Simple Toast Component (auto-dismiss after 3 seconds)
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" 
    ? "bg-emerald-500/90" 
    : type === "error" 
    ? "bg-red-500/90" 
    : "bg-blue-500/90";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">×</button>
    </div>
  );
}

function Reviewers() {
  const [reviewers, setReviewers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    department: ""
  });

  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  const fetchReviewers = () => {
    API.get("reviewers/")
      .then(res => setReviewers(res.data))
      .catch(err => {
        console.error(err);
        showToast("Failed to load reviewers", "error");
      });
  };

  useEffect(() => { fetchReviewers(); }, []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure?")) {
      API.delete(`reviewers/${id}/`)
        .then(() => {
          fetchReviewers();
          showToast("Reviewer deleted successfully", "success");
        })
        .catch(err => {
          console.error(err);
          showToast("Failed to delete reviewer", "error");
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      username: formData.username,
      email: formData.email,
      department: formData.department,
    };
    try {
      if (editingId) {
        await API.patch(`reviewers/${editingId}/`, payload);
        showToast("Reviewer updated successfully", "success");
      } else {
        await API.post("reviewers/", payload);
        showToast("Reviewer added successfully", "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ username: "", email: "", department: "" });
      fetchReviewers();
    } catch (error) {
      if (error.response) {
        const errorMsg = Object.values(error.response.data).flat().join(", ");
        showToast(`Error: ${errorMsg || error.response.statusText}`, "error");
        console.error(error.response.data);
      } else {
        showToast(error.message, "error");
      }
    }
  };

  const handleEdit = (reviewer) => {
    setEditingId(reviewer.id);
    setFormData({
      username: reviewer.username,
      email: reviewer.email,
      department: reviewer.department,
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredReviewers = reviewers.filter((r) =>
    r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = `
    w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-[#e6edf3]
    placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/30
    transition-all duration-200 text-sm font-mono
  `;

  const getInitials = (name) => (name || "?")[0].toUpperCase();
  const avatarColors = [
    "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700", "from-amber-500 to-amber-700",
    "from-rose-500 to-rose-700", "from-cyan-500 to-cyan-700",
  ];
  const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="min-h-screen w-screen bg-[#0d1117] text-[#e6edf3]"
      style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        .table-row-hover:hover { background: rgba(56,139,253,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
        @keyframes slide-in-from-top-2 {
          from { opacity:0; transform:translateY(-1rem); }
          to { opacity:1; transform:translateY(0); }
        }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
      `}</style>

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ── Top Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Reviewers</h1>
              <p className="text-[#7d8590] text-xs mt-0.5">
                {reviewers.length} total · {filteredReviewers.length} shown
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
                placeholder="Search reviewers..."
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
                setFormData({ username: "", email: "", department: "" });
                setShowForm(true);
              }}
              className="shine flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-[#238636]/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Reviewer
            </button>
          </div>
        </div>

        {/* ── Modal ── */}
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
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingId
                        ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#e6edf3]">{editingId ? "Edit Reviewer" : "New Reviewer"}</h3>
                    <p className="text-[#7d8590] text-xs">{editingId ? "Update reviewer information" : "Add a new reviewer to the system"}</p>
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
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Department</label>
                  <input type="text" name="department" placeholder="e.g. Engineering" value={formData.department} onChange={handleChange} required className={inputClass} />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-2 px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="flex-1 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white py-2 rounded-lg transition-all text-sm font-medium shadow-md shadow-[#238636]/20">
                  {editingId ? "Save Changes" : "Add Reviewer"}
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
                {["Reviewer", "Email", "Department", ""].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {filteredReviewers.length > 0 ? (
                filteredReviewers.map((r) => (
                  <tr key={r.id} className="table-row-hover transition-colors duration-150 group">
                    {/* Reviewer name + avatar */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(r.username)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {getInitials(r.username)}
                        </div>
                        <span className="text-[#e6edf3] text-sm font-medium">{r.username}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[#7d8590] text-sm font-mono">{r.email}</td>

                    {/* Department badge */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium px-2.5 py-1 rounded-full">
                        {r.department}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() => handleEdit(r)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 border border-transparent hover:border-[#388bfd]/20 transition-all text-xs font-medium"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-xs font-medium"
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
                  <td colSpan="4" className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="text-[#7d8590] text-sm font-medium">
                        {searchTerm ? "No reviewers match your search" : "No reviewers yet"}
                      </p>
                      <p className="text-[#484f58] text-xs">
                        {searchTerm ? "Try a different keyword" : "Click 'Add Reviewer' to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Table Footer */}
          {filteredReviewers.length > 0 && (
            <div className="bg-[#161b22] border-t border-[#21262d] px-4 py-2.5 flex items-center justify-between">
              <p className="text-[#484f58] text-xs">
                Showing <span className="text-[#7d8590] font-medium">{filteredReviewers.length}</span> of <span className="text-[#7d8590] font-medium">{reviewers.length}</span> reviewers
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

export default Reviewers;