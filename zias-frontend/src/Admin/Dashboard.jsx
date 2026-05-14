// src/Admin/Dashboard.jsx – without Monthly Registrations & Cumulative Trends
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { toast } from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getFriendlyErrorMessage = (err, defaultMsg = "An error occurred") => {
  if (!err?.response) return "Network error. Please check your connection.";
  const status = err.response.status;
  if (status >= 500) return "Service temporarily unavailable. Please try again later.";
  if (status === 404) return "Resource not found.";
  if (status === 400) return "Invalid request. Please try again.";
  if (status === 401 || status === 403) return "You are not authorized. Please log in again.";
  return err.response?.data?.detail || err.response?.data?.message || defaultMsg;
};

const extractArray = (response) => {
  const data = response.data.results || response.data;
  return Array.isArray(data) ? data : [];
};

const getCount = (response) => {
  if (response.data && typeof response.data.count === "number") return response.data.count;
  return extractArray(response).length;
};

// ─── Animated Counter Hook ────────────────────────────────────────────────────

function useAnimatedCounter(target, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

// ─── Live Clock (light theme) ───────────────────────────────────────────────

function LiveClock({ sessionStart }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.floor((now - sessionStart) / 1000);
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2 font-semibold">Live Clock</p>
        <p className="text-4xl sm:text-5xl font-bold tracking-tight font-mono text-gray-800">{timeStr}</p>
        <p className="text-gray-400 text-sm mt-2">{dateStr}</p>
      </div>
      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-gray-400 text-[11px] uppercase tracking-widest mb-1 font-semibold">Session Timer</p>
        <p className="text-3xl font-mono font-bold text-emerald-600">{hh}:{mm}:{ss}</p>
        <p className="text-gray-400 text-xs mt-1">Active since login</p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const AnimatedStatCard = ({ label, value, icon, color }) => {
  const displayed = useAnimatedCounter(value);
  const colors = {
    blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   icon: "bg-blue-100 text-blue-600" },
    green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  icon: "bg-green-100 text-green-600" },
    yellow: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  icon: "bg-amber-100 text-amber-600" },
    purple: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", icon: "bg-violet-100 text-violet-600" },
    rose:   { bg: "bg-rose-50",   border: "border-rose-200",   text: "text-rose-700",   icon: "bg-rose-100 text-rose-600" },
  };
  const c = colors[color];
  return (
    <div className={`flex-1 min-w-[150px] rounded-xl p-4 sm:p-5 border ${c.bg} ${c.border} flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center shrink-0 text-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-3xl font-bold tabular-nums ${c.text}`}>{displayed}</p>
      </div>
    </div>
  );
};

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
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${colors[color]}`}>
      <span className="text-base">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-lg">
        <p className="text-gray-500 text-xs mb-0.5">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold" style={{ color: p.color || p.fill || "#374151" }}>
            {p.name ? `${p.name}: ` : ""}{p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatusDot = ({ ok }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-green-600" : "bg-red-600"}`} />
);

