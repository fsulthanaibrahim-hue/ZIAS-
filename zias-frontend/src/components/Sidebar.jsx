import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

function NavLink({ to, label, active, badge }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 10px",
        borderRadius: "8px",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: active ? "500" : "400",
        color: active ? "#6b9eff" : "rgba(255,255,255,0.55)",
        background: active ? "rgba(59,110,255,0.15)" : "transparent",
        transition: "background 0.15s, color 0.15s",
        marginBottom: "2px",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.color = "rgba(255,255,255,0.9)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255,255,255,0.55)";
        }
      }}
    >
      <span style={{ width: "16px", height: "16px", flexShrink: 0, opacity: active ? 1 : 0.7 }}>
        {label === "Dashboard" && (
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z" />
          </svg>
        )}
        {label === "Students" && (
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z" />
          </svg>
        )}
        {label === "Mentors" && (
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3 8a2 2 0 100-4 2 2 0 000 4zm9.5 5c0-2.485-2.015-4.5-4.5-4.5S3.5 10.515 3.5 13H1a5 5 0 019-3.07A5 5 0 0115 13h-2.5z" />
          </svg>
        )}
        {label === "Reviewers" && (
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <path d="M8 1a3 3 0 110 6A3 3 0 018 1zm-4 9a4 4 0 018 0v1H4v-1zm6.5-2a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm0 1.5a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
        )}
        {label === "Courses" && (
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <path d="M2 2h12v1H2V2zm0 2h12v1H2V4zm0 2h12v1H2V6zm0 2h12v1H2V8zm0 2h12v1H2v-1zm0 2h12v1H2v-1zM2 0h12v1H2V0z" />
          </svg>
        )}
        {label === "Modules" && (
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <path d="M2 2h4v4H2V2zm6 0h4v4H8V2zM2 8h4v4H2V8zm6 0h4v4H8V8z" />
          </svg>
        )}
        {label === "Messages" && (
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <path d="M14.5 2h-13A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2zM1.5 3h13a.5.5 0 0 1 .5.5v.5L8 7.939 1 4v-.5a.5.5 0 0 1 .5-.5zm13 10h-13a.5.5 0 0 1-.5-.5V5.5l6.5 4.5 6.5-4.5v7a.5.5 0 0 1-.5.5z" />
          </svg>
        )}
      </span>

      {label}

      {badge && (
        <span
          style={{
            marginLeft: "auto",
            fontSize: "11px",
            fontWeight: "500",
            background: "rgba(59,110,255,0.25)",
            color: "#6b9eff",
            padding: "1px 7px",
            borderRadius: "20px",
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const sectionLabel = {
    display: "block",
    fontSize: "10px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "8px 10px 6px",
  };

  const isActive = (linkPath) => {
    if (linkPath === "/admin/dashboard") {
      return pathname === linkPath;
    }
    return pathname.startsWith(linkPath);
  };

  return (
    <aside
      style={{
        width: "232px",
        minHeight: "100vh",
        background: "#0f1623",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "#3b6eff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 16 16" fill="white" width="16" height="16">
                <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "15px", fontWeight: "600", color: "#ffffff", margin: 0 }}>
                ZIAS Admin
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Portal
              </p>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 10px" }}>
        <span style={sectionLabel}>Overview</span>
        <NavLink to="/admin/dashboard" label="Dashboard" active={isActive("/admin/dashboard")} badge="Live" />
        <span style={{ ...sectionLabel, marginTop: "8px" }}>Management</span>
        <NavLink to="/admin/students" label="Students" active={isActive("/admin/students")} />
        <NavLink to="/admin/mentors" label="Mentors" active={isActive("/admin/mentors")} />
        <NavLink to="/admin/reviewers" label="Reviewers" active={isActive("/admin/reviewers")} />
        <NavLink to="/admin/courses" label="Courses" active={isActive("/admin/courses")} />
        <NavLink to="/admin/modules" label="Modules" active={isActive("/admin/modules")} />
        <NavLink to="/admin/messages" label="Messages" active={isActive("/admin/messages")} />
      </nav>

      <div
        style={{
          padding: "12px 10px 16px",
          borderTop: "0.5px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 10px",
            marginBottom: "4px",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b6eff, #7b4eff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: "white",
              flexShrink: 0,
            }}
          >
            AD
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "rgba(255,255,255,0.85)",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Admin User
            </p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: 0 }}>
              Super Admin
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "13px",
            color: "rgba(255,100,100,0.7)",
            fontFamily: "inherit",
            transition: "background 0.15s, color 0.15s",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,80,80,0.08)";
            e.currentTarget.style.color = "rgba(255,100,100,1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,100,100,0.7)";
          }}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16" style={{ opacity: 0.8, flexShrink: 0 }}>
            <path d="M2 2h7v2H4v8h5v2H2V2zm9.293 3.293l3 3a1 1 0 010 1.414l-3 3-1.414-1.414L11.586 9H6V7h5.586L10.293 5.707l1.414-1.414z" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;


