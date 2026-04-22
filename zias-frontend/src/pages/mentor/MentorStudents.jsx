// src/pages/mentor/MentorStudents.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

let mentorPromise = null;
let studentsPromise = null;
let globalMentorFetched = false;
let globalStudentsFetched = false;

function MentorStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mentor, setMentor] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch mentor profile only once
        if (!globalMentorFetched && !mentorPromise) {
          mentorPromise = API.get("mentors/me/")
            .then(res => {
              setMentor(res.data);
              globalMentorFetched = true;
              return res.data;
            })
            .catch(err => {
              console.error("Failed to fetch mentor", err);
              throw err;
            })
            .finally(() => {
              mentorPromise = null;
            });
        }
        const mentorData = await mentorPromise;

        // Fetch students for this mentor only once
        if (!globalStudentsFetched && !studentsPromise) {
          studentsPromise = API.get("students/", { params: { mentor: mentorData.id } })
            .then(res => {
              setStudents(res.data);
              globalStudentsFetched = true;
              return res.data;
            })
            .catch(err => {
              console.error("Failed to fetch students", err);
              throw err;
            })
            .finally(() => {
              studentsPromise = null;
            });
        }
        await studentsPromise;
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Students</h1>
          <p className="text-gray-500 text-sm mt-1">
            Students assigned to you ({students.length})
          </p>
        </div>

        {students.length === 0 ? (
          <p className="text-gray-500">No students assigned to you yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center uppercase font-bold text-green-700">
                    {student.username?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{student.full_name || student.username}</h3>
                    <p className="text-xs text-gray-500">{student.course}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link
                    to={`/admin/student-review-edit?student_id=${student.id}`}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition"
                  >
                    Review Sheet
                  </Link>
                  <Link
                    to={`/chat?user=${student.id}`}
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-full transition"
                  >
                    Chat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default MentorStudents;