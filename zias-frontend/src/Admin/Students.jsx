// src/Admin/Students.jsx
import { useEffect, useState } from "react";
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
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">×</button>
    </div>
  );
}

function Students() {
  const [students, setStudents] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    // Basic
    username: "",
    full_name: "",
    email: "",
    course: "",
    batch: "",
    phone: "",
    date_of_birth: "",
    age: "",
    gender: "",
    // Parents & Guardian
    fathers_name: "",
    fathers_contact: "",
    mothers_name: "",
    mothers_contact: "",
    guardian_name: "",
    guardian_relation: "",
    // Address
    address: "",
    village: "",
    taluk: "",
    // Education
    educational_qualification: "",
    college_school: "",
    // Government ID
    govt_id_type: "",
    govt_id_number: "",
    govt_id_address: "",
  });

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  const fetchStudents = () => {
    API.get("students/")
      .then((res) => setStudents(res.data))
      .catch((err) => {
        console.error(err);
        showToast("Failed to load students", "error");
      });
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

  useEffect(() => {
    fetchStudents();
    fetchCourses();
    fetchBatches();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      API.delete(`students/${id}/`)
        .then(() => {
          fetchStudents();
          showToast("Student deleted successfully", "success");
        })
        .catch((err) => {
          console.error(err);
          showToast("Failed to delete student", "error");
        });
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
    const payload = {
      // Basic
      username: formData.username,
      full_name: formData.full_name || null,
      email: formData.email,
      course: formData.course,
      batch: formData.batch,
      phone: formData.phone,
      date_of_birth: formData.date_of_birth || null,
      age: formData.age || null,
      gender: formData.gender || null,
      // Parents & Guardian
      fathers_name: formData.fathers_name || null,
      fathers_contact: formData.fathers_contact || null,
      mothers_name: formData.mothers_name || null,
      mothers_contact: formData.mothers_contact || null,
      guardian_name: formData.guardian_name || null,
      guardian_relation: formData.guardian_relation || null,
      // Address
      address: formData.address || null,
      village: formData.village || null,
      taluk: formData.taluk || null,
      // Education
      educational_qualification: formData.educational_qualification || null,
      college_school: formData.college_school || null,
      // Government ID
      govt_id_type: formData.govt_id_type || null,
      govt_id_number: formData.govt_id_number || null,
      govt_id_address: formData.govt_id_address || null,
    };
    try {
      if (editingId) {
        await API.patch(`students/${editingId}/`, payload);
        showToast("Student updated successfully", "success");
      } else {
        await API.post("students/", payload);
        showToast("Student added successfully", "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        username: "", full_name: "", email: "", course: "", batch: "", phone: "", date_of_birth: "", age: "", gender: "",
        fathers_name: "", fathers_contact: "", mothers_name: "", mothers_contact: "", guardian_name: "", guardian_relation: "",
        address: "", village: "", taluk: "", educational_qualification: "", college_school: "",
        govt_id_type: "", govt_id_number: "", govt_id_address: "",
      });
      fetchStudents();
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
      phone: student.phone,
      date_of_birth: student.date_of_birth || "",
      age: student.age || "",
      gender: student.gender || "",
      fathers_name: student.fathers_name || "",
      fathers_contact: student.fathers_contact || "",
      mothers_name: student.mothers_name || "",
      mothers_contact: student.mothers_contact || "",
      guardian_name: student.guardian_name || "",
      guardian_relation: student.guardian_relation || "",
      address: student.address || "",
      village: student.village || "",
      taluk: student.taluk || "",
      educational_qualification: student.educational_qualification || "",
      college_school: student.college_school || "",
      govt_id_type: student.govt_id_type || "",
      govt_id_number: student.govt_id_number || "",
      govt_id_address: student.govt_id_address || "",
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredStudents = students.filter((s) =>
    s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.batch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = `
    w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-[#e6edf3]
    placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/30
    transition-all duration-200 text-sm font-mono
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
        @keyframes slide-in-from-top-2 {
          from { opacity:0; transform:translateY(-1rem); }
          to { opacity:1; transform:translateY(0); }
        }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/20 transition-all text-sm w-full sm:w-64"
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
                  username: "", full_name: "", email: "", course: "", batch: "", phone: "", date_of_birth: "", age: "", gender: "",
                  fathers_name: "", fathers_contact: "", mothers_name: "", mothers_contact: "", guardian_name: "", guardian_relation: "",
                  address: "", village: "", taluk: "", educational_qualification: "", college_school: "",
                  govt_id_type: "", govt_id_number: "", govt_id_address: "",
                });
                setShowForm(true);
              }}
              className="shine flex items-center justify-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-[#238636]/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Student
            </button>
          </div>
        </div>

        {/* Modal – with all sections */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md p-4"
            onClick={() => setShowForm(false)}
          >
            <form
              onSubmit={handleSubmit}
              className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-4xl border border-[#30363d] shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header */}
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
                {/* SECTION 1: Basic Information */}
                <div>
                  <h4 className="text-xs font-semibold text-[#388bfd] uppercase tracking-wider mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Username *</label>
                      <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Full Name</label>
                      <input type="text" name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Email *</label>
                      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Course *</label>
                      <select name="course" value={formData.course} onChange={handleChange} required className={inputClass}>
                        <option value="">Select a course</option>
                        {coursesList.map((course) => (
                          <option key={course.id} value={course.name}>{course.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Batch *</label>
                      <select name="batch" value={formData.batch} onChange={handleChange} required className={inputClass}>
                        <option value="">Select a batch</option>
                        {batchesList.map((batch) => (
                          <option key={batch.id} value={batch.name}>{batch.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Phone</label>
                      <input type="text" name="phone" placeholder="Mobile number" value={formData.phone} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Date of Birth</label>
                      <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputClass} style={{ colorScheme: "dark" }} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Age</label>
                      <input type="text" name="age" placeholder="Auto-calculated" value={formData.age} readOnly className={`${inputClass} cursor-not-allowed opacity-80`} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Parents & Guardian */}
                <div className="border-t border-[#21262d] pt-4">
                  <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Parents & Guardian</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Father's Name</label>
                      <input type="text" name="fathers_name" placeholder="Father's Name" value={formData.fathers_name} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Father's Contact</label>
                      <input type="text" name="fathers_contact" placeholder="Father's Contact" value={formData.fathers_contact} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mother's Name</label>
                      <input type="text" name="mothers_name" placeholder="Mother's Name" value={formData.mothers_name} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Mother's Contact</label>
                      <input type="text" name="mothers_contact" placeholder="Mother's Contact" value={formData.mothers_contact} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Guardian Name</label>
                      <input type="text" name="guardian_name" placeholder="Guardian Name (if different)" value={formData.guardian_name} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Relationship with Guardian</label>
                      <input type="text" name="guardian_relation" placeholder="e.g. Father, Mother, Uncle" value={formData.guardian_relation} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Address */}
                <div className="border-t border-[#21262d] pt-4">
                  <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Address</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Address</label>
                      <textarea name="address" rows="2" placeholder="Full address" value={formData.address} onChange={handleChange} className={`${inputClass} resize-none`} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Village / City</label>
                        <input type="text" name="village" placeholder="Village / City" value={formData.village} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Taluk / District</label>
                        <input type="text" name="taluk" placeholder="Taluk / District" value={formData.taluk} onChange={handleChange} className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Education */}
                <div className="border-t border-[#21262d] pt-4">
                  <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Education</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Educational Qualification</label>
                      <input type="text" name="educational_qualification" placeholder="e.g. Plus Two, Degree" value={formData.educational_qualification} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">College / School Name</label>
                      <input type="text" name="college_school" placeholder="College / School Name" value={formData.college_school} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                </div>

                {/* SECTION 5: Government ID */}
                <div className="border-t border-[#21262d] pt-4">
                  <h4 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-3">Government ID Card</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">ID Type</label>
                      <select name="govt_id_type" value={formData.govt_id_type} onChange={handleChange} className={inputClass}>
                        <option value="">Select ID Type</option>
                        <option value="Aadhaar">Aadhaar</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Passport">Passport</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="PAN Card">PAN Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">ID Number</label>
                      <input type="text" name="govt_id_number" placeholder="ID Number" value={formData.govt_id_number} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[#7d8590] text-xs font-medium mb-1.5">Address on ID Card</label>
                      <textarea name="govt_id_address" rows="2" placeholder="Address as per ID card (if any)" value={formData.govt_id_address} onChange={handleChange} className={`${inputClass} resize-none`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer – Only Submit button */}
              <div className="sticky bottom-0 bg-[#161b22] px-4 sm:px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="w-full bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white py-2.5 rounded-lg transition-all text-sm font-medium shadow-md shadow-[#238636]/20">
                  {editingId ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Responsive Table (unchanged) */}
        <div className="overflow-x-auto rounded-xl border border-[#21262d] shadow-xl shadow-black/20">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#161b22] border-b border-[#21262d]">
                {["Student", "Email", "Course", "Batch", "Phone", "Date of Birth", ""].map((h, i) => (
                  <th key={i} className="text-left px-3 sm:px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="table-row-hover group">
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${getColor(s.username)} flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0`}>{getInitial(s.username)}</div>
                        <span className="text-[#e6edf3] text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-none">{s.username}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-[#7d8590] text-xs sm:text-sm font-mono truncate max-w-[120px] sm:max-w-none">{s.email}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5"><span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full">{s.course}</span></td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5"><span className="inline-flex items-center bg-[#21262d] text-[#7d8590] border border-[#30363d] text-[10px] sm:text-xs font-mono px-2 py-0.5 sm:py-1 rounded-full">{s.batch}</span></td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-[#7d8590] text-xs sm:text-sm font-mono">{s.phone}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-[#7d8590] text-xs sm:text-sm font-mono">{s.date_of_birth || "—"}</td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3.5">
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                        <button onClick={() => handleEdit(s)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 text-xs"><svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg><span className="hidden sm:inline">Edit</span></button>
                        <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 text-xs"><svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg><span className="hidden sm:inline">Delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="text-center py-16 sm:py-20 text-[#7d8590]">No students found. Click 'Add Student' to create one.</td></tr>
              )}
            </tbody>
          </table>
          {filteredStudents.length > 0 && (
            <div className="bg-[#161b22] border-t border-[#21262d] px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-[#484f58] text-xs">Showing {filteredStudents.length} of {students.length} students</p>
              {searchTerm && <button onClick={() => setSearchTerm("")} className="text-[#388bfd] hover:text-blue-300 text-xs">Clear filter</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Students;