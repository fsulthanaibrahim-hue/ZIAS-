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

  // Module modal state
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [modules, setModules] = useState([]);
  const [moduleForm, setModuleForm] = useState({ title: "", content: "", order: 0 });
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [viewingModule, setViewingModule] = useState(null);
  const [expandedModuleId, setExpandedModuleId] = useState(null);

  // Day management state
  const [selectedModule, setSelectedModule] = useState(null);
  const [showDayForm, setShowDayForm] = useState(false);
  const [dayForm, setDayForm] = useState({ title: "", content: "", order: 0 });
  const [editingDayId, setEditingDayId] = useState(null);
  const [viewingDay, setViewingDay] = useState(null);

  const fetchCourses = () => API.get("courses/").then(res => setCourses(res.data));
  const fetchStudents = () => API.get("students/").then(res => setStudents(res.data));
  const fetchModules = (courseId) => API.get(`modules/?course=${courseId}`).then(res => setModules(res.data));

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  // Course CRUD
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
    } catch (err) {
      alert("Error saving course");
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
    const enrollmentsRes = await API.get(`enrollments/?course=${course.id}`);
    const enrolled = enrollmentsRes.data.map(e => e.student);
    setEnrolledStudentIds(enrolled);
    const available = students
      .filter(s => !enrolled.includes(s.id))
      .sort((a, b) => a.username.localeCompare(b.username));
    setAvailableStudents(available);
    setShowEnrollModal(true);
  };
  const enrollStudent = async (studentId) => {
    try {
      await API.post("enrollments/", { student: studentId, course: currentCourse.id });
      await openEnrollModal(currentCourse);
      fetchCourses();
    } catch (err) {
      alert("Enrollment failed");
    }
  };
  const unenrollStudent = async (studentId) => {
    const enrollments = await API.get(`enrollments/?student=${studentId}&course=${currentCourse.id}`);
    const enrollmentId = enrollments.data[0]?.id;
    if (enrollmentId) {
      await API.delete(`enrollments/${enrollmentId}/`);
      await openEnrollModal(currentCourse);
      fetchCourses();
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

  // Module management
  const openModulesModal = async (course) => {
    setCurrentCourse(course);
    await fetchModules(course.id);
    setExpandedModuleId(null);
    setShowModulesModal(true);
  };
  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      course: currentCourse.id,
      title: moduleForm.title,
      content: moduleForm.content,
      order: moduleForm.order,
    };
    try {
      if (editingModuleId) {
        await API.patch(`modules/${editingModuleId}/`, payload);
      } else {
        await API.post("modules/", payload);
      }
      setModuleForm({ title: "", content: "", order: 0 });
      setEditingModuleId(null);
      setShowModuleForm(false);
      await fetchModules(currentCourse.id);
    } catch (err) {
      alert("Error saving module");
    }
  };
  const editModule = (mod) => {
    setEditingModuleId(mod.id);
    setModuleForm({ title: mod.title, content: mod.content, order: mod.order });
    setShowModuleForm(true);
  };
  const deleteModule = async (modId) => {
    if (window.confirm("Delete this module? All its days will also be deleted.")) {
      await API.delete(`modules/${modId}/`);
      await fetchModules(currentCourse.id);
      if (expandedModuleId === modId) setExpandedModuleId(null);
    }
  };
  const viewModuleContent = (mod) => {
    setViewingModule(mod);
  };

  // Day management
  const openDayForm = (module) => {
    setSelectedModule(module);
    setEditingDayId(null);
    setDayForm({ title: "", content: "", order: 0 });
    setShowDayForm(true);
  };
  const editDay = (day, module) => {
    setSelectedModule(module);
    setEditingDayId(day.id);
    setDayForm({ title: day.title, content: day.content, order: day.order });
    setShowDayForm(true);
  };
  const handleDaySubmit = async (e) => {
    e.preventDefault();
    const payload = {
      module: selectedModule.id,
      title: dayForm.title,
      content: dayForm.content,
      order: dayForm.order,
    };
    try {
      if (editingDayId) {
        await API.patch(`days/${editingDayId}/`, payload);
      } else {
        await API.post("days/", payload);
      }
      setShowDayForm(false);
      setEditingDayId(null);
      setDayForm({ title: "", content: "", order: 0 });
      await fetchModules(currentCourse.id);
    } catch (err) {
      alert("Error saving day");
    }
  };
  const deleteDay = async (dayId) => {
    if (window.confirm("Delete this day?")) {
      await API.delete(`days/${dayId}/`);
      await fetchModules(currentCourse.id);
    }
  };
  const viewDayContent = (day) => {
    setViewingDay(day);
  };
  const toggleModule = (moduleId) => {
    setExpandedModuleId(expandedModuleId === moduleId ? null : moduleId);
  };

  return (
    <div className="min-h-screen w-screen bg-[#0f1623] p-8">
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
                  <button onClick={() => openModulesModal(c)} className="text-purple-400 hover:text-purple-300 mr-3 transition" title="Modules">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

      {/* Modules Modal with Days */}
      {showModulesModal && currentCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModulesModal(false)}>
          <div className="bg-[#1a2538] rounded-xl p-6 w-full max-w-4xl border border-white/10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Course Content – {currentCourse.name}</h3>
              <button
                onClick={() => { setShowModuleForm(true); setEditingModuleId(null); setModuleForm({ title: "", content: "", order: 0 }); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Week
              </button>
            </div>

            {showModuleForm && (
              <form onSubmit={handleModuleSubmit} className="mb-6 p-4 bg-[#0f1623] rounded-lg border border-white/10">
                <h4 className="text-white mb-3">{editingModuleId ? "Edit Week" : "New Week"}</h4>
                <input type="text" placeholder="Week Title (e.g., Week 2)" value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} required className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-3" />
                <input type="number" placeholder="Order (0,1,2...)" value={moduleForm.order} onChange={e => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 0 })} className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-3" />
                <textarea placeholder="Week Overview (HTML allowed)" value={moduleForm.content} onChange={e => setModuleForm({ ...moduleForm, content: e.target.value })} rows="6" className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white font-mono mb-3" />
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Save</button>
                  <button type="button" onClick={() => { setShowModuleForm(false); setEditingModuleId(null); }} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">Cancel</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {modules.map(mod => (
                <div key={mod.id} className="bg-[#0f1623] rounded-lg border border-white/10">
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-white/5"
                    onClick={() => toggleModule(mod.id)}
                  >
                    <div>
                      <h4 className="text-white font-semibold">{mod.title} (Order: {mod.order})</h4>
                    </div>
                    <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => viewModuleContent(mod)} className="text-blue-400 hover:text-blue-300 transition" title="View">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button onClick={() => editModule(mod)} className="text-yellow-400 hover:text-yellow-300 transition" title="Edit">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => deleteModule(mod.id)} className="text-red-400 hover:text-red-300 transition" title="Delete">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button onClick={() => openDayForm(mod)} className="text-green-400 hover:text-green-300 transition" title="Add Day">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {expandedModuleId === mod.id && (
                    <div className="p-4 pt-0 border-t border-white/10 mt-2">
                      <h5 className="text-white/70 text-sm mb-2">Days</h5>
                      {mod.days && mod.days.length > 0 ? (
                        <ul className="space-y-2">
                          {mod.days.map(day => (
                            <li key={day.id} className="flex justify-between items-center bg-[#0f1623] p-2 rounded">
                              <span className="text-white">{day.title}</span>
                              <div className="flex gap-2">
                                <button onClick={() => viewDayContent(day)} className="text-blue-400 hover:text-blue-300 transition" title="View">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button onClick={() => editDay(day, mod)} className="text-yellow-400 hover:text-yellow-300 transition" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button onClick={() => deleteDay(day.id)} className="text-red-400 hover:text-red-300 transition" title="Delete">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-white/40 text-sm">No days yet. Click "+ Day" to add.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {modules.length === 0 && <p className="text-white/40">No weeks yet. Click "Add Week" to create one.</p>}
            </div>

            <button onClick={() => setShowModulesModal(false)} className="mt-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Day Form Modal */}
      {showDayForm && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDayForm(false)}>
          <form onSubmit={handleDaySubmit} className="bg-[#1a2538] rounded-xl p-6 w-full max-w-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">{editingDayId ? "Edit Day" : "New Day"} – {selectedModule.title}</h3>
            <input type="text" placeholder="Day Title (e.g., Day 1)" value={dayForm.title} onChange={e => setDayForm({ ...dayForm, title: e.target.value })} required className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-3" />
            <input type="number" placeholder="Order (0,1,2...)" value={dayForm.order} onChange={e => setDayForm({ ...dayForm, order: parseInt(e.target.value) || 0 })} className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-3" />
            <textarea placeholder="Day Content (HTML allowed)" value={dayForm.content} onChange={e => setDayForm({ ...dayForm, content: e.target.value })} rows="8" className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white font-mono mb-4" />
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">Save</button>
              <button type="button" onClick={() => setShowDayForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Module Content View Modal */}
      {viewingModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewingModule(null)}>
          <div className="bg-[#1a2538] rounded-xl p-6 w-full max-w-4xl border border-white/10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{viewingModule.title}</h3>
              <button onClick={() => setViewingModule(null)} className="text-white/50 hover:text-white">✖</button>
            </div>
            <div className="prose prose-invert max-w-none text-white/90" dangerouslySetInnerHTML={{ __html: viewingModule.content }} />
            <button onClick={() => setViewingModule(null)} className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Day Content View Modal */}
      {viewingDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewingDay(null)}>
          <div className="bg-[#1a2538] rounded-xl p-6 w-full max-w-4xl border border-white/10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{viewingDay.title}</h3>
              <button onClick={() => setViewingDay(null)} className="text-white/50 hover:text-white">✖</button>
            </div>
            <div className="prose prose-invert max-w-none text-white/90" dangerouslySetInnerHTML={{ __html: viewingDay.content }} />
            <button onClick={() => setViewingDay(null)} className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;