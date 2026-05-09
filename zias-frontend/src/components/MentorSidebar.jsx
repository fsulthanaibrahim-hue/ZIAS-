// src/components/MentorSidebar.jsx – with Review Assignments link
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

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
    case "My Students":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z" /></svg>;
    case "Modules":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M2 2h4v4H2V2zm6 0h4v4H8V2zM2 8h4v4H2V8zm6 0h4v4H8V8z" /></svg>;
    case "Review Folders":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5V5zm0 2h6v1H5V7zm0 2h6v1H5V9z" /></svg>;
    case "Review Assignments":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M4 2h8v2H4V2zm0 3h8v2H4V5zm0 3h8v2H4V8zm0 3h8v2H4v-2zM2 2h1v12H2V2z" /></svg>;
    case "Attendance Monitor":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 1a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm.5 2H7v5.5l4 2.5.5-1-3.5-2V4.5z" /></svg>;
    case "Profile":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-2 1a5 5 0 00-5 5h14a5 5 0 00-5-5H6z" /></svg>;
    default:
      return null;
  }
}

function MentorSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("mentorSidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("mentorSidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const isActive = (linkPath) => {
    if (linkPath === "/mentor/dashboard") return pathname === linkPath;
    return pathname.startsWith(linkPath);
  };

  const navItems = [
    { path: "/mentor/dashboard", label: "Dashboard" },
    { path: "/mentor/students", label: "My Students" },
    { path: "/mentor/modules", label: "Modules" },
    { path: "/mentor/review-folders", label: "Review Folders" },
    { path: "/mentor/assignments", label: "Review Assignments" }, // NEW
    { path: "/mentor/attendance", label: "Attendance Monitor" },
    { path: "/mentor/profile", label: "Profile" },
  ];

  const overviewItems = navItems.filter(item => item.label === "Dashboard");
  const managementItems = navItems.filter(item => item.label !== "Dashboard");

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
      {/* Header with clickable logo + notification bell */}
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
                <p className="text-gray-800 font-semibold text-sm">ZIAS Mentor</p>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Portal</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-xs leading-tight">
                ZM
              </div>
              <span className="text-[10px] text-gray-500 font-medium mt-1">ZIAS</span>
            </div>
          )}
        </button>

        {/* NotificationBell auto‑detects role */}
        {!isCollapsed && <NotificationBell />}
      </div>

      {/* Navigation with sections */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider px-3 pb-1">
            Overview
          </div>
        )}
        {overviewItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            label={item.label}
            active={isActive(item.path)}
            collapsed={isCollapsed}
          />
        ))}
        {!isCollapsed && (
          <div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider px-3 pt-3 pb-1">
            Management
          </div>
        )}
        {managementItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            label={item.label}
            active={isActive(item.path)}
            collapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* User section and sign out */}
      <div className={`p-3 border-t border-gray-200 transition-all ${isCollapsed ? "text-center" : ""}`}>
        <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-bold">
            ME
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-gray-800 text-sm font-medium truncate">Mentor User</p>
              <p className="text-gray-400 text-xs">Mentor</p>
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

export default MentorSidebar;