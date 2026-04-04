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

  // Module management modal state
  const [showContentModal, setShowContentModal] = useState(false);
  const [modules, setModules] = useState([]);
  const [selectedCourseForContent, setSelectedCourseForContent] = useState(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleOrder, setNewModuleOrder] = useState(0);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [editingModuleOrder, setEditingModuleOrder] = useState(0);
  const [editingModuleContent, setEditingModuleContent] = useState("");

  // Day management (inline)
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

  // Enrollment functions (unchanged)
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

  // Module management functions
  const openContentModal = async (course) => {
    setSelectedCourseForContent(course);
    await fetchModules(course.id);
    setShowContentModal(true);
  };

  const addModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await API.post("modules/", {
        course: selectedCourseForContent.id,
        title: newModuleTitle,
        content: "",
        order: newModuleOrder,
      });
      setNewModuleTitle("");
      setNewModuleOrder(0);
      await fetchModules(selectedCourseForContent.id);
    } catch (err) {
      alert("Error adding module");
    }
  };

  const startEditModule = (mod) => {
    setEditingModuleId(mod.id);
    setEditingModuleTitle(mod.title);
    setEditingModuleOrder(mod.order);
    setEditingModuleContent(mod.content);
  };

  const saveEditModule = async () => {
    try {
      await API.patch(`modules/${editingModuleId}/`, {
        title: editingModuleTitle,
        content: editingModuleContent,
        order: editingModuleOrder,
      });
      setEditingModuleId(null);
      await fetchModules(selectedCourseForContent.id);
    } catch (err) {
      alert("Error updating module");
    }
  };

  const cancelEditModule = () => {
    setEditingModuleId(null);
  };

  const deleteModule = async (modId) => {
    if (window.confirm("Delete this module and all its days?")) {
      await API.delete(`modules/${modId}/`);
      await fetchModules(selectedCourseForContent.id);
    }
  };

  // Day management functions
  const addDay = async (moduleId) => {
    if (!newDayTitle.trim()) return;
    try {
      await API.post("days/", {
        module: moduleId,
        title: newDayTitle,
        content: newDayContent,
        order: newDayOrder,
      });
      setNewDayTitle("");
      setNewDayContent("");
      setNewDayOrder(0);
      setSelectedModuleForDay(null);
      await fetchModules(selectedCourseForContent.id);
    } catch (err) {
      alert("Error adding day");
    }
  };

  const startEditDay = (day) => {
    setEditingDayId(day.id);
    setEditingDayTitle(day.title);
    setEditingDayContent(day.content);
    setEditingDayOrder(day.order);
  };

  const saveEditDay = async () => {
    try {
      await API.patch(`days/${editingDayId}/`, {
        title: editingDayTitle,
        content: editingDayContent,
        order: editingDayOrder,
      });
      setEditingDayId(null);
      await fetchModules(selectedCourseForContent.id);
    } catch (err) {
      alert("Error updating day");
    }
  };

  const cancelEditDay = () => {
    setEditingDayId(null);
  };

  const deleteDay = async (dayId) => {
    if (window.confirm("Delete this day?")) {
      await API.delete(`days/${dayId}/`);
      await fetchModules(selectedCourseForContent.id);
    }
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

      {/* Course Form Modal (unchanged) */}
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
                  <button onClick={() => openContentModal(c)} className="text-purple-400 hover:text-purple-300 mr-3 transition" title="Content">
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

      {/* Enrollment Modal (unchanged) */}
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

      {/* New Module Content Modal (clean, separate) */}
      {showContentModal && selectedCourseForContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowContentModal(false)}>
          <div className="bg-[#1a2538] rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Course Content – {selectedCourseForContent.name}</h2>
              <button onClick={() => setShowContentModal(false)} className="text-white/50 hover:text-white">✖</button>
            </div>

            {/* Add Module Form */}
            <div className="mb-6 p-4 bg-[#0f1623] rounded-lg border border-white/10">
              <h3 className="text-white font-medium mb-2">Add New Week</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Week title (e.g., Week 2)"
                  value={newModuleTitle}
                  onChange={e => setNewModuleTitle(e.target.value)}
                  className="bg-[#0f1623] border border-white/10 rounded-lg px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Order (0,1,2...)"
                  value={newModuleOrder}
                  onChange={e => setNewModuleOrder(parseInt(e.target.value) || 0)}
                  className="bg-[#0f1623] border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <button onClick={addModule} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm">Add Week</button>
            </div>

            {/* List of Modules */}
            <div className="space-y-6">
              {modules.map(mod => (
                <div key={mod.id} className="bg-[#0f1623] rounded-lg border border-white/10 p-4">
                  {editingModuleId === mod.id ? (
                    // Edit Module Form
                    <div>
                      <input
                        type="text"
                        value={editingModuleTitle}
                        onChange={e => setEditingModuleTitle(e.target.value)}
                        className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-3 py-2 text-white mb-2"
                      />
                      <input
                        type="number"
                        value={editingModuleOrder}
                        onChange={e => setEditingModuleOrder(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-3 py-2 text-white mb-2"
                      />
                      <textarea
                        placeholder="Week overview (HTML allowed)"
                        value={editingModuleContent}
                        onChange={e => setEditingModuleContent(e.target.value)}
                        rows="4"
                        className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm mb-3"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveEditModule} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm">Save</button>
                        <button onClick={cancelEditModule} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    // View Module
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-semibold">{mod.title} (Order: {mod.order})</h3>
                          {mod.content && <p className="text-white/50 text-sm mt-1 line-clamp-2">{mod.content.substring(0, 100)}...</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEditModule(mod)} className="text-yellow-400 hover:text-yellow-300 text-sm">Edit</button>
                          <button onClick={() => deleteModule(mod.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                        </div>
                      </div>

                      {/* Days for this module */}
                      <div className="mt-4 pl-4 border-l border-white/10">
                        <h4 className="text-white/70 text-sm mb-2">Days</h4>
                        {mod.days && mod.days.length > 0 ? (
                          <ul className="space-y-2">
                            {mod.days.map(day => (
                              <li key={day.id} className="bg-[#0f1623] p-2 rounded flex justify-between items-center">
                                {editingDayId === day.id ? (
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={editingDayTitle}
                                      onChange={e => setEditingDayTitle(e.target.value)}
                                      className="w-full bg-[#0f1623] border border-white/10 rounded px-2 py-1 text-white text-sm mb-1"
                                    />
                                    <input
                                      type="number"
                                      value={editingDayOrder}
                                      onChange={e => setEditingDayOrder(parseInt(e.target.value) || 0)}
                                      className="w-full bg-[#0f1623] border border-white/10 rounded px-2 py-1 text-white text-sm mb-1"
                                    />
                                    <textarea
                                      value={editingDayContent}
                                      onChange={e => setEditingDayContent(e.target.value)}
                                      rows="2"
                                      className="w-full bg-[#0f1623] border border-white/10 rounded px-2 py-1 text-white text-sm"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button onClick={saveEditDay} className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">Save</button>
                                      <button onClick={cancelEditDay} className="bg-gray-600 text-white px-2 py-0.5 rounded text-xs">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-white text-sm">{day.title}</span>
                                    <div className="flex gap-2">
                                      <button onClick={() => startEditDay(day)} className="text-yellow-400 hover:text-yellow-300 text-xs">Edit</button>
                                      <button onClick={() => deleteDay(day.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                                    </div>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-white/40 text-sm">No days yet.</p>
                        )}
                        {/* Add day form for this module */}
                        {selectedModuleForDay === mod.id ? (
                          <div className="mt-3 p-3 bg-[#0f1623] rounded border border-white/10">
                            <input
                              type="text"
                              placeholder="Day title"
                              value={newDayTitle}
                              onChange={e => setNewDayTitle(e.target.value)}
                              className="w-full bg-[#0f1623] border border-white/10 rounded px-2 py-1 text-white text-sm mb-2"
                            />
                            <input
                              type="number"
                              placeholder="Order"
                              value={newDayOrder}
                              onChange={e => setNewDayOrder(parseInt(e.target.value) || 0)}
                              className="w-full bg-[#0f1623] border border-white/10 rounded px-2 py-1 text-white text-sm mb-2"
                            />
                            <textarea
                              placeholder="Day content (HTML or plain text with '- ' for bullet points)"
                              value={newDayContent}
                              onChange={e => setNewDayContent(e.target.value)}
                              rows="3"
                              className="w-full bg-[#0f1623] border border-white/10 rounded px-2 py-1 text-white text-sm mb-2"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => addDay(mod.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Add Day</button>
                              <button onClick={() => setSelectedModuleForDay(null)} className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedModuleForDay(mod.id);
                              setNewDayTitle("");
                              setNewDayContent("");
                              setNewDayOrder(0);
                            }}
                            className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            + Add Day
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {modules.length === 0 && <p className="text-white/40 text-center">No weeks yet. Add a week above.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;