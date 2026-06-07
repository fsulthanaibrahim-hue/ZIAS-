import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import ProgressModal from "../../components/ProgressModal";
import API from "../../api/api";

// Cache for static data (courses, batches, mentors)
let staticDataCache = null;
let mentorIdCache = null;

function MentorStudents() {
  const { user: authUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userRole, setUserRole] = useState("");
  
  // ✅ Use a counter instead of boolean ref for forced refresh
  const fetchCounterRef = useRef(0);

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

  const getBatchName = (batchId) => batchId || "—";
  const getInitials = (name) => (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  useEffect(() => {
    setMentorName(authUser?.full_name || authUser?.username || "Mentor");
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
  }, [authUser]);

  // ✅ Fetch static data (courses, batches) with caching
  const fetchStaticData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && staticDataCache) {
      console.log("📦 Using cached static data");
      setCoursesList(staticDataCache.courses);
      setBatchesList(staticDataCache.batches);
      return staticDataCache;
    }

    console.log("🔄 Fetching static data (courses, batches)");
    
    try {
      const [coursesRes, batchesRes] = await Promise.all([
        API.get("/courses/"),
        API.get("/batches/")
      ]);

      const courses = coursesRes.data.results || coursesRes.data || [];
      const batches = batchesRes.data.results || batchesRes.data || [];

      staticDataCache = { courses, batches };
      
      setCoursesList(courses);
      setBatchesList(batches);
      
      return staticDataCache;
    } catch (err) {
      console.error("Failed to fetch static data:", err);
      return { courses: [], batches: [] };
    }
  }, []);

  // ✅ Get mentor ID using API
  const getMentorId = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && mentorIdCache) {
      console.log("📦 Using cached mentor ID:", mentorIdCache);
      return mentorIdCache;
    }

    console.log("🔍 Fetching mentor profile...");
    
    try {
      const response = await API.get('/mentors/me/');
      if (response.data && response.data.id) {
        mentorIdCache = response.data.id;
        setMentorName(response.data.full_name || mentorName);
        console.log("✅ Found mentor ID:", mentorIdCache);
        return mentorIdCache;
      }
    } catch (err) {
      console.error("Failed to fetch mentor profile:", err);
      
      // Fallback: Try to find mentor by email
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const mentorsRes = await API.get("/mentors/");
        const mentorsList = mentorsRes.data.results || mentorsRes.data || [];
        const foundMentor = mentorsList.find(m => m.email === user.email);
        
        if (foundMentor) {
          mentorIdCache = foundMentor.id;
          setMentorName(foundMentor.full_name || mentorName);
          console.log("✅ Found mentor ID by email:", mentorIdCache);
          return mentorIdCache;
        }
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
      }
    }
    
    console.warn("⚠️ Using default mentor ID: 13");
    return 13;
  }, [mentorName]);

  // ✅ Fetch students for this mentor - ALWAYS fetches fresh data
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const mentorId = await getMentorId();
      console.log("🎯 Fetching students for mentor ID:", mentorId);
      
      const response = await API.get(`/students/?mentor=${mentorId}`);
      const allStudents = response.data.results || response.data || [];
      
      console.log(`✅ Found ${allStudents.length} students`);
      setStudents(allStudents);
      
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students");
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [getMentorId]);

  // ✅ Force refresh - clears ALL caches and refetches
  const forceRefresh = useCallback(async () => {
    console.log("🔄 Force refreshing all data...");
    // Clear all caches
    staticDataCache = null;
    mentorIdCache = null;
    // Increment counter to trigger useEffect
    setRefreshTrigger(prev => prev + 1);
    // Fetch fresh data
    await fetchStudents();
    toast.success("Data refreshed successfully!");
  }, [fetchStudents]);

  // Fetch courses and batches on mount
  useEffect(() => {
    fetchStaticData();
  }, [fetchStaticData]);

  // ✅ Fetch students when refreshTrigger changes OR component mounts
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents, refreshTrigger]);

  const openViewModal = async (student) => {
    try {
      const [fullStudentRes, docsRes] = await Promise.all([
        API.get(`/students/${student.id}/`),
        API.get(`/students/${student.id}/documents/`)
      ]);
      
      setViewerDocuments(docsRes.data.results || docsRes.data || []);
      setViewingStudent(fullStudentRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load student details");
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      full_name: student.full_name ?? "", email: student.email ?? "",
      course: student.course ?? "", phone: student.phone ?? "",
      date_of_birth: student.date_of_birth || "", age: student.age?.toString() || "",
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
    setSubmitting(true);
    try {
      await API.delete(`/students/${studentToDelete.id}/`);
      toast.success(`${studentToDelete.full_name || studentToDelete.username} removed successfully!`);
      
      // ✅ Clear caches and force refresh
      staticDataCache = null;
      mentorIdCache = null;
      
      // ✅ Immediately remove from local state for instant UI update
      setStudents(prevStudents => prevStudents.filter(s => s.id !== studentToDelete.id));
      
      // ✅ Also trigger background refresh
      fetchStudents();
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete student");
    } finally {
      setSubmitting(false);
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
    const uploadPromises = files.map(async (file) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("student", studentId);
      try {
        await API.post("/upload-student-document/", fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err) {
        console.error(`Failed to upload ${file.name}`, err);
        toast.error(`Failed to upload ${file.name}`);
      }
    });
    
    await Promise.all(uploadPromises);
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
    
    // Validate phone numbers
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
    
    // Validate required fields
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!formData.course) {
      toast.error("Course is required");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const mentorId = await getMentorId();
      
      if (editingId) {
        // UPDATE existing student
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
        
        console.log("Updating student:", payload);
        await API.patch(`/students/${editingId}/`, payload);
        toast.success("Student updated successfully!");
        
        if (selectedFiles.length) {
          await uploadDocs(editingId, selectedFiles);
        }
        
      } else {
        // CREATE new student
        const username = generateUsername(formData.email, formData.full_name);
        
        const payload = {
          full_name: formData.full_name?.trim() || null,
          email: formData.email,
          course: formData.course,
          batch: "B1",
          mentor: mentorId,
          username: username,
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
        
        console.log("Creating student with payload:", payload);
        const response = await API.post("/students/", payload);
        const newStudent = response.data;
        
        toast.success(`Student added successfully! Username: ${username}`);
        
        if (selectedFiles.length && newStudent.id) {
          await uploadDocs(newStudent.id, selectedFiles);
        }
      }
      
      // ✅ Clear all caches
      staticDataCache = null;
      mentorIdCache = null;
      
      // ✅ Force refresh the student list
      await fetchStudents();
      
      // Close modal and reset form
      setShowModal(false);
      resetForm();
      
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message || "Operation failed";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.full_name || s.username)?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.course?.toLowerCase().includes(term)
    );
  });

  const inputCls = "w-full bg-white border border-green-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm transition-all";
  const readOnlyCls = "w-full bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-gray-400 cursor-not-allowed text-sm";
  const labelCls = "block text-gray-500 text-[11px] font-medium mb-1 tracking-wide uppercase";
  const sectionTitleCls = "text-[11px] font-semibold tracking-[0.15em] uppercase mb-3";

  if (loading && students.length === 0) {
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
        <button onClick={forceRefresh} className="border border-green-500 text-green-600 px-6 py-2 rounded-xl text-sm hover:bg-green-500 hover:text-white transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-green-50/40 overflow-y-auto">
      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        studentId={progressStudent?.id}
        studentName={progressStudent?.full_name || progressStudent?.username}
      />

      <div className="bg-white border-b border-green-100 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-green-400 mb-1.5 font-medium">Mentor Portal</p>
            <h1 className="text-2xl text-gray-800">My Students</h1>
            <p className="text-gray-400 text-xs mt-1">{filteredStudents.length} student(s) in your cohort</p>
          </div>

          <div className="flex gap-2">
            <button onClick={forceRefresh} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-2.5 rounded-xl">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            {(userRole === 'admin' || userRole === 'mentor') && (
              <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs px-5 py-2.5 rounded-xl">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Student
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rest of your JSX remains the same... */}
      <div className="bg-white border-b border-green-100 px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by name, course..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-green-50 border border-green-200 rounded-xl py-2 pl-10 pr-4 text-sm" />
          </div>
          <span className="text-[11px] bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-full">{filteredStudents.length} result(s)</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-green-100">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No students assigned to you yet.</p>
            <p className="text-gray-400 text-xs mt-2">Click "Add Student" to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white rounded-2xl border border-green-100 overflow-hidden hover:shadow-lg transition-all">
                <div className="h-1 bg-gradient-to-r from-green-500 to-green-300" />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold">
                      {getInitials(student.full_name || student.username)}
                    </div>
                    <div>
                      <button onClick={() => openViewModal(student)} className="font-semibold text-gray-800 hover:text-green-600 text-sm">
                        {student.full_name || student.username}
                      </button>
                      <p className="text-[11px] text-gray-500">{student.course}</p>
                    </div>
                  </div>
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
                    
                    {(userRole === 'admin' || userRole === 'mentor') && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL - Keep your existing modal JSX */}
      {showModal && (userRole === 'admin' || userRole === 'mentor') && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-green-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal content - same as before */}
            <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-green-100 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{editingId ? "Edit Student" : "Add New Student"}</h3>
                  <p className="text-[11px] text-gray-400 font-light">{editingId ? "Update student information" : "Add a student to your batch"}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Form fields - same as before */}
              <div>
                <p className={`${sectionTitleCls} text-green-600`}>Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Full Name *</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className={inputCls} /></div>
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
                    <input type="text" readOnly value="B1" className={readOnlyCls} />
                    <p className="text-[11px] text-gray-400 mt-1">Auto-assigned to your batch</p>
                  </div>
                  <div>
                    <label className={labelCls}>Mentor</label>
                    <input type="text" readOnly value={mentorName} className={readOnlyCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} />
                    {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                  </div>
                  <div><label className={labelCls}>Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputCls} /></div>
                  <div><label className={labelCls}>Age</label><input type="text" name="age" value={formData.age} readOnly className={readOnlyCls} /></div>
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
                <p className={`${sectionTitleCls} text-gray-400`}>Education</p>
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
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setSelectedFiles(Array.from(e.target.files))} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-green-200 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-600 hover:file:text-white file:transition-colors file:cursor-pointer" />
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
              <button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 shadow-sm hover:shadow-md">
                {submitting ? (editingId ? "Saving…" : "Adding…") : (editingId ? "Save Changes" : "Add Student")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW DETAILS MODAL - Keep your existing modal JSX */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingStudent(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-green-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* View modal content - same as before */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-green-100 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {getInitials(viewingStudent.full_name || viewingStudent.username)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{viewingStudent.full_name || viewingStudent.username}</h3>
                  <p className="text-[11px] text-gray-400">{viewingStudent.course}</p>
                </div>
              </div>
              <button onClick={() => setViewingStudent(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            {/* Rest of view modal content */}
            <div className="p-6 space-y-6">
              {/* Basic info */}
              <div>
                <p className={`${sectionTitleCls} text-green-600`}>Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ["Full Name", viewingStudent.full_name],
                    ["Email", viewingStudent.email],
                    ["Course", viewingStudent.course],
                    ["Batch", getBatchName(viewingStudent.batch)],
                    ["Mentor", mentorName],
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
              {/* Add other sections similarly */}
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-green-100 rounded-b-2xl flex justify-end">
              <button onClick={() => setViewingStudent(null)} className="border border-green-200 text-gray-500 px-6 py-2 rounded-xl text-sm hover:border-green-400 hover:text-green-600 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL - Keep your existing modal JSX */}
      {showDeleteConfirm && studentToDelete && (userRole === 'admin' || userRole === 'mentor') && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-red-100 shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-400 to-red-300" />
            <div className="p-6">
              <p className="text-[10px] tracking-[0.2em] uppercase text-red-400 mb-2 font-medium">Confirm Removal</p>
              <h3 className="text-lg text-gray-800 mb-3">Remove Student?</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                You are about to remove <span className="text-gray-800 font-semibold">{studentToDelete.full_name || studentToDelete.username}</span>. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:border-gray-300 transition-colors">Cancel</button>
                <button onClick={confirmDelete} disabled={submitting} className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm transition-colors disabled:opacity-50">
                  {submitting ? "Deleting..." : "Delete"}
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