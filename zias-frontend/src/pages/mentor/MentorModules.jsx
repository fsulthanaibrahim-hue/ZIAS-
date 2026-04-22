// src/pages/mentor/MentorModules.jsx
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

// Module-level caches
let mentorPromise = null;
let studentsPromise = null;
let modulesPromises = {}; // key: studentId, value: promise
let globalMentorFetched = false;
let globalStudentsFetched = false;

function MentorModules() {
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [mentor, setMentor] = useState(null);
  const mountedRef = useRef(true);

  // Fetch mentor and students only once
  useEffect(() => {
    mountedRef.current = true;
    const fetchInitialData = async () => {
      try {
        // Mentor profile
        if (!globalMentorFetched && !mentorPromise) {
          mentorPromise = API.get("mentors/me/")
            .then(res => res.data)
            .catch(err => { throw err; })
            .finally(() => { mentorPromise = null; });
        }
        const mentorData = await mentorPromise;
        if (mountedRef.current) setMentor(mentorData);
        globalMentorFetched = true;

        // Students list
        if (!globalStudentsFetched && !studentsPromise) {
          studentsPromise = API.get("students/", { params: { mentor: mentorData.id } })
            .then(res => res.data)
            .catch(err => { throw err; })
            .finally(() => { studentsPromise = null; });
        }
        const studentsData = await studentsPromise;
        if (mountedRef.current) {
          setStudents(studentsData);
          if (studentsData.length > 0 && !selectedStudentId) {
            setSelectedStudentId(studentsData[0].id);
          }
        }
        globalStudentsFetched = true;
      } catch (err) {
        console.error(err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    fetchInitialData();
    return () => { mountedRef.current = false; };
  }, []); // empty dependency – runs once

  // Fetch modules when selected student changes (with deduplication)
  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchModules = async () => {
      // If already fetching or already fetched for this student, reuse promise
      if (modulesPromises[selectedStudentId]) {
        try {
          const data = await modulesPromises[selectedStudentId];
          if (mountedRef.current) setModules(data);
        } catch (err) {
          console.error(err);
        }
        return;
      }
      // Create new promise
      modulesPromises[selectedStudentId] = API.get(`modules/student-modules/?student_id=${selectedStudentId}`)
        .then(res => res.data)
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
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Modules</h1>
            <p className="text-gray-500 text-sm mt-1">
              View module progress for each student (unlocking based on completion)
            </p>
          </div>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-green-500"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name || student.username}
              </option>
            ))}
          </select>
        </div>

        {modules.length === 0 ? (
          <p className="text-gray-500">No modules available for this student.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => {
              const isLocked = mod.is_locked || false;
              return (
                <div
                  key={mod.id}
                  className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 transition-all duration-200 ${
                    !isLocked ? "hover:shadow-md" : "opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{mod.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {mod.is_common ? "Foundation Module" : `Course: ${mod.course_name}`}
                      </p>
                    </div>
                    {isLocked ? (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">🔒 Locked</span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🔓 Unlocked</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{mod.content || "No description"}</p>
                  <div className="mt-4">
                    <Link
                      to={`/student/module/${mod.id}`}
                      className={`text-sm ${
                        !isLocked
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none"
                      } px-3 py-1 rounded-full inline-block`}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default MentorModules;