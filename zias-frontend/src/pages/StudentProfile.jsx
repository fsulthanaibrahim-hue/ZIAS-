import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";

function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    course: "",
    batch: "",
    phone: "",
    date_of_birth: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await API.get("users/me/");
        const user = userRes.data;
        if (!user.is_student) {
          navigate("/login");
          return;
        }
        const studentRes = await API.get("students/me/");
        if (studentRes.data.length > 0) {
          const student = studentRes.data;
          setProfile(student);
          setFormData({
            course: student.course || "",
            batch: student.batch || "",
            phone: student.phone || "",
            date_of_birth: student.date_of_birth || "",
          });
        } else {
          setMessage({ text: "Student profile not found.", type: "error" });
        }
      } catch (err) {
        console.error(err);
        setMessage({ text: "Failed to load profile.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      await API.patch(`students/${profile.id}/`, {
        course: formData.course,
        batch: formData.batch,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
      });
      setMessage({ text: "Profile updated successfully.", type: "success" });
      // Refresh profile data
      setProfile({ ...profile, ...formData });
    } catch (err) {
      setMessage({ text: "Failed to update profile.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f1623] text-white flex items-center justify-center">Loading...</div>;
  if (!profile) return <div className="min-h-screen bg-[#0f1623] text-white flex items-center justify-center">{message.text}</div>;

  return (
    <div className="min-h-screen bg-[#0f1623] text-white p-8">
      <div className="max-w-2xl mx-auto bg-[#1a2538] rounded-xl p-6 border border-white/10">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Read‑only fields */}
          <div>
            <label className="block text-white/70 mb-1">Username</label>
            <p className="text-white bg-[#0f1623] px-4 py-2 rounded-lg border border-white/10">
              {profile.user?.username || profile.username}
            </p>
          </div>
          <div>
            <label className="block text-white/70 mb-1">Email</label>
            <p className="text-white bg-[#0f1623] px-4 py-2 rounded-lg border border-white/10">
              {profile.user?.email || profile.email}
            </p>
          </div>

          {/* Editable fields */}
          <div>
            <label className="block text-white/70 mb-1">Course</label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Full Stack Bootcamp"
            />
          </div>
          <div>
            <label className="block text-white/70 mb-1">Batch</label>
            <input
              type="text"
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g., Batch 1"
            />
          </div>
          <div>
            <label className="block text-white/70 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Your mobile number"
            />
          </div>
          <div>
            <label className="block text-white/70 mb-1">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              to="/change-password"
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition text-center"
            >
              Change Password
            </Link>
          </div>
        </form>

        {message.text && (
          <div className={`mt-4 p-3 rounded-lg ${message.type === "success" ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentProfile;