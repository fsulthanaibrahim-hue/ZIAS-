// src/components/Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

function NavLink({ to, label, active, badge }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
        active
          ? "bg-green-100 text-green-700 font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <span className="w-4 h-4 flex-shrink-0">{getIcon(label)}</span>
      <span>{label}</span>
      {badge && (
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
    case "Chat":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M8 2C4.686 2 2 4.686 2 8c0 1.316.4 2.537 1.087 3.548L2 14l2.452-1.087A5.973 5.973 0 008 14c3.314 0 6-2.686 6-6s-2.686-6-6-6zm0 1c2.761 0 5 2.239 5 5s-2.239 5-5 5a4.96 4.96 0 01-2.5-.693L4 13l.693-1.5A4.96 4.96 0 013 9c0-2.761 2.239-5 5-5zM5 7h1v1H5V7zm2 0h1v1H7V7zm2 0h1v1H9V7z" /></svg>;
    default:
      return null;
  }
}

function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (linkPath) => {
    if (linkPath === "/admin/dashboard") return pathname === linkPath;
    return pathname.startsWith(linkPath);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 font-sans">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-sm">
              Z
            </div>
            <div>
              <p className="text-gray-800 font-semibold text-sm">ZIAS Admin</p>
              <p className="text-gray-400 text-[10px] uppercase tracking-wide">Portal</p>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider px-3 pb-1">
          Overview
        </div>
        <NavLink to="/admin/dashboard" label="Dashboard" active={isActive("/admin/dashboard")} badge="Live" />
        <div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider px-3 pt-3 pb-1">
          Management
        </div>
        <NavLink to="/admin/students" label="Students" active={isActive("/admin/students")} />
        <NavLink to="/admin/mentors" label="Mentors" active={isActive("/admin/mentors")} />
        <NavLink to="/admin/reviewers" label="Reviewers" active={isActive("/admin/reviewers")} />
        <NavLink to="/admin/courses" label="Courses" active={isActive("/admin/courses")} />
        <NavLink to="/admin/modules" label="Modules" active={isActive("/admin/modules")} />
        <NavLink to="/admin/batches" label="Batches" active={isActive("/admin/batches")} />
        <NavLink to="/admin/messages" label="Messages" active={isActive("/admin/messages")} />
        <NavLink to="/admin/review-sheets" label="Review Sheets" active={isActive("/admin/review-sheets")} />
        <NavLink to="/chat" label="Chat" active={pathname === "/chat"} />
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-bold">
            AD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-gray-800 text-sm font-medium truncate">Admin User</p>
            <p className="text-gray-400 text-xs">Super Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition text-sm font-medium"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" className="opacity-80">
            <path d="M2 2h7v2H4v8h5v2H2V2zm9.293 3.293l3 3a1 1 0 010 1.414l-3 3-1.414-1.414L11.586 9H6V7h5.586L10.293 5.707l1.414-1.414z" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;