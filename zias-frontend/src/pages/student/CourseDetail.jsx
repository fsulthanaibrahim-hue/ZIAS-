// src/pages/student/CourseDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../api/api";

function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await API.get(`courses/${courseId}/`);
        setCourse(courseRes.data);
        const modulesRes = await API.get(`modules/?course=${courseId}`);
        setModules(modulesRes.data);
      } catch (err) {
        setError("Course not found or access denied.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  if (loading) return <div className="min-h-screen bg-[#0f1623] text-white flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen bg-[#0f1623] text-red-400 flex items-center justify-center">{error}</div>;
  if (!course) return null;

  return (
    <div className="min-h-screen bg-[#0f1623] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/student/dashboard" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="bg-[#1a2538] rounded-xl p-6 border border-white/10 mb-6">
          <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
          <p className="text-white/60 mb-2">Duration: {course.duration || "Not specified"}</p>
          <p className="text-white/80">{course.description || "No description available."}</p>
        </div>
        <h2 className="text-2xl font-semibold mb-4">Course Content</h2>
        <div className="space-y-3">
          {modules.map((mod) => (
            <div key={mod.id} className="bg-[#1a2538] rounded-lg p-4 border border-white/10 flex justify-between items-center">
              <span className="text-white">{mod.title}</span>
              {mod.is_public ? (
                <Link to={`/student/module/${mod.id}`} className="text-green-400 hover:text-green-300">View</Link>
              ) : (
                <span className="text-gray-500" title="You need to be enrolled in this course">🔒 Locked</span>
              )}
            </div>
          ))}
          {modules.length === 0 && <p className="text-white/40">No modules available for this course.</p>}
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;