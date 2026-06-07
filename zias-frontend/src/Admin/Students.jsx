import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";
import ProgressModal from "../components/ProgressModal";
import { clearAuthStorage } from "../utils/authStorage";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success" ? "bg-green-600" : type === "error" ? "bg-red-500" : "bg-gray-600";

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${bgColor} text-white text-sm font-medium max-w-[90vw] sm:max-w-md animate-in`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
        {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}
      </span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

function ConfirmModal({ isOpen, onClose, onConfirm, studentName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-red-100 shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-red-400 to-red-300" />
        <div className="p-6">
          <p className="text-[10px] tracking-[0.2em] uppercase text-red-400 mb-2 font-medium">Confirm Removal</p>
          <h3 className="text-lg text-gray-800 mb-3" style={{ fontFamily: '"DM Serif Display", serif' }}>
            Delete Student?
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            You are about to delete{" "}
            <span className="text-gray-800 font-semibold">{studentName}</span>. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-5 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:border-gray-300 transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm} className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractArray(responseOrData) {
  const data = responseOrData?.data ?? responseOrData;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function Students() {
  const location = useLocation();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
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
  const [progressStudent, setProgressStudent] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "", email: "", course: "", batch: "", mentor: "",
    phone: "", date_of_birth: "", age: "", gender: "",
    fathers_name: "", fathers_contact: "", mothers_name: "", mothers_contact: "",
    address: "", educational_qualification: "", college_school: "",
    parent_name: "", parent_phone: "", emergency_contact: "",
  });

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);
  const hideToast = useCallback(() => setToast(null), []);
  const hasLoaded = useRef(false);

  // ========== Auto-assign mentor based on batch ==========
  const getMentorForBatch = useCallback(async (batchName) => {
    if (!batchName) return null;
    try {
      const existingMentor = mentorsList.find(m => m.batch === batchName || m.batch_name === batchName);
      if (existingMentor) {
        return existingMentor.id;
      }
      const mentorsRes = await API.get("mentors/");
      const mentors = mentorsRes.data.results || mentorsRes.data;
      const batchMentor = mentors.find(m => m.batch === batchName || m.batch_name === batchName);
      return batchMentor ? batchMentor.id : null;
    } catch(err) {
      console.error("Error finding mentor for batch:", err);
      return null;
    }
  }, [mentorsList]);

  const handleBatchChange = async (e) => {
    const batchName = e.target.value;
    setFormData(prev => ({ ...prev, batch: batchName }));
    if (batchName && !formData.mentor) {
      const mentorId = await getMentorForBatch(batchName);
      if (mentorId) {
        setFormData(prev => ({ ...prev, mentor: mentorId.toString() }));
        showToast(`Auto-assigned mentor for batch: ${batchName}`, "success");
      }
    }
  };

  // ========== Auto-assign fee based on course ==========
  const getTotalAmountByCourse = (courseName) => {
    const courseAmounts = {
      'Foundations': 200000,
      'React.js': 50000,
      'Python': 100000,
      'Data Science': 150000,
      'UI/UX': 120000,
    };
    return courseAmounts[courseName] || 100000;
  };

  const assignFeeToStudent = async (studentId, courseName) => {
    try {
      const feeRes = await API.get("/fee-structures/");
      let feeStructures = feeRes.data.results || feeRes.data;
      
      if (feeStructures && feeStructures.length > 0) {
        const totalAmount = getTotalAmountByCourse(courseName);
        
        await API.post("/student-fees/", {
          student: studentId,
          fee_structure: feeStructures[0].id,
          total_amount: totalAmount,
          paid_amount: 0,
          discount_applied: 0
        });
        console.log(`✅ Fee auto-assigned: ₹${totalAmount} for ${courseName}`);
        return true;
      } else {
        console.log("⚠️ No fee structure found. Please create one first.");
        return false;
      }
    } catch(err) {
      console.error("Fee auto-assign failed:", err);
      return false;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const batch = params.get("batch");
    if (batch) { setBatchFilter(batch); setSearchTerm(""); }
    else setBatchFilter("");
  }, [location.search]);

  const fetchAllData = useCallback(async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    setLoading(true);
    try {
      const [studentsRes, coursesRes, batchesRes, mentorsRes] = await Promise.all([
        API.get("students/"), API.get("courses/"), API.get("batches/"), API.get("mentors/")
      ]);
      setStudents(extractArray(studentsRes));
      setCoursesList(extractArray(coursesRes));
      setBatchesList(extractArray(batchesRes));
      setMentorsList(extractArray(mentorsRes));
    } catch (err) {
      if (err.response?.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        setTimeout(() => { clearAuthStorage(); window.location.href = "/login"; }, 1500);
      } else showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const refreshStudents = useCallback(async () => {
    try {
      const res = await API.get("students/");
      setStudents(extractArray(res));
    } catch (err) {
      if (err.response?.status === 401) {
        showToast("Session expired.", "error");
        setTimeout(() => { clearAuthStorage(); window.location.href = "/login"; }, 1500);
      } else showToast("Failed to refresh", "error");
    }
  }, [showToast]);

  const handleDeleteClick = (id, name) => { setStudentToDelete({ id, name }); setShowConfirmModal(true); };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await API.delete(`students/${studentToDelete.id}/`);
      await refreshStudents();
      showToast("Student deleted successfully", "success");
    } catch { showToast("Failed to delete student", "error"); }
    finally { setShowConfirmModal(false); setStudentToDelete(null); }
  };

  useEffect(() => {
    if (formData.date_of_birth) {
      const birth = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      setFormData(prev => ({ ...prev, age: age.toString() }));
    } else setFormData(prev => ({ ...prev, age: "" }));
  }, [formData.date_of_birth]);

  const handlePhoneChange = (field, value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [field]: digits }));
    const err = digits.length > 0 && digits.length !== 10 ? 'Must be exactly 10 digits' : '';
    if (field === 'phone') setPhoneError(err);
    else if (field === 'fathers_contact') setFathersContactError(err);
    else if (field === 'mothers_contact') setMothersContactError(err);
    else if (field === 'parent_phone') setParentPhoneError(err);
    else if (field === 'emergency_contact') setEmergencyContactError(err);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['phone', 'fathers_contact', 'mothers_contact', 'parent_phone', 'emergency_contact'].includes(name))
      handlePhoneChange(name, value);
    else setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'email') setEmailError("");
  };

  const generateUsername = (email, fullName) => {
    let base = email ? email.split('@')[0] : (fullName || 'student');
    base = base.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!base) base = 'student';
    return `${base}${Math.floor(Math.random() * 10000)}`;
  };

  const getDocumentUrl = (url) => {
    if (!url || typeof url !== 'string') return '#';
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000${url}`;
  };

  const uploadDocuments = async (studentId, files = selectedFiles) => {
    if (!files.length) return;
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file); fd.append('student', studentId);
      try { await API.post('upload-student-document/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      catch { showToast(`Failed to upload ${file.name}`, "error"); }
    }
    setSelectedFiles([]);
  };

  const fetchStudentDocuments = async (studentId) => {
    try { const res = await API.get(`students/${studentId}/documents/`); return extractArray(res); }
    catch { return []; }
  };

  const deleteEditDocument = async (docId) => {
    try {
      await API.delete(`student-documents/${docId}/`);
      setEditDocuments(prev => prev.filter(d => d.id !== docId));
      showToast("Document removed", "success");
    } catch { showToast("Failed to delete document", "error"); }
  };

  const uploadDocumentsForEdit = async (studentId, files) => {
    if (!files.length) return;
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file); fd.append('student', studentId);
      try {
        await API.post('upload-student-document/', fd);
        showToast(`Uploaded ${file.name}`, "success");
        const updatedDocs = await fetchStudentDocuments(studentId);
        setEditDocuments(updatedDocs);
      } catch { showToast(`Failed to upload ${file.name}`, "error"); }
    }
    setSelectedFiles([]);
  };

  const resetForm = () => {
    setFormData({
      full_name: "", email: "", course: "", batch: "", mentor: "",
      phone: "", date_of_birth: "", age: "", gender: "",
      fathers_name: "", fathers_contact: "", mothers_name: "", mothers_contact: "",
      address: "", educational_qualification: "", college_school: "",
      parent_name: "", parent_phone: "", emergency_contact: "",
    });
    setPhoneError(""); setFathersContactError(""); setMothersContactError("");
    setParentPhoneError(""); setEmergencyContactError(""); setEmailError("");
    setSelectedFiles([]); setEditDocuments([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      showToast("Full name is required", "error");
      return;
    }

    if (!formData.email.trim()) {
      setEmailError("Email is required");
      showToast("Email is required", "error");
      return;
    }

    if (!formData.course) {
      showToast("Course is required", "error");
      return;
    }

    if (!formData.batch) {
      showToast("Batch is required", "error");
      return;
    }

    const phoneFields = [
      { field: 'phone', setErr: setPhoneError, label: 'Student phone' },
      { field: 'fathers_contact', setErr: setFathersContactError, label: "Father's contact" },
      { field: 'mothers_contact', setErr: setMothersContactError, label: "Mother's contact" },
      { field: 'parent_phone', setErr: setParentPhoneError, label: 'Parent phone' },
      { field: 'emergency_contact', setErr: setEmergencyContactError, label: 'Emergency contact' },
    ];
    
    let hasError = false;
    for (const { field, setErr, label } of phoneFields) {
      const val = formData[field];
      if (val && !/^\d{10}$/.test(val)) {
        setErr('Must be 10 digits');
        showToast(`${label} must be 10 digits`, "error");
        hasError = true;
      } else setErr('');
    }
    if (hasError) return;

    let assignedMentorId = formData.mentor ? parseInt(formData.mentor) : null;
    if (!assignedMentorId && formData.batch) {
      assignedMentorId = await getMentorForBatch(formData.batch);
      if (assignedMentorId) {
        console.log(`✅ Auto-assigned mentor ID ${assignedMentorId} for batch ${formData.batch}`);
      }
    }

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      course: formData.course,
      batch: formData.batch,
      mentor: assignedMentorId,
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

    console.log("Sending payload:", payload);

    setSubmitting(true);
    try {
      if (editingId) {
        await API.patch(`students/${editingId}/`, payload);
        showToast("Student updated successfully", "success");
        if (selectedFiles.length) await uploadDocumentsForEdit(editingId, selectedFiles);
        setShowForm(false); setEditingId(null); resetForm(); await refreshStudents();
      } else {
        payload.username = generateUsername(formData.email, formData.full_name);
        const createRes = await API.post("students/", payload);
        const newStudentId = createRes.data.id;
        showToast(`Student added successfully!`, "success");
        
        await assignFeeToStudent(newStudentId, formData.course);
        
        if (selectedFiles.length) await uploadDocuments(newStudentId);
        setShowForm(false); resetForm(); await refreshStudents(); setCurrentPage(1);
      }
    } catch (error) {
      console.error("Create error details:", error.response?.data);
      const data = error.response?.data;
      let msg = "Failed to add student. Please check all fields.";
      
      if (data) {
        if (typeof data === 'string') {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.error) {
          msg = data.error;
        } else if (data.email) {
          msg = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
        } else if (data.username) {
          msg = `Username: ${Array.isArray(data.username) ? data.username[0] : data.username}`;
        } else {
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            msg = `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`;
          }
        }
      }
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (student) => {
    setEditingId(student.id);
    setFormData({
      full_name: student.full_name || "", 
      email: student.email || "",
      course: student.course_name || student.course || "",
      batch: student.batch_name || student.batch || "",
      mentor: student.mentor ? student.mentor.toString() : "",
      phone: student.phone || "", 
      date_of_birth: student.date_of_birth || "",
      age: student.age?.toString() || "", 
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
    setEditDocuments(docs); setLoadingEditDocs(false);
    setSelectedFiles([]); setShowForm(true);
  };

  const openViewModal = async (student) => {
    setViewingStudent(student);
    const docs = await fetchStudentDocuments(student.id);
    setViewerDocuments(docs);
  };

  const getFirstLetter = (name) => {
    if (!name) return "?";
    const first = name.trim().charAt(0);
    return first.toUpperCase();
  };

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (s.full_name || s.username)?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      (s.course_name || s.course)?.toLowerCase().includes(term) ||
      (s.batch_name || s.batch)?.toLowerCase().includes(term) ||
      s.phone?.toLowerCase().includes(term);
    const matchesBatch = !batchFilter || s.batch_name === batchFilter || s.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

  const totalFiltered = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, batchFilter]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) for (let i = 1; i <= totalPages; i++) pages.push(i);
    else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push("..."); pages.push(totalPages); }
    else if (currentPage >= totalPages - 2) { pages.push(1); pages.push("..."); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
    else { pages.push(1); pages.push("..."); for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); pages.push("..."); pages.push(totalPages); }
    return pages;
  };

  const inputCls =
    "w-full bg-white border border-green-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm transition-all";
  const readOnlyCls =
    "w-full bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-gray-400 cursor-not-allowed text-sm";
  const labelCls =
    "block text-gray-500 text-[11px] font-medium mb-1.5 tracking-wide uppercase";
  const sectionTitleCls =
    "text-[11px] font-semibold tracking-[0.15em] uppercase mb-3";

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-green-50 gap-3" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-green-600 text-xs tracking-widest uppercase">Loading students…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-green-50/40 text-gray-800" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <style>{`
        @keyframes slide-in-from-top-2 { from { opacity:0; transform:translateY(-1rem); } to { opacity:1; transform:translateY(0); } }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
        .row-hover:hover { background: rgba(240,253,244,0.8); }
        
        /* Enhanced Responsive Table Styles */
        @media (max-width: 768px) {
          .student-table thead {
            display: none;
          }
          .student-table tbody tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #d1fae5;
            border-radius: 1rem;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            transition: all 0.2s;
          }
          .student-table tbody td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.875rem 1rem;
            border-bottom: 1px solid #f0fdf4;
            text-align: right;
            gap: 1rem;
            flex-wrap: wrap;
          }
          .student-table tbody td:last-child {
            border-bottom: none;
          }
          .student-table tbody td::before {
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
          
          /* Action buttons wrapper for mobile */
          .action-buttons-mobile {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          
          /* Touch-friendly tap targets */
          button, 
          [role="button"],
          .tap-target {
            min-height: 44px;
            cursor: pointer;
          }
          
          /* Improved spacing for mobile */
          .container-padding {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        
        /* Tablet optimization */
        @media (min-width: 769px) and (max-width: 1024px) {
          .student-table td {
            padding: 0.75rem 0.5rem;
          }
          .action-buttons {
            display: flex;
            gap: 0.25rem;
          }
        }
        
        /* Smooth scrolling for modals */
        .modal-scroll {
          scrollbar-width: thin;
        }
        
        /* Loading animation */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Hover effects for cards */
        .student-card-hover {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .student-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} studentName={studentToDelete?.name} />
      <ProgressModal isOpen={showProgressModal} onClose={() => setShowProgressModal(false)} student={progressStudent} />

      {/* Header Section - Responsive */}
      <div className="bg-white border-b border-green-100 px-4 sm:px-6 md:px-8 py-4 sm:py-6 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.2em] uppercase text-green-400 mb-1.5 font-medium">Admin Panel</p>
              <h1 className="text-xl sm:text-2xl md:text-3xl text-gray-800 leading-tight" style={{ fontFamily: '"DM Serif Display", serif' }}>
                Students
              </h1>
              <p className="text-gray-400 text-xs mt-1 font-light">
                {students.length} total · {filteredStudents.length} shown
              </p>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-green-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Menu
              </button>
            </div>

            {/* Controls - Desktop */}
            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition-all duration-300`}>
              <div className="relative w-full sm:w-64">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search students…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-green-50 border border-green-200 rounded-xl py-2.5 pl-10 pr-9 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-gray-700 placeholder-gray-400 transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {batchFilter && (
                <button
                  onClick={() => { setBatchFilter(""); navigate("/admin/students"); }}
                  className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-100 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {batchFilter}
                </button>
              )}

              <button
                onClick={() => { setEditingId(null); resetForm(); setShowForm(true); setMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Student
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Form Modal - Responsive */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setShowForm(false)}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl w-full max-w-3xl border border-green-100 shadow-2xl shadow-green-100/50 max-h-[90vh] overflow-y-auto modal-scroll"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-white px-4 sm:px-6 py-4 border-b border-green-100 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d={editingId
                          ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{editingId ? "Edit Student" : "New Student"}</h3>
                    <p className="text-[11px] text-gray-400 font-light">{editingId ? "Update student information" : "Add a new student to the system"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors p-2">✕</button>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-6">
                <div>
                  <p className={`${sectionTitleCls} text-green-600`}>Basic Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Full Name *</label>
                      <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>Email *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} />
                      {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Course *</label>
                      <select name="course" value={formData.course} onChange={handleChange} required className={inputCls}>
                        <option value="">Select a course</option>
                        {coursesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">Fee will be auto-assigned</p>
                    </div>
                    <div>
                      <label className={labelCls}>Batch *</label>
                      <select 
                        name="batch" 
                        value={formData.batch} 
                        onChange={handleBatchChange} 
                        required 
                        className={inputCls}
                      >
                        <option value="">Select a batch</option>
                        {batchesList.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">Auto-assigns mentor</p>
                    </div>
                    <div>
                      <label className={labelCls}>Mentor (optional)</label>
                      <select name="mentor" value={formData.mentor} onChange={handleChange} className={inputCls}>
                        <option value="">Auto-assign from batch</option>
                        {mentorsList.map(m => <option key={m.id} value={m.id}>{m.full_name || m.username}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} />
                      {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                    </div>
                    <div><label className={labelCls}>Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputCls} /></div>
                    <div><label className={labelCls}>Age</label><input type="text" value={formData.age} readOnly className={readOnlyCls} /></div>
                    <div>
                      <label className={labelCls}>Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className={inputCls}>
                        <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-green-50 pt-5">
                  <p className={`${sectionTitleCls} text-gray-400`}>Parents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={labelCls}>Father's Name</label><input type="text" name="fathers_name" value={formData.fathers_name} onChange={handleChange} className={inputCls} /></div>
                    <div><label className={labelCls}>Father's Contact</label><input type="tel" name="fathers_contact" value={formData.fathers_contact} onChange={handleChange} className={inputCls} />{fathersContactError && <p className="text-red-500 text-xs mt-1">{fathersContactError}</p>}</div>
                    <div><label className={labelCls}>Mother's Name</label><input type="text" name="mothers_name" value={formData.mothers_name} onChange={handleChange} className={inputCls} /></div>
                    <div><label className={labelCls}>Mother's Contact</label><input type="tel" name="mothers_contact" value={formData.mothers_contact} onChange={handleChange} className={inputCls} />{mothersContactError && <p className="text-red-500 text-xs mt-1">{mothersContactError}</p>}</div>
                  </div>
                </div>

                <div className="border-t border-green-50 pt-5">
                  <p className={`${sectionTitleCls} text-gray-400`}>Address</p>
                  <textarea name="address" rows={2} value={formData.address} onChange={handleChange} className={`${inputCls} resize-none`} />
                </div>

                <div className="border-t border-green-50 pt-5">
                  <p className={`${sectionTitleCls} text-gray-400`}>Education & Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className={labelCls}>Qualification</label><input type="text" name="educational_qualification" value={formData.educational_qualification} onChange={handleChange} className={inputCls} /></div>
                    <div><label className={labelCls}>College / School</label><input type="text" name="college_school" value={formData.college_school} onChange={handleChange} className={inputCls} /></div>
                    <div><label className={labelCls}>Parent Name</label><input type="text" name="parent_name" value={formData.parent_name} onChange={handleChange} className={inputCls} /></div>
                    <div><label className={labelCls}>Parent Phone</label><input type="tel" name="parent_phone" value={formData.parent_phone} onChange={handleChange} className={inputCls} />{parentPhoneError && <p className="text-red-500 text-xs mt-1">{parentPhoneError}</p>}</div>
                    <div><label className={labelCls}>Emergency Contact</label><input type="tel" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} className={inputCls} />{emergencyContactError && <p className="text-red-500 text-xs mt-1">{emergencyContactError}</p>}</div>
                  </div>
                </div>

                <div className="border-t border-green-50 pt-5">
                  <p className={`${sectionTitleCls} text-green-600`}>Documents</p>
                  {editingId && (
                    <div className="mb-4">
                      <label className={labelCls}>Existing Documents</label>
                      {loadingEditDocs ? (
                        <p className="text-gray-400 text-sm">Loading…</p>
                      ) : editDocuments.length === 0 ? (
                        <p className="text-gray-400 text-sm">No documents uploaded yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {editDocuments.map(doc => (
                            <li key={doc.id} className="flex items-center justify-between gap-2 bg-green-50/60 border border-green-100 p-2.5 rounded-xl">
                              <a href={getDocumentUrl(doc.url)} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm truncate flex-1">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="truncate">{doc.file_name || "Document"}</span>
                              </a>
                              <button type="button" onClick={() => deleteEditDocument(doc.id)}
                                className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <input
                    type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-green-200 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-600 hover:file:text-white file:transition-colors file:cursor-pointer"
                  />
                  {selectedFiles.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {selectedFiles.map((f, i) => (
                        <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />{f.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-4 border-t border-green-100 rounded-b-2xl">
                <button type="submit" disabled={submitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 shadow-sm hover:shadow-md">
                  {submitting ? (editingId ? "Saving…" : "Adding…") : (editingId ? "Save Changes" : "Add Student")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View Modal - Responsive */}
        {viewingStudent && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setViewingStudent(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-3xl border border-green-100 shadow-2xl shadow-green-100/50 max-h-[90vh] overflow-y-auto modal-scroll"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b border-green-100 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {getFirstLetter(viewingStudent.full_name || viewingStudent.username)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{viewingStudent.full_name || viewingStudent.username}</h3>
                    <p className="text-[11px] text-gray-400">{viewingStudent.course_name || viewingStudent.course}</p>
                  </div>
                </div>
                <button onClick={() => setViewingStudent(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none p-2">✕</button>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-6">
                <div>
                  <p className={`${sectionTitleCls} text-green-600`}>Basic Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ["Full Name", viewingStudent.full_name],
                      ["Email", viewingStudent.email],
                      ["Course", viewingStudent.course_name || viewingStudent.course],
                      ["Batch", viewingStudent.batch_name || viewingStudent.batch],
                      ["Mentor", mentorsList.find(m => m.id === viewingStudent.mentor)?.full_name || mentorsList.find(m => m.id === viewingStudent.mentor)?.username || "—"],
                      ["Phone", viewingStudent.phone],
                      ["Date of Birth", viewingStudent.date_of_birth],
                      ["Age", viewingStudent.age],
                      ["Gender", viewingStudent.gender],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-green-50/60 rounded-xl p-3 border border-green-100/60">
                        <p className="text-[10px] uppercase tracking-widest text-green-400 mb-1">{label}</p>
                        <p className="text-gray-800 text-sm font-medium break-words">{val || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-green-50 pt-5">
                  <p className={`${sectionTitleCls} text-gray-400`}>Parents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ["Father's Name", viewingStudent.fathers_name],
                      ["Father's Contact", viewingStudent.fathers_contact],
                      ["Mother's Name", viewingStudent.mothers_name],
                      ["Mother's Contact", viewingStudent.mothers_contact],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-green-50/60 rounded-xl p-3 border border-green-100/60">
                        <p className="text-[10px] uppercase tracking-widest text-green-400 mb-1">{label}</p>
                        <p className="text-gray-800 text-sm font-medium">{val || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-green-50 pt-5">
                  <p className={`${sectionTitleCls} text-gray-400`}>Address</p>
                  <div className="bg-green-50/60 rounded-xl p-3 border border-green-100/60">
                    <p className="text-gray-800 text-sm break-words">{viewingStudent.address || "—"}</p>
                  </div>
                </div>

                <div className="border-t border-green-50 pt-5">
                  <p className={`${sectionTitleCls} text-gray-400`}>Education & Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ["Qualification", viewingStudent.educational_qualification],
                      ["Institution", viewingStudent.college_school],
                      ["Parent Name", viewingStudent.parent_name],
                      ["Parent Phone", viewingStudent.parent_phone],
                      ["Emergency Contact", viewingStudent.emergency_contact],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-green-50/60 rounded-xl p-3 border border-green-100/60">
                        <p className="text-[10px] uppercase tracking-widest text-green-400 mb-1">{label}</p>
                        <p className="text-gray-800 text-sm font-medium">{val || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-green-50 pt-5">
                  <p className={`${sectionTitleCls} text-green-600`}>Documents</p>
                  {viewerDocuments.length === 0 ? (
                    <p className="text-gray-400 text-sm">No documents uploaded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {viewerDocuments.map(doc => (
                        <li key={doc.id}>
                          <a href={getDocumentUrl(doc.url)} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors text-sm break-all">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            {doc.file_name || "Document"}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-4 border-t border-green-100 rounded-b-2xl flex justify-end">
                <button onClick={() => setViewingStudent(null)}
                  className="border border-green-200 text-gray-500 px-6 py-2 rounded-xl text-sm hover:border-green-400 hover:text-green-600 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Students Table - Responsive */}
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-sm">
          <div className="h-1 bg-gradient-to-r from-green-500 to-green-300" />

          <div className="overflow-x-auto">
            <table className="student-table min-w-full">
              <thead className="bg-green-50/60 border-b border-green-100">
                <tr>
                  {["Student", "Email", "Course", "Batch", "Phone", "DOB", "Actions"].map(h => (
                    <th key={h} className="text-left px-3 sm:px-4 py-3.5 text-[10px] font-semibold text-green-500 uppercase tracking-[0.12em]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">No students found.</p>
                    </td>
                  </tr>
                ) : paginatedStudents.map(s => (
                  <tr key={s.id} className="row-hover transition-colors">
                    <td data-label="Student" className="px-3 sm:px-4 py-3.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-600 flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-sm">
                          {getFirstLetter(s.full_name || s.username)}
                        </div>
                        <button
                          onClick={() => openViewModal(s)}
                          className="text-gray-800 text-xs sm:text-sm font-medium hover:text-green-600 transition-colors text-left break-words flex-1"
                        >
                          {s.full_name || s.username}
                        </button>
                      </div>
                    </td>
                    <td data-label="Email" className="px-3 sm:px-4 py-3.5 text-gray-500 text-xs sm:text-sm break-all">{s.email}</td>
                    <td data-label="Course" className="px-3 sm:px-4 py-3.5">
                      <span className="inline-block bg-green-50 border border-green-200 text-green-700 text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full">
                        {s.course_name || s.course || "—"}
                      </span>
                    </td>
                    <td data-label="Batch" className="px-3 sm:px-4 py-3.5">
                      <span className="inline-block bg-gray-50 border border-gray-200 text-gray-600 text-[10px] sm:text-xs font-mono px-2 sm:px-2.5 py-1 rounded-full">
                        {s.batch_name || s.batch || "—"}
                      </span>
                    </td>
                    <td data-label="Phone" className="px-3 sm:px-4 py-3.5 text-gray-500 text-xs sm:text-sm">{s.phone || "—"}</td>
                    <td data-label="DOB" className="px-3 sm:px-4 py-3.5 text-gray-500 text-xs sm:text-sm">{s.date_of_birth || "—"}</td>
                    <td data-label="Actions" className="px-3 sm:px-4 py-3.5">
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-medium whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(s.id, s.full_name || s.username)}
                          className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-medium whitespace-nowrap"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => { setProgressStudent(s); setShowProgressModal(true); }}
                          className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all font-medium whitespace-nowrap"
                        >
                          Progress
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination - Responsive */}
          {totalFiltered > 0 && (
            <div className="bg-green-50/40 border-t border-green-100 px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row justify-between gap-3 items-center">
              <p className="text-gray-400 text-xs text-center sm:text-left">
                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered} students
              </p>
              <div className="flex gap-1 flex-wrap justify-center">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-green-100 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
                >
                  ←
                </button>
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span key={idx} className="px-2 py-1.5 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        currentPage === page
                          ? "bg-green-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-green-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-green-100 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Students;