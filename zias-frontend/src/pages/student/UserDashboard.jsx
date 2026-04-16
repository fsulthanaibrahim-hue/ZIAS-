import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/api";

function StudentDashboard() {
  const [modules, setModules] = useState([]);
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

        // Fetch all modules from all enrolled courses
        const allModules = [];
        for (const enrollment of enrollments.data) {
          const modulesRes = await API.get(`modules/?course=${enrollment.course}`);
          const courseRes = await API.get(`courses/${enrollment.course}/`);
          const courseName = courseRes.data.name;
          const modulesWithCourse = modulesRes.data.map(mod => ({
            ...mod,
            courseName: courseName
          }));
          allModules.push(...modulesWithCourse);
        }

        // Remove duplicate modules by ID (keep first occurrence)
        const uniqueModules = [];
        const seenIds = new Set();
        for (const mod of allModules) {
          if (!seenIds.has(mod.id)) {
            seenIds.add(mod.id);
            uniqueModules.push(mod);
          }
        }

        setModules(uniqueModules);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">My Learning</h1>
        <Link to="/user/profile" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
          My Profile
        </Link>
      </div>

      {modules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/60 text-lg">You are not enrolled in any course yet.</p>
          <Link to="/courses" className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">
            Browse Courses
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <div
            key={`${mod.courseName}-${mod.id}`}   // composite key for safety
            className="bg-[#1a2538] rounded-xl border border-white/10 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-semibold text-white">{mod.title}</h2>
                {mod.is_public && (
                  <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">Public</span>
                )}
              </div>
              <p className="text-white/60 text-sm mb-4">Course: {mod.courseName}</p>
              <p className="text-white/40 text-sm mb-4 line-clamp-2">
                {mod.content ? mod.content.substring(0, 100) + "..." : "No overview available."}
              </p>
              <Link
                to={`/module/${mod.id}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
              >
                View Week →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentDashboard;