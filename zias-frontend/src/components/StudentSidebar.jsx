// src/components/StudentSidebar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import API from "../api/api";

function NavLink({ to, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
        active
          ? "bg-green-100 text-green-700 font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } ${collapsed ? "justify-center" : ""}`}
      title={collapsed ? label : ""}
    >
      <span className="w-4 h-4 flex-shrink-0">{getIcon(label)}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function getIcon(label) {
  const svgClass = "w-full h-full";
  switch (label) {
    case "Dashboard":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z" /></svg>;
    case "Review Folders":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5V5zm0 2h6v1H5V7zm0 2h6v1H5V9z" /></svg>;
    case "Review Sheet":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M3 2h10v12H3V2zm1 1v10h8V3H4zm2 2h4v1H6V5zm0 2h4v1H6V7zm0 2h2v1H6V9z" /></svg>;
    case "Modules":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5V5zm0 2h6v1H5V7zm0 2h6v1H5V9z" /></svg>;
    case "My Attendance":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M5 2h6v2H5V2zm10 3H1v10h14V5zM3 7h10v6H3V7z" /></svg>;
    case "Profile":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-2 1a5 5 0 00-5 5h14a5 5 0 00-5-5H6z" /></svg>;
    default:
      return null;
  }
}

function StudentSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("studentSidebarCollapsed");
    return saved === "true";
  });
  const [userName, setUserName] = useState("Student User");
  const [userRole, setUserRole] = useState("Student");

  useEffect(() => {
    API.get("users/me/")
      .then(res => {
        setUserName(res.data.full_name || res.data.username);
        setUserRole("Student");
      })
      .catch(err => console.error("Failed to fetch user", err));
  }, []);

  useEffect(() => {
    localStorage.setItem("studentSidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const isActive = (linkPath) => {
    if (linkPath === "/student/dashboard") return pathname === linkPath;
    return pathname.startsWith(linkPath);
  };

  const navItems = [
    { path: "/student/dashboard", label: "Dashboard" },
    { path: "/student/review-folders", label: "Review Folders" },
    { path: "/student/review-sheet", label: "Review Sheet" },
    { path: "/student/modules", label: "Modules" },
    { path: "/student/attendance", label: "My Attendance" },
    { path: "/student/profile", label: "Profile" },
  ];

  const sidebarWidth = isCollapsed ? "5rem" : "16rem";

  return (
    <aside
      style={{
        width: sidebarWidth,
        flexShrink: 0,
        transition: "width 0.3s ease",
      }}
      className="bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 font-sans overflow-y-auto"
    >
      <div className="p-3 border-b border-gray-200 flex items-center justify-between gap-2">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 focus:outline-none cursor-pointer hover:opacity-80 transition-opacity"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                Z
              </div>
              <div className="text-left">
                <p className="text-gray-800 font-semibold text-sm">ZIAS Student</p>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Portal</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-xs leading-tight">
                ZS
              </div>
              <span className="text-[10px] text-gray-500 font-medium mt-1">ZIAS</span>
            </div>
          )}
        </button>
        {!isCollapsed && <NotificationBell role="student" />}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            label={item.label}
            active={isActive(item.path)}
            collapsed={isCollapsed}
          />
        ))}
      </nav>

      <div className={`p-3 border-t border-gray-200 transition-all ${isCollapsed ? "text-center" : ""}`}>
        <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-bold">
            ST
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-gray-800 text-sm font-medium truncate">{userName}</p>
              <p className="text-gray-400 text-xs">{userRole}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition text-sm font-medium ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? "Sign out" : ""}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" className="opacity-80">
            <path d="M2 2h7v2H4v8h5v2H2V2zm9.293 3.293l3 3a1 1 0 010 1.414l-3 3-1.414-1.414L11.586 9H6V7h5.586L10.293 5.707l1.414-1.414z" />
          </svg>
          {!isCollapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}

export default StudentSidebar;