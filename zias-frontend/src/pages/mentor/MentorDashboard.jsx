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

function MentorDashboard() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
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
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await API.get("batches/");
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCourses();
    fetchBatches();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digits }));
    } else if (name === "date_of_birth") {
      setFormData(prev => ({ ...prev, date_of_birth: value }));
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        setFormData(prev => ({ ...prev, age: age.toString() }));
      } else {
        setFormData(prev => ({ ...prev, age: "" }));
      }
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
      await API.post("students/", payload);
      showToast(`Student "${payload.username}" added successfully!`, "success");
      setShowForm(false);
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

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">👨‍🏫 My Students</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-[#238636] hover:bg-[#2ea043] px-4 py-2 rounded-lg text-sm"
            >
              {showForm ? "Cancel" : "+ Add Student"}
            </button>
            <Link to="/mentor/profile" className="bg-[#21262d] hover:bg-[#30363d] px-4 py-2 rounded-lg text-sm">
              My Profile
            </Link>
          </div>
        </div>

        {showForm && (
          <div className="bg-[#161b22] rounded-xl border border-[#21262d] p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Student</h2>
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
                  {submitting ? "Adding..." : "Add Student"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-[#21262d] hover:bg-[#30363d] px-4 py-2 rounded">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-6">
          <input type="text" placeholder="Search by name or username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-80 bg-[#161b22] border border-[#21262d] rounded-lg px-4 py-2 text-sm" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#21262d]">
          <table className="w-full text-sm">
            <thead className="bg-[#161b22] border-b border-[#21262d]">
              <tr><th className="px-4 py-3 text-left">Student</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Course</th><th className="px-4 py-3 text-left">Batch</th><th className="px-4 py-3 text-left">Phone</th><th className="px-4 py-3 text-left">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-[#21262d]">
              {filteredStudents.map(s => (
                <tr key={s.id} className="hover:bg-[#161b22]/30">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-[#7d8590]">{s.email}</td>
                  <td className="px-4 py-3">{s.course || "—"}</td>
                  <td className="px-4 py-3">{s.batch_name || s.batch || "—"}</td>
                  <td className="px-4 py-3">{s.phone || "—"}</td>
                  <td className="px-4 py-3"><Link to={`/student/review-sheet?student_id=${s.id}`} className="text-emerald-400 hover:underline">View Review</Link></td>
                </tr>
              ))}
              {filteredStudents.length === 0 && <tr><td colSpan="6" className="text-center py-8">No students found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MentorDashboard;