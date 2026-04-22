// src/Admin/Mentors.jsx (corrected – removed qualification & experience)
import { useEffect, useState, useRef } from "react";
import API from "../api/api";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" 
    ? "bg-green-600" 
    : type === "error" 
    ? "bg-red-600" 
    : "bg-gray-600";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2 max-w-[90vw] sm:max-w-md`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

function ConfirmModal({ isOpen, onClose, onConfirm, mentorName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl p-6 mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="text-gray-900 font-medium">{mentorName}</span>?<br />
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Mentors() {
  const [mentors, setMentors] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [viewingMentor, setViewingMentor] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    expertise: "",
    batch: "",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mentorToDelete, setMentorToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  const initialFetchDone = useRef(false);

  const fetchMentors = () => {
    API.get("mentors/")
      .then(res => setMentors(res.data))
      .catch(err => {
        console.error(err);
        showToast("Failed to load mentors", "error");
      });
  };

  const fetchBatches = () => {
    API.get("batches/")
      .then(res => setBatchesList(res.data))
      .catch(() => showToast("Failed to load batches", "error"));
  };

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchMentors();
    fetchBatches();
  }, []);

  useEffect(() => {
    if (showForm) {
      fetchBatches();
    }
  }, [showForm]);

  const handleDeleteClick = (mentorId, mentorName) => {
    setMentorToDelete({ id: mentorId, name: mentorName });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!mentorToDelete) return;
    try {
      await API.delete(`mentors/${mentorToDelete.id}/`);
      fetchMentors();
      showToast("Mentor deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete mentor", "error");
    } finally {
      setShowConfirmModal(false);
      setMentorToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      showToast("Phone number must be exactly 10 digits", "error");
      setPhoneError("Phone number must be exactly 10 digits");
      return;
    }
    setPhoneError("");

    const payload = {
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
      expertise: formData.expertise,
      batch: formData.batch || null,
    };
    try {
      if (editingId) {
        await API.patch(`mentors/${editingId}/`, payload);
        showToast("Mentor updated successfully", "success");
      } else {
        await API.post("mentors/", payload);
        showToast("Mentor added successfully", "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        username: "", email: "", phone: "", expertise: "", batch: "",
      });
      setPhoneError("");
      fetchMentors();
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

  const handleEdit = (mentor) => {
    setEditingId(mentor.id);
    setFormData({
      username: mentor.username,
      email: mentor.email,
      phone: mentor.phone || "",
      expertise: mentor.expertise,
      batch: mentor.batch || "",
    });
    setPhoneError("");
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digits }));
      if (digits.length > 0 && digits.length !== 10) {
        setPhoneError("Phone number must be exactly 10 digits");
      } else {
        setPhoneError("");
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const filteredMentors = mentors.filter(m =>
    m.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFiltered = filteredMentors.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMentors = filteredMentors.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const inputClass = `
    w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800
    placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30
    transition-all duration-200 text-sm
  `;
  const readOnlyClass = `
    w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-600
    cursor-not-allowed text-sm
  `;

  const getInitials = (name) => (name || "?")[0].toUpperCase();
  const avatarColors = [
    "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700", "from-amber-500 to-amber-700",
    "from-rose-500 to-rose-700", "from-cyan-500 to-cyan-700",
  ];
  const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  const getBatchName = (batchId) => {
    const batch = batchesList.find(b => b.id === batchId);
    return batch ? batch.name : "—";
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800" style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        .table-row-hover:hover { background: rgba(34,197,94,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
        @keyframes slide-in-from-top-2 {
          from { opacity:0; transform:translateY(-1rem); }
          to { opacity:1; transform:translateY(0); }
        }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
        @media (max-width: 640px) {
          .mentor-table thead { display: none; }
          .mentor-table tbody tr { display: block; margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; background: white; }
          .mentor-table tbody td { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; text-align: right; gap: 1rem; }
          .mentor-table tbody td:last-child { border-bottom: none; }
          .mentor-table tbody td::before { content: attr(data-label); font-weight: 600; color: #6b7280; text-align: left; flex: 1; }
          .mentor-table tbody td .action-buttons { margin-left: auto; display: flex; gap: 0.5rem; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} mentorName={mentorToDelete?.name} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">

        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Mentors</h1>
              <p className="text-gray-500 text-xs mt-0.5">{mentors.length} total · {filteredMentors.length} shown</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search mentors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  username: "", email: "", phone: "", expertise: "", batch: "",
                });
                setPhoneError("");
                setShowForm(true);
              }}
              className="shine flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Mentor
            </button>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
            <form onSubmit={handleSubmit} className="modal-enter bg-white rounded-2xl w-full max-w-2xl border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{editingId ? "Edit Mentor" : "New Mentor"}</h3>
                    <p className="text-gray-500 text-xs">{editingId ? "Update mentor information" : "Add a new mentor to the system"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Username *</label><input type="text" name="username" value={formData.username} onChange={handleChange} required className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${inputClass} ${phoneError ? "border-red-500" : ""}`} placeholder="10-digit mobile" />{phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}</div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Expertise *</label><input type="text" name="expertise" value={formData.expertise} onChange={handleChange} required className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Batch</label><select name="batch" value={formData.batch} onChange={handleChange} className={inputClass}><option value="">Select a batch</option>{batchesList.map(batch => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></div>
                </div>
              </div>

              <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-gray-200">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-all text-sm font-medium shadow-sm">
                  {editingId ? "Save Changes" : "Add Mentor"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View Details Modal */}
        {viewingMentor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setViewingMentor(null)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Mentor Details</h3>
                    <p className="text-gray-500 text-xs">View all information</p>
                  </div>
                </div>
                <button type="button" onClick={() => setViewingMentor(null)} className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-500 text-xs font-medium mb-1.5">Username</label><input type="text" value={viewingMentor.username || ""} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-gray-500 text-xs font-medium mb-1.5">Email</label><input type="text" value={viewingMentor.email || ""} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-gray-500 text-xs font-medium mb-1.5">Phone</label><input type="text" value={viewingMentor.phone || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-gray-500 text-xs font-medium mb-1.5">Expertise</label><input type="text" value={viewingMentor.expertise || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-gray-500 text-xs font-medium mb-1.5">Batch</label><input type="text" value={getBatchName(viewingMentor.batch)} readOnly className={readOnlyClass} /></div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end">
                <button onClick={() => setViewingMentor(null)} className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 hover:text-gray-800 px-5 py-2 rounded-lg">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Mentors Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="mentor-table min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Mentor", "Email", "Phone", "Expertise", "Batch", ""].map((h, i) => <th key={i} className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">{h}</th>)}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedMentors.length > 0 ? (
                paginatedMentors.map((m) => (
                  <tr key={m.id} className="table-row-hover transition-colors duration-150 group">
                    <td data-label="Mentor" className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(m.username)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{getInitials(m.username)}</div>
                        <button onClick={() => setViewingMentor(m)} className="text-gray-800 text-sm font-medium hover:text-green-600 transition-colors cursor-pointer">{m.username}</button>
                      </div>
                    </td>
                    <td data-label="Email" className="px-4 py-3 text-gray-500 text-sm break-all">{m.email}</td>
                    <td data-label="Phone" className="px-4 py-3 text-gray-500 text-sm">{m.phone || "—"}</td>
                    <td data-label="Expertise" className="px-4 py-3"><span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 border border-green-200 text-xs font-medium px-2 py-1 rounded-full">{m.expertise}</span></td>
                    <td data-label="Batch" className="px-4 py-3">{m.batch ? <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium px-2 py-1 rounded-full">{getBatchName(m.batch)}</span> : <span className="text-gray-400 text-xs">—</span>}</td>
                    <td data-label="Actions" className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(m)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all text-xs font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button onClick={() => handleDeleteClick(m.id, m.username)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-xs font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 sm:py-20 text-gray-500">
                    {searchTerm ? "No mentors match your search" : "No mentors yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {totalFiltered > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row justify-between gap-3 items-center">
              <div className="text-gray-500 text-xs">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered} mentors</div>
              <div className="flex gap-1 flex-wrap justify-center">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100 disabled:hover:bg-transparent">←</button>
                {getPageNumbers().map((page, idx) => page === "..." ? <span key={idx} className="px-2 py-1.5 text-gray-400">...</span> : <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === page ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>{page}</button>)}
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100 disabled:hover:bg-transparent">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Mentors;