// src/pages/student/StudentProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/api";

const avatarColors = [
  ["#e6f4ea", "#2e7d32"], // light green background, dark green text
  ["#e8f5e9", "#388e3c"],
  ["#c8e6c9", "#2e7d32"],
  ["#f1f8e9", "#558b2f"],
  ["#dcedc8", "#33691e"],
];

function getInitials(username = "") {
  const parts = username.trim().split(/[\s._-]+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : username.slice(0, 2).toUpperCase() || "?";
}

function getAvatarColor(username = "") {
  const idx = username.charCodeAt(0) % avatarColors.length || 0;
  return avatarColors[idx];
}

function ReadOnly({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-gray-800 break-all font-medium">{value || "—"}</div>
    </div>
  );
}

function ReadOnlyField({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <span className="text-base">{icon}</span>
        <span className="text-gray-800 text-sm flex-1">{value || "—"}</span>
      </div>
    </div>
  );
}

function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
        setProfile(studentRes.data);
      } catch (err) {
        console.error(err);
        setMessage({
          text: err.response?.status === 404
            ? "Student profile not found. Please contact admin."
            : "Failed to load profile.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const username = profile?.user?.username || profile?.username || "";
  const email = profile?.user?.email || profile?.email || "";

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{message.text}</div>
      </div>
    );
  }

  const [bgColor, accentColor] = getAvatarColor(username);

  const personalFields = [
    { name: "course", label: "Course", icon: "🎓", value: profile.course },
    { name: "batch", label: "Batch", icon: "📅", value: profile.batch },
    { name: "phone", label: "Phone", icon: "📞", value: profile.phone },
    { name: "date_of_birth", label: "Date of Birth", icon: "🎂", value: profile.date_of_birth },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden transition-all">
        {/* Banner */}
        <div
          className="relative h-40 flex items-end px-8 pb-5"
          style={{ background: `linear-gradient(135deg, ${bgColor} 0%, #c8e6c9 100%)` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:24px_24px]" />
          <div
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md z-10 border-2"
            style={{ borderColor: accentColor }}
          >
            <span className="text-3xl font-bold" style={{ color: accentColor }}>
              {getInitials(username)}
            </span>
          </div>
          <div className="ml-4 z-10 pb-1">
            <h2 className="text-2xl font-bold text-gray-800">{username}</h2>
            <span
              className="inline-block text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-1"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              Student
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnly label="Username" value={username} />
            <ReadOnly label="Email" value={email} />
          </div>

          <div className="border-t border-gray-200 my-5" />

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Personal Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {personalFields.map(({ name, label, icon, value }) => (
              <ReadOnlyField key={name} label={label} value={value} icon={icon} />
            ))}
          </div>

          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center mb-6">
            <p className="text-sm text-green-800">
              📝 For any changes to your profile information, please contact your administrator.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/change-password"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
            >
              Change Password
            </Link>
            <Link
              to="/student/dashboard"
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>

          {message.text && (
            <div
              className={`mt-4 px-4 py-2 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {message.type === "success" ? "✓" : "✕"} {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;