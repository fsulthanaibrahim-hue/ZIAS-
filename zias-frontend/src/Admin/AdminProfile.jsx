// src/Admin/AdminProfile.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";

const avatarColors = [
  ["#e6f4ea", "#2e7d32"],
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

function AdminProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const isFetched = useRef(false);

  useEffect(() => {
    if (isFetched.current) return;
    isFetched.current = true;
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
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
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

  const username = user?.username || "";
  const email = user?.email || "";
  const role = "Admin";
  const [bgColor, accentColor] = getAvatarColor(username);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div style={{ ...s.card, animation: "fadeIn 0.4s ease both" }}>
        <div style={{ ...s.banner, background: `linear-gradient(135deg, ${bgColor} 0%, #c8e6c9 100%)` }}>
          <div style={s.dotPattern} />
          <div style={{ ...s.avatar, border: `2.5px solid ${accentColor}`, boxShadow: `0 0 24px ${accentColor}30` }}>
            <span style={{ color: accentColor, fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>
              {getInitials(username)}
            </span>
          </div>
          <div style={s.bannerMeta}>
            <h2 style={s.bannerName}>{username}</h2>
            <span style={{ ...s.badge, borderColor: accentColor, color: accentColor }}>{role}</span>
          </div>
        </div>

        <div style={s.body}>
          {message.text && (
            <div
              style={{
                ...s.toast,
                ...(message.type === "success" ? s.toastSuccess : s.toastError),
                marginBottom: 20,
              }}
            >
              {message.type === "success" ? "✓" : "✕"} {message.text}
            </div>
          )}

          {!editing ? (
            <div style={s.infoContainer}>
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Username</span>
                <span style={s.infoValue}>{username}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Email</span>
                <span style={s.infoValue}>{email}</span>
              </div>
              <div style={s.actions}>
                <button onClick={() => setEditing(true)} style={s.btnPrimary}>
                  Edit Profile
                </button>
                <Link to="/change-password" style={s.btnSecondary}>
                  Change Password
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={s.input}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={s.input}
                />
              </div>
              <div style={s.formActions}>
                <button type="submit" disabled={updating} style={s.btnPrimary}>
                  {updating ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)} style={s.btnSecondary}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div style={s.logoutSection}>
            <button onClick={() => setShowLogoutConfirm(true)} style={s.btnLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <p style={s.modalText}>Are you sure you want to logout?</p>
            <div style={s.modalActions}>
              <button onClick={handleLogout} style={s.modalBtnYes}>Yes</button>
              <button onClick={() => setShowLogoutConfirm(false)} style={s.modalBtnNo}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles – the outer container now uses flex to center the card perfectly
const s = {
  page: {
    display: "flex",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: "100vh",
    background: "#f9fafb",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 640,
    background: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02)",
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
    backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)",
    backgroundSize: "22px 22px",
    pointerEvents: "none",
  },
  avatar: {
    width: 72, height: 72,
    borderRadius: "50%",
    background: "#ffffff",
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
    color: "#1f2937",
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
  infoContainer: {
    marginBottom: 24,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #eef2f6",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 500,
    color: "#1f2937",
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 20,
  },
  btnPrimary: {
    background: "#22c55e",
    color: "#ffffff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  btnSecondary: {
    background: "#f9fafb",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  form: {
    marginBottom: 24,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  },
  formActions: {
    display: "flex",
    gap: 12,
    marginTop: 8,
  },
  logoutSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTop: "1px solid #eef2f6",
    textAlign: "center",
  },
  btnLogout: {
    background: "none",
    border: "none",
    color: "#dc2626",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    transition: "color 0.2s",
  },
  toast: {
    padding: "11px 16px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  toastSuccess: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
  },
  toastError: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: 16,
    padding: 24,
    width: 280,
    textAlign: "center",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
  },
  modalText: {
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 20,
    color: "#1f2937",
  },
  modalActions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
  },
  modalBtnYes: {
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "8px 20px",
    cursor: "pointer",
    fontWeight: 500,
  },
  modalBtnNo: {
    background: "#e5e7eb",
    color: "#1f2937",
    border: "none",
    borderRadius: 8,
    padding: "8px 20px",
    cursor: "pointer",
    fontWeight: 500,
  },
};

export default AdminProfile;