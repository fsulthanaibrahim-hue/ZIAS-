// src/Admin/Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

// ── Stat Card (5 boxes) – light theme ──
const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    blue:   { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    icon: "bg-blue-100 text-blue-600" },
    green:  { bg: "bg-green-50",   border: "border-green-200",   text: "text-green-700",   icon: "bg-green-100 text-green-600" },
    yellow: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   icon: "bg-amber-100 text-amber-600" },
    purple: { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  icon: "bg-violet-100 text-violet-600" },
    rose:   { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    icon: "bg-rose-100 text-rose-600" },
  };
  const c = colors[color];
  return (
    <div className={`flex-1 min-w-[150px] rounded-xl p-4 sm:p-5 border ${c.bg} ${c.border} flex items-center gap-3 sm:gap-4`}>
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${c.icon} flex items-center justify-center shrink-0 text-lg sm:text-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-2xl sm:text-3xl font-bold ${c.text}`}>{value}</p>
      </div>
    </div>
  );
};

// ── Quick Action Button – light theme ──
const ActionBtn = ({ label, icon, onClick, color = "blue" }) => {
  const colors = {
    blue:   "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700",
    green:  "bg-green-50 hover:bg-green-100 border-green-200 text-green-700",
    yellow: "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700",
    purple: "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700",
    rose:   "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700",
    violet: "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${colors[color]}`}
    >
      <span className="text-base">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

// ── Custom Tooltip – light theme ──
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 shadow-lg">
        <p className="text-gray-500 text-xs mb-0.5">{label}</p>
        <p className="font-bold text-gray-800">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// ── Status Dot – light theme ──
const StatusDot = ({ ok }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-green-600" : "bg-red-600"}`} />
);

function Dashboard() {
  const [stats, setStats] = useState({ students: 0, mentors: 0, reviewers: 0, courses: 0, batches: 0 });
  const [adminName, setAdminName] = useState("Admin");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notification, setNotification] = useState(null);
  const [apiOk, setApiOk] = useState(true);
  const [activity, setActivity] = useState([]);
  const navigate = useNavigate();

  const fetched = useRef(false);

  useEffect(() => {
    API.get("users/me/")
      .then(r => setAdminName(r.data.first_name || r.data.username || "Admin"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchData = async () => {
      try {
        const [studentsRes, mentorsRes, reviewersRes, coursesRes, batchesRes] = await Promise.all([
          API.get("students/"),
          API.get("mentors/"),
          API.get("reviewers/"),
          API.get("courses/"),
          API.get("batches/"),
        ]);
        setStats({
          students: studentsRes.data.length,
          mentors: mentorsRes.data.length,
          reviewers: reviewersRes.data.length,
          courses: coursesRes.data.length,
          batches: batchesRes.data.length,
        });
        setApiOk(true);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
        setApiOk(false);
      }
    };
    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      const [studentsRes, mentorsRes, reviewersRes, coursesRes, batchesRes] = await Promise.all([
        API.get("students/"),
        API.get("mentors/"),
        API.get("reviewers/"),
        API.get("courses/"),
        API.get("batches/"),
      ]);
      setStats({
        students: studentsRes.data.length,
        mentors: mentorsRes.data.length,
        reviewers: reviewersRes.data.length,
        courses: coursesRes.data.length,
        batches: batchesRes.data.length,
      });
      setApiOk(true);
      setLastUpdated(new Date());
      setNotification("Data refreshed");
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      setApiOk(false);
      setNotification("Refresh failed");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const chartData = [
    { name: "Students",  value: stats.students,  fill: "#3b82f6" },
    { name: "Mentors",   value: stats.mentors,   fill: "#10b981" },
    { name: "Reviewers", value: stats.reviewers, fill: "#f59e0b" },
    { name: "Courses",   value: stats.courses,   fill: "#8b5cf6" },
    { name: "Batches",   value: stats.batches,   fill: "#ec4899" },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen w-screen bg-gray-50 text-gray-800 p-4 sm:p-6 md:p-8 overflow-x-hidden">
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold">
          {notification}
        </div>
      )}

      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-gray-500 text-xs sm:text-sm font-medium">{greeting()},</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{adminName}</h1>
          <p className="text-gray-400 text-xs mt-0.5 font-medium">Admin Dashboard</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <StatusDot ok={apiOk} />
            {apiOk ? "All systems operational" : "API unreachable"}
          </div>
          {lastUpdated && (
            <p className="text-gray-400 text-xs font-medium">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <button
            onClick={handleRefresh}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Students"   value={stats.students}  icon="🎓" color="blue"   />
        <StatCard label="Mentors"    value={stats.mentors}   icon="👨‍🏫" color="green"  />
        <StatCard label="Reviewers"  value={stats.reviewers} icon="📋" color="yellow" />
        <StatCard label="Courses"    value={stats.courses}   icon="📚" color="purple" />
        <StatCard label="Batches"    value={stats.batches}   icon="🎓" color="rose"   />
      </div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 font-semibold">Quick Actions</p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <ActionBtn label="Manage Students"  icon="🎓" color="blue"   onClick={() => navigate("/admin/students")}  />
          <ActionBtn label="Manage Mentors"   icon="👨‍🏫" color="green"  onClick={() => navigate("/admin/mentors")}   />
          <ActionBtn label="Manage Reviewers" icon="📋" color="yellow" onClick={() => navigate("/admin/reviewers")} />
          <ActionBtn label="Manage Courses"   icon="📚" color="purple" onClick={() => navigate("/admin/courses")}   />
          <ActionBtn label="Manage Batches"   icon="🎓" color="rose"   onClick={() => navigate("/admin/batches")}   />
          <ActionBtn label="View Messages"    icon="💬" color="violet" onClick={() => navigate("/admin/messages")}  />
        </div>
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-4 font-semibold">Overview</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28} maxBarSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 font-semibold">System Status</p>
            <div className="space-y-2.5">
              {[
                { label: "API Server", ok: apiOk },
                { label: "Student Service", ok: stats.students >= 0 },
                { label: "Mentor Service", ok: stats.mentors >= 0 },
                { label: "Reviewer Service", ok: stats.reviewers >= 0 },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <StatusDot ok={ok} />
                    <span className={`text-xs font-semibold ${ok ? "text-green-700" : "text-red-700"}`}>{ok ? "Operational" : "Down"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm flex-1">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 font-semibold">Recent Activity</p>
            {activity.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent activity yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {activity.map(a => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <span className="text-base mt-0.5">📩</span>
                    <div>
                      <p className="text-gray-700 font-medium">{a.text}</p>
                      <p className="text-gray-400 text-xs font-medium">{a.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;