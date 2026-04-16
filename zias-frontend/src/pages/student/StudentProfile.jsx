// src/pages/student/StudentProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/api";

const avatarColors = [
  ["#1a3a5c", "#4a9eff"],
  ["#1a3830", "#3dd68c"],
  ["#3a1a2c", "#e879a0"],
  ["#2a2a1a", "#f5a623"],
  ["#1a1a3a", "#a78bfa"],
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
    <div style={s.roField}>
      <span style={s.roLabel}>{label}</span>
      <span style={s.roValue}>{value || "—"}</span>
    </div>
  );
}

function ReadOnlyField({ label, value, icon }) {
  return (
    <div style={s.fieldWrap}>
      <label style={s.label}>{label}</label>
      <div style={s.readOnlyWrap}>
        <span style={{ fontSize: 14, flexShrink: 0, opacity: 0.65 }}>{icon}</span>
        <span style={s.readOnlyValue}>{value || "—"}</span>
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
        const student = studentRes.data;
        setProfile(student);
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
      <div style={s.fullPage}>
        <div style={s.spinner} />
      </div>
    );
  }

  const username = profile?.user?.username || profile?.username || "";
  const email = profile?.user?.email || profile?.email || "";

  if (!profile) {
    return (
      <div style={s.fullPage}>
        <div style={{ ...s.toast, ...s.toastError }}>{message.text}</div>
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
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div style={{ ...s.card, animation: "fadeIn 0.4s ease both" }}>

        <div style={{ ...s.banner, background: `linear-gradient(135deg, ${bgColor} 0%, #0e1828 100%)` }}>
          <div style={s.dotPattern} />
          <div style={{ ...s.avatar, border: `2.5px solid ${accentColor}`, boxShadow: `0 0 24px ${accentColor}30` }}>
            <span style={{ color: accentColor, fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>
              {getInitials(username)}
            </span>
          </div>
          <div style={s.bannerMeta}>
            <h2 style={s.bannerName}>{username}</h2>
            <span style={{ ...s.badge, borderColor: accentColor, color: accentColor }}>Student</span>
          </div>
        </div>

        <div style={s.body}>
          <div style={s.roGrid}>
            <ReadOnly label="Username" value={username} />
            <ReadOnly label="Email" value={email} />
          </div>

          <div style={s.divider} />
          <p style={s.sectionLabel}>Personal Details</p>

          <div style={s.fieldGrid}>
            {personalFields.map(({ name, label, icon, value }) => (
              <ReadOnlyField key={name} label={label} value={value} icon={icon} />
            ))}
          </div>

          <div style={s.noteBox}>
            <p style={s.noteText}>
              📝 For any changes to your profile information, please contact your administrator.
            </p>
          </div>

          <div style={s.actions}>
            <Link to="/student/change-password" style={s.btnSecondary}>
              Change Password
            </Link>
            <Link to="/student/dashboard" style={s.btnDashboard}>
              Back to Dashboard
            </Link>
            <button onClick={handleLogout} style={s.btnLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>

          {message.text && (
            <div style={{
              ...s.toast,
              ...(message.type === "success" ? s.toastSuccess : s.toastError),
              animation: "fadeIn 0.3s ease both",
            }}>
              {message.type === "success" ? "✓" : "✕"} {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "48px 16px 80px",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  fullPage: {
    minHeight: "100vh",
    background: "#0b1220",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 36, height: 36,
    border: "3px solid #1e2d45",
    borderTop: "3px solid #4a9eff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  card: {
    width: "100%",
    maxWidth: 640,
    background: "#111a2c",
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 24px 72px rgba(0,0,0,0.55)",
  },
  banner: {
    position: "relative",
    height: 164,
    display: "flex",
    alignItems: "flex-end",
    padding: "0 28px 22px",
    gap: 16,
    overflow: "hidden",
  },
  dotPattern: {
    position: "absolute",
    inset: 0,
    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
    backgroundSize: "22px 22px",
    pointerEvents: "none",
  },
  avatar: {
    width: 72, height: 72,
    borderRadius: "50%",
    background: "#0b1220",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    zIndex: 1,
  },
  bannerMeta: {
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    paddingBottom: 4,
  },
  bannerName: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "#f0f6ff",
    letterSpacing: "-0.3px",
  },
  badge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    border: "1px solid",
    borderRadius: 99,
    padding: "2px 10px",
    width: "fit-content",
  },
  body: {
    padding: "26px 28px 32px",
  },
  roGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 22,
  },
  roField: {
    background: "#0d1625",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: "10px 14px",
  },
  roLabel: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#3a5a7a",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  roValue: {
    fontSize: 14,
    color: "#7a9cbf",
    wordBreak: "break-all",
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.05)",
    margin: "0 0 18px",
  },
  sectionLabel: {
    margin: "0 0 14px",
    fontSize: 10,
    fontWeight: 700,
    color: "#3a5a7a",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginBottom: 16,
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: "#5a7a9a",
  },
  readOnlyWrap: {
    display: "flex",
    alignItems: "center",
    background: "#0d1625",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "11px 12px",
    gap: 8,
  },
  readOnlyValue: {
    flex: 1,
    color: "#cce0f5",
    fontSize: 14,
  },
  noteBox: {
    background: "rgba(74,158,255,0.05)",
    border: "1px solid rgba(74,158,255,0.1)",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 24,
  },
  noteText: {
    margin: 0,
    fontSize: 12,
    color: "#5a7a9a",
    textAlign: "center",
  },
  actions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.04)",
    color: "#7a9cbf",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "11px 24px",
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
    transition: "background 0.2s, color 0.2s",
  },
  btnDashboard: {
    display: "inline-flex",
    alignItems: "center",
    background: "#1e2d45",
    color: "#7a9cbf",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "11px 24px",
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
    transition: "background 0.2s, color 0.2s",
  },
  btnLogout: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(226,75,74,0.15)",
    color: "#e24b4a",
    border: "1px solid rgba(226,75,74,0.3)",
    borderRadius: 10,
    padding: "11px 24px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.2s, color 0.2s",
  },
  toast: {
    marginTop: 18,
    padding: "11px 16px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  toastSuccess: {
    background: "rgba(61,214,140,0.07)",
    border: "1px solid rgba(61,214,140,0.18)",
    color: "#3dd68c",
  },
  toastError: {
    background: "rgba(226,75,74,0.07)",
    border: "1px solid rgba(226,75,74,0.18)",
    color: "#e24b4a",
  },
};

export default StudentProfile;