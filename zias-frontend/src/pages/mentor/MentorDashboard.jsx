import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function MentorDashboard() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [mentor, setMentor] = useState(null);
  const [students, setStudents] = useState([]);
  const [recentFolders, setRecentFolders] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    completedModules: 0,
  });
  const [loading, setLoading] = useState(true);
  const dataFetched = useRef(false);

  // Modal state for student details
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewerDocuments, setViewerDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Helper to get batch name from ID or string
  const getBatchName = (batchId) => {
    if (!batchId) return "—";
    if (typeof batchId === "string" && batchId.match(/^[A-Za-z0-9]+$/)) return batchId;
    const idNum = parseInt(batchId, 10);
    if (!isNaN(idNum)) {
      // We don't have batchesList here, so just return the raw value or id
      return batchId;
    }
    return batchId;
  };

  // Open modal and fetch full student details + documents
  const openStudentModal = async (student) => {
    try {
      const fullStudentRes = await API.get(`students/${student.id}/`);
      const fullStudent = fullStudentRes.data;
      const docsRes = await API.get(`students/${student.id}/documents/`);
      setViewerDocuments(docsRes.data.results || docsRes.data);
      setSelectedStudent(fullStudent);
      setShowModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (dataFetched.current) return;
    dataFetched.current = true;

    const fetchData = async () => {
      try {
        // Determine mentor ID and mentor data
        let mentorId = null;
        let mentorData = null;

        if (authUser?.mentor_id) {
          mentorId = authUser.mentor_id;
          mentorData = {
            id: mentorId,
            expertise: authUser.expertise,
            batch: authUser.batch,
            full_name: authUser.full_name,
            user: {
              username: authUser.username,
              email: authUser.email,
            },
          };
          setMentor(mentorData);
        } else if (authUser?.id && (authUser?.expertise || authUser?.batch)) {
          mentorId = authUser.id;
          mentorData = authUser;
          setMentor(mentorData);
        } else {
          const mentorRes = await API.get("mentors/me/");
          mentorData = mentorRes.data;
          setMentor(mentorData);
          mentorId = mentorData.id;
        }

        if (!mentorId) {
          setLoading(false);
          return;
        }

        // 2. Get all students of this mentor
        const studentsRes = await API.get("students/", { params: { mentor: mentorId } });
        const studentList = studentsRes.data.results || studentsRes.data;
        setStudents(studentList);
        const totalStudents = studentList.length;

        // 3. Get ALL completed student modules for this mentor (one request)
        const modulesRes = await API.get("student-modules/", {
          params: { student__mentor: mentorId, is_completed: true },
        });
        const modules = modulesRes.data.results || modulesRes.data;
        const totalCompletedModules = modules.length;
        const activeStudentCount = new Set(modules.map(m => m.student)).size;

        // 4. Get recent review folders (limit 5)
        const foldersRes = await API.get("review-folders/", {
          params: { student__mentor: mentorId, ordering: "-created_at", limit: 5 },
        });
        let folders = foldersRes.data.results || foldersRes.data;
        setRecentFolders(folders.slice(0, 5));

        setStats({
          totalStudents,
          activeStudents: activeStudentCount,
          completedModules: totalCompletedModules,
        });
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser, navigate]);

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const mentorName = mentor?.user?.username || mentor?.full_name || authUser?.username || "Mentor";
  const mentorExpertise = mentor?.expertise || authUser?.expertise || "—";
  const mentorBatch = mentor?.batch || authUser?.batch || "—";

  // Helper to get document URL
  const getDocumentUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    return `http://127.0.0.1:8000${url}`;
  };

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Mentor Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {mentorName}!</p>
          {mentorExpertise !== "—" && (
            <p className="text-sm text-gray-500 mt-1">Expertise: {mentorExpertise}</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-800">{stats.totalStudents}</div>
                <div className="text-gray-500 text-sm mt-1">Assigned Students</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5m4-14a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-600">{stats.activeStudents}</div>
                <div className="text-gray-500 text-sm mt-1">Active Students</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.completedModules}</div>
                <div className="text-gray-500 text-sm mt-1">Completed Modules</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Students Table (clickable rows) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Recent Students</h2>
              <Link to="/mentor/students" className="text-sm text-green-600 hover:text-green-700 font-medium">View all</Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.slice(0, 5).map((student) => (
                  <tr 
                    key={student.id} 
                    onClick={() => openStudentModal(student)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.full_name || student.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.course || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getBatchName(student.batch)}</td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400">No students assigned yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Recent Folders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/mentor/students" className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">View All Students</Link>
              <Link to="/mentor/modules" className="block w-full text-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition">Manage Modules</Link>
              <Link to="/mentor/chat" className="block w-full text-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition">Go to Chat</Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-semibold text-gray-800">Recent Review Folders</h3>
              <Link to="/mentor/review-folders" className="text-xs text-green-600 hover:text-green-700">View all</Link>
            </div>
            {recentFolders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No review folders yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentFolders.map(folder => (
                  <div key={folder.id} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{folder.student_name || "Student"}</p>
                      <p className="text-xs text-gray-500">Week {folder.week || "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${folder.is_done ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {folder.is_done ? "Completed" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mentor Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-md font-semibold text-gray-800 mb-3">Mentor Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Username:</span> {authUser?.username || "—"}</p>
            <p><span className="font-medium">Email:</span> {authUser?.email || "—"}</p>
            <p><span className="font-medium">Expertise:</span> {mentorExpertise}</p>
            <p><span className="font-medium">Batch:</span> {mentorBatch}</p>
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-4 py-3 border-b flex justify-between items-center">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Student Details</h3>
                  <p className="text-xs text-gray-500">Complete information</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-500 text-xs">Full Name</label><p className="text-gray-800 text-sm">{selectedStudent.full_name || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Email</label><p className="text-gray-800 text-sm">{selectedStudent.email}</p></div>
                  <div><label className="block text-gray-500 text-xs">Course</label><p className="text-gray-800 text-sm">{selectedStudent.course || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Batch</label><p className="text-gray-800 text-sm">{getBatchName(selectedStudent.batch)}</p></div>
                  <div><label className="block text-gray-500 text-xs">Mentor</label><p className="text-gray-800 text-sm">{selectedStudent.mentor_name || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Phone</label><p className="text-gray-800 text-sm">{selectedStudent.phone || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Date of Birth</label><p className="text-gray-800 text-sm">{selectedStudent.date_of_birth || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Age</label><p className="text-gray-800 text-sm">{selectedStudent.age || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Gender</label><p className="text-gray-800 text-sm">{selectedStudent.gender || "—"}</p></div>
                </div>
              </div>

              {/* Parents */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Parents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-500 text-xs">Father's Name</label><p>{selectedStudent.fathers_name || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Father's Contact</label><p>{selectedStudent.fathers_contact || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Mother's Name</label><p>{selectedStudent.mothers_name || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Mother's Contact</label><p>{selectedStudent.mothers_contact || "—"}</p></div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Address</h4>
                <p className="text-gray-800 text-sm">{selectedStudent.address || "—"}</p>
              </div>

              {/* Education */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Education</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-gray-500 text-xs">Educational Qualification</label><p>{selectedStudent.educational_qualification || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">College / School</label><p>{selectedStudent.college_school || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Parent Name</label><p>{selectedStudent.parent_name || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Parent Phone</label><p>{selectedStudent.parent_phone || "—"}</p></div>
                  <div><label className="block text-gray-500 text-xs">Emergency Contact</label><p>{selectedStudent.emergency_contact || "—"}</p></div>
                </div>
              </div>

              {/* Documents */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Documents</h4>
                {viewerDocuments.length === 0 ? (
                  <p className="text-gray-400 text-sm">No documents uploaded.</p>
                ) : (
                  <ul className="space-y-2">
                    {viewerDocuments.map((doc) => (
                      <li key={doc.id}>
                        <a
                          href={getDocumentUrl(doc.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {doc.file_name}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end">
              <button onClick={() => setShowModal(false)} className="bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default MentorDashboard;