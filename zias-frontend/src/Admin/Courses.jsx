import { useEffect, useState } from "react";
import API from "../api/api";

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

  const [showContentModal, setShowContentModal] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedCourseForContent, setSelectedCourseForContent] = useState(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleOrder, setNewModuleOrder] = useState(0);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [editingModuleOrder, setEditingModuleOrder] = useState(0);
  const [editingModuleContent, setEditingModuleContent] = useState("");

  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayContent, setNewDayContent] = useState("");
  const [newDayOrder, setNewDayOrder] = useState(0);
  const [selectedModuleForDay, setSelectedModuleForDay] = useState(null);
  const [editingDayId, setEditingDayId] = useState(null);
  const [editingDayTitle, setEditingDayTitle] = useState("");
  const [editingDayContent, setEditingDayContent] = useState("");
  const [editingDayOrder, setEditingDayOrder] = useState(0);

  const fetchCourses = () => API.get("courses/").then(res => setCourses(res.data));
  const fetchStudents = () => API.get("students/").then(res => setStudents(res.data));
  const fetchModules = (courseId) => API.get(`modules/?course=${courseId}`).then(res => setModules(res.data));

  useEffect(() => { fetchCourses(); fetchStudents(); }, []);

  const handleDelete = (id) => {
    if (window.confirm("Delete this course?")) {
      API.delete(`courses/${id}/`).then(() => fetchCourses());
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.patch(`courses/${editingId}/`, formData);
      } else {
        await API.post("courses/", formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", description: "", duration: "" });
      fetchCourses();
    } catch (err) { alert("Error saving course"); }
  };
  const handleEdit = (course) => {
    setEditingId(course.id);
    setFormData({ name: course.name, description: course.description || "", duration: course.duration || "" });
    setShowForm(true);
  };

  const openEnrollModal = async (course) => {
    setCurrentCourse(course);
    setEnrollSearchTerm("");
    const enrollmentsRes = await API.get(`enrollments/?course=${course.id}`);
    const enrolled = enrollmentsRes.data.map(e => e.student);
    setEnrolledStudentIds(enrolled);
    const available = students.filter(s => !enrolled.includes(s.id)).sort((a, b) => a.username.localeCompare(b.username));
    setAvailableStudents(available);
    setShowEnrollModal(true);
  };
  const enrollStudent = async (studentId) => {
    try {
      await API.post("enrollments/", { student: studentId, course: currentCourse.id });
      await openEnrollModal(currentCourse); fetchCourses();
    } catch (err) { alert("Enrollment failed"); }
  };
  const unenrollStudent = async (studentId) => {
    const enrollments = await API.get(`enrollments/?student=${studentId}&course=${currentCourse.id}`);
    const enrollmentId = enrollments.data[0]?.id;
    if (enrollmentId) { await API.delete(`enrollments/${enrollmentId}/`); await openEnrollModal(currentCourse); fetchCourses(); }
  };
  const getFilteredEnrolled = () => students.filter(s => enrolledStudentIds.includes(s.id)).filter(s => s.username.toLowerCase().includes(enrollSearchTerm.toLowerCase())).sort((a, b) => a.username.localeCompare(b.username));
  const getFilteredAvailable = () => availableStudents.filter(s => s.username.toLowerCase().includes(enrollSearchTerm.toLowerCase()));

  const openContentModal = async (course) => {
    setSelectedCourseForContent(course);
    await fetchModules(course.id);
    setShowContentModal(true);
  };
  const addModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await API.post("modules/", { course: selectedCourseForContent.id, title: newModuleTitle, content: "", order: newModuleOrder });
      setNewModuleTitle(""); setNewModuleOrder(0);
      await fetchModules(selectedCourseForContent.id);
    } catch (err) { alert("Error adding module"); }
  };
  const startEditModule = (mod) => { setEditingModuleId(mod.id); setEditingModuleTitle(mod.title); setEditingModuleOrder(mod.order); setEditingModuleContent(mod.content); };
  const saveEditModule = async () => {
    try {
      await API.patch(`modules/${editingModuleId}/`, { title: editingModuleTitle, content: editingModuleContent, order: editingModuleOrder });
      setEditingModuleId(null);
      await fetchModules(selectedCourseForContent.id);
    } catch (err) { alert("Error updating module"); }
  };
  const cancelEditModule = () => setEditingModuleId(null);
  const deleteModule = async (modId) => {
    if (window.confirm("Delete this module and all its days?")) {
      await API.delete(`modules/${modId}/`);
      await fetchModules(selectedCourseForContent.id);
    }
  };
  const addDay = async (moduleId) => {
    if (!newDayTitle.trim()) return;
    try {
      await API.post("days/", { module: moduleId, title: newDayTitle, content: newDayContent, order: newDayOrder });
      setNewDayTitle(""); setNewDayContent(""); setNewDayOrder(0); setSelectedModuleForDay(null);
      await fetchModules(selectedCourseForContent.id);
    } catch (err) { alert("Error adding day"); }
  };
  const startEditDay = (day) => { setEditingDayId(day.id); setEditingDayTitle(day.title); setEditingDayContent(day.content); setEditingDayOrder(day.order); };
  const saveEditDay = async () => {
    try {
      await API.patch(`days/${editingDayId}/`, { title: editingDayTitle, content: editingDayContent, order: editingDayOrder });
      setEditingDayId(null);
      await fetchModules(selectedCourseForContent.id);
    } catch (err) { alert("Error updating day"); }
  };
  const cancelEditDay = () => setEditingDayId(null);
  const deleteDay = async (dayId) => {
    if (window.confirm("Delete this day?")) {
      await API.delete(`days/${dayId}/`);
      await fetchModules(selectedCourseForContent.id);
    }
  };

  const inputClass = "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd]/30 transition-all duration-200 text-sm";
  const smallInputClass = "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-all text-sm";

  return (
    <div className="min-h-screen w-screen bg-[#0d1117] text-[#e6edf3]"
      style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        .table-row-hover:hover { background: rgba(56,139,253,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
        .scrollbar::-webkit-scrollbar { width: 4px; } .scrollbar::-webkit-scrollbar-track { background: transparent; } .scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ── Top Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Courses</h1>
              <p className="text-[#7d8590] text-xs mt-0.5">{courses.length} total courses</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingId(null); setFormData({ name: "", description: "", duration: "" }); setShowForm(true); }}
            className="shine flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-[#238636]/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Course
          </button>
        </div>

        {/* ── Course Form Modal ── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => setShowForm(false)}>
            <form onSubmit={handleSubmit} className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-md border border-[#30363d] shadow-2xl shadow-black/60" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#21262d]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#e6edf3]">{editingId ? "Edit Course" : "New Course"}</h3>
                    <p className="text-[#7d8590] text-xs">{editingId ? "Update course details" : "Create a new course"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-[#484f58] hover:text-[#7d8590] transition p-1.5 rounded-lg hover:bg-[#21262d]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Course Name</label>
                  <input type="text" placeholder="e.g. Full Stack Development" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Duration</label>
                  <input type="text" placeholder="e.g. 6 months" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[#7d8590] text-xs font-medium mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea placeholder="Course description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3" className={`${inputClass} resize-none`} />
                </div>
              </div>
              <div className="flex gap-2 px-6 py-4 border-t border-[#21262d]">
                <button type="submit" className="flex-1 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white py-2 rounded-lg transition-all text-sm font-medium">
                  {editingId ? "Save Changes" : "Add Course"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] py-2 rounded-lg transition-all text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Courses Table ── */}
        <div className="rounded-xl border border-[#21262d] overflow-hidden shadow-xl shadow-black/20">
          <table className="w-full">
            <thead>
              <tr className="bg-[#161b22] border-b border-[#21262d]">
                {["Course", "Duration", "Students", ""].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-[#7d8590] text-xs font-semibold uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[#0d1117] divide-y divide-[#21262d]">
              {courses.length > 0 ? courses.map(c => (
                <tr key={c.id} className="table-row-hover transition-colors duration-150 group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#e6edf3] text-sm font-medium">{c.name}</p>
                        {c.description && <p className="text-[#484f58] text-xs mt-0.5 truncate max-w-xs">{c.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {c.duration
                      ? <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-medium px-2.5 py-1 rounded-full">{c.duration}</span>
                      : <span className="text-[#484f58]">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[#7d8590] text-sm">{c.student_count ?? 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button onClick={() => handleEdit(c)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 border border-transparent hover:border-[#388bfd]/20 transition-all text-xs font-medium" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button onClick={() => openContentModal(c)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-violet-400 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all text-xs font-medium" title="Content">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        Content
                      </button>
                      <button onClick={() => openEnrollModal(c)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all text-xs font-medium" title="Enroll">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        Enroll
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-xs font-medium" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <p className="text-[#7d8590] text-sm font-medium">No courses yet</p>
                    <p className="text-[#484f58] text-xs">Click 'Add Course' to get started</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
          {courses.length > 0 && (
            <div className="bg-[#161b22] border-t border-[#21262d] px-4 py-2.5">
              <p className="text-[#484f58] text-xs"><span className="text-[#7d8590] font-medium">{courses.length}</span> course{courses.length !== 1 ? "s" : ""} total</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Enrollment Modal ── */}
      {showEnrollModal && currentCourse && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => setShowEnrollModal(false)}>
          <div className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-3xl border border-[#30363d] shadow-2xl shadow-black/60" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#21262d]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#e6edf3]">Manage Enrollments</h3>
                  <p className="text-[#7d8590] text-xs">{currentCourse.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="text-[#484f58] hover:text-[#7d8590] transition p-1.5 rounded-lg hover:bg-[#21262d]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="relative mb-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
                <input type="text" placeholder="Search students..." value={enrollSearchTerm} onChange={(e) => setEnrollSearchTerm(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-all text-sm" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[#7d8590] text-xs font-semibold uppercase tracking-wider mb-2">Enrolled <span className="text-emerald-400 ml-1">{enrolledStudentIds.length}</span></p>
                  <ul className="space-y-1.5 max-h-60 overflow-y-auto scrollbar">
                    {getFilteredEnrolled().map(s => (
                      <li key={s.id} className="flex justify-between items-center bg-[#0d1117] border border-[#21262d] px-3 py-2 rounded-lg">
                        <span className="text-[#c9d1d9] text-sm">{s.username}</span>
                        <button onClick={() => unenrollStudent(s.id)} className="text-red-400 hover:text-red-300 text-xs font-medium transition">Remove</button>
                      </li>
                    ))}
                    {getFilteredEnrolled().length === 0 && <p className="text-[#484f58] text-sm py-2">No matching students enrolled.</p>}
                  </ul>
                </div>
                <div>
                  <p className="text-[#7d8590] text-xs font-semibold uppercase tracking-wider mb-2">Available</p>
                  <ul className="space-y-1.5 max-h-60 overflow-y-auto scrollbar">
                    {getFilteredAvailable().map(s => (
                      <li key={s.id} className="flex justify-between items-center bg-[#0d1117] border border-[#21262d] px-3 py-2 rounded-lg">
                        <span className="text-[#c9d1d9] text-sm">{s.username}</span>
                        <button onClick={() => enrollStudent(s.id)} className="text-[#388bfd] hover:text-blue-300 text-xs font-medium transition">Enroll</button>
                      </li>
                    ))}
                    {getFilteredAvailable().length === 0 && <p className="text-[#484f58] text-sm py-2">No matching students available.</p>}
                  </ul>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#21262d]">
              <button onClick={() => setShowEnrollModal(false)} className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] px-4 py-2 rounded-lg text-sm font-medium transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content / Modules Modal ── */}
      {showContentModal && selectedCourseForContent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md" onClick={() => setShowContentModal(false)}>
          <div className="modal-enter bg-[#161b22] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#30363d] shadow-2xl shadow-black/60" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#21262d] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#e6edf3]">Course Content</h3>
                  <p className="text-[#7d8590] text-xs">{selectedCourseForContent.name}</p>
                </div>
              </div>
              <button onClick={() => setShowContentModal(false)} className="text-[#484f58] hover:text-[#7d8590] transition p-1.5 rounded-lg hover:bg-[#21262d]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto scrollbar px-6 py-5 space-y-5">
              {/* Add Week */}
              <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4">
                <p className="text-[#7d8590] text-xs font-semibold uppercase tracking-wider mb-3">Add New Week</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input type="text" placeholder="Week title (e.g., Week 1)" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} className={smallInputClass} />
                  <input type="number" placeholder="Order (0, 1, 2...)" value={newModuleOrder} onChange={e => setNewModuleOrder(parseInt(e.target.value) || 0)} className={smallInputClass} />
                </div>
                <button onClick={addModule} className="bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all">
                  + Add Week
                </button>
              </div>

              {/* Modules */}
              {modules.length === 0 ? (
                <p className="text-[#484f58] text-sm text-center py-6">No weeks yet. Add a week above.</p>
              ) : modules.map(mod => (
                <div key={mod.id} className="bg-[#0d1117] border border-[#21262d] rounded-xl overflow-hidden">
                  {editingModuleId === mod.id ? (
                    <div className="p-4 space-y-3">
                      <input type="text" value={editingModuleTitle} onChange={e => setEditingModuleTitle(e.target.value)} className={smallInputClass} placeholder="Week title" />
                      <input type="number" value={editingModuleOrder} onChange={e => setEditingModuleOrder(parseInt(e.target.value) || 0)} className={smallInputClass} placeholder="Order" />
                      <textarea placeholder="Week overview (HTML allowed)" value={editingModuleContent} onChange={e => setEditingModuleContent(e.target.value)} rows="3" className={`${smallInputClass} resize-none font-mono`} />
                      <div className="flex gap-2">
                        <button onClick={saveEditModule} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">Save</button>
                        <button onClick={cancelEditModule} className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] px-3 py-1.5 rounded-lg text-sm font-medium transition">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Module header */}
                      <div className="flex justify-between items-center px-4 py-3 border-b border-[#21262d]">
                        <div className="flex items-center gap-3">
                          <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-semibold px-2 py-0.5 rounded-md">Week {mod.order + 1}</span>
                          <span className="text-[#e6edf3] text-sm font-medium">{mod.title}</span>
                          {mod.days && <span className="text-[#484f58] text-xs">{mod.days.length} day{mod.days.length !== 1 ? "s" : ""}</span>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEditModule(mod)} className="px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 transition text-xs font-medium">Edit</button>
                          <button onClick={() => deleteModule(mod.id)} className="px-2.5 py-1.5 rounded-lg text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 transition text-xs font-medium">Delete</button>
                        </div>
                      </div>

                      {/* Days */}
                      <div className="p-4">
                        {mod.days && mod.days.length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {mod.days.map(day => (
                              <div key={day.id} className="bg-[#161b22] border border-[#21262d] rounded-lg">
                                {editingDayId === day.id ? (
                                  <div className="p-3 space-y-2">
                                    <input type="text" value={editingDayTitle} onChange={e => setEditingDayTitle(e.target.value)} className={smallInputClass} placeholder="Day title" />
                                    <input type="number" value={editingDayOrder} onChange={e => setEditingDayOrder(parseInt(e.target.value) || 0)} className={smallInputClass} placeholder="Order" />
                                    <textarea value={editingDayContent} onChange={e => setEditingDayContent(e.target.value)} rows="2" className={`${smallInputClass} resize-none`} placeholder="Day content" />
                                    <div className="flex gap-2">
                                      <button onClick={saveEditDay} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition">Save</button>
                                      <button onClick={cancelEditDay} className="bg-[#21262d] border border-[#30363d] text-[#7d8590] px-3 py-1 rounded-lg text-xs font-medium transition">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-center px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[#484f58] text-xs font-mono">Day {day.order + 1}</span>
                                      <span className="text-[#c9d1d9] text-sm">{day.title}</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <button onClick={() => startEditDay(day)} className="px-2 py-1 rounded text-[#7d8590] hover:text-[#388bfd] hover:bg-[#388bfd]/10 transition text-xs">Edit</button>
                                      <button onClick={() => deleteDay(day.id)} className="px-2 py-1 rounded text-[#7d8590] hover:text-red-400 hover:bg-red-500/10 transition text-xs">Delete</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#484f58] text-xs mb-3">No days yet.</p>
                        )}

                        {/* Add Day */}
                        {selectedModuleForDay === mod.id ? (
                          <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder="Day title" value={newDayTitle} onChange={e => setNewDayTitle(e.target.value)} className={smallInputClass} />
                              <input type="number" placeholder="Order" value={newDayOrder} onChange={e => setNewDayOrder(parseInt(e.target.value) || 0)} className={smallInputClass} />
                            </div>
                            <textarea placeholder="Day content (HTML or plain text)" value={newDayContent} onChange={e => setNewDayContent(e.target.value)} rows="2" className={`${smallInputClass} resize-none`} />
                            <div className="flex gap-2">
                              <button onClick={() => addDay(mod.id)} className="bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]/40 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">Add Day</button>
                              <button onClick={() => setSelectedModuleForDay(null)} className="bg-[#21262d] border border-[#30363d] text-[#7d8590] px-3 py-1.5 rounded-lg text-xs font-medium transition">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setSelectedModuleForDay(mod.id); setNewDayTitle(""); setNewDayContent(""); setNewDayOrder(0); }} className="flex items-center gap-1.5 text-[#388bfd] hover:text-blue-300 text-xs font-medium transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Day
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;