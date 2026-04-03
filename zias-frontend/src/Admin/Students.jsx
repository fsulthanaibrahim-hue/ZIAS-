import { useEffect, useState } from "react";
import API from "../api/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    course: "",
    batch: "",
    phone: "",
    date_of_birth: "",
  });

  const fetchStudents = () => {
    API.get("students/")
      .then((res) => setStudents(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      API.delete(`students/${id}/`)
        .then(() => fetchStudents())
        .catch((err) => console.error(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      username: formData.username,
      email: formData.email,
      course: formData.course,
      batch: formData.batch,
      phone: formData.phone,
    };

    try {
      if (editingId) {
        await API.patch(`students/${editingId}/`, payload);
      } else {
        await API.post("students/", payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ username: "", email: "", course: "", batch: "", phone: "" });
      fetchStudents();
    } catch (error) {
      if (error.response) {
        alert(`Error ${error.response.status}:\n${JSON.stringify(error.response.data, null, 2)}`);
        console.error(error.response.data);
      } else {
        alert(error.message);
      }
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      username: student.username,
      email: student.email,
      course: student.course,
      batch: student.batch,
      phone: student.phone,
      date_of_birth: student.date_of_birth || "",
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Filter students based on search term (include enrolled courses)
  const filteredStudents = students.filter((s) =>
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.courses && s.courses.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="min-h-screen w-screen bg-[#0f1623] p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-white/50 text-sm mt-1">Manage all registered students</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ username: "", email: "", course: "", batch: "", phone: "" });
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by name, email, course, batch, phone or enrolled courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-[#1a2538] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Modal Form (unchanged) */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowForm(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-[#1a2538] rounded-xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Student" : "New Student"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-white/50 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
              />
              <input
                type="text"
                name="course"
                placeholder="Course (main)"
                value={formData.course}
                onChange={handleChange}
                required
                className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
              />
              <input
                type="text"
                name="batch"
                placeholder="Batch"
                value={formData.batch}
                onChange={handleChange}
                required
                className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
              />
              <input
                type="date"
                name="date_of_birth"
                placeholder="Date of Birth"
                value={formData.date_of_birth || ''}
                onChange={handleChange}
                className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-3"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition">
                Save
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Students Table */}
      <div className="overflow-x-auto mt-6">
        <table className="w-full bg-[#1a2538] rounded-xl border border-white/10">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-white/60 text-sm font-medium">Name</th>
              <th className="text-left p-4 text-white/60 text-sm font-medium">Email</th>
              <th className="text-left p-4 text-white/60 text-sm font-medium">Course (Main)</th>
              <th className="text-left p-4 text-white/60 text-sm font-medium">Batch</th>
              <th className="text-left p-4 text-white/60 text-sm font-medium">Phone</th>
              <th className="text-left p-4 text-white/60 text-sm font-medium">Date of Birth</th>
              <th className="text-left p-4 text-white/60 text-sm font-medium">Enrolled Courses</th>
              <th className="text-left p-4 text-white/60 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="p-4 text-white">{s.username}</td>
                  <td className="p-4 text-white/80">{s.email}</td>
                  <td className="p-4 text-white/80">{s.course}</td>
                  <td className="p-4 text-white/80">{s.batch}</td>
                  <td className="p-4 text-white/80">{s.phone}</td>
                  <td className="p-4 text-white/80">{s.date_of_birth || '-'}</td>
                  <td className="p-4 text-white/80">
                    {s.courses && s.courses.length > 0
                      ? s.courses.map(c => c.name).join(", ")
                      : "-"}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-blue-400 hover:text-blue-300 mr-3 transition"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-400 hover:text-red-300 transition"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center p-8 text-white/40">
                  {searchTerm ? "No students match your search." : "No students found. Click 'Add Student' to create one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Students;