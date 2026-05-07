// src/pages/student/StudentDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import StudentSidebar from "../../components/StudentSidebar";
import WeeklySubmissions from "./WeeklySubmissions";
import InOutRegister from "./InOutRegister";

// 🔥 UNIQUE WIDGET: Module Marathon – visual progress + streak
const ModuleMarathon = ({ studentId }) => {
  const [progress, setProgress] = useState({ completedWeeks: 0, totalWeeks: 0, percentage: 0 });
  const [streak, setStreak] = useState(0);
  const [nextWeek, setNextWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get module progress
        const moduleRes = await API.get("modules/student-modules/");
        const modules = moduleRes.data;
        const unlocked = modules.filter(m => !m.is_locked).length;
        const total = modules.length;
        const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
        setProgress({ completedWeeks: unlocked, totalWeeks: total, percentage });

        // Get attendance history to calculate streak
        const attRes = await API.get("attendance/history/");
        let records = attRes.data.results || attRes.data || [];
        records.sort((a,b) => new Date(b.check_in) - new Date(a.check_in));
        let currentStreak = 0;
        let lastDate = null;
        const today = new Date().toDateString();
        for (let i = 0; i < records.length; i++) {
          const date = new Date(records[i].check_in).toDateString();
          if (i === 0 && date !== today) break;
          if (lastDate) {
            const diffDays = (new Date(lastDate) - new Date(date)) / (1000*60*60*24);
            if (diffDays === 1) currentStreak++;
            else if (diffDays > 1) break;
          } else {
            currentStreak = 1;
          }
          lastDate = date;
        }
        setStreak(currentStreak);

        // Find next locked module
        const nextLocked = modules.find(m => m.is_locked === true);
        setNextWeek(nextLocked ? { title: nextLocked.title, id: nextLocked.id } : null);
      } catch (err) {
        console.error("ModuleMarathon error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  if (loading) return <div className="animate-pulse bg-gray-100 h-40 rounded-xl"></div>;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress.percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">🏃‍♂️ Module Marathon</h2>
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
            <circle cx="80" cy="80" r={radius} fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-green-600">{progress.percentage}%</div>
            <div className="text-xs text-gray-500">completed</div>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <div className="text-2xl font-bold text-green-700">{progress.completedWeeks}</div>
            <div className="text-xs text-gray-600">weeks unlocked</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-xl">
            <div className="text-2xl font-bold text-orange-600">{streak}</div>
            <div className="text-xs text-gray-600">day streak 🔥</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl col-span-2">
            <div className="text-sm font-medium text-gray-700">🎯 Next goal:</div>
            <div className="text-md font-semibold text-blue-700">
              {nextWeek ? `Unlock "${nextWeek.title}"` : "All weeks unlocked! 🎉"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {nextWeek ? "Complete previous week review with 'Task Completed'" : "You're a marathon finisher!"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await API.post("update-dashboard-access/");
        try { const studentRes = await API.get("students/me/"); setStudent(studentRes.data); } catch (err) { console.warn(err); }
        const modulesRes = await API.get("modules/student-modules/");
        const modulesData = modulesRes.data;
        setWeeks(modulesData);
        if (modulesData.length > 0) setSelectedWeekId(modulesData[0].id);
      } catch (err) {
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Welcome card */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {student?.username || 'Student'}!</p>
            {student?.course && <p className="text-sm text-gray-500 mt-1">Course: <span className="text-gray-700">{student.course}</span></p>}
          </div>

          {/* 🔥 UNIQUE – Module Marathon widget */}
          <ModuleMarathon studentId={student?.id} />

          {/* In/Out Register (without history) */}
          <InOutRegister showHistory={false} />


          {selectedWeekId && (
            <div className="bg-white rounded-xl shadow-sm p-6"><WeeklySubmissions weekId={selectedWeekId} studentId={student?.id} /></div>
          )}
          {weeks.length === 0 && <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">No weeks assigned yet.</div>}
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;