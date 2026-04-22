// src/pages/mentor/MentorDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

// Module-level flags to prevent duplicate fetches
let mentorFetched = false;
let isFetching = false;

function MentorDashboard() {
  const [mentor, setMentor] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (mentorFetched || isFetching) return;
      isFetching = true;
      try {
        const mentorRes = await API.get("mentors/me/");
        setMentor(mentorRes.data);
        const studentsRes = await API.get("students/", {
          params: { mentor: mentorRes.data.id },
        });
        setStudentsCount(studentsRes.data.length);
        mentorFetched = true;
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
        isFetching = false;
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Mentor Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {mentor?.user?.username || "Mentor"}!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Expertise: {mentor?.expertise || "Not specified"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="text-3xl font-bold text-gray-800">{studentsCount}</div>
            <div className="text-gray-500 text-sm">Assigned Students</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="text-3xl font-bold text-gray-800">—</div>
            <div className="text-gray-500 text-sm">Pending Reviews</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="text-3xl font-bold text-gray-800">—</div>
            <div className="text-gray-500 text-sm">Completed Modules</div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default MentorDashboard;