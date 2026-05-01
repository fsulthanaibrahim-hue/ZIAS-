// src/pages/student/StudentProfile.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/api";
import StudentSidebar from "../../components/StudentSidebar";

/* ── Inject styles once ─────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

  .sp-root {
    --green-50:  #f0fdf4;
    --green-100: #dcfce7;
    --green-200: #bbf7d0;
    --green-400: #4ade80;
    --green-500: #22c55e;
    --green-600: #16a34a;
    --green-700: #15803d;
    --green-800: #166534;
    --gray-50:   #f9fafb;
    --gray-100:  #f3f4f6;
    --gray-200:  #e5e7eb;
    --gray-400:  #9ca3af;
    --gray-500:  #6b7280;
    --gray-700:  #374151;
    --gray-800:  #1f2937;
    --gray-900:  #111827;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* Page fade-in */
  .sp-fadein { animation: sp-fade .55s ease both; }
  .sp-fadein-1 { animation: sp-fade .55s .08s ease both; }
  .sp-fadein-2 { animation: sp-fade .55s .16s ease both; }
  .sp-fadein-3 { animation: sp-fade .55s .24s ease both; }
  .sp-fadein-4 { animation: sp-fade .55s .32s ease both; }
  @keyframes sp-fade {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }

  /* Avatar ring pulse */
  @keyframes sp-ring {
    0%,100% { box-shadow: 0 0 0 4px rgba(34,197,94,0.15), 0 0 0 8px rgba(34,197,94,0.07); }
    50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0.22), 0 0 0 12px rgba(34,197,94,0.08); }
  }
  .sp-avatar-ring { animation: sp-ring 3s ease-in-out infinite; }

  /* Field card hover */
  .sp-field {
    transition: box-shadow .2s, transform .2s, border-color .2s;
    border: 1.5px solid var(--gray-200);
  }
  .sp-field:hover {
    border-color: var(--green-400);
    box-shadow: 0 0 0 3px rgba(34,197,94,0.10);
    transform: translateY(-1px);
  }

  /* Button transitions */
  .sp-btn { transition: all .18s cubic-bezier(.4,0,.2,1); }
  .sp-btn-primary:hover { background: var(--green-700); box-shadow: 0 4px 14px rgba(22,163,74,0.35); transform: translateY(-1px); }
  .sp-btn-ghost:hover { background: var(--gray-100); transform: translateY(-1px); }
  .sp-btn-danger:hover { background: #fef2f2; border-color: #ef4444; transform: translateY(-1px); }

  /* Hex pattern overlay */
  .sp-hero-pattern {
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }

  /* Scrollbar */
  .sp-scroll::-webkit-scrollbar { width: 5px; }
  .sp-scroll::-webkit-scrollbar-track { background: transparent; }
  .sp-scroll::-webkit-scrollbar-thumb { background: var(--green-200); border-radius: 99px; }
`;

function injectStyles() {
  if (document.getElementById("sp-styles")) return;
  const el = document.createElement("style");
  el.id = "sp-styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

/* ── Helpers ─────────────────────────────────────────────────── */
function getInitials(username = "") {
  const parts = username.trim().split(/[\s._-]+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : username.slice(0, 2).toUpperCase() || "?";
}

/* ── Sub-components ──────────────────────────────────────────── */
function InfoChip({ label, value }) {
  return (
    <div className="sp-field" style={{
      background: "#fff", borderRadius: 14, padding: "14px 18px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gray-400)" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-800)", wordBreak: "break-all" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function DetailField({ label, icon, value }) {
  return (
    <div className="sp-field" style={{
      background: "#fff", borderRadius: 14, padding: "13px 16px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: "var(--green-50)", border: "1.5px solid var(--green-200)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gray-400)", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--gray-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--green-700)", fontFamily: "'Playfair Display', serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 500, marginTop: 1 }}>{label}</div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await API.get("users/me/");
        if (!userRes.data.is_student) { navigate("/login"); return; }
        const studentRes = await API.get("students/me/");
        setProfile(studentRes.data);
      } catch (err) {
        setMessage({
          text: err.response?.status === 404
            ? "Student profile not found. Please contact admin."
            : "Failed to load profile.",
          type: "error",
        });
      } finally { setLoading(false); }
    })();
  }, [navigate]);

  const handleLogout = () => {
    ["access_token", "refresh_token", "user"].forEach(k => localStorage.removeItem(k));
    navigate("/login");
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="sp-root" style={{ display: "flex", height: "100vh" }}>
        <StudentSidebar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--green-50)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid var(--green-200)", borderTopColor: "var(--green-600)", animation: "sp-spin .8s linear infinite" }} />
            <span style={{ color: "var(--gray-500)", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading your profile…</span>
            <style>{`@keyframes sp-spin { to { transform:rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (!profile) {
    return (
      <div className="sp-root" style={{ display: "flex", height: "100vh" }}>
        <StudentSidebar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--green-50)" }}>
          <div style={{ background: "#fff", border: "1.5px solid #fecaca", borderRadius: 16, padding: "20px 28px", color: "#b91c1c", fontSize: 14, boxShadow: "var(--shadow-md)" }}>
            {message.text || "Profile not found"}
          </div>
        </div>
      </div>
    );
  }

  const username = profile?.user?.username || profile?.username || "";
  const email = profile?.user?.email || profile?.email || "";
  const initials = getInitials(username);

  const personalFields = [
    { key: "course",        label: "Course",        icon: "🎓", value: profile.course },
    { key: "batch",         label: "Batch",          icon: "📅", value: profile.batch },
    { key: "phone",         label: "Phone",          icon: "📞", value: profile.phone },
    { key: "date_of_birth", label: "Date of Birth",  icon: "🎂", value: profile.date_of_birth },
  ];

  return (
    <div className="sp-root" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <StudentSidebar />

      <div className="sp-scroll" style={{ flex: 1, overflowY: "auto", background: "var(--green-50)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* ── Hero Card ── */}
          <div className="sp-fadein" style={{
            background: "#fff", borderRadius: 24, overflow: "hidden",
            boxShadow: "var(--shadow-lg)", border: "1.5px solid var(--green-100)", marginBottom: 20,
          }}>
            {/* Banner */}
            <div className="sp-hero-pattern" style={{
              height: 150,
              background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #a7f3d0 100%)",
              position: "relative", overflow: "hidden",
            }}>
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(34,197,94,0.12)" }} />
              <div style={{ position: "absolute", top: 20, right: 80, width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.10)" }} />
              <div style={{ position: "absolute", bottom: -20, left: 120, width: 100, height: 100, borderRadius: "50%", background: "rgba(22,163,74,0.08)" }} />

              {/* Student badge top-right */}
              <div style={{
                position: "absolute", top: 16, right: 20,
                background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
                borderRadius: 99, padding: "5px 14px",
                fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                color: "var(--green-700)", border: "1.5px solid var(--green-200)",
              }}>
                Student
              </div>
            </div>

            {/* Avatar — overlapping banner */}
            <div style={{ position: "relative", paddingLeft: 36, paddingBottom: 28, marginTop: -44 }}>
              <div className="sp-avatar-ring" style={{
                width: 88, height: 88, borderRadius: "50%",
                background: "linear-gradient(135deg, #22c55e, #15803d)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "4px solid #fff", position: "relative", zIndex: 2,
              }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 700, color: "#fff", letterSpacing: ".02em" }}>
                  {initials}
                </span>
              </div>

              <div style={{ marginTop: 14 }}>
                <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-.01em" }}>
                  {username}
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--gray-500)", fontWeight: 400 }}>{email}</p>
              </div>
            </div>

            {/* Stats strip */}
            <div style={{
              borderTop: "1.5px solid var(--green-100)",
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              padding: "16px 24px",
              background: "var(--green-50)",
            }}>
              <StatBadge label="Course" value={profile.course || "—"} />
              <div style={{ borderLeft: "1.5px solid var(--green-200)", borderRight: "1.5px solid var(--green-200)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <StatBadge label="Batch" value={profile.batch || "—"} />
              </div>
              <StatBadge label="Status" value="Active" />
            </div>
          </div>

          {/* ── Account Info ── */}
          <div className="sp-fadein-1" style={{
            background: "#fff", borderRadius: 20, padding: "24px",
            boxShadow: "var(--shadow-sm)", border: "1.5px solid var(--green-100)", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 4, height: 20, borderRadius: 99, background: "linear-gradient(180deg, #22c55e, #15803d)" }} />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--gray-800)", fontFamily: "'Playfair Display', serif" }}>Account Details</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <InfoChip label="Username" value={username} />
              <InfoChip label="Email" value={email} />
            </div>
          </div>

          {/* ── Personal Details ── */}
          <div className="sp-fadein-2" style={{
            background: "#fff", borderRadius: 20, padding: "24px",
            boxShadow: "var(--shadow-sm)", border: "1.5px solid var(--green-100)", marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 4, height: 20, borderRadius: 99, background: "linear-gradient(180deg, #22c55e, #15803d)" }} />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--gray-800)", fontFamily: "'Playfair Display', serif" }}>Personal Details</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {personalFields.map(f => (
                <DetailField key={f.key} label={f.label} icon={f.icon} value={f.value} />
              ))}
            </div>
          </div>

          {/* ── Notice ── */}
          <div className="sp-fadein-3" style={{
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            border: "1.5px solid var(--green-200)", borderRadius: 16,
            padding: "14px 20px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>📝</div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--green-800)", lineHeight: 1.6, fontWeight: 500 }}>
              For any changes to your profile information, please contact your administrator.
            </p>
          </div>

          {/* ── Action Buttons ── */}
          <div className="sp-fadein-4" style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", paddingBottom: 32 }}>
            <Link
              to="/change-password"
              className="sp-btn sp-btn-ghost"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 12, textDecoration: "none",
                border: "1.5px solid var(--gray-200)", background: "#fff",
                color: "var(--gray-700)", fontSize: 13, fontWeight: 600,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Change Password
            </Link>

            <Link
              to="/student/dashboard"
              className="sp-btn sp-btn-primary"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 22px", borderRadius: 12, textDecoration: "none",
                background: "var(--green-600)", color: "#fff",
                fontSize: 13, fontWeight: 600, border: "none",
                boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
              }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Dashboard
            </Link>

            <button
              onClick={handleLogout}
              className="sp-btn sp-btn-danger"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 12,
                background: "#fff", border: "1.5px solid #fecaca",
                color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>

          {/* ── Status message ── */}
          {message.text && (
            <div style={{
              marginTop: 8, padding: "12px 18px", borderRadius: 12, fontSize: 13, fontWeight: 500,
              ...(message.type === "success"
                ? { background: "var(--green-50)", border: "1.5px solid var(--green-200)", color: "var(--green-800)" }
                : { background: "#fef2f2", border: "1.5px solid #fecaca", color: "#b91c1c" }),
            }}>
              {message.type === "success" ? "✓ " : "✕ "}{message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;