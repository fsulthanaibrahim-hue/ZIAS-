// src/pages/student/StudentDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import StudentSidebar from "../../components/StudentSidebar";
import WeeklySubmissions from "./WeeklySubmissions"; // adjust path if needed

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

        // Fetch student profile
        try {
          const studentRes = await API.get("students/me/");
          setStudent(studentRes.data);
        } catch (err) {
          console.warn("Could not fetch student profile:", err);
        }

        // Fetch available weeks (modules) for the student
        const modulesRes = await API.get("modules/student-modules/");
        const modulesData = modulesRes.data;
        setWeeks(modulesData);
        if (modulesData.length > 0) {
          setSelectedWeekId(modulesData[0].id);
        }
      } catch (err) {
        console.error(err);
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
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
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
            {student?.course && (
              <p className="text-sm text-gray-500 mt-1">Course: <span className="text-gray-700">{student.course}</span></p>
            )}
          </div>

          {/* Weekly Submissions component for the selected week */}
          {selectedWeekId && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <WeeklySubmissions weekId={selectedWeekId} studentId={student?.id} />
            </div>
          )}

          {weeks.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
              No weeks assigned yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;