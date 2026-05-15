// src/pages/mentor/MentorModules.jsx
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

let mentorPromise = null;
let studentsPromise = null;
let modulesPromises = {};
let coursesPromise = null; // cache courses

function MentorModules() {
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [mentor, setMentor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const mountedRef = useRef(true);

  const extractArray = (response) => {
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data : [];
  };

  // Fetch courses (once)
  const fetchCourses = async () => {
    if (!coursesPromise) {
      coursesPromise = API.get("courses/")
        .then(res => {
          const data = res.data.results || res.data;
          return Array.isArray(data) ? data : [];
        })
        .catch(err => {
          console.error("Failed to fetch courses", err);
          return [];
        });
    }
    return coursesPromise;
  };

  useEffect(() => {
    mountedRef.current = true;
    const fetchInitialData = async () => {
      try {
        if (!mentorPromise) {
          mentorPromise = API.get("mentors/me/")
            .then(res => res.data)
            .catch(err => { throw err; });
        }
        const mentorData = await mentorPromise;
        if (mountedRef.current) setMentor(mentorData);

        if (!studentsPromise) {
          studentsPromise = API.get("students/", { params: { mentor: mentorData.id } })
            .then(res => res.data)
            .catch(err => { throw err; });
        }
        const studentsData = await studentsPromise;
        if (mountedRef.current) {
          setStudents(studentsData);
          if (studentsData.length > 0) {
            const firstStudent = studentsData[0];
            setSelectedStudentId(firstStudent.id);
            setSelectedStudentName(firstStudent.full_name || firstStudent.username);
          }
        }

        // Load courses for filter dropdown
        const coursesData = await fetchCourses();
        if (mountedRef.current) setCourses(coursesData);
      } catch (err) {
        console.error(err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    fetchInitialData();
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchModules = async () => {
      if (modulesPromises[selectedStudentId]) {
        try {
          const data = await modulesPromises[selectedStudentId];
          if (mountedRef.current) setModules(data);
        } catch (err) {
          console.error(err);
        }
        return;
      }
      modulesPromises[selectedStudentId] = API.get(`modules/student-modules/?student_id=${selectedStudentId}`)
        .then(res => extractArray(res))
        .catch(err => {
          console.error("Failed to fetch modules", err);
          throw err;
        })
        .finally(() => {
          delete modulesPromises[selectedStudentId];
        });
      try {
        const data = await modulesPromises[selectedStudentId];
        if (mountedRef.current) setModules(data);
      } catch (err) {
        // already handled
      }
    };
    fetchModules();
  }, [selectedStudentId]);

  const handleStudentChange = (studentId) => {
    const student = students.find(s => s.id === parseInt(studentId));
    setSelectedStudentId(studentId);
    setSelectedStudentName(student ? (student.full_name || student.username) : "");
    setSearchTerm("");
    setSelectedCourseId(""); // reset course filter when student changes
  };

  // Filter modules by search term and course
  const filteredModules = modules.filter(mod => {
    const matchesSearch = mod.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mod.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !selectedCourseId || mod.course === parseInt(selectedCourseId) || mod.course_name === selectedCourseId;
    return matchesSearch && matchesCourse;
  });

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex-1 p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>No students assigned to you yet.</p>
          <p className="text-sm mt-2">Please contact an administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Student Modules</h1>
              <p className="text-gray-500 text-sm mt-1">
                View all modules for the selected student (no locks)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Student:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filters: Search bar + Course dropdown */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search modules by title or content..."
              className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="w-64">
          </div>
        </div>

        {filteredModules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500">
              {searchTerm || selectedCourseId ? "No modules match your filters." : "No modules available for this student."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((mod) => (
              <div
                key={mod.id}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg line-clamp-1">
                        {mod.title}
                      </h3>
                      {mod.course_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          {mod.is_common ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Foundation Module
                            </span>
                          ) : (
                            <span>Course: {mod.course_name}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {mod.content || "No description available."}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      to={`/mentor/module/${mod.id}?student_id=${selectedStudentId}`}
                      className="text-sm font-medium px-4 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-sm transition"
                    >
                      View Module →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default MentorModules;