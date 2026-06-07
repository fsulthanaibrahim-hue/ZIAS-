import { useEffect, useState, useCallback, useRef } from "react";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// Global cache to prevent duplicate requests
let cachedData = null;
let fetchPromise = null;

function MentorAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const initialFetchDone = useRef(false);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Force refresh function - always fetches fresh data
  const forceRefreshData = useCallback(async (showToastMsg = false) => {
    if (!user?.id) return;
    
    setRefreshing(true);
    try {
      const res = await API.get("/review-assignments/");
      let data = res.data;
      if (data?.results && Array.isArray(data.results)) data = data.results;
      else if (!Array.isArray(data)) data = [];
      
      // Check if new data arrived
      const oldLength = cachedData?.length || 0;
      const newLength = data.length;
      
      // Update cache
      cachedData = data;
      
      if (isMountedRef.current) {
        setAssignments(data);
        setLastUpdated(new Date());
        
        // Show notification for new assignments
        if (showToastMsg && newLength > oldLength) {
          const newCount = newLength - oldLength;
          toast.success(`📋 ${newCount} new assignment(s) received!`, {
            duration: 5000,
            icon: '📋'
          });
        }
      }
      
      console.log("Force refresh completed:", data.length, "assignments");
    } catch (err) {
      console.error("Force refresh error:", err);
      if (showToastMsg) toast.error("Failed to refresh assignments");
    } finally {
      if (isMountedRef.current) setRefreshing(false);
    }
  }, [user?.id]);

  // Normal fetch with cache (for initial load)
  const fetchAssignments = useCallback(async (forceRefresh = false, showToast = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    // If force refresh, bypass cache
    if (forceRefresh) {
      await forceRefreshData(showToast);
      setLoading(false);
      return;
    }
    
    // Return cached data if available
    if (cachedData) {
      setAssignments(cachedData);
      setLoading(false);
      return;
    }
    
    // If already fetching, wait for that promise
    if (fetchPromise) {
      try {
        const data = await fetchPromise;
        if (isMountedRef.current) setAssignments(data);
        setLoading(false);
        return;
      } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    
    fetchPromise = (async () => {
      try {
        const res = await API.get("/review-assignments/");
        let data = res.data;
        if (data?.results && Array.isArray(data.results)) data = data.results;
        else if (!Array.isArray(data)) data = [];
        
        console.log("Initial fetch:", data.length, "assignments");
        cachedData = data;
        if (isMountedRef.current) setLastUpdated(new Date());
        return data;
      } catch (err) {
        console.error("Fetch error:", err);
        if (showToast) toast.error("Failed to load assignments");
        throw err;
      } finally {
        fetchPromise = null;
      }
    })();
    
    try {
      const data = await fetchPromise;
      if (isMountedRef.current) setAssignments(data);
    } catch (err) {
      // Error already logged
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [user?.id, forceRefreshData]);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current && user?.id) {
      initialFetchDone.current = true;
      fetchAssignments();
    }
  }, [user?.id, fetchAssignments]);

  // ✅ Auto-refresh every 30 seconds - ALWAYS force refresh
  useEffect(() => {
    if (!user?.id) return;
    
    intervalRef.current = setInterval(() => {
      console.log("🔄 Auto-refreshing assignments...");
      forceRefreshData(true); // Always fetch fresh data
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.id, forceRefreshData]);

  // ✅ Refresh when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        console.log("🔄 Tab became visible, refreshing...");
        forceRefreshData(false);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id, forceRefreshData]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getSuggestedTime = (comments) => {
    if (!comments) return null;
    const match = comments.match(/Suggested time: (.*?)(\n|$)/);
    return match ? match[1] : null;
  };

  const handleAccept = async (id) => {
    try {
      await API.post(`/review-assignments/${id}/accept/`);
      // Clear cache and force refresh
      cachedData = null;
      await forceRefreshData(true);
      toast.success("Assignment accepted successfully!");
    } catch (err) {
      console.error("Accept error:", err);
      toast.error(err.response?.data?.error || "Failed to accept");
    }
  };

  const handleReject = async (id) => {
    try {
      await API.post(`/review-assignments/${id}/reject/`);
      // Clear cache and force refresh
      cachedData = null;
      await forceRefreshData(true);
      toast.success("Assignment rejected successfully!");
    } catch (err) {
      console.error("Reject error:", err);
      toast.error(err.response?.data?.error || "Failed to reject");
    }
  };

  const handleRefresh = () => {
    cachedData = null;
    forceRefreshData(true);
  };

  // Filter assignments based on status
  const filteredAssignments = assignments.filter(assignment => {
    if (filterStatus === "all") return true;
    return assignment.status === filterStatus;
  });

  // Calculate counts for each status
  const counts = {
    all: assignments.length,
    assigned: assignments.filter(a => a.status === 'assigned').length,
    accepted: assignments.filter(a => a.status === 'accepted').length,
    rejected: assignments.filter(a => a.status === 'rejected').length,
    pending: assignments.filter(a => a.status === 'pending approval').length,
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  // Format time for last updated
  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    return lastUpdated.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="mt-2 text-gray-500">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">My Review Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Assignments created when you add reviewers to review folders</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Last updated: {formatLastUpdated()}
            </span>
          )}
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
          >
            {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
          </button>
        </div>
      </div>

      <div className="mb-3 text-right">
        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
          🔄 Auto-refreshes every 30 seconds
        </span>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterStatus === "all" 
              ? "bg-gray-800 text-white" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilterStatus("assigned")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterStatus === "assigned" 
              ? "bg-blue-600 text-white" 
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
        >
          Assigned ({counts.assigned})
        </button>
        <button
          onClick={() => setFilterStatus("accepted")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterStatus === "accepted" 
              ? "bg-green-600 text-white" 
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          Accepted ({counts.accepted})
        </button>
        <button
          onClick={() => setFilterStatus("rejected")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterStatus === "rejected" 
              ? "bg-red-600 text-white" 
              : "bg-red-100 text-red-700 hover:bg-red-200"
          }`}
        >
          Rejected ({counts.rejected})
        </button>
        <button
          onClick={() => setFilterStatus("pending approval")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterStatus === "pending approval" 
              ? "bg-yellow-600 text-white" 
              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
          }`}
        >
          Pending ({counts.pending})
        </button>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-8 bg-white rounded shadow">
          <p className="text-gray-500">No assignments found for this filter.</p>
          {filterStatus === "all" && (
            <p className="text-gray-400 text-sm mt-1">
              When you assign a reviewer to a student's review folder, an assignment will appear here.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proposed Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssignments.map((ass) => {
                const suggestedTime = getSuggestedTime(ass.comments);
                const isPending = ass.status === "pending approval";
                const isAssigned = ass.status === "assigned";
                const weekNumber = ass.week ? `Week ${ass.week}` : "—";
                
                return (
                  <tr key={ass.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{ass.student_full_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{ass.reviewer_full_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ass.course || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{weekNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(ass.review_date)}</td>
                    <td className="px-4 py-3 text-sm">
                      {suggestedTime ? (
                        <span className="text-amber-600 font-medium">{suggestedTime}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        isPending ? "bg-yellow-100 text-yellow-800" :
                        ass.status === "accepted" ? "bg-green-100 text-green-800" :
                        ass.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {isPending ? "Pending Approval" : 
                         isAssigned ? "Assigned" : 
                         ass.status === "accepted" ? "Accepted" :
                         ass.status === "rejected" ? "Rejected" :
                         ass.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isPending ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAccept(ass.id)} 
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleReject(ass.id)} 
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : isAssigned ? (
                        <span className="text-xs text-gray-400">Waiting for reviewer</span>
                      ) : ass.status === "accepted" ? (
                        <span className="text-xs text-green-600">✓ Accepted</span>
                      ) : ass.status === "rejected" ? (
                        <span className="text-xs text-red-600">✗ Rejected</span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {assignments.length > 0 && (
        <div className="mt-4 text-center text-xs text-gray-400">
          Total: {assignments.length} assignment(s) • Auto-refreshes every 30 seconds
        </div>
      )}
    </div>
  );
}

export default MentorAssignments;