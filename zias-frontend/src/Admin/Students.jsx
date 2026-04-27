import { useEffect, useState, useRef, useCallback } from "react";
import API from "../api/api";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-gray-600";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2 max-w-[90vw] sm:max-w-md`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

function ConfirmModal({ isOpen, onClose, onConfirm, studentName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl p-6 mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="text-gray-900 font-medium">{studentName}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition">Cancel</button>
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingStudent, setViewingStudent] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [fathersContactError, setFathersContactError] = useState("");
  const [mothersContactError, setMothersContactError] = useState("");
  const [parentPhoneError, setParentPhoneError] = useState("");
  const [emergencyContactError, setEmergencyContactError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewerDocuments, setViewerDocuments] = useState([]);
  const [editDocuments, setEditDocuments] = useState([]);
  const [loadingEditDocs, setLoadingEditDocs] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "", email: "", course: "", batch: "", mentor: "", phone: "", date_of_birth: "", age: "", gender: "",
    fathers_name: "", fathers_contact: "", mothers_name: "", mothers_contact: "",
    address: "", educational_qualification: "", college_school: "", parent_name: "", parent_phone: "", emergency_contact: "",
  });

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);
  const hideToast = useCallback(() => setToast(null), []);

  const hasLoaded = useRef(false);

  const fetchAllData = useCallback(async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    setLoading(true);
    try {
      const [studentsRes, coursesRes, batchesRes, mentorsRes] = await Promise.all([
        API.get("students/"),
        API.get("courses/"),
        API.get("batches/"),
        API.get("mentors/")
      ]);
      setStudents(studentsRes.data);
      setCoursesList(coursesRes.data);
      setBatchesList(batchesRes.data);
      setMentorsList(mentorsRes.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshStudents = useCallback(async () => {
    try {
      const res = await API.get("students/");
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to refresh student list", "error");
    }
  }, [showToast]);

  const handleDeleteClick = (studentId, studentName) => {
    setStudentToDelete({ id: studentId, name: studentName });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await API.delete(`students/${studentToDelete.id}/`);
      await refreshStudents();
      showToast("Student deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete student", "error");
    } finally {
      setShowConfirmModal(false);
      setStudentToDelete(null);
    }
  };

  useEffect(() => {
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      setFormData(prev => ({ ...prev, age: age.toString() }));
    } else {
      setFormData(prev => ({ ...prev, age: "" }));
    }
  }, [formData.date_of_birth]);

  const handlePhoneChange = (field, value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [field]: digits }));
    const errorMsg = digits.length > 0 && digits.length !== 10 ? 'Phone number must be exactly 10 digits' : '';
    if (field === 'phone') setPhoneError(errorMsg);
    else if (field === 'fathers_contact') setFathersContactError(errorMsg);
    else if (field === 'mothers_contact') setMothersContactError(errorMsg);
    else if (field === 'parent_phone') setParentPhoneError(errorMsg);
    else if (field === 'emergency_contact') setEmergencyContactError(errorMsg);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['phone', 'fathers_contact', 'mothers_contact', 'parent_phone', 'emergency_contact'].includes(name)) {
      handlePhoneChange(name, value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generateUsername = (email, fullName) => {
    let base = email ? email.split('@')[0] : (fullName || 'student');
    base = base.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!base) base = 'student';
    const suffix = Math.floor(Math.random() * 10000);
    return `${base}${suffix}`;
  };

  const uploadDocuments = async (studentId, files = selectedFiles) => {
    if (!files.length) return;
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('student', studentId);
      try {
        await API.post('upload-student-document/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err) {
        console.error(`Failed to upload ${file.name}`, err);
        showToast(`Failed to upload ${file.name}`, "error");
      }
    }
    setSelectedFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneFields = [
      { field: 'phone', setError: setPhoneError, label: 'Student phone' },
      { field: 'fathers_contact', setError: setFathersContactError, label: "Father's contact" },
      { field: 'mothers_contact', setError: setMothersContactError, label: "Mother's contact" },
      { field: 'parent_phone', setError: setParentPhoneError, label: 'Parent phone' },
      { field: 'emergency_contact', setError: setEmergencyContactError, label: 'Emergency contact' },
    ];
    let hasError = false;
    for (const { field, setError, label } of phoneFields) {
      const val = formData[field];
      if (val && !/^\d{10}$/.test(val)) {
        setError('Phone number must be exactly 10 digits');
        showToast(`${label} must be exactly 10 digits`, "error");
        hasError = true;
      } else {
        setError('');
      }
    }
    if (hasError) return;

    const payload = {
      full_name: formData.full_name ? formData.full_name.trim() : null,
      email: formData.email,
      course: formData.course,
      batch: formData.batch,
      mentor: formData.mentor ? parseInt(formData.mentor) : null,
      phone: formData.phone || null,
      date_of_birth: formData.date_of_birth || null,
      age: formData.age ? parseInt(formData.age) : null,
      gender: formData.gender || null,
      fathers_name: formData.fathers_name || null,
      fathers_contact: formData.fathers_contact || null,
      mothers_name: formData.mothers_name || null,
      mothers_contact: formData.mothers_contact || null,
      address: formData.address || null,
      educational_qualification: formData.educational_qualification || null,
      college_school: formData.college_school || null,
      parent_name: formData.parent_name || null,
      parent_phone: formData.parent_phone || null,
      emergency_contact: formData.emergency_contact || null,
    };

    setSubmitting(true);
    let studentId = null;
    try {
      if (editingId) {
        await API.patch(`students/${editingId}/`, payload);
        showToast("Student updated successfully", "success");
        studentId = editingId;
        setShowForm(false);
        setEditingId(null);
        resetForm();
        await refreshStudents();
      } else {
        const generatedUsername = generateUsername(formData.email, formData.full_name);
        payload.username = generatedUsername;
        const createRes = await API.post("students/", payload);
        showToast(`Student added successfully! Username: ${generatedUsername}`, "success");
        studentId = createRes.data.id;
        setShowForm(false);
        resetForm();
        await refreshStudents();
        setCurrentPage(1);
      }
      if (studentId && selectedFiles.length) {
        await uploadDocuments(studentId);
      }
    } catch (error) {
      console.error("API error:", error);
      let errorMsg = "An unexpected error occurred.";
      if (error.response) {
        const data = error.response.data;
        if (typeof data === 'object') {
          const messages = [];
          if (data.username) messages.push(`Username: ${data.username.join(', ')}`);
          if (data.email) messages.push(`Email: ${data.email.join(', ')}`);
          if (data.non_field_errors) messages.push(data.non_field_errors.join(', '));
          if (data.detail) messages.push(data.detail);
          if (messages.length) errorMsg = messages.join('; ');
          else errorMsg = "Validation error. Please check the data.";
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      } else if (error.request) {
        errorMsg = "No response from server. Please check your connection.";
      } else {
        errorMsg = error.message;
      }
      showToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "", email: "", course: "", batch: "", mentor: "", phone: "", date_of_birth: "", age: "", gender: "",
      fathers_name: "", fathers_contact: "", mothers_name: "", mothers_contact: "",
      address: "", educational_qualification: "", college_school: "", parent_name: "", parent_phone: "", emergency_contact: "",
    });
    setPhoneError("");
    setFathersContactError("");
    setMothersContactError("");
    setParentPhoneError("");
    setEmergencyContactError("");
    setSelectedFiles([]);
    setEditDocuments([]);
  };

  const fetchStudentDocuments = async (studentId) => {
    try {
      const res = await API.get(`students/${studentId}/documents/`);
      return res.data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const handleEdit = async (student) => {
    setEditingId(student.id);
    setFormData({
      full_name: student.full_name || "",
      email: student.email,
      course: student.course,
      batch: student.batch,
      mentor: student.mentor ? student.mentor.toString() : "",
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
      parent_name: student.parent_name || "",
      parent_phone: student.parent_phone || "",
      emergency_contact: student.emergency_contact || "",
    });
    setLoadingEditDocs(true);
    const docs = await fetchStudentDocuments(student.id);
    setEditDocuments(docs);
    setLoadingEditDocs(false);
    setSelectedFiles([]);
    setShowForm(true);
  };

  const deleteEditDocument = async (docId) => {
    try {
      await API.delete(`student-documents/${docId}/`);
      setEditDocuments(prev => prev.filter(d => d.id !== docId));
      showToast("Document removed", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete document", "error");
    }
  };

  const getDocumentUrl = (url) => {
  if (url.startsWith('http')) return url;
  return `http://127.0.0.1:8000${url}`;
};

  const uploadDocumentsForEdit = async (studentId, files) => {
    if (!files.length) return;
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('student', studentId);
      try {
        await API.post('upload-student-document/', fd);
        showToast(`Uploaded ${file.name}`, "success");
        const updatedDocs = await fetchStudentDocuments(studentId);
        setEditDocuments(updatedDocs);
      } catch (err) {
        console.error(err);
        showToast(`Failed to upload ${file.name}`, "error");
      }
    }
    setSelectedFiles([]);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const phoneFields = [
      { field: 'phone', setError: setPhoneError, label: 'Student phone' },
      { field: 'fathers_contact', setError: setFathersContactError, label: "Father's contact" },
      { field: 'mothers_contact', setError: setMothersContactError, label: "Mother's contact" },
      { field: 'parent_phone', setError: setParentPhoneError, label: 'Parent phone' },
      { field: 'emergency_contact', setError: setEmergencyContactError, label: 'Emergency contact' },
    ];
    let hasError = false;
    for (const { field, setError, label } of phoneFields) {
      const val = formData[field];
      if (val && !/^\d{10}$/.test(val)) {
        setError('Phone number must be exactly 10 digits');
        showToast(`${label} must be exactly 10 digits`, "error");
        hasError = true;
      } else {
        setError('');
      }
    }
    if (hasError) return;

    const payload = {
      full_name: formData.full_name ? formData.full_name.trim() : null,
      email: formData.email,
      course: formData.course,
      batch: formData.batch,
      mentor: formData.mentor ? parseInt(formData.mentor) : null,
      phone: formData.phone || null,
      date_of_birth: formData.date_of_birth || null,
      age: formData.age ? parseInt(formData.age) : null,
      gender: formData.gender || null,
      fathers_name: formData.fathers_name || null,
      fathers_contact: formData.fathers_contact || null,
      mothers_name: formData.mothers_name || null,
      mothers_contact: formData.mothers_contact || null,
      address: formData.address || null,
      educational_qualification: formData.educational_qualification || null,
      college_school: formData.college_school || null,
      parent_name: formData.parent_name || null,
      parent_phone: formData.parent_phone || null,
      emergency_contact: formData.emergency_contact || null,
    };

    setSubmitting(true);
    try {
      await API.patch(`students/${editingId}/`, payload);
      showToast("Student updated successfully", "success");
      if (selectedFiles.length) {
        await uploadDocumentsForEdit(editingId, selectedFiles);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      await refreshStudents();
    } catch (error) {
      console.error("API error:", error);
      let errorMsg = "An unexpected error occurred.";
      if (error.response) {
        const data = error.response.data;
        if (typeof data === 'object') {
          const messages = [];
          if (data.username) messages.push(`Username: ${data.username.join(', ')}`);
          if (data.email) messages.push(`Email: ${data.email.join(', ')}`);
          if (data.non_field_errors) messages.push(data.non_field_errors.join(', '));
          if (data.detail) messages.push(data.detail);
          if (messages.length) errorMsg = messages.join('; ');
          else errorMsg = "Validation error. Please check the data.";
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      } else if (error.request) {
        errorMsg = "No response from server. Please check your connection.";
      } else {
        errorMsg = error.message;
      }
      showToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openViewModal = async (student) => {
    setViewingStudent(student);
    const docs = await fetchStudentDocuments(student.id);
    setViewerDocuments(docs);
  };

  const filteredStudents = students.filter(s =>
    (s.full_name || s.username)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const inputClass = `w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all duration-200 text-sm`;
  const readOnlyClass = `w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-600 cursor-not-allowed text-sm`;

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
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800" style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        .table-row-hover:hover { background: rgba(34,197,94,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
        @keyframes slide-in-from-top-2 { from { opacity:0; transform:translateY(-1rem); } to { opacity:1; transform:translateY(0); } }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
        .cursor-pointer { cursor: pointer; }
        @media (max-width: 640px) {
          .student-table thead { display: none; }
          .student-table tbody tr { display: block; margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; background: white; }
          .student-table tbody td { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; text-align: right; gap: 1rem; }
          .student-table tbody td:last-child { border-bottom: none; }
          .student-table tbody td::before { content: attr(data-label); font-weight: 600; color: #6b7280; text-align: left; flex: 1; }
          .student-table tbody td .action-buttons { margin-left: auto; display: flex; gap: 0.5rem; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} studentName={studentToDelete?.name} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Students</h1>
              <p className="text-gray-500 text-xs mt-0.5">{students.length} total · {filteredStudents.length} shown</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search students..."
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
                resetForm();
                setShowForm(true);
              }}
              className="shine flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Student
            </button>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
            <form
              onSubmit={editingId ? handleEditSubmit : handleSubmit}
              className="modal-enter bg-white rounded-2xl w-full max-w-3xl border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{editingId ? "Edit Student" : "New Student"}</h3>
                    <p className="text-gray-500 text-xs">{editingId ? "Update student information" : "Add a new student to the system"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Full Name</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Course *</label><select name="course" value={formData.course} onChange={handleChange} required className={inputClass}><option value="">Select a course</option>{coursesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Batch *</label><select name="batch" value={formData.batch} onChange={handleChange} required className={inputClass}><option value="">Select a batch</option>{batchesList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Mentor (optional)</label><select name="mentor" value={formData.mentor} onChange={handleChange} className={inputClass}><option value="">Select a mentor</option>{mentorsList.map(mentor => <option key={mentor.id} value={mentor.id}>{mentor.username} ({mentor.expertise || "No expertise"})</option>)}</select></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />{phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}</div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Age</label><input type="text" name="age" value={formData.age} readOnly className={inputClass + " cursor-not-allowed opacity-80"} /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Gender</label><select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                  </div>
                </div>

                {/* Parents */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Parents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Father's Name</label><input type="text" name="fathers_name" value={formData.fathers_name} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Father's Contact</label><input type="text" name="fathers_contact" value={formData.fathers_contact} onChange={handleChange} className={inputClass} />{fathersContactError && <p className="text-red-500 text-xs mt-1">{fathersContactError}</p>}</div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Mother's Name</label><input type="text" name="mothers_name" value={formData.mothers_name} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Mother's Contact</label><input type="text" name="mothers_contact" value={formData.mothers_contact} onChange={handleChange} className={inputClass} />{mothersContactError && <p className="text-red-500 text-xs mt-1">{mothersContactError}</p>}</div>
                  </div>
                </div>

                {/* Address */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Address</h4>
                  <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className={inputClass + " resize-none"} />
                </div>

                {/* Education */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Education</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Educational Qualification</label><input type="text" name="educational_qualification" value={formData.educational_qualification} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">College / School</label><input type="text" name="college_school" value={formData.college_school} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Parent Name</label><input type="text" name="parent_name" value={formData.parent_name} onChange={handleChange} className={inputClass} /></div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Parent Phone</label><input type="text" name="parent_phone" value={formData.parent_phone} onChange={handleChange} className={inputClass} />{parentPhoneError && <p className="text-red-500 text-xs mt-1">{parentPhoneError}</p>}</div>
                    <div><label className="block text-gray-600 text-xs font-medium mb-1.5">Emergency Contact</label><input type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} className={inputClass} />{emergencyContactError && <p className="text-red-500 text-xs mt-1">{emergencyContactError}</p>}</div>
                  </div>
                </div>

                {/* Document Section – only in edit mode */}
                {editingId && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Documents</h4>
                    <div className="mb-4">
                      <label className="block text-gray-600 text-xs font-medium mb-1.5">Existing Documents</label>
                      {loadingEditDocs ? (
                        <p className="text-gray-400 text-sm">Loading documents...</p>
                      ) : editDocuments.length === 0 ? (
                        <p className="text-gray-400 text-sm">No documents uploaded yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {editDocuments.map(doc => (
                            <li key={doc.id} className="flex items-center justify-between gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline truncate cursor-pointer">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                <span className="truncate">{doc.file_name || "Document"}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => deleteEditDocument(doc.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition"
                                title="Delete document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-medium mb-1.5">Upload Additional Documents</label>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      {selectedFiles.length > 0 && (
                        <ul className="mt-2 text-xs text-gray-500 list-disc pl-5">
                          {selectedFiles.map((f, idx) => <li key={idx}>📎 {f.name}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-4 border-t border-gray-200">
                <button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? (editingId ? "Saving..." : "Adding...") : (editingId ? "Save Changes" : "Add Student")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View Details Modal – no upload, only documents list */}
        {viewingStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setViewingStudent(null)}>
            <div className="bg-white rounded-2xl w-full max-w-3xl border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Student Details</h3>
                    <p className="text-gray-500 text-xs">View all information & documents</p>
                  </div>
                </div>
                <button type="button" onClick={() => setViewingStudent(null)} className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-gray-500 text-xs">Full Name</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.full_name || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">Email</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.email}</p></div>
                    <div><label className="block text-gray-500 text-xs">Course</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.course}</p></div>
                    <div><label className="block text-gray-500 text-xs">Batch</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.batch}</p></div>
                    <div><label className="block text-gray-500 text-xs">Mentor</label>
                      <p className="text-gray-800 text-sm mt-1">
                        {viewingStudent.mentor ? (mentorsList.find(m => m.id === viewingStudent.mentor)?.username || "—") : "—"}
                      </p>
                    </div>
                    <div><label className="block text-gray-500 text-xs">Phone</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.phone || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">Date of Birth</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.date_of_birth || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">Age</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.age || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">Gender</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.gender || "—"}</p></div>
                  </div>
                </div>

                {/* Parents */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Parents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-gray-500 text-xs">Father's Name</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.fathers_name || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">Father's Contact</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.fathers_contact || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">Mother's Name</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.mothers_name || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">Mother's Contact</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.mothers_contact || "—"}</p></div>
                  </div>
                </div>

                {/* Address */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Address</h4>
                  <p className="text-gray-800 text-sm">{viewingStudent.address || "—"}</p>
                </div>

                {/* Education */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Education</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-gray-500 text-xs">Educational Qualification</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.educational_qualification || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">College/School</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.college_school || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">Parent Name</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.parent_name || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">Parent Phone</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.parent_phone || "—"}</p></div>
                    <div><label className="block text-gray-500 text-xs">Emergency Contact</label><p className="text-gray-800 text-sm mt-1">{viewingStudent.emergency_contact || "—"}</p></div>
                  </div>
                </div>

                {/* Documents section – only list, no upload */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Documents</h4>
                  {viewerDocuments.length === 0 ? (
                    <p className="text-gray-400 text-sm">No documents uploaded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {viewerDocuments.map(doc => (
                        <li key={doc.id} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline truncate cursor-pointer"
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{doc.file_name || "Document"}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end">
                <button onClick={() => setViewingStudent(null)} className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 hover:text-gray-800 px-5 py-2 rounded-lg transition-all text-sm font-medium">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Students Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="student-table min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Student</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Course</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Batch</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Phone</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">DOB</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedStudents.map(s => (
                <tr key={s.id} className="table-row-hover group">
                  <td data-label="Student" className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(s.full_name || s.username)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{getInitial(s.full_name || s.username)}</div>
                      <button onClick={() => openViewModal(s)} className="text-gray-800 text-sm font-medium hover:text-green-600 transition-colors cursor-pointer text-left">{s.full_name || s.username}</button>
                    </div>
                  </td>
                  <td data-label="Email" className="px-4 py-3 text-gray-500 text-sm break-all">{s.email}</td>
                  <td data-label="Course" className="px-4 py-3"><span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium px-2 py-1 rounded-full">{s.course}</span></td>
                  <td data-label="Batch" className="px-4 py-3"><span className="inline-flex items-center bg-gray-100 text-gray-700 border border-gray-200 text-xs font-mono px-2 py-1 rounded-full">{s.batch}</span></td>
                  <td data-label="Phone" className="px-4 py-3 text-gray-500 text-sm">{s.phone || "—"}</td>
                  <td data-label="DOB" className="px-4 py-3 text-gray-500 text-sm">{s.date_of_birth || "—"}</td>
                  <td data-label="Actions" className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(s)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button onClick={() => handleDeleteClick(s.id, s.full_name || s.username)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalFiltered > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row justify-between gap-3 items-center">
              <div className="text-gray-500 text-xs">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered} students</div>
              <div className="flex gap-1 flex-wrap justify-center">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100 disabled:hover:bg-transparent">←</button>
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? <span key={idx} className="px-2 py-1.5 text-gray-400">...</span> : (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === page ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>{page}</button>
                  )
                )}
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100 disabled:hover:bg-transparent">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Students;