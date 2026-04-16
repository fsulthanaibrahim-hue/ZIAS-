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
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="bg-[#161b22] p-8 rounded-xl text-center max-w-md">
        <h1 className="text-2xl font-bold text-[#e6edf3] mb-4">Dashboard Locked</h1>
        <p className="text-[#7d8590] mb-6">
          Your dashboard has been locked because you haven't visited for more than 7 days.
          Click the button below to unlock and continue learning.
        </p>
        <button
          onClick={handleUnlock}
          disabled={loading}
          className="bg-[#238636] hover:bg-[#2ea043] px-6 py-2 rounded-lg font-medium"
        >
          {loading ? "Unlocking..." : "Unlock Dashboard"}
        </button>
      </div>
    </div>
  );
}

export default DashboardLock;