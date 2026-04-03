import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";

function StudentDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await API.get("users/me/");
        const user = userRes.data;
        if (!user.is_student) {
          navigate("/login");
          return;
        }
        const studentRes = await API.get(`students/?user=${user.id}`);
        const student = studentRes.data[0];
        const enrollments = await API.get(`enrollments/?student=${student.id}`);
        const courses = await Promise.all(
          enrollments.data.map(async (e) => {
            const courseRes = await API.get(`courses/${e.course}/`);
            const modulesRes = await API.get(`modules/?course=${e.course}`);
            return { ...courseRes.data, modules: modulesRes.data };
          })
        );
        setEnrolledCourses(courses);
      } catch (err) {
        console.error(err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) return <div className="min-h-screen bg-[#0f1623] text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0f1623] p-8">
      <h1 className="text-3xl font-bold text-white mb-8">My Learning</h1>
      {enrolledCourses.length === 0 && (
        <p className="text-white/60">You are not enrolled in any course yet.</p>
      )}
      <div className="space-y-8">
        {enrolledCourses.map((course) => (
          <div key={course.id} className="bg-[#1a2538] rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-semibold text-white mb-4">{course.name}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.modules.map((mod) => (
                <div key={mod.id} className="bg-[#0f1623] p-4 rounded-lg border border-white/10 flex justify-between items-center">
                  <span className="text-white">{mod.title}</span>
                  {mod.is_public ? (
                    <Link to={`/module/${mod.id}`} className="text-green-400 hover:text-green-300">View</Link>
                  ) : (
                    <span className="text-gray-500" title="You need to be enrolled in this course">
                      🔒 Locked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentDashboard;