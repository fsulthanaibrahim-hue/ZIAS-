// src/Admin/Dashboard.jsx
// Features: Animated counters, Heatmap calendar, Live clock & session timer, Confetti on milestone
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti({ active, onDone }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#f97316"];
    const pieces = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      vr: (Math.random() - 0.5) * 0.15,
      opacity: 1,
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      let alive = 0;
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (frame > 90) p.opacity -= 0.012;
        if (p.y < canvas.height && p.opacity > 0) alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive > 0) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDone?.();
      }
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
    />
  );
}

// ─── Heatmap Calendar ─────────────────────────────────────────────────────────

function HeatmapCalendar() {
  const today = new Date();
  const days = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (83 - i));
    return {
      date: d,
      count: Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 8),
    };
  });

  const getColor = (count) => {
    if (count === 0) return "bg-gray-100";
    if (count <= 2) return "bg-blue-200";
    if (count <= 4) return "bg-blue-400";
    if (count <= 6) return "bg-blue-600";
    return "bg-blue-800";
  };

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="w-4 text-[9px] text-gray-400 font-medium text-center">{d}</div>
        ))}
      </div>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                title={`${day.date.toDateString()}: ${day.count} actions`}
                className={`w-4 h-4 rounded-sm ${getColor(day.count)} cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-[9px] text-gray-400">Less</span>
        {["bg-gray-100", "bg-blue-200", "bg-blue-400", "bg-blue-600", "bg-blue-800"].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-gray-400">More</span>
      </div>
    </div>
  );
}

// ─── Live Clock & Session Timer ───────────────────────────────────────────────

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
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 sm:p-5 text-white shadow-lg flex flex-col justify-between">
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-semibold">Live Clock</p>
        <p className="text-3xl sm:text-4xl font-bold tracking-tight font-mono">{timeStr}</p>
        <p className="text-slate-400 text-xs mt-1">{dateStr}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-0.5 font-semibold">Session Timer</p>
        <p className="text-2xl font-mono font-bold text-emerald-400">{hh}:{mm}:{ss}</p>
        <p className="text-slate-500 text-[10px] mt-0.5">Active since login</p>
      </div>
    </div>
  );
}

// ─── Milestones ───────────────────────────────────────────────────────────────

const MILESTONES = [10, 25, 50, 100, 200, 500];

// ─── Animated Stat Card ───────────────────────────────────────────────────────

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
    <div className={`flex-1 min-w-[150px] rounded-xl p-4 sm:p-5 border ${c.bg} ${c.border} flex items-center gap-3 sm:gap-4`}>
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${c.icon} flex items-center justify-center shrink-0 text-lg sm:text-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${c.text}`}>{displayed}</p>
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
    <button onClick={onClick} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${colors[color]}`}>
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
  <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold">{title}</p>
      {badge && <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{badge}</span>}
    </div>
    {children}
  </div>
);

// ─── Mock time-series ─────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const currentMonth = new Date().getMonth();

const generateGrowthData = (base, variance) =>
  MONTHS.slice(0, currentMonth + 1).map((month, i) => ({
    month,
    value: Math.max(0, Math.round(base + i * variance + (Math.random() - 0.4) * variance * 2)),
  }));

const mockGrowthData = {
  students: generateGrowthData(10, 8),
  mentors:  generateGrowthData(3,  2),
  courses:  generateGrowthData(2,  1.5),
  batches:  generateGrowthData(1,  1),
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionStart = useRef(new Date());

  const [stats, setStats] = useState({ students: 0, mentors: 0, reviewers: 0, courses: 0, batches: 0 });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiOk, setApiOk] = useState(true);
  const [activity] = useState([]);
  const [lineMetric, setLineMetric] = useState("students");
  const [confettiActive, setConfettiActive] = useState(false);
  const [milestoneMsg, setMilestoneMsg] = useState(null);
  const fetched = useRef(false);
  const firedMilestones = useRef(new Set());

  const adminName = user?.first_name || user?.username || "Admin";

  // ── Milestone checker ──
  useEffect(() => {
    const checks = [
      { key: "students",  val: stats.students,  label: "Students" },
      { key: "mentors",   val: stats.mentors,   label: "Mentors" },
      { key: "courses",   val: stats.courses,   label: "Courses" },
    ];
    for (const { key, val, label } of checks) {
      for (const m of MILESTONES) {
        const id = `${key}-${m}`;
        if (val >= m && !firedMilestones.current.has(id)) {
          firedMilestones.current.add(id);
          setConfettiActive(true);
          setMilestoneMsg(`🎉 ${label} reached ${m}!`);
          toast.success(`🎉 Milestone! ${label} hit ${m}`, { duration: 4000 });
          setTimeout(() => setMilestoneMsg(null), 4000);
          return;
        }
      }
    }
  }, [stats]);

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
        students:  getCount(studentsRes),
        mentors:   getCount(mentorsRes),
        reviewers: getCount(reviewersRes),
        courses:   getCount(coursesRes),
        batches:   getCount(batchesRes),
      });
      setApiOk(true);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn(err);
      toast.error(getFriendlyErrorMessage(err, "Failed to load dashboard data"));
      setApiOk(false);
    }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
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
        students:  getCount(studentsRes),
        mentors:   getCount(mentorsRes),
        reviewers: getCount(reviewersRes),
        courses:   getCount(coursesRes),
        batches:   getCount(batchesRes),
      });
      setApiOk(true);
      setLastUpdated(new Date());
      toast.success("Dashboard refreshed");
    } catch (err) {
      console.warn(err);
      toast.error(getFriendlyErrorMessage(err, "Refresh failed"));
      setApiOk(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // ── Chart data ──
  const barData = [
    { name: "Students",  value: stats.students,  fill: "#3b82f6" },
    { name: "Mentors",   value: stats.mentors,   fill: "#10b981" },
    { name: "Reviewers", value: stats.reviewers, fill: "#f59e0b" },
    { name: "Courses",   value: stats.courses,   fill: "#8b5cf6" },
    { name: "Batches",   value: stats.batches,   fill: "#ec4899" },
  ];

  const pieData = [
    { name: "Students",  value: stats.students  || 1, fill: "#3b82f6" },
    { name: "Mentors",   value: stats.mentors   || 1, fill: "#10b981" },
    { name: "Reviewers", value: stats.reviewers || 1, fill: "#f59e0b" },
  ];

  const lineData = mockGrowthData[lineMetric] || [];

  const areaData = MONTHS.slice(0, currentMonth + 1).map((month, i) => ({
    month,
    Students: Math.max(0, Math.round(10 + i * 8  + (Math.random() - 0.4) * 10)),
    Mentors:  Math.max(0, Math.round(3  + i * 2  + (Math.random() - 0.4) * 3)),
    Courses:  Math.max(0, Math.round(2  + i * 1.5 + (Math.random() - 0.4) * 2)),
  }));

  const total = Math.max(stats.students + stats.mentors + stats.reviewers + stats.courses + stats.batches, 1);
  const radarData = [
    { subject: "Students",  A: Math.min(100, Math.round((stats.students  / total) * 500)) },
    { subject: "Mentors",   A: Math.min(100, Math.round((stats.mentors   / total) * 500)) },
    { subject: "Reviewers", A: Math.min(100, Math.round((stats.reviewers / total) * 500)) },
    { subject: "Courses",   A: Math.min(100, Math.round((stats.courses   / total) * 500)) },
    { subject: "Batches",   A: Math.min(100, Math.round((stats.batches   / total) * 500)) },
  ];

  const LINE_METRICS = [
    { key: "students", label: "Students", color: "#3b82f6" },
    { key: "mentors",  label: "Mentors",  color: "#10b981" },
    { key: "courses",  label: "Courses",  color: "#8b5cf6" },
    { key: "batches",  label: "Batches",  color: "#ec4899" },
  ];
  const activeMetric = LINE_METRICS.find((m) => m.key === lineMetric);

  return (
    <div className="min-h-screen w-screen bg-gray-50 text-gray-800 p-4 sm:p-6 md:p-8 overflow-x-hidden">

      {/* Confetti canvas */}
      <Confetti active={confettiActive} onDone={() => setConfettiActive(false)} />

      {/* Milestone Banner */}
      {milestoneMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9998] bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-bold animate-bounce">
          {milestoneMsg}
        </div>
      )}

      {/* ── Header ── */}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Animated Stat Cards ── */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
        <AnimatedStatCard label="Students"  value={stats.students}  icon="🎓" color="blue"   />
        <AnimatedStatCard label="Mentors"   value={stats.mentors}   icon="👨‍🏫" color="green"  />
        <AnimatedStatCard label="Reviewers" value={stats.reviewers} icon="📋" color="yellow" />
        <AnimatedStatCard label="Courses"   value={stats.courses}   icon="📚" color="purple" />
        <AnimatedStatCard label="Batches"   value={stats.batches}   icon="🎓" color="rose"   />
      </div>

      {/* ── Quick Actions ── */}
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

      {/* ── Row 1: Clock + Bar + Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <LiveClock sessionStart={sessionStart.current} />

        <ChartCard title="Overview" badge="Current">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={24} maxBarSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Distribution" badge="Donut">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={78} paddingAngle={4} dataKey="value" stroke="none">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600 font-medium">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 2: Line + Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Monthly Growth" badge="Mock data">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {LINE_METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setLineMetric(m.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  lineMetric === m.key ? "text-white border-transparent shadow-sm" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                }`}
                style={lineMetric === m.key ? { backgroundColor: m.color, borderColor: m.color } : {}}
              >
                {m.label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={185}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke={activeMetric?.color || "#3b82f6"} strokeWidth={2.5}
                dot={{ r: 4, fill: activeMetric?.color || "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-400 mt-2 font-medium text-center">
            ⚠ Mock data — replace <code>mockGrowthData</code> with your monthly API
          </p>
        </ChartCard>

        <ChartCard title="Cumulative Trends" badge="Mock data">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMentors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCourses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600 font-medium">{v}</span>} />
              <Area type="monotone" dataKey="Students" stroke="#3b82f6" strokeWidth={2} fill="url(#gradStudents)" />
              <Area type="monotone" dataKey="Mentors"  stroke="#10b981" strokeWidth={2} fill="url(#gradMentors)"  />
              <Area type="monotone" dataKey="Courses"  stroke="#8b5cf6" strokeWidth={2} fill="url(#gradCourses)"  />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-400 mt-2 font-medium text-center">
            ⚠ Mock data — replace <code>areaData</code> with your monthly API
          </p>
        </ChartCard>
      </div>

      {/* ── Row 3: Radar + Heatmap + Activity (no System Status) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Platform Balance" badge="Radar">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={75}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 500 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: "#9ca3af" }} tickCount={4} />
              <Radar name="Share" dataKey="A" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.18}
                dot={{ r: 3, fill: "#6366f1" }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-400 text-center font-medium">Proportional share across all entities</p>
        </ChartCard>

        <ChartCard title="Activity Heatmap" badge="Last 12 weeks">
          <p className="text-gray-400 text-[10px] mb-3 font-medium">Daily admin actions · mock data</p>
          <HeatmapCalendar />
        </ChartCard>

        {/* Recent Activity (replaces the old status card) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm flex-1">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 font-semibold">Recent Activity</p>
          {activity.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent activity yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="text-base mt-0.5">📩</span>
                  <div>
                    <p className="text-gray-700 font-medium">{a.text}</p>
                    <p className="text-gray-400 text-xs font-medium">
                      {a.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;