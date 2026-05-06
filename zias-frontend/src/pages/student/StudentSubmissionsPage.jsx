import { useSearchParams } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import WeeklySubmissions from "../students/WeeklySubmissions";

function StudentSubmissionsPage() {
  const [searchParams] = useSearchParams();
  const weekId = searchParams.get("weekId");
  const studentId = searchParams.get("studentId");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Weekly Submissions</h1>
          {weekId ? (
            <WeeklySubmissions weekId={parseInt(weekId)} studentId={studentId ? parseInt(studentId) : undefined} />
          ) : (
            <p className="text-gray-500">Select a week from your dashboard.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentSubmissionsPage;