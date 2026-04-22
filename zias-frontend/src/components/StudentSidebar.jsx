// src/components/StudentSidebar.jsx
import { Link, useLocation } from "react-router-dom";

function StudentSidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/student/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/student/review-sheet", label: "Review Sheet", icon: "📋" },
    { path: "/chat", label: "Chat", icon: "💬" },
    { path: "/student/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Student Panel</h2>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              isActive(item.path)
                ? "bg-green-600 text-white"
                : "text-gray-700 hover:bg-green-50 hover:text-green-700"
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