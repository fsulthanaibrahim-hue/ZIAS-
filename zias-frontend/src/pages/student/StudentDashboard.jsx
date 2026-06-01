import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import StudentSidebar from "../../components/StudentSidebar";
import InOutRegister from "./InOutRegister";

/* ── Styles ──────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cal+Sans&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

  .sd-root {
    --green-50:  #f0fdf4;
    --green-100: #dcfce7;
    --green-200: #bbf7d0;
    --green-400: #4ade80;
    --green-500: #22c55e;
    --green-600: #16a34a;
    --green-700: #15803d;
    --green-800: #166534;
    --green-900: #14532d;
    --gray-50:  #f8fafc;
    --gray-100: #f1f5f9;
    --gray-200: #e2e8f0;
    --gray-300: #cbd5e1;
    --gray-400: #94a3b8;
    --gray-500: #64748b;
    --gray-600: #475569;
    --gray-700: #334155;
    --gray-800: #1e293b;
    --gray-900: #0f172a;
    font-family: 'Inter', sans-serif;
    color: var(--gray-800);
    background: var(--gray-50);
  }

  /* Stagger fade */
  .sd-f0 { animation: sdf .45s ease both; }
  .sd-f1 { animation: sdf .45s .06s ease both; }
  .sd-f2 { animation: sdf .45s .12s ease both; }
  .sd-f3 { animation: sdf .45s .18s ease both; }
  @keyframes sdf {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes sd-spin { to { transform: rotate(360deg); } }

  /* Scroll */
  .sd-scroll::-webkit-scrollbar { width: 4px; }
  .sd-scroll::-webkit-scrollbar-track { background: transparent; }
  .sd-scroll::-webkit-scrollbar-thumb { background: var(--gray-200); border-radius: 99px; }

  /* Divider */
  .sd-divider { height: 1px; background: var(--gray-100); width: 100%; }

  /* Stat chip */
  .sd-chip {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--gray-50);
    border: 1px solid var(--gray-100);
    transition: border-color .18s;
  }
  .sd-chip:hover { border-color: var(--green-200); }

  /* Progress ring transition */
  .sd-ring-fill { transition: stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1); }

  /* Progress bar */
  .sd-bar {
    height: 4px;
    background: var(--green-100);
    border-radius: 99px;
    overflow: hidden;
    margin-top: 8px;
  }
  .sd-bar-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, var(--green-400), var(--green-600));
    transition: width 1.3s cubic-bezier(.4,0,.2,1);
  }

  /* Live pulse */
  @keyframes sd-pulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.4; }
  }
  .sd-pulse { animation: sd-pulse 2s ease-in-out infinite; }

  /* Tag */
  .sd-tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 99px;
    font-size: 11px; font-weight: 600; letter-spacing: .02em;
  }
`;

function injectStyles() {
  if (document.getElementById("sd-styles")) return;
  const el = document.createElement("style");
  el.id = "sd-styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

/* ── Left panel label ────────────────────────────────────────── */
function Label({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: ".08em",
      textTransform: "uppercase", color: "var(--gray-400)", marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

/* ── Section title ───────────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 600, color: "var(--gray-700)",
      letterSpacing: "-.01em", marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

/* ── Module Marathon ─────────────────────────────────────────── */
const ModuleMarathon = ({ studentId }) => {
  const [progress, setProgress] = useState({ completedWeeks: 0, totalWeeks: 0, percentage: 0 });
  const [streak, setStreak] = useState(0);
  const [nextWeek, setNextWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      try {
        const moduleRes = await API.get("modules/student-modules/");
        const modules = moduleRes.data;
        const unlocked = modules.filter(m => !m.is_locked).length;
        const total = modules.length;
        setProgress({ completedWeeks: unlocked, totalWeeks: total, percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0 });

        const attRes = await API.get("attendance/history/");
        let records = attRes.data.results || attRes.data || [];
        records.sort((a, b) => new Date(b.check_in) - new Date(a.check_in));
        let s = 0, lastDate = null;
        const today = new Date().toDateString();
        for (let i = 0; i < records.length; i++) {
          const date = new Date(records[i].check_in).toDateString();
          if (i === 0 && date !== today) break;
          if (lastDate) {
            const diff = (new Date(lastDate) - new Date(date)) / 86400000;
            if (diff === 1) s++;
            else if (diff > 1) break;
          } else s = 1;
          lastDate = date;
        }
        setStreak(s);
        const next = modules.find(m => m.is_locked);
        setNextWeek(next ? { title: next.title } : null);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [studentId]);

  if (loading) return <div style={{ flex: 1, background: "#fff", borderRadius: 0 }} />;

  const r = 38, circ = 2 * Math.PI * r;
  const offset = circ - (progress.percentage / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Progress ring + label */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
          <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="44" cy="44" r={r} fill="none" stroke="var(--green-100)" strokeWidth="7" />
            <circle cx="44" cy="44" r={r} fill="none" stroke="var(--green-500)" strokeWidth="7"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" className="sd-ring-fill" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green-700)", lineHeight: 1 }}>{progress.percentage}%</div>
            <div style={{ fontSize: 9, color: "var(--gray-400)", fontWeight: 600, marginTop: 2, letterSpacing: ".06em" }}>DONE</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-700)", marginBottom: 4 }}>
            {progress.completedWeeks} of {progress.totalWeeks} weeks unlocked
          </div>
          <div className="sd-bar">
            <div className="sd-bar-fill" style={{ width: `${progress.percentage}%` }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 6 }}>
            {progress.totalWeeks - progress.completedWeeks} weeks remaining
          </div>
        </div>
      </div>

      <div className="sd-divider" />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="sd-chip">
          <Label>Day Streak</Label>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--gray-800)", lineHeight: 1 }}>
            {streak} <span style={{ fontSize: 16 }}>🔥</span>
          </div>
        </div>
        <div className="sd-chip">
          <Label>Unlocked</Label>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--green-700)", lineHeight: 1 }}>
            {progress.completedWeeks}
            <span style={{ fontSize: 12, color: "var(--gray-400)", fontWeight: 500 }}> / {progress.totalWeeks}</span>
          </div>
        </div>
      </div>

      {/* Next goal */}
      {nextWeek && (
        <div style={{
          background: "var(--green-50)", border: "1px solid var(--green-100)",
          borderRadius: 10, padding: "12px 14px",
        }}>
          <Label>Next Goal</Label>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green-800)" }}>
            {nextWeek.title}
          </div>
          <div style={{ fontSize: 11, color: "var(--green-600)", marginTop: 3 }}>
            Complete previous week review to unlock
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main ────────────────────────────────────────────────────── */
function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState("");
  const navigate = useNavigate();
  const fetchedRef = useRef(false);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      try {
        const res = await API.get("students/me/");
        setStudentId(res.data.id);
        setStudentName(res.data?.user?.username || res.data?.username || "");
      } catch (e) {
        if (e.response?.status === 401) navigate("/login");
      } finally { setLoading(false); }
    })();
  }, [navigate]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="sd-root" style={{ display: "flex", height: "100vh" }}>
        <StudentSidebar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2.5px solid var(--green-200)", borderTopColor: "var(--green-600)", animation: "sd-spin .7s linear infinite" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="sd-root" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <StudentSidebar />

      <div className="sd-scroll" style={{ flex: 1, overflowY: "auto", background: "var(--gray-50)" }}>

        {/* ── Top bar ── */}
        <div className="sd-f0" style={{
          background: "#fff",
          borderBottom: "1px solid var(--gray-100)",
          padding: "18px 36px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: "-.02em" }}>
              {greeting}{studentName ? `, ${studentName}` : ""}.
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 2 }}>{todayStr}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="sd-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-500)" }} />
            <span style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 500 }}>{timeStr}</span>
          </div>
        </div>

        {/* ── Split layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 0, minHeight: "calc(100vh - 65px)" }}>

          {/* ── LEFT — Attendance ── */}
          <div className="sd-f1" style={{ padding: "32px 32px 32px 36px", borderRight: "1px solid var(--gray-100)" }}>

            {/* Quick stats strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
              {[
                { label: "Status", value: "Active", accent: "var(--green-600)", bg: "var(--green-50)", border: "var(--green-100)" },
                { label: "This Week", value: "4 days", accent: "var(--gray-800)", bg: "#fff", border: "var(--gray-100)" },
                { label: "This Month", value: "18 days", accent: "var(--gray-800)", bg: "#fff", border: "var(--gray-100)" },
              ].map(s => (
                <div key={s.label} style={{
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: 14, padding: "16px 18px",
                }}>
                  <Label>{s.label}</Label>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.accent, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Attendance section */}
            <SectionTitle>Attendance Register</SectionTitle>
            <div style={{
              background: "#fff", borderRadius: 16,
              border: "1px solid var(--gray-100)",
              overflow: "hidden",
            }}>
              <div style={{ padding: "20px 22px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "var(--gray-500)", fontWeight: 500 }}>Mark your presence</span>
                  <span className="sd-tag" style={{ background: "var(--green-50)", color: "var(--green-700)", border: "1px solid var(--green-100)" }}>
                    Today
                  </span>
                </div>
              </div>
              <div style={{ padding: "0 22px 22px" }}>
                <InOutRegister showHistory={false} studentId={studentId} />
              </div>
            </div>
          </div>

          {/* ── RIGHT — Module Marathon ── */}
          <div className="sd-f2" style={{
            background: "#fff",
            padding: "32px 28px",
            display: "flex", flexDirection: "column", gap: 0,
          }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <SectionTitle>Module Marathon</SectionTitle>
                  <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: -10 }}>Weekly learning tracker</div>
                </div>
                <span className="sd-tag" style={{ background: "var(--green-50)", color: "var(--green-700)", border: "1px solid var(--green-100)" }}>
                  🏃 Active
                </span>
              </div>
            </div>

            <div className="sd-divider" style={{ marginBottom: 24 }} />

            <ModuleMarathon studentId={studentId} />

            {/* Bottom tip */}
            <div style={{
              marginTop: "auto", paddingTop: 28,
              borderTop: "1px solid var(--gray-100)",
            }}>
              <div style={{ fontSize: 11, color: "var(--gray-400)", lineHeight: 1.7, fontStyle: "italic" }}>
                💡 Complete weekly reviews and mark 'Task Completed' to unlock the next module.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;