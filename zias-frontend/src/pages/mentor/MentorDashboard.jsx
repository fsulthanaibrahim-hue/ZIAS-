// src/pages/mentor/MentorDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-emerald-500/90" : type === "error" ? "bg-red-500/90" : "bg-blue-500/90";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md bg-black/70 text-white text-sm font-medium">
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">×</button>
    </div>
  );
}

// Custom confirmation modal for delete
function ConfirmModal({ isOpen, onClose, onConfirm, studentName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md p-4">
      <div className="bg-[#161b22] rounded-2xl max-w-md w-full border border-[#30363d] shadow-2xl shadow-black/60 p-6">
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

function MentorDashboard() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    course: "",
    batch: "",
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

  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const hideToast = () => setToast(null);

  const fetchStudents = async () => {
    try {
      const res = await API.get("students/list/");
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await API.get("courses/");
      setCourses(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchBatches = async () => {
    try {
      const res = await API.get("batches/");
      setBatches(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchStudents();
    fetchCourses();
    fetchBatches();
  }, []);

  // Auto-calculate age from date_of_birth
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digits }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.username || !formData.email || !formData.course || !formData.batch) {
      showToast("Username, Email, Course, and Batch are required.", "error");
      return;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      showToast("Phone number must be exactly 10 digits", "error");
      return;
    }

    setSubmitting(true);
    const payload = {
      username: formData.username.trim(),
      full_name: formData.full_name || null,
      email: formData.email,
      course: formData.course,
      batch: formData.batch,
      phone: formData.phone || null,
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
        showToast(`Student "${payload.username}" added successfully!`, "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        username: "", full_name: "", email: "", course: "", batch: "", phone: "", date_of_birth: "", age: "", gender: "",
        fathers_name: "", fathers_contact: "", mothers_name: "", mothers_contact: "",
        address: "", educational_qualification: "", college_school: "",
      });
      fetchStudents();
    } catch (err) {
      console.error(err);
      if (err.response) {
        const errorData = err.response.data;
        let errorMsg = "Failed to add student.";
        if (errorData.username) errorMsg = `Username "${payload.username}" already exists.`;
        else if (errorData.course) errorMsg = "Course is required.";
        else if (errorData.batch) errorMsg = "Batch is required.";
        else if (errorData.email) errorMsg = "Email is invalid or already used.";
        else errorMsg = Object.values(errorData).flat().join(", ");
        showToast(errorMsg, "error");
      } else {
        showToast(err.message, "error");
      }
    } finally {
      setSubmitting(false);
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
    setShowForm(true);
  };

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

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Read-only class for view modal
  const readOnlyClass = `
    w-full bg-[#0d1117]/50 border border-[#30363d]/50 rounded-lg px-4 py-2.5 text-[#7d8590]
    cursor-not-allowed text-sm font-mono
  `;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} studentName={studentToDelete?.name} />

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">👨‍🏫 My Students</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  username: "", full_name: "", email: "", course: "", batch: "", phone: "", date_of_birth: "", age: "", gender: "",
                  fathers_name: "", fathers_contact: "", mothers_name: "", mothers_contact: "",
                  address: "", educational_qualification: "", college_school: "",
                });
                setShowForm(!showForm);
              }}
              className="bg-[#238636] hover:bg-[#2ea043] px-4 py-2 rounded-lg text-sm"
            >
              {showForm ? "Cancel" : "+ Add Student"}
            </button>
            <Link to="/mentor/profile" className="bg-[#21262d] hover:bg-[#30363d] px-4 py-2 rounded-lg text-sm">
              My Profile
            </Link>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-[#161b22] rounded-xl border border-[#21262d] p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit Student" : "Add New Student"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="username" placeholder="Username *" value={formData.username} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" required />
              <input name="email" placeholder="Email *" type="email" value={formData.email} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" required />
              <input name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" />
              <select name="course" value={formData.course} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" required>
                <option value="">Select Course *</option>
                {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <select name="batch" value={formData.batch} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" required>
                <option value="">Select Batch *</option>
                {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
              <input name="phone" placeholder="Phone (10 digits)" value={formData.phone} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" />
              <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" />
              <input name="age" placeholder="Age (auto)" value={formData.age} readOnly className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2 opacity-70" />
              <select name="gender" value={formData.gender} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2">
                <option value="">Gender</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
              <input name="fathers_name" placeholder="Father's Name" value={formData.fathers_name} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" />
              <input name="fathers_contact" placeholder="Father's Contact" value={formData.fathers_contact} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" />
              <input name="mothers_name" placeholder="Mother's Name" value={formData.mothers_name} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" />
              <input name="mothers_contact" placeholder="Mother's Contact" value={formData.mothers_contact} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" />
              <textarea name="address" placeholder="Address" value={formData.address} onChange={handleChange} rows="2" className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2 col-span-full" />
              <input name="educational_qualification" placeholder="Educational Qualification" value={formData.educational_qualification} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" />
              <input name="college_school" placeholder="College / School Name" value={formData.college_school} onChange={handleChange} className="bg-[#0d1117] border border-[#21262d] rounded px-3 py-2" />
              <div className="col-span-full flex gap-3 mt-2">
                <button type="submit" disabled={submitting} className="bg-[#238636] hover:bg-[#2ea043] px-4 py-2 rounded font-medium">
                  {submitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Save Changes" : "Add Student")}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="bg-[#21262d] hover:bg-[#30363d] px-4 py-2 rounded">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input type="text" placeholder="Search by name or username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-80 bg-[#161b22] border border-[#21262d] rounded-lg px-4 py-2 text-sm" />
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto rounded-xl border border-[#21262d]">
          <table className="w-full text-sm">
            <thead className="bg-[#161b22] border-b border-[#21262d]">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Batch</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]">
              {filteredStudents.map(s => (
                <tr key={s.id} className="hover:bg-[#161b22]/30">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewingStudent(s)}
                      className="text-[#e6edf3] hover:text-blue-400 transition-colors cursor-pointer text-left"
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[#7d8590]">{s.email}</td>
                  <td className="px-4 py-3">{s.course || "—"}</td>
                  <td className="px-4 py-3">{s.batch_name || s.batch || "—"}</td>
                  <td className="px-4 py-3">{s.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-300 text-xs">✎ Edit</button>
                      <button onClick={() => handleDeleteClick(s.id, s.name)} className="text-red-400 hover:text-red-300 text-xs">🗑 Delete</button>
                      <Link to={`/student/review-sheet?student_id=${s.id}`} className="text-emerald-400 hover:text-emerald-300 text-xs">📊 Review</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-[#7d8590]">No students found. Use "Add Student" to create one. </td></tr>}
            </tbody>
          </table>
        </div>
      </div>

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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-4 sm:px-6 py-5 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-xs font-semibold text-[#388bfd] uppercase tracking-wider mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Username</label><input type="text" value={viewingStudent.username} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Full Name</label><input type="text" value={viewingStudent.full_name || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Email</label><input type="text" value={viewingStudent.email} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Course</label><input type="text" value={viewingStudent.course} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Batch</label><input type="text" value={viewingStudent.batch_name || viewingStudent.batch || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mentor</label><input type="text" value={viewingStudent.mentor_name || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Phone</label><input type="text" value={viewingStudent.phone || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Date of Birth</label><input type="text" value={viewingStudent.date_of_birth || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Age</label><input type="text" value={viewingStudent.age || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Gender</label><input type="text" value={viewingStudent.gender || "—"} readOnly className={readOnlyClass} /></div>
                </div>
              </div>
              {/* Parents */}
              <div className="border-t border-[#21262d] pt-4">
                <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Parents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Father's Name</label><input type="text" value={viewingStudent.fathers_name || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Father's Contact</label><input type="text" value={viewingStudent.fathers_contact || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mother's Name</label><input type="text" value={viewingStudent.mothers_name || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mother's Contact</label><input type="text" value={viewingStudent.mothers_contact || "—"} readOnly className={readOnlyClass} /></div>
                </div>
              </div>
              {/* Address */}
              <div className="border-t border-[#21262d] pt-4">
                <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Address</h4>
                <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Address</label><textarea rows="2" value={viewingStudent.address || "—"} readOnly className={`${readOnlyClass} resize-none`} /></div>
              </div>
              {/* Education */}
              <div className="border-t border-[#21262d] pt-4">
                <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Education</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">Educational Qualification</label><input type="text" value={viewingStudent.educational_qualification || "—"} readOnly className={readOnlyClass} /></div>
                  <div><label className="block text-[#7d8590] text-xs font-medium mb-1.5">College / School Name</label><input type="text" value={viewingStudent.college_school || "—"} readOnly className={readOnlyClass} /></div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-[#161b22] px-4 sm:px-6 py-4 border-t border-[#21262d] flex justify-end">
              <button onClick={() => setViewingStudent(null)} className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] px-5 py-2 rounded-lg transition-all text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MentorDashboard;