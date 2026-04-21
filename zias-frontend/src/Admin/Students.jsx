// src/Admin/Students.jsx
import { useEffect, useState, useRef } from "react";
import API from "../api/api";

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
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2 max-w-[90vw] sm:max-w-md`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

// Custom confirmation modal for delete
function ConfirmModal({ isOpen, onClose, onConfirm, studentName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md p-4">
      <div className="bg-[#161b22] rounded-2xl max-w-md w-full border border-[#30363d] shadow-2xl shadow-black/60 p-6 mx-4">
        <h3 className="text-lg font-semibold text-[#e6edf3] mb-2">Confirm Delete</h3>
        <p className="text-[#7d8590] mb-6">
          Are you sure you want to delete <span className="text-white font-medium">{studentName}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#7d8590] hover:text-white transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Students() {
  const [students, setStudents] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingStudent, setViewingStudent] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true); // new loading state

  // Delete confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    course: "",
    batch: "",
    mentor: "",
    phone: "",
    date_of_birth: "",
    age: "",
    gender: "",
    fathers_name: "",
    fathers_contact: "",
    mothers_name: "",
    mothers_contact: "",
    address: "",
    educational_qualification: "",
    college_school: "",
  });

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  const fetched = useRef(false);

  const fetchStudents = () => {
    API.get("students/")
      .then((res) => setStudents(res.data))
      .catch((err) => {
        console.error(err);
        showToast("Failed to load students", "error");
      })
      .finally(() => setLoading(false));
  };

  const fetchCourses = () => {
    API.get("courses/")
      .then((res) => setCoursesList(res.data))
      .catch(() => showToast("Failed to load courses", "error"));
  };
  const fetchBatches = () => {
    API.get("batches/")
      .then((res) => setBatchesList(res.data))
      .catch(() => showToast("Failed to load batches", "error"));
  };
  const fetchMentors = () => {
    API.get("mentors/")
      .then((res) => setMentorsList(res.data))
      .catch(() => showToast("Failed to load mentors", "error"));
  };

  // Initial data fetch – runs only once (ref resets on full page refresh)
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    Promise.all([fetchStudents(), fetchCourses(), fetchBatches(), fetchMentors()]).catch(() => {});
  }, []);

  // No extra fetch when form opens – the lists are already loaded

  const handleDeleteClick = (studentId, studentName) => {
    setStudentToDelete({ id: studentId, name: studentName });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await API.delete(`students/${studentToDelete.id}/`);
      fetchStudents();
      showToast("Student deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete student", "error");
    } finally {
      setShowConfirmModal(false);
      setStudentToDelete(null);
    }
  };

  // Auto-calculate age from date_of_birth
  useEffect(() => {
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age: age.toString() }));
    } else {
      setFormData(prev => ({ ...prev, age: "" }));
    }
  }, [formData.date_of_birth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      showToast("Phone number must be exactly 10 digits", "error");
      setPhoneError("Phone number must be exactly 10 digits");
      return;
    }
    setPhoneError("");
    
    const payload = {
      username: formData.username.trim(),
      full_name: formData.full_name || null,
      email: formData.email,
      course: formData.course,
      batch: formData.batch,
      mentor: formData.mentor || null,
      phone: formData.phone,
      date_of_birth: formData.date_of_birth || null,
      age: formData.age || null,
      gender: formData.gender || null,
      fathers_name: formData.fathers_name || null,
      fathers_contact: formData.fathers_contact || null,
      mothers_name: formData.mothers_name || null,
      mothers_contact: formData.mothers_contact || null,
      address: formData.address || null,
      educational_qualification: formData.educational_qualification || null,
      college_school: formData.college_school || null,
    };
    
    try {
      if (editingId) {
        await API.patch(`students/${editingId}/`, payload);
        showToast("Student updated successfully", "success");
      } else {
        await API.post("students/", payload);
        showToast(`Student added successfully! Username: ${payload.username}`, "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        username: "", full_name: "", email: "", course: "", batch: "", mentor: "", phone: "", date_of_birth: "", age: "", gender: "",
        fathers_name: "", fathers_contact: "", mothers_name: "", mothers_contact: "",
        address: "", educational_qualification: "", college_school: "",
      });
      setPhoneError("");
      fetchStudents();
      setCurrentPage(1);
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

  const handleEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      username: student.username,
      full_name: student.full_name || "",
      email: student.email,
      course: student.course,
      batch: student.batch,
      mentor: student.mentor || "",
      phone: student.phone || "",
      date_of_birth: student.date_of_birth || "",
      age: student.age || "",
      gender: student.gender || "",
      fathers_name: student.fathers_name || "",
      fathers_contact: student.fathers_contact || "",
      mothers_name: student.mothers_name || "",
      mothers_contact: student.mothers_contact || "",
      address: student.address || "",
      educational_qualification: student.educational_qualification || "",
      college_school: student.college_school || "",
    });
    setPhoneError("");
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digits }));
      if (digits.length > 0 && digits.length !== 10) {
        setPhoneError('Phone number must be exactly 10 digits');
      } else {
        setPhoneError('');
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const filteredStudents = students.filter((s) =>
    s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.batch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFiltered = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

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
    w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-[#e6edf3]
    placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/30
    transition-all duration-200 text-sm
  `;
  const readOnlyClass = `
    w-full bg-[#0d1117]/50 border border-[#30363d]/50 rounded-lg px-4 py-2.5 text-[#7d8590]
    cursor-not-allowed text-sm
  `;

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

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-[#0d1117]">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0d1117] text-[#e6edf3]" style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');
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
        /* Mobile card layout for the student table */
        @media (max-width: 640px) {
          .student-table thead { display: none; }
          .student-table tbody tr { display: block; margin-bottom: 1rem; border: 1px solid #21262d; border-radius: 0.75rem; background: #0d1117; }
          .student-table tbody td { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #21262d; text-align: right; gap: 1rem; }
          .student-table tbody td:last-child { border-bottom: none; }
          .student-table tbody td::before { content: attr(data-label); font-weight: 600; color: #7d8590; text-align: left; flex: 1; }
          .student-table tbody td .action-buttons { margin-left: auto; display: flex; gap: 0.5rem; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} studentName={studentToDelete?.name} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Students</h1>
              <p className="text-[#7d8590] text-xs mt-0.5">{students.length} total · {filteredStudents.length} shown</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/20 transition-all text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#7d8590] transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  username: "", full_name: "", email: "", course: "", batch: "", mentor: "", phone: "", date_of_birth: "", age: "", gender: "",
                  fathers_name: "", fathers_contact: "", mothers_name: "", mothers_contact: "",
                  address: "", educational_qualification: "", college_school: "",
                });
                setPhoneError("");
                setShowForm(true);
              }}
              className="shine flex items-center justify-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-[#238636]/20 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Student
            </button>
          </div>
        </div>

        {/* Add/Edit Modal (full) – unchanged */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md p-4" onClick={() => setShowForm(false)}>
            <form onSubmit={handleSubmit} className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-3xl border border-[#30363d] shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[#161b22] z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-[#21262d]">
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

              <div className="px-4 sm:px-6 py-5 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-[#388bfd] uppercase tracking-wider mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Username *</label><input type="text" name="username" value={formData.username} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Full Name</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Course *</label><select name="course" value={formData.course} onChange={handleChange} required className={inputClass}><option value="">Select a course</option>{coursesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Batch *</label><select name="batch" value={formData.batch} onChange={handleChange} required className={inputClass}><option value="">Select a batch</option>{batchesList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mentor (optional)</label><select name="mentor" value={formData.mentor} onChange={handleChange} className={inputClass}><option value="">Select a mentor</option>{mentorsList.map(mentor => <option key={mentor.id} value={mentor.id}>{mentor.username} ({mentor.expertise || "No expertise"})</option>)}</select></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />{phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}</div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputClass} style={{ colorScheme: "dark" }} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Age</label><input type="text" name="age" value={formData.age} readOnly className={`${inputClass} cursor-not-allowed opacity-80`} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Gender</label><select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                  </div>
                </div>

                <div className="border-t border-[#21262d] pt-4">
                  <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Parents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Father's Name</label><input type="text" name="fathers_name" value={formData.fathers_name} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Father's Contact</label><input type="text" name="fathers_contact" value={formData.fathers_contact} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mother's Name</label><input type="text" name="mothers_name" value={formData.mothers_name} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mother's Contact</label><input type="text" name="mothers_contact" value={formData.mothers_contact} onChange={handleChange} className={inputClass} /></div>
                  </div>
                </div>

                <div className="border-t border-[#21262d] pt-4">
                  <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Address</h4>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Address</label><textarea name="address" rows="2" value={formData.address} onChange={handleChange} className={`${inputClass} resize-none`} /></div>
                </div>

                <div className="border-t border-[#21262d] pt-4">
                  <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Education</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Educational Qualification</label><input type="text" name="educational_qualification" value={formData.educational_qualification} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">College / School Name</label><input type="text" name="college_school" value={formData.college_school} onChange={handleChange} className={inputClass} /></div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-[#161b22] px-4 sm:px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="w-full bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white py-2.5 rounded-lg transition-all text-sm font-medium shadow-md shadow-[#238636]/20">
                  {editingId ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View Details Modal */}
        {viewingStudent && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md p-4" onClick={() => setViewingStudent(null)}>
            <div className="bg-[#161b22] rounded-2xl w-full max-w-3xl border border-[#30363d] shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[#161b22] z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-[#21262d]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#e6edf3]">Student Details</h3>
                    <p className="text-[#7d8590] text-xs">View all information</p>
                  </div>
                </div>
                <button type="button" onClick={() => setViewingStudent(null)} className="text-[#484f58] hover:text-[#7d8590] transition p-1.5 rounded-lg hover:bg-[#21262d]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-[#388bfd] uppercase tracking-wider mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Username</label><input type="text" value={viewingStudent.username} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Full Name</label><input type="text" value={viewingStudent.full_name || "—"} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Email</label><input type="text" value={viewingStudent.email} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Course</label><input type="text" value={viewingStudent.course} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Batch</label><input type="text" value={viewingStudent.batch} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mentor</label><input type="text" value={viewingStudent.mentor_name || "—"} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Phone</label><input type="text" value={viewingStudent.phone || "—"} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Date of Birth</label><input type="text" value={viewingStudent.date_of_birth || "—"} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Age</label><input type="text" value={viewingStudent.age || "—"} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Gender</label><input type="text" value={viewingStudent.gender || "—"} readOnly className={readOnlyClass} /></div>
                  </div>
                </div>
                <div className="border-t border-[#21262d] pt-4">
                  <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Parents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Father's Name</label><input type="text" value={viewingStudent.fathers_name || "—"} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Father's Contact</label><input type="text" value={viewingStudent.fathers_contact || "—"} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mother's Name</label><input type="text" value={viewingStudent.mothers_name || "—"} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mother's Contact</label><input type="text" value={viewingStudent.mothers_contact || "—"} readOnly className={readOnlyClass} /></div>
                  </div>
                </div>
                <div className="border-t border-[#21262d] pt-4">
                  <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Address</h4>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Address</label><textarea rows="2" value={viewingStudent.address || "—"} readOnly className={`${readOnlyClass} resize-none`} /></div>
                </div>
                <div className="border-t border-[#21262d] pt-4">
                  <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Education</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Educational Qualification</label><input type="text" value={viewingStudent.educational_qualification || "—"} readOnly className={readOnlyClass} /></div>
                    <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">College / School Name</label><input type="text" value={viewingStudent.college_school || "—"} readOnly className={readOnlyClass} /></div>
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-[#161b22] px-4 sm:px-6 py-4 border-t border-[#21262d] flex justify-end">
                <button onClick={() => setViewingStudent(null)} className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] px-5 py-2 rounded-lg transition-all text-sm font-medium">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Students Table with responsive card layout */}
        <div className="overflow-hidden rounded-xl border border-[#21262d] shadow-xl shadow-black/20">
          <table className="student-table min-w-full">
            <thead className="bg-[#161b22] border-b border-[#21262d]">
              <tr>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Student</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Course</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Batch</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Phone</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">DOB</th>
                <th className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((s) => (
                  <tr key={s.id} className="table-row-hover group">
                    <td data-label="Student" className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(s.username)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{getInitial(s.username)}</div>
                        <button onClick={() => setViewingStudent(s)} className="text-[#e6edf3] text-sm font-medium hover:text-blue-400 transition-colors cursor-pointer text-left">{s.username}</button>
                      </div>
                    </td>
                    <td data-label="Email" className="px-4 py-3 text-[#7d8590] text-sm font-mono break-all">{s.email}</td>
                    <td data-label="Course" className="px-4 py-3"><span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium px-2 py-1 rounded-full">{s.course}</span></td>
                    <td data-label="Batch" className="px-4 py-3"><span className="inline-flex items-center bg-[#21262d] text-[#7d8590] border border-[#30363d] text-xs font-mono px-2 py-1 rounded-full">{s.batch}</span></td>
                    <td data-label="Phone" className="px-4 py-3 text-[#7d8590] text-sm font-mono">{s.phone || "—"}</td>
                    <td data-label="DOB" className="px-4 py-3 text-[#7d8590] text-sm font-mono">{s.date_of_birth || "—"}</td>
                    <td data-label="Actions" className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(s)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 border border-transparent hover:border-[#388bfd]/20 transition-all text-xs font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button onClick={() => handleDeleteClick(s.id, s.username)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-xs font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 sm:py-20 text-[#7d8590]">
                    {searchTerm ? "No students match your search" : "No students found. Click 'Add Student' to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalFiltered > 0 && (
            <div className="bg-[#161b22] border-t border-[#21262d] px-4 py-3 flex flex-col sm:flex-row justify-between gap-3 items-center">
              <div className="text-[#484f58] text-xs">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered} students</div>
              <div className="flex gap-1 flex-wrap justify-center">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-[#484f58] text-[#7d8590] hover:bg-[#21262d] disabled:hover:bg-transparent">←</button>
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? <span key={idx} className="px-2 py-1.5 text-[#484f58]">...</span> : (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === page ? "bg-[#388bfd] text-white shadow-md shadow-[#388bfd]/20" : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"}`}>{page}</button>
                  )
                )}
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-[#484f58] text-[#7d8590] hover:bg-[#21262d] disabled:hover:bg-transparent">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Students;