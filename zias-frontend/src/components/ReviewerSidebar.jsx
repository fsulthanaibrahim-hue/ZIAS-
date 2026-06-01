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
    case "Assignments":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M4 1.5H3a1 1 0 0 0-1 1V14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2.5a1 1 0 0 0-1-1h-1M4 1.5V3h8V1.5M4 1.5v1M12 1.5V3" stroke="currentColor" strokeWidth="1"/><path d="M5 5h6v1H5V5zm0 3h6v1H5V8zm0 3h4v1H5v-1z" /></svg>;
    case "Profile":
      return <svg viewBox="0 0 16 16" fill="currentColor" className={svgClass}><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-2 1a5 5 0 00-5 5h14a5 5 0 00-5-5H6z" /></svg>;
    default:
      // Fallback icon for any unknown menu item (prevents visual break)
      return <span className="w-4 h-4 block rounded bg-gray-300" />;
  }
}

function ReviewerSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("reviewerSidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("reviewerSidebarCollapsed", isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const isActive = (linkPath) => {
    if (linkPath === "/reviewer/dashboard") return pathname === linkPath;
    return pathname.startsWith(linkPath);
  };

  const navItems = [
    { path: "/reviewer/dashboard", label: "Dashboard" },
    { path: "/reviewer/assignments", label: "Assignments" },
    { path: "/reviewer/profile", label: "Profile" },
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
                <p className="text-gray-800 font-semibold text-sm">ZIAS Reviewer</p>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Portal</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-xs leading-tight">
                ZR
              </div>
              <span className="text-[10px] text-gray-500 font-medium mt-1">ZIAS</span>
            </div>
          )}
        </button>

        {/* NotificationBell auto-detects role – no props needed */}
        {!isCollapsed && <NotificationBell />}
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
            RV
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-gray-800 text-sm font-medium truncate">Reviewer User</p>
              <p className="text-gray-400 text-xs">Reviewer</p>
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

export default ReviewerSidebar;