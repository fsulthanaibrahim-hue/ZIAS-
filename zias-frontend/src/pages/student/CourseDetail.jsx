// src/pages/student/CourseDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import API from "../../api/api";

function CourseDetail() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("student_id");

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [currentStudentId, setCurrentStudentId] = useState(null);

  // Fetch current user role and (if student) their own student id
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("users/me/");
        const user = res.data;
        if (user.is_admin) setUserRole("admin");
        else if (user.is_mentor) setUserRole("mentor");
        else if (user.is_reviewer) setUserRole("reviewer");
        else setUserRole("student");
        if (!user.is_mentor && !user.is_admin && user.student_profile) {
          setCurrentStudentId(user.student_profile.id);
        }
      } catch (err) {
        console.error("Failed to fetch user role", err);
      }
    };
    fetchUser();
  }, []);

  // Determine effective student ID (for mentor: use param; for student: use own id)
  const effectiveStudentId = (userRole === "mentor" || userRole === "admin") && studentIdParam
    ? studentIdParam
    : currentStudentId;

  useEffect(() => {
    if (!userRole) return; // wait for role
    if ((userRole === "mentor" || userRole === "admin") && !studentIdParam) {
      // Mentor/admin but no student_id provided – show generic course info (no enrollment status)
      fetchCourseOnly();
    } else if (effectiveStudentId) {
      fetchCourseWithStudent(effectiveStudentId);
    } else {
      fetchCourseOnly();
    }
  }, [courseId, userRole, effectiveStudentId, studentIdParam]);

  const fetchCourseOnly = async () => {
    setLoading(true);
    setError("");
    try {
      const courseRes = await API.get(`courses/${courseId}/`);
      setCourse(courseRes.data);
      // Fetch modules without student-specific enrollment info (show all as locked or just titles)
      const modulesRes = await API.get(`modules/?course=${courseId}`);
      setModules(modulesRes.data);
    } catch (err) {
      setError("Course not found or access denied.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseWithStudent = async (studentId) => {
    setLoading(true);
    setError("");
    try {
      const courseRes = await API.get(`courses/${courseId}/`);
      setCourse(courseRes.data);
      // Fetch modules with student enrollment status (use backend endpoint that checks enrollment)
      // If your backend doesn't have a special endpoint, you can fetch modules and then check enrollment separately
      const modulesRes = await API.get(`modules/?course=${courseId}`);
      let modulesData = modulesRes.data;
      // Optionally fetch enrollment info for this student to determine locked/unlocked
      try {
        const enrollmentRes = await API.get(`enrollments/?student=${studentId}&course=${courseId}`);
        const isEnrolled = enrollmentRes.data.length > 0;
        if (!isEnrolled) {
          // Student not enrolled: all modules locked
          modulesData = modulesData.map(mod => ({ ...mod, is_public: false }));
        }
        // If enrolled, we keep original is_public (or you can set all to true)
      } catch (err) {
        // If enrollment check fails, assume not enrolled (or use original is_public)
        console.warn("Enrollment check failed", err);
        modulesData = modulesData.map(mod => ({ ...mod, is_public: false }));
      }
      setModules(modulesData);
    } catch (err) {
      setError("Course not found or access denied.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getModuleLink = (moduleId) => {
    // For mentors/admins viewing a student's course, use mentor module detail route
    if ((userRole === "mentor" || userRole === "admin") && studentIdParam) {
      return `/mentor/module/${moduleId}?student_id=${studentIdParam}`;
    }
    // For students or mentors without student_id, use student module detail
    return `/student/module/${moduleId}`;
  };

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

  // Determine back link based on role
  let backLink = "/student/dashboard";
  if (userRole === "mentor") backLink = "/mentor/dashboard";
  if (userRole === "admin") backLink = "/admin/dashboard";
  if (userRole === "reviewer") backLink = "/reviewer/dashboard";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to={backLink}
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
          {(userRole === "mentor" || userRole === "admin") && studentIdParam && (
            <p className="text-xs text-amber-600 mt-3">
              👁️ Mentor view for student ID: {studentIdParam}
            </p>
          )}
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
                  to={getModuleLink(mod.id)}
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