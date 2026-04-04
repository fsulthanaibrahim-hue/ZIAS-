import { useEffect, useState } from "react";
import API from "../api/api";

// Toast Component
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

function Courses() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", duration: "" });
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState([]);
  const [enrollSearchTerm, setEnrollSearchTerm] = useState("");

  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  const fetchCourses = () => {
    API.get("courses/")
      .then(res => setCourses(res.data))
      .catch(() => showToast("Failed to load courses", "error"));
  };
  const fetchStudents = () => {
    API.get("students/")
      .then(res => setStudents(res.data))
      .catch(() => showToast("Failed to load students", "error"));
  };

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  // Course CRUD
  const handleDelete = (id) => {
    if (window.confirm("Delete this course?")) {
      API.delete(`courses/${id}/`)
        .then(() => {
          fetchCourses();
          showToast("Course deleted successfully", "success");
        })
        .catch(() => showToast("Failed to delete course", "error"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.patch(`courses/${editingId}/`, formData);
        showToast("Course updated successfully", "success");
      } else {
        await API.post("courses/", formData);
        showToast("Course added successfully", "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", description: "", duration: "" });
      fetchCourses();
    } catch (err) {
      let errorMsg = "Error saving course";
      if (err.response?.data) {
        errorMsg = Object.values(err.response.data).flat().join(", ");
      }
      showToast(errorMsg, "error");
    }
  };

  const handleEdit = (course) => {
    setEditingId(course.id);
    setFormData({ name: course.name, description: course.description || "", duration: course.duration || "" });
    setShowForm(true);
  };

  // Enrollment functions
  const openEnrollModal = async (course) => {
    setCurrentCourse(course);
    setEnrollSearchTerm("");
    try {
      const enrollmentsRes = await API.get(`enrollments/?course=${course.id}`);
      const enrolled = enrollmentsRes.data.map(e => e.student);
      setEnrolledStudentIds(enrolled);
      const available = students
        .filter(s => !enrolled.includes(s.id))
        .sort((a, b) => a.username.localeCompare(b.username));
      setAvailableStudents(available);
      setShowEnrollModal(true);
    } catch (err) {
      showToast("Failed to load enrollments", "error");
    }
  };

  const enrollStudent = async (studentId) => {
    try {
      await API.post("enrollments/", { student: studentId, course: currentCourse.id });
      showToast("Student enrolled successfully", "success");
      await openEnrollModal(currentCourse);
      fetchCourses();
    } catch (err) {
      showToast("Enrollment failed", "error");
    }
  };

  const unenrollStudent = async (studentId) => {
    try {
      const enrollments = await API.get(`enrollments/?student=${studentId}&course=${currentCourse.id}`);
      const enrollmentId = enrollments.data[0]?.id;
      if (enrollmentId) {
        await API.delete(`enrollments/${enrollmentId}/`);
        showToast("Student unenrolled successfully", "success");
        await openEnrollModal(currentCourse);
        fetchCourses();
      }
    } catch (err) {
      showToast("Failed to unenroll student", "error");
    }
  };

  const getFilteredEnrolled = () => {
    return students
      .filter(s => enrolledStudentIds.includes(s.id))
      .filter(s => s.username.toLowerCase().includes(enrollSearchTerm.toLowerCase()))
      .sort((a, b) => a.username.localeCompare(b.username));
  };
  const getFilteredAvailable = () => {
    return availableStudents.filter(s =>
      s.username.toLowerCase().includes(enrollSearchTerm.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen w-screen bg-[#0f1623] text-white p-8">
      <style>{`
        @keyframes slide-in-from-top-2 {
          from { opacity:0; transform:translateY(-1rem); }
          to { opacity:1; transform:translateY(0); }
        }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-white/50 text-sm">Manage all courses and enrollments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: "", description: "", duration: "" });
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Add Course
          </button>
        </div>
      </div>

      {/* Course Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowForm(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-[#1a2538] rounded-xl p-6 w-full max-w-md border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingId ? "Edit Course" : "New Course"}
            </h3>
            <input
              type="text"
              name="name"
              placeholder="Course Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-3"
            />
            <input
              type="text"
              name="duration"
              placeholder="Duration (e.g., 6 months)"
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: e.target.value })}
              className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-3"
            />
            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-4"
            />
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-[#1a2538] rounded-xl border border-white/10">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-4 text-white/60 text-left">Name</th>
              <th className="p-4 text-white/60 text-left">Duration</th>
              <th className="p-4 text-white/60 text-left">Students</th>
              <th className="p-4 text-white/60 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="p-4 text-white">{c.name}</td>
                <td className="p-4 text-white/80">{c.duration || '-'}</td>
                <td className="p-4 text-white/80">{c.student_count}</td>
                <td className="p-4">
                  <button onClick={() => handleEdit(c)} className="text-blue-400 hover:text-blue-300 mr-3 transition" title="Edit">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => openEnrollModal(c)} className="text-green-400 hover:text-green-300 mr-3 transition" title="Enroll">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 transition" title="Delete">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal && currentCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEnrollModal(false)}>
          <div className="bg-[#1a2538] rounded-xl p-6 w-full max-w-3xl border border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Manage Enrollments – {currentCourse.name}</h3>
            <div className="mb-4">
              <input type="text" placeholder="Search by student name..." value={enrollSearchTerm} onChange={(e) => setEnrollSearchTerm(e.target.value)} className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-white/70 mb-2">Enrolled Students ({enrolledStudentIds.length})</h4>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {getFilteredEnrolled().map(s => (
                    <li key={s.id} className="flex justify-between items-center bg-[#0f1623] p-2 rounded">
                      <span className="text-white">{s.username}</span>
                      <button onClick={() => unenrollStudent(s.id)} className="text-red-400 text-sm">Remove</button>
                    </li>
                  ))}
                  {getFilteredEnrolled().length === 0 && <p className="text-white/40">No matching students enrolled.</p>}
                </ul>
              </div>
              <div>
                <h4 className="text-white/70 mb-2">Available Students</h4>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {getFilteredAvailable().map(s => (
                    <li key={s.id} className="flex justify-between items-center bg-[#0f1623] p-2 rounded">
                      <span className="text-white">{s.username}</span>
                      <button onClick={() => enrollStudent(s.id)} className="text-blue-400 text-sm">Enroll</button>
                    </li>
                  ))}
                  {getFilteredAvailable().length === 0 && <p className="text-white/40">No matching students available.</p>}
                </ul>
              </div>
            </div>
            <button onClick={() => setShowEnrollModal(false)} className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;