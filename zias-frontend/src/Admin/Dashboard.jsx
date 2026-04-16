import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

// ── Stat Card ───
const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    blue:   { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    icon: "bg-blue-500/20"    },
    green:  { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "bg-emerald-500/20" },
    yellow: { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   icon: "bg-amber-500/20"   },
    purple: { bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-400",  icon: "bg-violet-500/20"  },
  };
  const c = colors[color];
  return (
    <div className={`flex-1 min-w-[150px] rounded-xl p-4 sm:p-5 border ${c.bg} ${c.border} flex items-center gap-3 sm:gap-4`}>
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${c.icon} flex items-center justify-center shrink-0 text-lg sm:text-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-white/55 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-2xl sm:text-3xl font-bold ${c.text}`}>{value}</p>
      </div>
    </div>
  );
};

// ── Quick Action Button ────
const ActionBtn = ({ label, icon, onClick, color = "blue" }) => {
  const colors = {
    blue:   "bg-blue-600/20 hover:bg-blue-600/40 border-blue-500/30 text-blue-300",
    green:  "bg-emerald-600/20 hover:bg-emerald-600/40 border-emerald-500/30 text-emerald-300",
    yellow: "bg-amber-600/20 hover:bg-amber-600/40 border-amber-500/30 text-amber-300",
    purple: "bg-violet-600/20 hover:bg-violet-600/40 border-violet-500/30 text-violet-300",
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

// ── Custom Tooltip ───
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2538] border border-white/10 rounded-lg px-3 py-2 text-sm text-white shadow-xl">
        <p className="text-white/60 text-xs mb-0.5">{label}</p>
        <p className="font-bold text-white">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// ── Status Dot ───
const StatusDot = ({ ok }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
);

// ── Main Component ───
function Dashboard() {
  const [stats, setStats]                   = useState({ students: 0, mentors: 0, reviewers: 0 });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [prevUnread, setPrevUnread]         = useState(0);
  const [adminName, setAdminName]           = useState("Admin");
  const [lastUpdated, setLastUpdated]       = useState(null);
  const [notification, setNotification]     = useState(null);
  const [apiOk, setApiOk]                  = useState(true);
  const [activity, setActivity]             = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("users/me/").then(r => {
      setAdminName(r.data.first_name || r.data.username || "Admin");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, mentorsRes, reviewersRes, messagesRes] = await Promise.all([
          API.get("students/"),
          API.get("mentors/"),
          API.get("reviewers/"),
          API.get("unread-messages/"),
        ]);
        const s = studentsRes.data.length;
        const m = mentorsRes.data.length;
        const r = reviewersRes.data.length;
        setStats({ students: s, mentors: m, reviewers: r });

        const newUnread = messagesRes.data.unread_count;
        setUnreadMessages(newUnread);
        setApiOk(true);

        if (prevUnread !== 0 && newUnread > prevUnread) {
          setNotification(`📩 ${newUnread} unread message${newUnread > 1 ? "s" : ""}`);
          setTimeout(() => setNotification(null), 5000);
          setActivity(prev => [
            { id: Date.now(), text: `${newUnread - prevUnread} new message(s) received`, time: new Date(), type: "message" },
            ...prev.slice(0, 9),
          ]);
        }
        setPrevUnread(newUnread);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
        setApiOk(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [prevUnread]);

  const chartData = [
    { name: "Students",  value: stats.students,  fill: "#3b82f6" },
    { name: "Mentors",   value: stats.mentors,   fill: "#10b981" },
    { name: "Reviewers", value: stats.reviewers, fill: "#f59e0b" },
    { name: "Messages",  value: unreadMessages,  fill: "#8b5cf6" },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen w-screen bg-[#0f1623] text-white p-4 sm:p-6 md:p-8 overflow-x-hidden">
      {/* Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-violet-600/90 text-white px-4 py-2.5 rounded-xl shadow-2xl text-sm font-semibold backdrop-blur">
          {notification}
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-white/50 text-xs sm:text-sm font-medium">{greeting()},</p>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{adminName}</h1>
          <p className="text-white/40 text-xs mt-0.5 font-medium">Admin Dashboard</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-white/50 font-medium">
            <StatusDot ok={apiOk} />
            {apiOk ? "All systems operational" : "API unreachable"}
          </div>
          {lastUpdated && (
            <p className="text-white/35 text-xs font-medium">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Students"        value={stats.students}  icon="🎓" color="blue"   />
        <StatCard label="Mentors"         value={stats.mentors}   icon="👨‍🏫" color="green"  />
        <StatCard label="Reviewers"       value={stats.reviewers} icon="📋" color="yellow" />
        <StatCard label="Unread Messages" value={unreadMessages}  icon="💬" color="purple" />
      </div>

      {/* ── Quick Actions ── */}
      <div className="mb-6 sm:mb-8">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3 font-semibold">Quick Actions</p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <ActionBtn label="Manage Students"  icon="🎓" color="blue"   onClick={() => navigate("/admin/students")}  />
          <ActionBtn label="Manage Mentors"   icon="👨‍🏫" color="green"  onClick={() => navigate("/admin/mentors")}   />
          <ActionBtn label="Manage Reviewers" icon="📋" color="yellow" onClick={() => navigate("/admin/reviewers")} />
          <ActionBtn label="View Messages"    icon="💬" color="purple" onClick={() => navigate("/admin/messages")}  />
        </div>
      </div>

      {/* ── Chart + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart – fixed: numeric height on ResponsiveContainer */}
        <div className="bg-[#1a2538] rounded-xl border border-white/10 p-4 sm:p-5">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-4 font-semibold">Overview</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28} maxBarSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.40)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System Status + Activity */}
        <div className="flex flex-col gap-4">
          {/* System Status */}
          <div className="bg-[#1a2538] rounded-xl border border-white/10 p-4 sm:p-5">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-3 font-semibold">System Status</p>
            <div className="space-y-2.5">
              {[
                { label: "API Server",      ok: apiOk },
                { label: "Student Service", ok: stats.students >= 0 },
                { label: "Mentor Service",  ok: stats.mentors >= 0 },
                { label: "Message Service", ok: unreadMessages >= 0 },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-white/65 font-medium">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <StatusDot ok={ok} />
                    <span className={`text-xs font-semibold ${ok ? "text-emerald-400" : "text-red-400"}`}>
                      {ok ? "Operational" : "Down"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#1a2538] rounded-xl border border-white/10 p-4 sm:p-5 flex-1">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-3 font-semibold">Recent Activity</p>
            {activity.length === 0 ? (
              <p className="text-white/35 text-sm">No recent activity yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {activity.map(a => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <span className="text-base mt-0.5">📩</span>
                    <div>
                      <p className="text-white/80 font-medium">{a.text}</p>
                      <p className="text-white/40 text-xs font-medium">
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
    </div>
  );
}

export default Dashboard;
