// src/pages/reviewer/ReviewerDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

function ReviewerDashboard() {
  const [reviewer, setReviewer] = useState(null);
  const [stats, setStats] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    completedReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        const reviewerRes = await API.get("reviewers/me/", { signal: abortController.signal });
        if (!isMounted) return;
        setReviewer(reviewerRes.data);

        // Example: fetch review folders (adjust to your actual data model)
        const foldersRes = await API.get("/review-folders/", {
          params: { created_by: reviewerRes.data.id },
          signal: abortController.signal,
        });
        const folders = foldersRes.data;
        setStats({
          totalReviews: folders.length,
          pendingReviews: folders.filter(f => !f.is_done).length,
          completedReviews: folders.filter(f => f.is_done).length,
        });
      } catch (err) {
        if (err.name === "AbortError" || err.code === "ERR_CANCELED") return;
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Reviewer Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {reviewer?.user?.username || "Reviewer"}!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Department: {reviewer?.department || "Not specified"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="text-3xl font-bold text-gray-800">{stats.totalReviews}</div>
            <div className="text-gray-500 text-sm">Total Reviews</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="text-3xl font-bold text-gray-800">{stats.pendingReviews}</div>
            <div className="text-gray-500 text-sm">Pending Reviews</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="text-3xl font-bold text-gray-800">{stats.completedReviews}</div>
            <div className="text-gray-500 text-sm">Completed Reviews</div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ReviewerDashboard;