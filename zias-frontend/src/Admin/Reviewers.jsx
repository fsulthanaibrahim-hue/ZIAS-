import { useEffect, useState } from "react";
import API from "../api/api";

function Reviewers() {
  const [reviewers, setReviewers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    department: ""
  });

  const fetchReviewers = () => {
    API.get("reviewers/")
      .then(res => setReviewers(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchReviewers();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure?")) {
      API.delete(`reviewers/${id}/`)
        .then(() => fetchReviewers())
        .catch(err => console.error(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      username: formData.username,
      email: formData.email,
      department: formData.department,
    };

    try {
      if (editingId) {
        await API.patch(`reviewers/${editingId}/`, payload);
      } else {
        await API.post("reviewers/", payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ username: "", email: "", department: "" });
      fetchReviewers();
    } catch (error) {
      if (error.response) {
        alert(`Error ${error.response.status}:\n${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        alert(error.message);
      }
    }
  };

  const handleEdit = (reviewer) => {
    setEditingId(reviewer.id);
    setFormData({
      username: reviewer.username,
      email: reviewer.email,
      department: reviewer.department,
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen w-screen bg-[#0f1623] p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviewers</h1>
          <p className="text-white/50 text-sm mt-1">Manage reviewers and departments</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ username: "", email: "", department: "" });
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Reviewer
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowForm(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1a2538] rounded-xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? "Edit Reviewer" : "New Reviewer"}
              </h3>
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
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
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

      {/* Table */}
      <div className="overflow-x-auto mt-6">
        <table className="w-full bg-[#1a2538] rounded-xl border border-white/10">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-white/60 text-sm font-medium">Name</th>
              <th className="text-left p-4 text-white/60 text-sm font-medium">Email</th>
              <th className="text-left p-4 text-white/60 text-sm font-medium">Department</th>
              <th className="text-left p-4 text-white/60 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviewers.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition"><td className="p-4 text-white">{r.username}</td><td className="p-4 text-white/80">{r.email}</td><td className="p-4 text-white/80">{r.department}</td><td className="p-4">
                  <button onClick={() => handleEdit(r)} className="text-blue-400 hover:text-blue-300 mr-3 transition" title="Edit">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300 transition" title="Delete">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {reviewers.length === 0 && <tr><td colSpan="4" className="text-center p-8 text-white/40">No reviewers found. Click "Add Reviewer" to create one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Reviewers;