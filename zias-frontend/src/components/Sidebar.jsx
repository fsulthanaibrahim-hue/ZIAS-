import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { clearAuthStorage } from "../utils/authStorage";

function NavLink({ to, label, active, badge, collapsed }) {
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
      {!collapsed && badge && (
        <span className="ml-auto text-[10px] font-semibold bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

function getIcon(label) {
  const svgClass = "w-full h-full";
  switch (label) {
    case "Dashboard":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z" /></svg>;
    case "Students":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z" /></svg>;
    case "Mentors":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3 8a2 2 0 100-4 2 2 0 000 4zm9.5 5c0-2.485-2.015-4.5-4.5-4.5S3.5 10.515 3.5 13H1a5 5 0 019-3.07A5 5 0 0115 13h-2.5z" /></svg>;
    case "Reviewers":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M8 1a3 3 0 110 6A3 3 0 018 1zm-4 9a4 4 0 018 0v1H4v-1zm6.5-2a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm0 1.5a1 1 0 100 2 1 1 0 000-2z" /></svg>;
    case "Courses":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M2 2h12v1H2V2zm0 2h12v1H2V4zm0 2h12v1H2V6zm0 2h12v1H2V8zm0 2h12v1H2v-1zm0 2h12v1H2v-1zM2 0h12v1H2V0z" /></svg>;
    case "Modules":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M2 2h4v4H2V2zm6 0h4v4H8V2zM2 8h4v4H2V8zm6 0h4v4H8V8z" /></svg>;
    case "Messages":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M14.5 2h-13A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2zM1.5 3h13a.5.5 0 0 1 .5.5v.5L8 7.939 1 4v-.5a.5.5 0 0 1 .5-.5zm13 10h-13a.5.5 0 0 1-.5-.5V5.5l6.5 4.5 6.5-4.5v7a.5.5 0 0 1-.5.5z" /></svg>;
    case "Review Sheets":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5V5zm0 2h6v1H5V7zm0 2h6v1H5V9z" /></svg>;
    case "Batches":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M2 2h12v1H2V2zm0 2h12v1H2V4zm0 2h12v1H2V6zm0 2h12v1H2V8zm0 2h12v1H2v-1zm0 2h12v1H2v-1zM2 0h12v1H2V0z" /></svg>;
    case "Review Folders":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}>
        <path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5V5zm0 2h6v1H5V7zm0 2h6v1H5V9zm0 2h4v1H5v-1z" />
      </svg>;
    case "Attendance":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}>
        <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 1a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm.5 2H7v5.5l4 2.5.5-1-3.5-2V4.5z"/>
      </svg>;
    case "Accounts":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}>
        <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm0 1a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm.5 2H7v5.5l4 2.5.5-1-3.5-2V4.5z"/>
      </svg>;
    case "Fee Analytics":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M8 1a6 6 0 00-6 6 6 6 0 1012 0 6 6 0 00-6-6zm0 1a5 5 0 015 5c0 2.5-2 5-5 5-2.5 0-5-2.5-5-5 0-3 2-5 5-5z"/></svg>;
    case "Fee Overview":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}>
        <path d="M3 2h10v12H3V2zm1 1v10h8V3H4zm2 2h4v1H6V5zm0 2h4v1H6V7zm0 2h2v1H6V9z"/>
      </svg>;
    case "Fee Structure":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}>
        <path d="M2 1h12v3H2V1zm1 1v1h10V2H3zm-1 4h12v3H2V6zm1 1v1h10V7H3zm-1 4h12v3H2v-3zm1 1v1h10v-1H3z"/>
      </svg>;
    case "Student Fee Management":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}>
        <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3zm6.5-7a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm0 1a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM2 2.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5zm0 2a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5z"/>
      </svg>;
    case "Profile":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-2 1a5 5 0 00-5 5h14a5 5 0 00-5-5H6z" /></svg>;
    default:
      return null;
  }
}

function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("adminSidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const isActive = (linkPath) => {
    if (linkPath === "/admin/dashboard") return pathname === linkPath;
    return pathname.startsWith(linkPath);
  };

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", badge: "Live" },
    { path: "/admin/students", label: "Students" },
    { path: "/admin/mentors", label: "Mentors" },
    { path: "/admin/reviewers", label: "Reviewers" },
    { path: "/admin/courses", label: "Courses" },
    { path: "/admin/modules", label: "Modules" },
    { path: "/admin/batches", label: "Batches" },
    { path: "/admin/review-folders", label: "Review Folders" },
    { path: "/admin/attendance", label: "Attendance" },
    { path: "/admin/accounts", label: "Accounts" },
    { path: "/admin/fee-structure", label: "Fee Structure" },
    { path: "/admin/fee-analytics", label: "Fee Analytics" },
    { path: "/admin/fee-overview", label: "Fee Overview" },
    { path: "/admin/student-fee-management", label: "Student Fee Management" }, // ← new link
    { path: "/admin/messages", label: "Messages" },
    { path: "/admin/review-sheets", label: "Review Sheets" },
    { path: "/admin/profile", label: "Profile" },
  ];

  return (
    <aside
      className={`bg-white border-r border-gray-200 flex-col h-screen sticky top-0 font-sans transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
      style={{ display: "flex" }}
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
                <p className="text-gray-800 font-semibold text-sm">ZIAS Admin</p>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Portal</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-xs leading-tight">
                ZA
              </div>
              <span className="text-[10px] text-gray-500 font-medium mt-1">ZIAS</span>
            </div>
          )}
        </button>
        {!isCollapsed && <NotificationBell />}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider px-3 pb-1">
            Overview
          </div>
        )}
        {navItems.slice(0, 1).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            label={item.label}
            active={isActive(item.path)}
            badge={item.badge}
            collapsed={isCollapsed}
          />
        ))}
        {!isCollapsed && (
          <div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider px-3 pt-3 pb-1">
            Management
          </div>
        )}
        {navItems.slice(1).map((item) => (
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
            AD
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-gray-800 text-sm font-medium truncate">Admin User</p>
              <p className="text-gray-400 text-xs">Super Admin</p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            clearAuthStorage();
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

export default Sidebar;
