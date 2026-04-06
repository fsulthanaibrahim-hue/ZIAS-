import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";

function StudentDashboard() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current student
        const studentRes = await API.get("students/me/");
        setStudent(studentRes.data);
        
        // Get enrolled courses
        const enrollmentsRes = await API.get("enrollments/me/");
        setEnrolledCourses(enrollmentsRes.data);
        
        if (enrollmentsRes.data.length > 0) {
          const firstCourseId = enrollmentsRes.data[0].course;
          setSelectedCourseId(firstCourseId);
          await fetchModules(firstCourseId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const fetchModules = async (courseId) => {
    setLoading(true);
    try {
      // Fetch common modules + course-specific modules
      const res = await API.get(`modules/for-course/?course_id=${courseId}`);
      setModules(res.data);
    } catch (err) {
      console.error("Failed to fetch modules:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (courseId) => {
    setSelectedCourseId(courseId);
    await fetchModules(courseId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-[#7d8590] mt-1">Welcome back, {student?.username || 'Student'}!</p>
          </div>
          <Link to="/user/profile" className="bg-[#21262d] hover:bg-[#30363d] px-4 py-2 rounded-lg text-sm">
            My Profile
          </Link>
        </div>

        {/* Course Selector */}
        {enrolledCourses.length > 0 && (
          <div className="mb-6">
            <label className="block text-[#7d8590] text-sm mb-2">Select Course</label>
            <select
              value={selectedCourseId || ""}
              onChange={(e) => handleCourseChange(Number(e.target.value))}
              className="bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 text-[#e6edf3]"
            >
              {enrolledCourses.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.course}>
                  {enrollment.course_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Modules List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Your Modules</h2>
          {modules.length === 0 ? (
            <p className="text-[#7d8590]">No modules available yet.</p>
          ) : (
            modules.map((mod) => (
              <div key={mod.id} className="bg-[#161b22] rounded-xl border border-[#21262d] p-5 hover:bg-[#1a2538] transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#e6edf3]">{mod.title}</h3>
                    <p className="text-[#7d8590] text-sm mt-1">{mod.content || "No description"}</p>
                    {mod.is_common && (
                      <span className="inline-block mt-2 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                        Foundation Module
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/module/${mod.id}`}
                    className="bg-[#238636] hover:bg-[#2ea043] px-4 py-2 rounded-lg text-sm font-medium transition ml-4"
                  >
                    View Module
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;