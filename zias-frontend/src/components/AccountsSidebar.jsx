import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaMoneyBillWave, FaFileInvoice, FaUsers, FaUserCircle, FaSignOutAlt } from "react-icons/fa";

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
  switch (label) {
    case "Dashboard":
      return <FaTachometerAlt className="w-4 h-4" />;
    case "Payments":
      return <FaMoneyBillWave className="w-4 h-4" />;
    case "Invoices":
      return <FaFileInvoice className="w-4 h-4" />;
    case "Students":
      return <FaUsers className="w-4 h-4" />;
    case "Profile":
      return <FaUserCircle className="w-4 h-4" />;
    default:
      return null;
  }
}

function AccountsSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("accountsSidebarCollapsed");
    return saved === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto‑collapse on small screens (<768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const isActive = (linkPath) => {
    if (linkPath === "/accounts/dashboard") return pathname === linkPath;
    return pathname.startsWith(linkPath);
  };

  const navItems = [
    { path: "/accounts/dashboard", label: "Dashboard" },
    { path: "/accounts/payments", label: "Payments" },
    { path: "/accounts/invoices", label: "Invoices" },
    { path: "/accounts/students", label: "Students" },
    { path: "/accounts/profile", label: "Profile" },
  ];

  const overviewItems = navItems.filter(item => item.label === "Dashboard");
  const managementItems = navItems.filter(item => item.label !== "Dashboard");

  const sidebarWidth = isCollapsed ? "5rem" : "16rem";
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.full_name || user?.username || "Accounts User";
  const userRole = "Accounts";

  return (
    <>
      {/* Hamburger button for mobile */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-green-600 text-white p-2 rounded-lg shadow-md"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && window.innerWidth < 768 && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          transition: "width 0.3s ease, transform 0.3s ease",
          transform: window.innerWidth < 768 && !mobileOpen ? "translateX(-100%)" : "none",
        }}
        className="bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 font-sans overflow-y-auto z-45"
      >
        {/* Header – without notification bell */}
        <div className="p-3 border-b border-gray-200 flex items-center justify-between gap-2">
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-3 focus:outline-none cursor-pointer hover:opacity-80 transition-opacity"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <div className="text-left">
                  <p className="text-gray-800 font-semibold text-sm">ZIAS Accounts</p>
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
          {/* No NotificationBell here */}
        </div>

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

        <div className={`p-3 border-t border-gray-200 transition-all ${isCollapsed ? "text-center" : ""}`}>
          <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xs font-bold">
              AU
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
    </>
  );
}

export default AccountsSidebar;