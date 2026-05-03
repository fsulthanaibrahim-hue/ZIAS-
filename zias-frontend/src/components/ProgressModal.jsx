// src/components/ProgressModal.jsx – no course API call, uses default 52 weeks
import { useEffect, useState } from "react";
import API from "../api/api";

function ProgressModal({ isOpen, onClose, student, studentId, studentName }) {
  const actualStudentId = student?.id || studentId;
  const actualStudentName = student?.full_name || student?.username || studentName || "Student";
  const courseFromProp = student?.course;
  const batchFromProp = student?.batch;

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !actualStudentId) return;

    const fetchProgress = async () => {
      setLoading(true);
      setError(null);
      try {
        let courseName = courseFromProp;
        let batch = batchFromProp;
        if (!courseName) {
          try {
            const studentRes = await API.get(`students/${actualStudentId}/`);
            courseName = studentRes.data.course;
            batch = studentRes.data.batch;
          } catch (err) {
            console.warn("Could not fetch student details", err);
          }
        }

        // Use a fixed default of 52 weeks – no extra API call
        const totalWeeks = 52;

        // Get modules (weeks) for this student
        const modulesRes = await API.get(`modules/student-modules/?student_id=${actualStudentId}`);
        let modules = modulesRes.data.results || modulesRes.data;
        if (!Array.isArray(modules)) modules = [];

        const moduleOrderMap = {};
        modules.forEach(m => {
          if (m.id && m.order !== null && m.order !== undefined) {
            moduleOrderMap[m.id] = m.order;
          }
        });

        // Get review statuses
        const statusRes = await API.get(`student/review-status/?student_id=${actualStudentId}`);
        const statuses = statusRes.data;
        if (!Array.isArray(statuses)) throw new Error("Invalid response");

        const completedWeeks = [];
        statuses.forEach(status => {
          const moduleId = status.module_id;
          const weekNum = moduleOrderMap[moduleId];
          if (weekNum && status.status === "completed") {
            completedWeeks.push(weekNum);
          }
        });
        completedWeeks.sort((a,b) => a-b);

        const currentWeek = completedWeeks.length ? Math.max(...completedWeeks) : 0;
        const nextWeek = currentWeek + 1;
        const percent = totalWeeks ? Math.round((currentWeek / totalWeeks) * 100) : 0;

        setProgress({
          course: courseName || "—",
          batch: batch || "—",
          completed_weeks: completedWeeks,
          current_week: currentWeek,
          next_week: nextWeek <= totalWeeks ? nextWeek : null,
          total_weeks: totalWeeks,
          progress_percent: percent,
        });
      } catch (err) {
        console.error("Progress fetch error:", err);
        setError("Failed to load progress data");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [isOpen, actualStudentId, courseFromProp, batchFromProp]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Student Progress</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-4">{error}</p>
        ) : progress ? (
          <div className="space-y-3">
            <p><span className="font-medium">Student:</span> {actualStudentName}</p>
            <p><span className="font-medium">Course:</span> {progress.course}</p>
            <p><span className="font-medium">Batch:</span> {progress.batch}</p>
            <p><span className="font-medium">Completed Weeks:</span> {progress.completed_weeks.join(", ") || "None"}</p>
            <p><span className="font-medium">Current Week:</span> {progress.current_week}</p>
            <p><span className="font-medium">Next Week:</span> {progress.next_week || "—"}</p>
            <p><span className="font-medium">Total Weeks:</span> {progress.total_weeks}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{progress.progress_percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress.progress_percent}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No progress data available</p>
        )}
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  );
}

export default ProgressModal;