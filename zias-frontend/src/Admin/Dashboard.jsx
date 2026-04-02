import { useEffect, useState } from "react";
import API from "../api/api";

function Dashboard() {
  const [stats, setStats] = useState({ students: 0, mentors: 0, reviewers: 0 });

  useEffect(() => {
    Promise.all([
      API.get("students/"),
      API.get("mentors/"),
      API.get("reviewers/")
    ]).then(([studentsRes, mentorsRes, reviewersRes]) => {
      setStats({
        students: studentsRes.data.length,
        mentors: mentorsRes.data.length,
        reviewers: reviewersRes.data.length
      });
    }).catch(err => console.log(err));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="flex gap-5 flex-wrap">
        <div className="bg-blue-100 p-5 rounded-lg flex-1 min-w-[150px] text-center shadow">
          <h3 className="text-lg font-medium">Students</h3>
          <p className="text-3xl font-bold mt-2">{stats.students}</p>
        </div>
        <div className="bg-green-100 p-5 rounded-lg flex-1 min-w-[150px] text-center shadow">
          <h3 className="text-lg font-medium">Mentors</h3>
          <p className="text-3xl font-bold mt-2">{stats.mentors}</p>
        </div>
        <div className="bg-yellow-100 p-5 rounded-lg flex-1 min-w-[150px] text-center shadow">
          <h3 className="text-lg font-medium">Reviewers</h3>
          <p className="text-3xl font-bold mt-2">{stats.reviewers}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;