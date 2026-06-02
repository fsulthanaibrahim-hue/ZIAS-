import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/api";
import { clearAuthStorage } from "../../utils/authStorage";

const avatarColors = [
  ["#e6f4ea", "#2e7d32"],
  ["#e8f5e9", "#388e3c"],
  ["#c8e6c9", "#2e7d32"],
  ["#f1f8e9", "#558b2f"],
  ["#dcedc8", "#33691e"],
];

function getInitials(fullName = "") {
  const parts = fullName.trim().split(/[\s._-]+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : fullName.slice(0, 2).toUpperCase() || "?";
}

function getAvatarColor(fullName = "") {
  const idx = fullName.charCodeAt(0) % avatarColors.length || 0;
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

function AccountsProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();
  const isFetched = useRef(false);

  useEffect(() => {
    if (isFetched.current) return;
    isFetched.current = true;

    const fetchProfile = async () => {
      try {
        const res = await API.get("/accounts/profile/");
        setProfile(res.data);
      } catch (err) {
        setMessage({
          text: err.response?.status === 404
            ? "Accounts profile not found. Please contact admin."
            : "Failed to load profile.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/login");
  };

  const handleChangePassword = () => {
    // Navigate to accounts-specific change password page
    navigate("/accounts/change-password");
  };

  if (loading) {
    return (
      <div style={s.fullPage}>
        <div style={s.spinner} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={s.fullPage}>
        <div style={{ ...s.toast, ...s.toastError }}>{message.text}</div>
      </div>
    );
  }

  const fullName = profile.full_name || profile.username || "Accounts User";
  const email = profile.email || "";
  const role = "Accounts";
  const phone = profile.phone || "—";
  const department = profile.department || "—";

  const [bgColor, accentColor] = getAvatarColor(fullName);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div style={{ ...s.card, margin: "0 auto", animation: "fadeIn 0.4s ease both" }}>
        <div style={{ ...s.banner, background: `linear-gradient(135deg, ${bgColor} 0%, #c8e6c9 100%)` }}>
          <div style={s.dotPattern} />
          <div style={{ ...s.avatar, border: `2.5px solid ${accentColor}`, boxShadow: `0 0 24px ${accentColor}30` }}>
            <span style={{ color: accentColor, fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>
              {getInitials(fullName)}
            </span>
          </div>
          <div style={s.bannerMeta}>
            <h2 style={s.bannerName}>{fullName}</h2>
            <span style={{ ...s.badge, borderColor: accentColor, color: accentColor }}>{role}</span>
          </div>
        </div>

        <div style={s.body}>
          <div style={s.roGrid}>
            <ReadOnly label="Full Name" value={fullName} />
            <ReadOnly label="Email" value={email} />
            <ReadOnly label="Phone" value={phone} />
            <ReadOnly label="Department" value={department} />
          </div>

          <div style={s.divider} />
          <p style={s.sectionLabel}>Account Details</p>

          <div style={s.noteBox}>
            <p style={s.noteText}>
              📝 For any changes to your profile information, please contact your administrator.
            </p>
          </div>

          <div style={s.actions}>
            <button onClick={handleChangePassword} style={s.btnSecondary}>
              🔒 Change Password
            </button>
            <Link to="/accounts/dashboard" style={s.btnDashboard}>
              📊 Back to Dashboard
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
    width: "100%",
    minHeight: "100vh",
    background: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 16px",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  fullPage: {
    minHeight: "100vh",
    background: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 36, height: 36,
    border: "3px solid #d1d5db",
    borderTop: "3px solid #22c55e",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
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
  roGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 22,
  },
  roField: {
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 14px",
  },
  roLabel: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#6b7280",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  roValue: {
    fontSize: 14,
    color: "#374151",
    wordBreak: "break-all",
  },
  divider: {
    height: 1,
    background: "#e5e7eb",
    margin: "0 0 18px",
  },
  sectionLabel: {
    margin: "0 0 14px",
    fontSize: 10,
    fontWeight: 700,
    color: "#6b7280",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  noteBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 24,
  },
  noteText: {
    margin: 0,
    fontSize: 12,
    color: "#166534",
    textAlign: "center",
  },
  actions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    background: "#f9fafb",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "11px 24px",
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
    cursor: "pointer",
    transition: "background 0.2s, color 0.2s",
  },
  btnDashboard: {
    display: "inline-flex",
    alignItems: "center",
    background: "#22c55e",
    color: "#ffffff",
    border: "1px solid #16a34a",
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
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
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
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
  },
  toastError: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
  },
};

export default AccountsProfile;
