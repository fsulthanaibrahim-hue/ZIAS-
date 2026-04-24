// src/pages/student/StudentReviewFolders.jsx

import React, { useEffect, useState } from "react";
import API from "../../api/api";

function StudentReviewFolders() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyFolders = async () => {
      try {
        const res = await API.get("/review-folders/");
        setFolders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyFolders();
  }, []);

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Review Folders</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Week</th><th className="p-2 border">Review Date</th>
              <th className="p-2 border">Work Documents</th><th className="p-2 border">Industry Expert</th>
              <th className="p-2 border">Meeting Link</th><th className="p-2 border">Review Sheet</th>
              <th className="p-2 border">Time Started</th><th className="p-2 border">Time Ended</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {folders.map(folder => (
              <tr key={folder.id}>
                <td className="p-2 border text-center">{folder.week}</td>
                <td className="p-2 border">{folder.review_date}</td>
                <td className="p-2 border"><a href={folder.work_documents} target="_blank" className="text-blue-600 underline">Link</a></td>
                <td className="p-2 border">{folder.industry_expert}</td>
                <td className="p-2 border"><a href={folder.meeting_link} target="_blank" className="text-blue-600 underline">Link</a></td>
                <td className="p-2 border"><a href={folder.review_sheet} target="_blank" className="text-blue-600 underline">Link</a></td>
                <td className="p-2 border">{folder.time_started}</td>
                <td className="p-2 border">{folder.time_ended}</td>
                <td className="p-2 border">
                  <span className={`px-2 py-1 rounded text-white ${folder.review_status === 'Done' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                    {folder.review_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentReviewFolders;