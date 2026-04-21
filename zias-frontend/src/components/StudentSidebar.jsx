// src/components/StudentSidebar.jsx
import { Link, useLocation } from "react-router-dom";

function StudentSidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/student/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/student/review-sheet", label: "Review Sheet", icon: "📋" },
    { path: "/chat", label: "Chat", icon: "💬" },          // 👈 Chat link
    { path: "/student/profile", label: "Profile", icon: "👤" },
    { path: "/change-password", label: "Change Password", icon: "🔒" },
  ];

  return (
    <aside className="w-64 bg-[#0d1117] border-r border-[#21262d] flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div className="p-4 border-b border-[#21262d]">
        <h2 className="text-xl font-bold text-[#e6edf3]">Student Panel</h2>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              isActive(item.path)
                ? "bg-[#388bfd] text-white"
                : "text-[#7d8590] hover:bg-[#161b22] hover:text-[#e6edf3]"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default StudentSidebar;