import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bgColor = type === "success" ? "bg-emerald-500/90" : "bg-red-500/90";
  const icon = type === "success" ? "✓" : "✕";
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">×</button>
    </div>
  );
}

function StudentReviewSheet() {
  const [student, setStudent] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type) => setToast({ message: msg, type });
  const hideToast = () => setToast(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await API.get("students/me/");
        setStudent(studentRes.data);

        const enrollmentsRes = await API.get("enrollments/me/");
        if (enrollmentsRes.data.length === 0) {
          showToast("No courses enrolled.", "error");
          setLoading(false);
          return;
        }
        const courseId = enrollmentsRes.data[0].course;

        const modulesRes = await API.get(`modules/for-course/?course_id=${courseId}`);
        const moduleList = modulesRes.data;

        const enriched = await Promise.all(
          moduleList.map(async (mod) => {
            const daysRes = await API.get(`days/?module=${mod.id}`);
            const days = daysRes.data;
            const totalDays = days.length;
            const completedDays = days.filter(d => d.is_completed).length;
            const percent = totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100);
            return {
              ...mod,
              totalDays,
              completedDays,
              percent,
            };
          })
        );
        setModules(enriched);
      } catch (err) {
        console.error(err);
        showToast("Failed to load review data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        Unable to load profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-6xl mx-auto">
        {/* Header with toolbar (Google Sheets style) */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">📊 Progress Review Sheet</h1>
            <p className="text-[#7d8590] text-sm">Student: {student.username} | Course: {student.course || "—"}</p>
          </div>
          <Link to="/user/dashboard" className="bg-[#21262d] hover:bg-[#30363d] px-4 py-2 rounded-lg text-sm">
            ← Dashboard
          </Link>
        </div>

        {/* Spreadsheet table */}
        <div className="overflow-x-auto border border-[#21262d] rounded-lg shadow-lg">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#161b22] border-b border-[#21262d]">
                <th className="px-4 py-3 text-left font-semibold text-[#7d8590] border-r border-[#21262d]">Module</th>
                <th className="px-4 py-3 text-center font-semibold text-[#7d8590] border-r border-[#21262d]">Total Days</th>
                <th className="px-4 py-3 text-center font-semibold text-[#7d8590] border-r border-[#21262d]">Completed</th>
                <th className="px-4 py-3 text-center font-semibold text-[#7d8590] border-r border-[#21262d]">Progress</th>
                <th className="px-4 py-3 text-center font-semibold text-[#7d8590]">Status</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod, idx) => (
                <tr key={mod.id} className={idx % 2 === 0 ? "bg-[#0d1117]" : "bg-[#161b22]/30"} style={{ borderBottom: "1px solid #21262d" }}>
                  <td className="px-4 py-3 border-r border-[#21262d] font-medium">{mod.title}</td>
                  <td className="px-4 py-3 text-center border-r border-[#21262d]">{mod.totalDays}</td>
                  <td className="px-4 py-3 text-center border-r border-[#21262d]">{mod.completedDays}</td>
                  <td className="px-4 py-3 text-center border-r border-[#21262d]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 bg-[#0d1117] rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${mod.percent}%` }} />
                      </div>
                      <span className="text-xs text-[#7d8590]">{mod.percent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {mod.percent === 100 ? (
                      <span className="text-emerald-400 text-sm font-medium">✅ Completed</span>
                    ) : mod.percent > 0 ? (
                      <span className="text-yellow-400 text-sm font-medium">⏳ In Progress</span>
                    ) : (
                      <span className="text-red-400 text-sm font-medium">❌ Not Started</span>
                    )}
                  </td>
                </tr>
              ))}
              {modules.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-[#7d8590]">No modules found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        {modules.length > 0 && (
          <div className="mt-4 text-right text-xs text-[#484f58]">
            Total modules: {modules.length} | Last updated: {new Date().toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentReviewSheet;