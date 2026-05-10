// src/pages/mentor/MentorStudents.jsx – Elegant Light Green Theme
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import ProgressModal from "../../components/ProgressModal";



function MentorStudents() {
  const { user: authUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mentorId, setMentorId] = useState(null);
  const [mentorBatch, setMentorBatch] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [viewerDocuments, setViewerDocuments] = useState([]);
  const [progressStudent, setProgressStudent] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "", email: "", course: "", phone: "", date_of_birth: "",
    age: "", gender: "", fathers_name: "", fathers_contact: "",
    mothers_name: "", mothers_contact: "", address: "",
    educational_qualification: "", college_school: "", parent_name: "",
    parent_phone: "", emergency_contact: "",
  });

  const [phoneError, setPhoneError] = useState("");
  const [fathersContactError, setFathersContactError] = useState("");
  const [mothersContactError, setMothersContactError] = useState("");
  const [parentPhoneError, setParentPhoneError] = useState("");
  const [emergencyContactError, setEmergencyContactError] = useState("");

  const mentorFetched = useRef(false);

  const getBatchName = (batchId) => {
    if (!batchId) return "—";
    if (typeof batchId === "string" && batchId.match(/^[A-Za-z0-9]+$/)) return batchId;
    const idNum = parseInt(batchId, 10);
    if (!isNaN(idNum)) {
      const batch = batchesList.find((b) => b.id === idNum);
      if (batch) return batch.name;
    }
    return batchId;
  };

  const getStudentMentorName = (student) => student.mentor_name || mentorName;

  const getInitials = (name) =>
    (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  useEffect(() => {
    if (mentorFetched.current) return;
    mentorFetched.current = true;
    const fetchMentor = async () => {
      if (authUser?.mentor_id) {
        setMentorId(authUser.mentor_id);
        setMentorBatch(authUser.batch || authUser.batch_name || "");
        setMentorName(authUser.full_name || authUser.username || "Mentor");
        return;
      }
      try {
        const res = await API.get("mentors/me/");
        setMentorId(res.data.id);
        setMentorBatch(res.data.batch || res.data.batch_name || "");
        setMentorName(res.data.full_name || res.data.name || res.data.username || "Mentor");
      } catch (err) {
        console.error(err);
        setError("Failed to load mentor info");
      }
    };
    fetchMentor();
  }, [authUser]);

  useEffect(() => {
    if (!mentorId) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [studentsRes, coursesRes, batchesRes] = await Promise.all([
          API.get("students/", { params: { mentor: mentorId } }),
          API.get("courses/"),
          API.get("batches/"),
        ]);
        setStudents(studentsRes.data.results || studentsRes.data);
        setCoursesList(coursesRes.data.results || coursesRes.data);
        setBatchesList(batchesRes.data.results || batchesRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [mentorId]);

  const refreshList = async () => {
    if (!mentorId) return;
    try {
      const res = await API.get("students/", { params: { mentor: mentorId } });
      setStudents(res.data.results || res.data);
    } catch {
      toast.error("Failed to refresh list");
    }
  };

  const openViewModal = async (student) => {
    try {
      const fullStudentRes = await API.get(`students/${student.id}/`);
      const docsRes = await API.get(`students/${student.id}/documents/`);
      setViewerDocuments(docsRes.data.results || docsRes.data);
      setViewingStudent(fullStudentRes.data);
    } catch {
      toast.error("Could not load student details");
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      full_name: student.full_name ?? "", email: student.email ?? "",
      course: student.course ?? "", phone: student.phone ?? "",
      date_of_birth: student.date_of_birth ?? "", age: student.age ?? "",
      gender: student.gender ?? "", fathers_name: student.fathers_name ?? "",
      fathers_contact: student.fathers_contact ?? "", mothers_name: student.mothers_name ?? "",
      mothers_contact: student.mothers_contact ?? "", address: student.address ?? "",
      educational_qualification: student.educational_qualification ?? "",
      college_school: student.college_school ?? "", parent_name: student.parent_name ?? "",
      parent_phone: student.parent_phone ?? "", emergency_contact: student.emergency_contact ?? "",
    });
    setShowModal(true);
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await API.delete(`students/${studentToDelete.id}/`);
      toast.success(`${studentToDelete.full_name || studentToDelete.username} removed`);
      await refreshList();
    } catch {
      toast.error("Failed to delete student");
    } finally {
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
    }
  };

  const generateUsername = (email, fullName) => {
    let base = email ? email.split("@")[0] : (fullName || "student");
    base = base.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!base) base = "student";
    return `${base}${Math.floor(Math.random() * 10000)}`;
  };

  const uploadDocs = async (studentId, files) => {
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("student", studentId);
      try { await API.post("upload-student-document/", fd); }
      catch { toast.error(`Failed to upload ${f.name}`); }
    }
  };

  const handlePhoneChange = (field, value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, [field]: digits }));
    const errMsg = digits.length && digits.length !== 10 ? "Must be 10 digits" : "";
    if (field === "phone") setPhoneError(errMsg);
    else if (field === "fathers_contact") setFathersContactError(errMsg);
    else if (field === "mothers_contact") setMothersContactError(errMsg);
    else if (field === "parent_phone") setParentPhoneError(errMsg);
    else if (field === "emergency_contact") setEmergencyContactError(errMsg);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["phone", "fathers_contact", "mothers_contact", "parent_phone", "emergency_contact"].includes(name)) {
      handlePhoneChange(name, value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (formData.date_of_birth) {
      const birth = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      setFormData((prev) => ({ ...prev, age: age.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, age: "" }));
    }
  }, [formData.date_of_birth]);

  const resetForm = () => {
    setFormData({
      full_name: "", email: "", course: "", phone: "", date_of_birth: "",
      age: "", gender: "", fathers_name: "", fathers_contact: "",
      mothers_name: "", mothers_contact: "", address: "",
      educational_qualification: "", college_school: "", parent_name: "",
      parent_phone: "", emergency_contact: "",
    });
    setPhoneError(""); setFathersContactError(""); setMothersContactError("");
    setParentPhoneError(""); setEmergencyContactError("");
    setSelectedFiles([]); setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const checks = [
      { field: "phone", setErr: setPhoneError, label: "Student phone" },
      { field: "fathers_contact", setErr: setFathersContactError, label: "Father's contact" },
      { field: "mothers_contact", setErr: setMothersContactError, label: "Mother's contact" },
      { field: "parent_phone", setErr: setParentPhoneError, label: "Parent phone" },
      { field: "emergency_contact", setErr: setEmergencyContactError, label: "Emergency contact" },
    ];
    let hasErr = false;
    for (const { field, setErr, label } of checks) {
      const val = formData[field];
      if (val && !/^\d{10}$/.test(val)) {
        setErr("Must be 10 digits"); toast.error(`${label} must be 10 digits`); hasErr = true;
      } else { setErr(""); }
    }
    if (hasErr) return;
    setSubmitting(true);
    try {
      if (editingId) {
        const payload = {
          full_name: formData.full_name?.trim() || null, email: formData.email,
          course: formData.course, phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null, fathers_name: formData.fathers_name || null,
          fathers_contact: formData.fathers_contact || null, mothers_name: formData.mothers_name || null,
          mothers_contact: formData.mothers_contact || null, address: formData.address || null,
          educational_qualification: formData.educational_qualification || null,
          college_school: formData.college_school || null, parent_name: formData.parent_name || null,
          parent_phone: formData.parent_phone || null, emergency_contact: formData.emergency_contact || null,
        };
        await API.patch(`students/${editingId}/`, payload);
        toast.success("Student updated successfully!");
        if (selectedFiles.length) await uploadDocs(editingId, selectedFiles);
      } else {
        const username = generateUsername(formData.email, formData.full_name);
        const payload = {
          full_name: formData.full_name?.trim() || null, email: formData.email,
          course: formData.course, batch: mentorBatch, mentor: mentorId, username,
          phone: formData.phone || null, date_of_birth: formData.date_of_birth || null,
          age: formData.age ? parseInt(formData.age) : null, gender: formData.gender || null,
          fathers_name: formData.fathers_name || null, fathers_contact: formData.fathers_contact || null,
          mothers_name: formData.mothers_name || null, mothers_contact: formData.mothers_contact || null,
          address: formData.address || null, educational_qualification: formData.educational_qualification || null,
          college_school: formData.college_school || null, parent_name: formData.parent_name || null,
          parent_phone: formData.parent_phone || null, emergency_contact: formData.emergency_contact || null,
        };
        const res = await API.post("students/", payload);
        toast.success(`Student added! Username: ${username}`);
        if (selectedFiles.length) await uploadDocs(res.data.id, selectedFiles);
      }
      await refreshList();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      let msg = err.response?.data?.detail || "Operation failed";
      const data = err.response?.data;
      if (data?.email) msg = `Email: ${data.email.join(", ")}`;
      else if (data?.username) msg = `Username: ${data.username.join(", ")}`;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.full_name || s.username)?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.course?.toLowerCase().includes(term) ||
      (s.batch && getBatchName(s.batch).toLowerCase().includes(term))
    );
  });

  // ─── Shared styles ───────────────────────────────────────────────────────
  const inputCls =
    "w-full bg-white border border-green-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm transition-all";
  const readOnlyCls =
    "w-full bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-gray-400 cursor-not-allowed text-sm";
  const labelCls =
    "block text-gray-500 text-[11px] font-medium mb-1 tracking-wide uppercase";
  const sectionTitleCls =
    "text-[11px] font-semibold tracking-[0.15em] uppercase mb-3";

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-green-50 min-h-screen gap-3">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-green-600 text-xs tracking-widest uppercase">Loading students…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-green-50 min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="border border-green-500 text-green-600 px-6 py-2 rounded-xl text-sm hover:bg-green-500 hover:text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-green-50/40 overflow-y-auto" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        studentId={progressStudent?.id}
        studentName={progressStudent?.full_name || progressStudent?.username}
      />

      {/* ── Top Banner ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-green-100 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-green-400 mb-1.5 font-medium">
              Mentor Portal
            </p>
            <h1
              className="text-2xl text-gray-800 leading-tight"
              style={{ fontFamily: '"DM Serif Display", serif' }}
            >
              My Students
            </h1>
            <p className="text-gray-400 text-xs mt-1 font-light">
              {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} in your cohort
            </p>
          </div>

          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs tracking-wide px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Student
          </button>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-green-100 px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, course, batch…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-green-50 border border-green-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 text-gray-700 placeholder-gray-400 transition-all"
            />
          </div>
          <span className="text-[11px] bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-full whitespace-nowrap font-medium">
            {filteredStudents.length} result{filteredStudents.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Card Grid ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm" style={{ fontFamily: '"DM Serif Display", serif' }}>
              {searchTerm ? "No students match your search." : "No students assigned to you yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-green-100 overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-green-100/80 hover:border-green-300 transition-all duration-200"
              >
                {/* green top accent stripe */}
                <div className="h-1 bg-gradient-to-r from-green-500 to-green-300" />

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm">
                      {getInitials(student.full_name || student.username)}
                    </div>
                    <div className="min-w-0">
                      <button
                        onClick={() => openViewModal(student)}
                        className="font-semibold text-gray-800 hover:text-green-600 transition-colors text-sm text-left leading-snug truncate w-full block"
                      >
                        {student.full_name || student.username}
                      </button>
                      <p className="text-[11px] text-gray-500 font-light mt-0.5 truncate">
                        {student.course}
                      </p>
                      <span className="inline-block mt-1 text-[10px] bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                        {getBatchName(student.batch)}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-green-50 mb-3" />

                  <div className="flex flex-wrap gap-1.5">
                    <Link
                      to={`/mentor/review-sheet?student_id=${student.id}`}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all font-medium"
                    >
                      Review Sheet
                    </Link>
                    <button
                      onClick={() => { setProgressStudent(student); setShowProgressModal(true); }}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all font-medium"
                    >
                      Progress
                    </button>
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(student)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-green-100 shadow-2xl shadow-green-100/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-green-100 rounded-t-2xl flex justify-between items-center">
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
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {editingId ? "Edit Student" : "Add New Student"}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-light">
                    {editingId ? "Update student information" : "Add a student to your batch"}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <p className={`${sectionTitleCls} text-green-600`}>Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Full Name</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={inputCls} /></div>
                  <div><label className={labelCls}>Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Course *</label>
                    <select name="course" value={formData.course} onChange={handleChange} required className={inputCls}>
                      <option value="">Select a course</option>
                      {coursesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Batch</label>
                    <input type="text" readOnly
                      value={editingId ? getBatchName(students.find((s) => s.id === editingId)?.batch) : (getBatchName(mentorBatch) || "Not assigned")}
                      className={readOnlyCls} />
                    {!editingId && <p className="text-[11px] text-gray-400 mt-1">Auto-assigned from your profile</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Mentor</label>
                    <input type="text" readOnly
                      value={editingId ? (students.find((s) => s.id === editingId)?.mentor_name || mentorName) : mentorName}
                      className={readOnlyCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} />
                    {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                  </div>
                  <div><label className={labelCls}>Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputCls} /></div>
                  <div><label className={labelCls}>Age</label><input type="text" name="age" value={formData.age} readOnly className={readOnlyCls} /></div>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className={inputCls}>
                      <option value="">Select</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Parents */}
              <div className="border-t border-green-50 pt-5">
                <p className={`${sectionTitleCls} text-gray-400`}>Parents</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Father's Name</label><input type="text" name="fathers_name" value={formData.fathers_name} onChange={handleChange} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Father's Contact</label>
                    <input type="text" name="fathers_contact" value={formData.fathers_contact} onChange={handleChange} className={inputCls} />
                    {fathersContactError && <p className="text-red-500 text-xs mt-1">{fathersContactError}</p>}
                  </div>
                  <div><label className={labelCls}>Mother's Name</label><input type="text" name="mothers_name" value={formData.mothers_name} onChange={handleChange} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Mother's Contact</label>
                    <input type="text" name="mothers_contact" value={formData.mothers_contact} onChange={handleChange} className={inputCls} />
                    {mothersContactError && <p className="text-red-500 text-xs mt-1">{mothersContactError}</p>}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t border-green-50 pt-5">
                <p className={`${sectionTitleCls} text-gray-400`}>Address</p>
                <textarea name="address" rows={2} value={formData.address} onChange={handleChange} className={`${inputCls} resize-none`} />
              </div>

              {/* Education */}
              <div className="border-t border-green-50 pt-5">
                <p className={`${sectionTitleCls} text-gray-400`}>Education</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Qualification</label><input type="text" name="educational_qualification" value={formData.educational_qualification} onChange={handleChange} className={inputCls} /></div>
                  <div><label className={labelCls}>College / School</label><input type="text" name="college_school" value={formData.college_school} onChange={handleChange} className={inputCls} /></div>
                  <div><label className={labelCls}>Parent Name</label><input type="text" name="parent_name" value={formData.parent_name} onChange={handleChange} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Parent Phone</label>
                    <input type="text" name="parent_phone" value={formData.parent_phone} onChange={handleChange} className={inputCls} />
                    {parentPhoneError && <p className="text-red-500 text-xs mt-1">{parentPhoneError}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Emergency Contact</label>
                    <input type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} className={inputCls} />
                    {emergencyContactError && <p className="text-red-500 text-xs mt-1">{emergencyContactError}</p>}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="border-t border-green-50 pt-5">
                <p className={`${sectionTitleCls} text-green-600`}>Documents</p>
                <input
                  type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-green-200 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-600 hover:file:text-white file:transition-colors file:cursor-pointer"
                />
                {selectedFiles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {selectedFiles.map((f, i) => (
                      <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        {f.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-green-100 rounded-b-2xl">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
              >
                {submitting
                  ? (editingId ? "Saving…" : "Adding…")
                  : (editingId ? "Save Changes" : "Add Student")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW DETAILS MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {viewingStudent && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setViewingStudent(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-green-100 shadow-2xl shadow-green-100/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-green-100 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {getInitials(viewingStudent.full_name || viewingStudent.username)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {viewingStudent.full_name || viewingStudent.username}
                  </h3>
                  <p className="text-[11px] text-gray-400">{viewingStudent.course}</p>
                </div>
              </div>
              <button onClick={() => setViewingStudent(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className={`${sectionTitleCls} text-green-600`}>Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ["Full Name", viewingStudent.full_name],
                    ["Email", viewingStudent.email],
                    ["Course", viewingStudent.course],
                    ["Batch", getBatchName(viewingStudent.batch)],
                    ["Mentor", getStudentMentorName(viewingStudent)],
                    ["Phone", viewingStudent.phone],
                    ["Date of Birth", viewingStudent.date_of_birth],
                    ["Age", viewingStudent.age],
                    ["Gender", viewingStudent.gender],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-green-50/60 rounded-xl p-3 border border-green-100/60">
                      <p className="text-[10px] uppercase tracking-widest text-green-400 mb-1">{label}</p>
                      <p className="text-gray-800 text-sm font-medium">{val || "—"}</p>
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
                  <p className="text-gray-800 text-sm">{viewingStudent.address || "—"}</p>
                </div>
              </div>

              <div className="border-t border-green-50 pt-5">
                <p className={`${sectionTitleCls} text-gray-400`}>Education</p>
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
                    {viewerDocuments.map((doc) => (
                      <li key={doc.id}>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors text-sm">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {doc.file_name}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-green-100 rounded-b-2xl flex justify-end">
              <button onClick={() => setViewingStudent(null)}
                className="border border-green-200 text-gray-500 px-6 py-2 rounded-xl text-sm hover:border-green-400 hover:text-green-600 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showDeleteConfirm && studentToDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-red-100 shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-400 to-red-300" />
            <div className="p-6">
              <p className="text-[10px] tracking-[0.2em] uppercase text-red-400 mb-2 font-medium">Confirm Removal</p>
              <h3 className="text-lg text-gray-800 mb-3" style={{ fontFamily: '"DM Serif Display", serif' }}>
                Remove Student?
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                You are about to remove{" "}
                <span className="text-gray-800 font-semibold">
                  {studentToDelete.full_name || studentToDelete.username}
                </span>. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:border-gray-300 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDelete}
                  className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default MentorStudents;