import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";
import toast from "react-hot-toast";

function ReviewerAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestTimeForId, setSuggestTimeForId] = useState(null);
  const [suggestedTime, setSuggestedTime] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const initialFetchDone = useRef(false);
  const isRefreshingRef = useRef(false);

  // Fetch assignments - optimized with timeout
  const fetchAssignments = useCallback(async (showToast = false) => {
    if (isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await API.get("/review-assignments/", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      let data = res.data;
      if (data?.results && Array.isArray(data.results)) data = data.results;
      else if (!Array.isArray(data)) data = [];
      
      const oldLength = assignments.length;
      
      if (isMountedRef.current) {
        setAssignments(data);
        
        if (showToast && data.length > oldLength && oldLength > 0) {
          const newCount = data.length - oldLength;
          toast.success(`📋 ${newCount} new assignment(s) received!`);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Fetch error:", err);
        if (showToast) toast.error("Failed to load assignments");
      }
    } finally {
      isRefreshingRef.current = false;
      if (isMountedRef.current && initialFetchDone.current) {
        setLoading(false);
      }
    }
  }, [assignments.length]);

  // Initial fetch - runs once
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchAssignments();
      // Set a maximum timeout for loading state
      const timeout = setTimeout(() => {
        if (isMountedRef.current && loading) {
          setLoading(false);
          toast.error("Loading timeout. Please refresh.");
        }
      }, 15000);
      
      return () => clearTimeout(timeout);
    }
  }, []); // Empty dependency - runs once

  // Auto-refresh every 30 seconds (only after initial load)
  useEffect(() => {
    if (!initialFetchDone.current) return;
    
    intervalRef.current = setInterval(() => {
      console.log("🔄 Auto-refreshing reviewer assignments...");
      fetchAssignments(true);
    }, 30000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAssignments]);

  // Refresh when tab becomes visible
  useEffect(() => {
    if (!initialFetchDone.current) return;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Tab visible, refreshing...");
        fetchAssignments(false);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchAssignments]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => { 
      isMountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSuggestTime = async (id) => {
    if (!suggestedTime.trim()) {
      toast.error("Please enter a time (e.g., 2:00 PM)");
      return;
    }
    
    setIsSubmitting(true);
    const timeValue = suggestedTime;
    
    try {
      await API.post(`/review-assignments/${id}/suggest_time/`, { proposed_time: timeValue });
      
      toast.success(`Time suggested: ${timeValue}`);
      
      setSuggestTimeForId(null);
      setSuggestedTime("");
      
      // Optimistic update
      setAssignments(prevAssignments => 
        prevAssignments.map(ass => 
          ass.id === id 
            ? { 
                ...ass, 
                status: "pending approval",
                comments: ass.comments 
                  ? `${ass.comments}\nSuggested time: ${timeValue}`
                  : `Suggested time: ${timeValue}`
              }
            : ass
        )
      );
      
      // Background refresh
      fetchAssignments(false);
      
    } catch (err) {
      console.error("Suggest time error:", err);
      toast.error("Failed to suggest time: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSuggestedTime = (comments) => {
    if (!comments) return null;
    const match = comments.match(/Suggested time: (.*?)(\n|$)/);
    return match ? match[1] : null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filterStatus === "all") return true;
    return assignment.status === filterStatus;
  });

  const counts = {
    all: assignments.length,
    assigned: assignments.filter(a => a.status === "assigned").length,
    accepted: assignments.filter(a => a.status === "accepted").length,
    rejected: assignments.filter(a => a.status === "rejected").length,
    pending: assignments.filter(a => a.status === "pending approval").length
  };

  // Show skeleton loader while loading
  if (loading && assignments.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen w-full">
        <div className="mb-4">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Skeleton filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        {/* Skeleton table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <div className="h-12 w-full bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">My Review Assignments</h1>
        <p className="text-sm text-gray-500 mt-1">Auto-refreshes every 30 seconds</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilterStatus("all")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === "all" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>All ({counts.all})</button>
        <button onClick={() => setFilterStatus("assigned")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === "assigned" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>Assigned ({counts.assigned})</button>
        <button onClick={() => setFilterStatus("accepted")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === "accepted" ? "bg-green-600 text-white" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>Accepted ({counts.accepted})</button>
        <button onClick={() => setFilterStatus("rejected")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === "rejected" ? "bg-red-600 text-white" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>Rejected ({counts.rejected})</button>
        <button onClick={() => setFilterStatus("pending approval")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === "pending approval" ? "bg-yellow-600 text-white" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"}`}>Pending ({counts.pending})</button>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-8 bg-white rounded shadow">
          <p className="text-gray-500">No assignments found for this filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proposed Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Sheet</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssignments.map((ass) => {
                const existingTime = getSuggestedTime(ass.comments);
                const isAssigned = ass.status === "assigned";
                const showSuggest = isAssigned && suggestTimeForId === ass.id;
                const studentId = ass.student_id || ass.student;
                const weekNumber = ass.week ? `Week ${ass.week}` : "—";
                const isPendingApproval = ass.status === "pending approval";
                
                return (
                  <tr key={ass.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{ass.student_full_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{ass.mentor_full_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{ass.course || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{weekNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(ass.review_date)}</td>
                    <td className="px-4 py-3 text-sm">
                      {showSuggest ? (
                        <input 
                          type="text" 
                          value={suggestedTime} 
                          onChange={(e) => setSuggestedTime(e.target.value)} 
                          placeholder="e.g., 2:00 PM" 
                          className="border rounded px-2 py-1 w-28 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                          autoFocus 
                        />
                      ) : isPendingApproval ? (
                        <span className="text-amber-600 font-medium">{existingTime || "—"}</span>
                      ) : (existingTime || "—")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {studentId ? (
                        <Link to={`/reviewer/review-sheet?student_id=${studentId}`} className="text-indigo-600 hover:text-indigo-800 underline">View Sheet</Link>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        ass.status === "assigned" ? "bg-blue-100 text-blue-800" :
                        ass.status === "pending approval" ? "bg-yellow-100 text-yellow-800" :
                        ass.status === "accepted" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {ass.status === "pending approval" ? "Pending Approval" : 
                         ass.status === "assigned" ? "Assigned" : 
                         ass.status === "accepted" ? "Accepted" : "Rejected"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isAssigned ? (
                        showSuggest ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleSuggestTime(ass.id)} 
                              disabled={isSubmitting}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                            >
                              {isSubmitting ? "Saving..." : "Save"}
                            </button>
                            <button 
                              onClick={() => { setSuggestTimeForId(null); setSuggestedTime(""); }} 
                              className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setSuggestTimeForId(ass.id)} 
                            className="text-blue-600 border border-blue-300 hover:bg-blue-50 px-2 py-1 rounded text-xs transition-colors"
                          >
                            Suggest Time
                          </button>
                        )
                      ) : isPendingApproval ? (
                        <span className="text-yellow-600 text-sm flex items-center gap-1">
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Waiting for mentor
                        </span>
                      ) : ass.status === "accepted" ? (
                        <span className="text-green-600 text-sm">✓ Accepted</span>
                      ) : ass.status === "rejected" ? (
                        <span className="text-red-600 text-sm">✗ Rejected</span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReviewerAssignments;