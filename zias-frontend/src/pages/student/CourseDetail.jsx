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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-red-600 flex items-center justify-center p-4 text-center">
        {error}
      </div>
    );
  }
  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/student/dashboard"
          className="text-green-600 hover:text-green-700 mb-4 inline-flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>

        {/* Course Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{course.name}</h1>
          <p className="text-gray-500 mb-2">
            Duration: {course.duration || "Not specified"}
          </p>
          <p className="text-gray-600">
            {course.description || "No description available."}
          </p>
        </div>

        {/* Modules List */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Course Content</h2>
        <div className="space-y-3">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex justify-between items-center hover:shadow-md transition"
            >
              <span className="text-gray-800 font-medium">{mod.title}</span>
              {mod.is_public ? (
                <Link
                  to={`/student/module/${mod.id}`}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  View
                </Link>
              ) : (
                <span className="text-gray-400" title="You need to be enrolled in this course">
                  🔒 Locked
                </span>
              )}
            </div>
          ))}
          {modules.length === 0 && (
            <p className="text-gray-500">No modules available for this course.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;