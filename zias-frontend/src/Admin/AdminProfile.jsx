// src/Admin/AdminProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";

function AdminProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);   // 👈 update loading state
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/users/me/");
      setUser(res.data);
      setFormData({ username: res.data.username, email: res.data.email });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setMessage({ text: "Failed to load profile", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await API.patch("/users/me/", formData);
      setUser((prev) => ({ ...prev, ...formData }));
      setEditing(false);
      setMessage({ text: "Profile updated successfully", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({
        text: err.response?.data?.detail || "Failed to update profile",
        type: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    // Clear both tokens
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Optionally clear user from localStorage if stored
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Admin Profile</h1>
          <p className="text-green-100 text-sm">Manage your account settings</p>
        </div>

        <div className="p-6">
          {message.text && (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {!editing ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="text-lg font-medium text-gray-800">
                    {user?.username || "—"}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-lg font-medium text-gray-800">
                    {user?.email || "—"}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setEditing(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Edit Profile
                </button>
                <Link
                  to="/change-password"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Change Password
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;