import { useEffect, useState, useRef, useCallback } from "react";
import API from "../api/api";

function ProgressModal({ isOpen, onClose, student, studentId, studentName, refreshTrigger }) {
  const actualStudentId = student?.id || studentId;
  const actualStudentName = student?.full_name || student?.username || studentName || "Student";

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchingRef = useRef(false);
  const abortControllerRef = useRef(null);

  const fetchProgress = useCallback(async () => {
    if (!isOpen || !actualStudentId) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      // ✅ SINGLE API CALL - Gets all progress data at once
      const response = await API.get(`students/${actualStudentId}/progress/`, {
        signal: abortController.signal
      });
      
      setProgress(response.data);
      
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error("Progress fetch error:", err);
      setError("Failed to load progress data");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [isOpen, actualStudentId]);

  useEffect(() => {
    if (!isOpen || !actualStudentId) {
      setProgress(null);
      setError(null);
      fetchingRef.current = false;
      return;
    }
    
    fetchProgress();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, actualStudentId, refreshTrigger, fetchProgress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Student Progress</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm mt-3">Loading progress...</p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => fetchProgress()}
              className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : progress ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Student:</span> {actualStudentName}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Course</p>
                <p className="text-sm font-semibold text-gray-800">{progress.course}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Batch</p>
                <p className="text-sm font-semibold text-gray-800">{progress.batch}</p>
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500">Progress</p>
                <p className="text-sm font-bold text-amber-600">{progress.progress_percent}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${progress.progress_percent}%` }} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Completed</p>
                <p className="text-lg font-bold text-emerald-700">{progress.completed_weeks?.length || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Current Week</p>
                <p className="text-lg font-bold text-blue-700">{progress.current_week}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Weeks</p>
                <p className="text-lg font-bold text-purple-700">{progress.total_weeks}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-2">Completed Weeks:</p>
              <div className="flex flex-wrap gap-2">
                {progress.completed_weeks && progress.completed_weeks.length > 0 ? (
                  progress.completed_weeks.map(week => (
                    <span 
                      key={week} 
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                    >
                      Week {week} ✓
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">No weeks completed yet</span>
                )}
              </div>
            </div>
            
            {progress.next_week && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Next Week to Complete</p>
                <p className="text-sm font-semibold text-blue-700">Week {progress.next_week}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400">No progress data available</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProgressModal;