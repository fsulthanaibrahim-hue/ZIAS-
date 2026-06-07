import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

// ---------- Toast component ----------
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success"
    ? "bg-emerald-500"
    : type === "error"
    ? "bg-red-500"
    : "bg-slate-600";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl ${bgColor} text-white text-sm font-medium max-w-[90vw] sm:max-w-sm`}
      style={{ animation: "slideDown 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
      <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-bold shrink-0">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none ml-1">×</button>
    </div>
  );
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-7 mx-4">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function ModalWrapper({ onClose, children, maxW = "max-w-md" }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-2 sm:p-4" onClick={onClose}>
      <div className={`bg-white rounded-3xl w-full ${maxW} shadow-2xl max-h-[90vh] overflow-y-auto modal-scroll`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function DayModal({ isOpen, onClose, initialDay, onSave }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialDay?.title || "");
      setContent(initialDay?.content || "");
      if (inputRef.current) inputRef.current.focus();
    }
  }, [isOpen, initialDay]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, content });
    onClose();
  };

  if (!isOpen) return null;
  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm";
  
  return (
    <ModalWrapper onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center px-4 sm:px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{initialDay?.id ? "Edit Day" : "New Day"}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-lg transition-colors">×</button>
        </div>
        <div className="px-4 sm:px-6 py-5 space-y-3.5">
          <input ref={inputRef} type="text" placeholder="Day title" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
          <textarea placeholder="Content (optional)" value={content} onChange={(e) => setContent(e.target.value)} rows="4" className={`${inputClass} resize-none`} />
        </div>
        <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-gray-100">
          <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors">Save Day</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl transition-colors">Cancel</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ---------- Main component - Simple Day List ----------
function ModuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const hideToast = () => setToast(null);

  const [dayModal, setDayModal] = useState({ isOpen: false, initialDay: null });
  const [showDayConfirm, setShowDayConfirm] = useState(false);
  const [dayToDelete, setDayToDelete] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchModule();
    fetchDays();
  }, [id]);

  const fetchModule = async () => {
    try {
      const res = await API.get(`modules/${id}/`);
      setModule(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load module", "error");
    }
  };

  const fetchDays = async () => {
    try {
      const res = await API.get(`days/?module=${id}`);
      const daysArray = res.data.results || res.data;
      setDays(Array.isArray(daysArray) ? daysArray : []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load days", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDaySave = async (dayData) => {
    const payload = { module: id, title: dayData.title, content: dayData.content, order: 0 };
    try {
      if (dayModal.initialDay?.id) {
        await API.patch(`days/${dayModal.initialDay.id}/`, payload);
        showToast("Day updated");
      } else {
        if (days.length >= 7) {
          showToast("This week already has 7 days. Cannot add more.", "error");
          return;
        }
        await API.post("days/", payload);
        showToast("Day added");
      }
      fetchDays();
    } catch (err) {
      console.error(err);
      showToast("Error saving day", "error");
    }
  };

  const deleteDay = async () => {
    if (!dayToDelete) return;
    try {
      await API.delete(`days/${dayToDelete.id}/`);
      showToast("Day deleted", "success");
      fetchDays();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete day", "error");
    } finally {
      setShowDayConfirm(false);
      setDayToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Module not found.</p>
          <button onClick={() => navigate("/admin/modules")} className="text-emerald-600 hover:text-emerald-700 font-medium">← Back to Modules</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        
        /* Touch-friendly tap targets */
        button, [role="button"] { min-height: 44px; cursor: pointer; }
        
        /* Smooth scrolling for modals */
        .modal-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f1f5f9; }
        .modal-scroll::-webkit-scrollbar { width: 6px; }
        .modal-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .modal-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <ConfirmDeleteModal
        isOpen={showDayConfirm}
        onClose={() => setShowDayConfirm(false)}
        onConfirm={deleteDay}
        title="Delete Day?"
        message={`Are you sure you want to delete "${dayToDelete?.title}"?`}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <button 
              onClick={() => navigate("/admin/modules")} 
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors text-sm sm:text-base w-fit px-2 py-2 -ml-2"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Modules
            </button>

            {/* Mobile Menu Toggle */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Menu
              </button>
            </div>

            {/* Add Day Button */}
            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:flex`}>
              <button
                onClick={() => setDayModal({ isOpen: true, initialDay: null })}
                disabled={days.length >= 7}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto ${
                  days.length >= 7 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg active:scale-95"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Day ({days.length}/7)
              </button>
            </div>
          </div>
          
          {/* Module Info */}
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 break-words">{module.title}</h1>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
                </svg>
                {module.course_name || module.course?.name || "—"}
              </span>
              {module.order && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Week {module.order}
                </span>
              )}
            </div>
            {module.content && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">{module.content}</p>
              </div>
            )}
          </div>
        </div>

        {/* Simple Day List - No Cards, Just Numbers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Days</h2>
          </div>

          {days.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-center">No days yet. Click "Add Day" to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {days.map((day, idx) => (
                <div 
                  key={day.id} 
                  className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm sm:text-base break-words">
                        {day.title}
                      </p>
                      {day.content && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{day.content}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => setDayModal({ isOpen: true, initialDay: day })}
                      className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      title="Edit day"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setDayToDelete(day); setShowDayConfirm(true); }}
                      className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Delete day"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DayModal
        isOpen={dayModal.isOpen}
        onClose={() => setDayModal({ isOpen: false, initialDay: null })}
        initialDay={dayModal.initialDay}
        onSave={handleDaySave}
      />
    </div>
  );
}

export default ModuleDetail;