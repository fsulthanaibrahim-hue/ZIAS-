// src/pages/student/DashboardLock.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

function DashboardLock() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUnlock = async () => {
    setLoading(true);
    try {
      await API.post("update-dashboard-access/");
      navigate("/student/dashboard");
    } catch (err) {
      alert("Failed to unlock. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Locked</h1>
        <p className="text-gray-600 mb-6">
          Your dashboard has been locked because you haven't visited for more than 7 days.
          Click the button below to unlock and continue learning.
        </p>
        <button
          onClick={handleUnlock}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm"
        >
          {loading ? "Unlocking..." : "Unlock Dashboard"}
        </button>
      </div>
    </div>
  );
}

export default DashboardLock;