const ChartCard = ({ title, badge, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
    <div className="flex items-center justify-between mb-5">
      <p className="text-gray-600 text-xs uppercase tracking-widest font-semibold">{title}</p>
      {badge && (
        <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

const LoadingBox = ({ height = 280 }) => (
  <div className={`flex items-center justify-center text-gray-400 text-sm`} style={{ height }}>
    <div className="flex flex-col items-center gap-2">
      <svg className="w-6 h-6 animate-spin text-gray-300" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span>Loading...</span>
    </div>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionStart = useRef(new Date());

  const [stats, setStats] = useState({ students: 0, mentors: 0, reviewers: 0, courses: 0, batches: 0 });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiOk, setApiOk] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetched = useRef(false);
  const adminName = user?.first_name || user?.username || "Admin";

  const fetchData = async (showToast = false) => {
    try {
      setLoading(true);
      const [studentsRes, mentorsRes, reviewersRes, coursesRes, batchesRes] = await Promise.all([
        API.get("students/"),
        API.get("mentors/"),
        API.get("reviewers/"),
        API.get("courses/"),
        API.get("batches/"),
      ]);
      setStats({
        students:  getCount(studentsRes),
        mentors:   getCount(mentorsRes),
        reviewers: getCount(reviewersRes),
        courses:   getCount(coursesRes),
        batches:   getCount(batchesRes),
      });
      setApiOk(true);
      setLastUpdated(new Date());
      if (showToast) toast.success("Dashboard refreshed");
    } catch (err) {
      console.warn(err);
      toast.error(getFriendlyErrorMessage(err, "Failed to load dashboard data"));
      setApiOk(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchData();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // Real chart data
  const barData = [
    { name: "Students",  value: stats.students,  fill: "#3b82f6" },
    { name: "Mentors",   value: stats.mentors,   fill: "#10b981" },
    { name: "Reviewers", value: stats.reviewers, fill: "#f59e0b" },
    { name: "Courses",   value: stats.courses,   fill: "#8b5cf6" },
    { name: "Batches",   value: stats.batches,   fill: "#ec4899" },
  ];

  const pieData = [
    { name: "Students",  value: stats.students  || 0, fill: "#3b82f6" },
    { name: "Mentors",   value: stats.mentors   || 0, fill: "#10b981" },
    { name: "Reviewers", value: stats.reviewers || 0, fill: "#f59e0b" },
  ];
  const pieDataSafe = pieData.every(p => p.value === 0)
    ? pieData.map(p => ({ ...p, value: 1 }))
    : pieData;

  const total = Math.max(stats.students + stats.mentors + stats.reviewers + stats.courses + stats.batches, 1);
  const radarData = [
    { subject: "Students",  A: Math.round((stats.students  / total) * 100) },
    { subject: "Mentors",   A: Math.round((stats.mentors   / total) * 100) },
    { subject: "Reviewers", A: Math.round((stats.reviewers / total) * 100) },
    { subject: "Courses",   A: Math.round((stats.courses   / total) * 100) },
    { subject: "Batches",   A: Math.round((stats.batches   / total) * 100) },
  ];

  return (
    <div className="min-h-screen w-screen bg-gray-50 text-gray-800 p-4 sm:p-6 md:p-8 overflow-x-hidden">

      {/* Header */}
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
            onClick={() => fetchData(true)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
        <AnimatedStatCard label="Students"  value={stats.students}  icon="🎓" color="blue"   />
        <AnimatedStatCard label="Mentors"   value={stats.mentors}   icon="👨‍🏫" color="green"  />
        <AnimatedStatCard label="Reviewers" value={stats.reviewers} icon="📋" color="yellow" />
        <AnimatedStatCard label="Courses"   value={stats.courses}   icon="📚" color="purple" />
        <AnimatedStatCard label="Batches"   value={stats.batches}   icon="🎓" color="rose"   />
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

      {/* Row 1: Live Clock + Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LiveClock sessionStart={sessionStart.current} />

        <ChartCard title="Overview" badge="Live">
          {loading ? <LoadingBox height={280} /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barSize={36} maxBarSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Donut + Radar (both full width on smaller screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="User Distribution" badge="Live">
          {loading ? <LoadingBox height={300} /> : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieDataSafe} cx="50%" cy="47%" innerRadius={75} outerRadius={115}
                    paddingAngle={4} dataKey="value" stroke="none">
                    {pieDataSafe.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={10}
                    formatter={(v) => <span className="text-sm text-gray-600 font-medium">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 text-center font-medium -mt-1">
                Total users: {stats.students + stats.mentors + stats.reviewers}
              </p>
            </>
          )}
        </ChartCard>

        <ChartCard title="Platform Balance" badge="Live">
          {loading ? <LoadingBox height={300} /> : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={105}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} tickCount={4} />
                  <Radar name="Share %" dataKey="A" stroke="#6366f1" strokeWidth={2.5}
                    fill="#6366f1" fillOpacity={0.18} dot={{ r: 4, fill: "#6366f1" }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-gray-400 text-center font-medium mt-1">
                % share across all entities (real data)
              </p>
            </>
          )}
        </ChartCard>
      </div>

    </div>
  );
}

export default Dashboard;