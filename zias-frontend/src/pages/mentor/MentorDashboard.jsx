// src/pages/mentor/MentorDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

function MentorDashboard() {
  const [mentor, setMentor] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [completedModulesCount, setCompletedModulesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        // 1. Get mentor profile
        const mentorRes = await API.get("mentors/me/", { signal: abortController.signal });
        if (!isMounted) return;
        const mentorData = mentorRes.data;
        setMentor(mentorData);
        const mentorId = mentorData.id;

        // 2. Fetch students count (already have list)
        const studentsRes = await API.get("students/", {
          params: { mentor: mentorId },
          signal: abortController.signal,
        });
        if (!isMounted) return;
        const students = studentsRes.data;
        setStudentsCount(students.length);

        // 3. Fetch pending reviews count: all review folders where is_done = false for these students
        //    Try to use filtering by student__mentor if backend supports it; otherwise we would need to aggregate.
        //    We'll assume the endpoint accepts ?student__mentor=<id>
        let pending = 0;
        try {
          const pendingRes = await API.get("/review-folders/", {
            params: { student__mentor: mentorId, is_done: false },
            signal: abortController.signal,
          });
          pending = pendingRes.data.length;
        } catch (err) {
          // fallback: fetch all review folders for each student (inefficient but works)
          for (const student of students) {
            const res = await API.get("/review-folders/", {
              params: { student: student.id, is_done: false },
              signal: abortController.signal,
            });
            pending += res.data.length;
          }
        }
        if (!isMounted) return;
        setPendingReviewsCount(pending);

        // 4. Fetch completed modules count: student modules with is_completed = true for these students
        let completed = 0;
        try {
          const completedRes = await API.get("/student-modules/", {
            params: { student__mentor: mentorId, is_completed: true },
            signal: abortController.signal,
          });
          completed = completedRes.data.length;
        } catch (err) {
          for (const student of students) {
            const res = await API.get("/student-modules/", {
              params: { student: student.id, is_completed: true },
              signal: abortController.signal,
            });
            completed += res.data.length;
          }
        }
        if (!isMounted) return;
        setCompletedModulesCount(completed);
      } catch (err) {
        if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [navigate]);

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="text-3xl font-bold text-gray-800">{studentsCount}</div>
            <div className="text-gray-500 text-sm">Assigned Students</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="text-3xl font-bold text-gray-800">{pendingReviewsCount}</div>
            <div className="text-gray-500 text-sm">Pending Reviews</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="text-3xl font-bold text-gray-800">{completedModulesCount}</div>
            <div className="text-gray-500 text-sm">Completed Modules</div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default MentorDashboard;