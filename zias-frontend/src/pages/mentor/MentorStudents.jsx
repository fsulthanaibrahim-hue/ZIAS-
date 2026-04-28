// src/pages/mentor/MentorStudents.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";
import toast from "react-hot-toast";

function MentorStudents() {
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

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    course: "",
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
    parent_name: "",
    parent_phone: "",
    emergency_contact: "",
  });

  const [phoneError, setPhoneError] = useState("");
  const [fathersContactError, setFathersContactError] = useState("");
  const [mothersContactError, setMothersContactError] = useState("");
  const [parentPhoneError, setParentPhoneError] = useState("");
  const [emergencyContactError, setEmergencyContactError] = useState("");

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

  const getStudentMentorName = (student) => {
    if (student.mentor_name) return student.mentor_name;
    return mentorName;
  };

  useEffect(() => {
    const fetchMentor = async () => {
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
  }, []);

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
        setStudents(studentsRes.data);
        setCoursesList(coursesRes.data);
        setBatchesList(batchesRes.data);
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
      setStudents(res.data);
    } catch (err) {
      toast.error("Failed to refresh list");
    }
  };

  const openViewModal = async (student) => {
    try {
      const fullStudentRes = await API.get(`students/${student.id}/`);
      const fullStudent = fullStudentRes.data;
      const docsRes = await API.get(`students/${student.id}/documents/`);
      setViewerDocuments(docsRes.data);
      setViewingStudent(fullStudent);
    } catch (err) {
      console.error(err);
      toast.error("Could not load student details");
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      full_name: student.full_name ?? "",
      email: student.email ?? "",
      course: student.course ?? "",
      phone: student.phone ?? "",
      date_of_birth: student.date_of_birth ?? "",
      age: student.age ?? "",
      gender: student.gender ?? "",
      fathers_name: student.fathers_name ?? "",
      fathers_contact: student.fathers_contact ?? "",
      mothers_name: student.mothers_name ?? "",
      mothers_contact: student.mothers_contact ?? "",
      address: student.address ?? "",
      educational_qualification: student.educational_qualification ?? "",
      college_school: student.college_school ?? "",
      parent_name: student.parent_name ?? "",
      parent_phone: student.parent_phone ?? "",
      emergency_contact: student.emergency_contact ?? "",
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
      toast.success(`Student ${studentToDelete.full_name || studentToDelete.username} deleted`);
      await refreshList();
    } catch (err) {
      console.error(err);
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
    if (!files.length) return;
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("student", studentId);
      try {
        await API.post("upload-student-document/", fd);
      } catch (err) {
        toast.error(`Failed to upload ${f.name}`);
      }
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
      full_name: "",
      email: "",
      course: "",
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
      parent_name: "",
      parent_phone: "",
      emergency_contact: "",
    });
    setPhoneError("");
    setFathersContactError("");
    setMothersContactError("");
    setParentPhoneError("");
    setEmergencyContactError("");
    setSelectedFiles([]);
    setEditingId(null);
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
        setErr("Must be 10 digits");
        toast.error(`${label} must be 10 digits`);
        hasErr = true;
      } else {
        setErr("");
      }
    }
    if (hasErr) return;

    setSubmitting(true);
    try {
      if (editingId) {
        // EDIT: PATCH request
        const payload = {
          full_name: formData.full_name?.trim() || null,
          email: formData.email,
          course: formData.course,
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
        await API.patch(`students/${editingId}/`, payload);
        toast.success("Student updated successfully!");
        if (selectedFiles.length) {
          await uploadDocs(editingId, selectedFiles);
        }
        await refreshList();
        setShowModal(false);
        resetForm();
      } else {
        // ADD: POST request
        const username = generateUsername(formData.email, formData.full_name);
        const payload = {
          full_name: formData.full_name?.trim() || null,
          email: formData.email,
          course: formData.course,
          batch: mentorBatch,
          mentor: mentorId,
          username,
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
        const res = await API.post("students/", payload);
        toast.success(`Student added! Username: ${username}`);
        if (selectedFiles.length) {
          await uploadDocs(res.data.id, selectedFiles);
        }
        await refreshList();
        setShowModal(false);
        resetForm();
      }
    } catch (err) {
      console.error(err);
      let msg = err.response?.data?.detail || "Operation failed";
      if (err.response?.data) {
        const data = err.response.data;
        if (data.email) msg = `Email: ${data.email.join(", ")}`;
        else if (data.username) msg = `Username: ${data.username.join(", ")}`;
      }
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

  const inputClass =
    "w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 text-sm";
  const readOnlyClass =
    "w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-600 cursor-not-allowed text-sm";

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-gray-50 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 bg-gray-50 text-center text-red-600">
        {error}
        <button onClick={() => window.location.reload()} className="ml-2 bg-green-600 text-white px-3 py-1 rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Students</h1>
            <p className="text-gray-500 text-sm">Assigned to you ({filteredStudents.length})</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Student
          </button>
        </div>

        <div className="mb-6 relative max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, course, batch..."
            className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500">
              {searchTerm ? "No students match your search." : "No students assigned to you yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center uppercase font-bold text-green-700">
                    {student.username?.charAt(0) || "?"}
                  </div>
                  <div>
                    <button
                      onClick={() => openViewModal(student)}
                      className="font-semibold text-gray-800 hover:text-green-600 transition text-left"
                    >
                      {student.full_name || student.username}
                    </button>
                    <p className="text-xs text-gray-500">
                      {student.course} • {getBatchName(student.batch)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link
                    to={`/mentor/review-sheet?student_id=${student.id}`}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition"
                  >
                    Review Sheet
                  </Link>
                  <button
                    onClick={() => handleEdit(student)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(student)}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal (same form – used for both) */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-4 py-3 border-b flex justify-between items-center">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"}
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">{editingId ? "Edit Student" : "Add New Student"}</h3>
                  <p className="text-xs text-gray-500">
                    {editingId ? "Update student information" : "Add a student to your batch"}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic Information */}
              <div>
                <h4 className="text-xs font-semibold text-green-600 uppercase mb-2">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Full Name</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Course *</label><select name="course" value={formData.course} onChange={handleChange} required className={inputClass}><option value="">Select a course</option>{coursesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                  <div>
                    <label className="block text-gray-600 text-xs font-medium mb-1">Batch</label>
                    <input
                      type="text"
                      value={editingId ? getBatchName(students.find(s => s.id === editingId)?.batch) : (getBatchName(mentorBatch) || "Not assigned")}
                      readOnly
                      className={readOnlyClass}
                    />
                    {!editingId && <p className="text-xs text-gray-400 mt-1">Auto‑assigned from your mentor profile</p>}
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs font-medium mb-1">Mentor</label>
                    <input
                      type="text"
                      value={editingId ? (students.find(s => s.id === editingId)?.mentor_name || mentorName) : mentorName}
                      readOnly
                      className={readOnlyClass}
                    />
                    {!editingId && <p className="text-xs text-gray-400 mt-1">You are the assigned mentor</p>}
                  </div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />{phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}</div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Age</label><input type="text" name="age" value={formData.age} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-gray-600 text-xs font-medium mb-1">Gender</label><select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                </div>
              </div>

              {/* Parents */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-amber-600 uppercase mb-2">Parents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-600 text-xs mb-1">Father's Name</label><input type="text" name="fathers_name" value={formData.fathers_name} onChange={handleChange} className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs mb-1">Father's Contact</label><input type="text" name="fathers_contact" value={formData.fathers_contact} onChange={handleChange} className={inputClass} />{fathersContactError && <p className="text-red-500 text-xs mt-1">{fathersContactError}</p>}</div>
                  <div><label className="block text-gray-600 text-xs mb-1">Mother's Name</label><input type="text" name="mothers_name" value={formData.mothers_name} onChange={handleChange} className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs mb-1">Mother's Contact</label><input type="text" name="mothers_contact" value={formData.mothers_contact} onChange={handleChange} className={inputClass} />{mothersContactError && <p className="text-red-500 text-xs mt-1">{mothersContactError}</p>}</div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-amber-600 uppercase mb-2">Address</h4>
                <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className={`${inputClass} resize-none`} />
              </div>

              {/* Education */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-amber-600 uppercase mb-2">Education</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-600 text-xs mb-1">Educational Qualification</label><input type="text" name="educational_qualification" value={formData.educational_qualification} onChange={handleChange} className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs mb-1">College / School</label><input type="text" name="college_school" value={formData.college_school} onChange={handleChange} className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs mb-1">Parent Name</label><input type="text" name="parent_name" value={formData.parent_name} onChange={handleChange} className={inputClass} /></div>
                  <div><label className="block text-gray-600 text-xs mb-1">Parent Phone</label><input type="text" name="parent_phone" value={formData.parent_phone} onChange={handleChange} className={inputClass} />{parentPhoneError && <p className="text-red-500 text-xs mt-1">{parentPhoneError}</p>}</div>
                  <div><label className="block text-gray-600 text-xs mb-1">Emergency Contact</label><input type="text" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} className={inputClass} />{emergencyContactError && <p className="text-red-500 text-xs mt-1">{emergencyContactError}</p>}</div>
                </div>
              </div>

              {/* Documents */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-blue-600 uppercase mb-2">Documents</h4>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {selectedFiles.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-500 list-disc pl-5">
                    {selectedFiles.map((f, i) => <li key={i}>📎 {f.name}</li>)}
                  </ul>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg transition text-sm font-medium disabled:opacity-50"
              >
                {submitting ? (editingId ? "Saving..." : "Adding...") : (editingId ? "Save Changes" : "Add Student")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Details Modal (unchanged) */}
      {viewingStudent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingStudent(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-4 py-3 border-b flex justify-between items-center">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Student Details</h3>
                  <p className="text-xs text-gray-500">Complete information (same as admin)</p>
                </div>
              </div>
              <button onClick={() => setViewingStudent(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-500 text-xs">Full Name</label><p className="text-gray-800 text-sm">{viewingStudent.full_name || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Email</label><p className="text-gray-800 text-sm">{viewingStudent.email}</p></div>
                  <div><label className="block text-gray-500 text-xs">Course</label><p className="text-gray-800 text-sm">{viewingStudent.course}</p></div>
                  <div><label className="block text-gray-500 text-xs">Batch</label><p className="text-gray-800 text-sm">{getBatchName(viewingStudent.batch)}</p></div>
                  <div><label className="block text-gray-500 text-xs">Mentor</label><p className="text-gray-800 text-sm">{getStudentMentorName(viewingStudent)}</p></div>
                  <div><label className="block text-gray-500 text-xs">Phone</label><p className="text-gray-800 text-sm">{viewingStudent.phone || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Date of Birth</label><p className="text-gray-800 text-sm">{viewingStudent.date_of_birth || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Age</label><p className="text-gray-800 text-sm">{viewingStudent.age || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Gender</label><p className="text-gray-800 text-sm">{viewingStudent.gender || "—"}</p></div>
                </div>
              </div>

              {/* Parents */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Parents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-500 text-xs">Father's Name</label><p>{viewingStudent.fathers_name || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Father's Contact</label><p>{viewingStudent.fathers_contact || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Mother's Name</label><p>{viewingStudent.mothers_name || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Mother's Contact</label><p>{viewingStudent.mothers_contact || "—"}</p></div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Address</h4>
                <p className="text-gray-800 text-sm">{viewingStudent.address || "—"}</p>
              </div>

              {/* Education */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Education</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-500 text-xs">Educational Qualification</label><p>{viewingStudent.educational_qualification || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">College / School</label><p>{viewingStudent.college_school || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Parent Name</label><p>{viewingStudent.parent_name || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Parent Phone</label><p>{viewingStudent.parent_phone || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Emergency Contact</label><p>{viewingStudent.emergency_contact || "—"}</p></div>
                </div>
              </div>

              {/* Documents */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Documents</h4>
                {viewerDocuments.length === 0 ? (
                  <p className="text-gray-400 text-sm">No documents uploaded.</p>
                ) : (
                  <ul className="space-y-2">
                    {viewerDocuments.map((doc) => (
                      <li key={doc.id}>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end">
              <button onClick={() => setViewingStudent(null)} className="bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && studentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold">Confirm Delete</h3>
            <p className="text-gray-600 my-4">
              Delete <strong>{studentToDelete.full_name || studentToDelete.username}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default MentorStudents;