// src/Admin/Accounts.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import API from "../api/api";
import { toast } from "react-hot-toast";

const getFriendlyErrorMessage = (err, defaultMsg = "Request failed") => {
  if (!err?.response) {
    return "Network error. Please check your connection.";
  }
  const status = err.response.status;
  if (status >= 500) {
    return "Server error. Please try again later.";
  }
  if (status === 404) {
    return "Not found.";
  }
  if (status === 400) {
    const data = err.response.data;
    if (typeof data === 'object') {
      const firstError = Object.values(data)[0];
      if (Array.isArray(firstError)) return firstError[0];
      if (typeof firstError === 'string') return firstError;
    }
    return "Invalid request. Please review your data.";
  }
  if (status === 401 || status === 403) {
    return "Unauthorized. Please log in again.";
  }
  return err.response?.data?.detail || defaultMsg;
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-gray-600";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${bgColor} text-white text-sm font-medium animate-in slide-in-from-top-2 max-w-[90vw] sm:max-w-md`}>
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

function ConfirmModal({ isOpen, onClose, onConfirm, accountName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-xl p-6 mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="text-gray-900 font-medium">{accountName}</span>?<br />
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [viewingAccount, setViewingAccount] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
  });

  const showToast = useCallback((message, type = "success") => setToastMsg({ message, type }), []);
  const hideToast = useCallback(() => setToastMsg(null), []);
  const initialFetchDone = useRef(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await API.get("accounts/");
      let accountsArray = [];
      if (Array.isArray(res.data)) {
        accountsArray = res.data;
      } else if (res.data && typeof res.data === 'object') {
        if (Array.isArray(res.data.results)) {
          accountsArray = res.data.results;
        } else if (res.data.id) {
          accountsArray = [res.data];
        }
      }
      setAccounts(accountsArray);
    } catch (err) {
      const msg = getFriendlyErrorMessage(err, "Failed to load accounts");
      showToast(msg, "error");
      setAccounts([]);
    }
  }, [showToast]);

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDeleteClick = (accountId, accountName) => {
    setAccountToDelete({ id: accountId, name: accountName });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      await API.delete(`accounts/${accountToDelete.id}/`);
      await fetchAccounts();
      showToast("Account deleted successfully", "success");
    } catch (err) {
      const msg = getFriendlyErrorMessage(err, "Failed to delete account");
      showToast(msg, "error");
    } finally {
      setShowConfirmModal(false);
      setAccountToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      department: "",
    });
    setPhoneError("");
  };

  const validatePhone = (phone) => {
    if (!phone) return true;
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    setFormData(prev => ({ ...prev, phone: value }));
    
    if (value && value.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.full_name.trim()) {
      showToast("Full name is required", "error");
      return;
    }
    if (!formData.email.trim()) {
      showToast("Email is required", "error");
      return;
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      showToast("Phone number must be exactly 10 digits", "error");
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        const updatePayload = {
          full_name: formData.full_name.trim(),
          phone: formData.phone || "",
          department: formData.department || "",
        };
        
        await API.patch(`accounts/${editingId}/`, updatePayload);
        showToast("Account updated successfully", "success");
        
        setShowForm(false);
        setEditingId(null);
        resetForm();
        await fetchAccounts();

      } else {
        const createPayload = {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone || "",
          department: formData.department || "",
        };
        
        console.log("Creating account with payload:", createPayload);
        const response = await API.post("accounts/", createPayload);
        
        const generatedUsername = response.data?.username || "generated";
        showToast(`Account created! Username: ${generatedUsername} sent to ${formData.email}`, "success");

        setShowForm(false);
        resetForm();
        await fetchAccounts();
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error:", error);
      let msg = "Error saving account";
      
      if (error.response?.data?.error) {
        msg = error.response.data.error;
      } else if (error.response?.data?.detail) {
        msg = error.response.data.detail;
      } else if (error.response?.data?.email) {
        msg = `Email error: ${error.response.data.email}`;
      }
      
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (account) => {
    setEditingId(account.id);
    setFormData({
      full_name: account.full_name || "",
      email: account.user?.email || account.email || "",
      phone: account.phone || "",
      department: account.department || "",
    });
    setPhoneError("");
    setShowForm(true);
    setViewingAccount(null);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredAccounts = Array.isArray(accounts)
    ? accounts.filter(a =>
        (a.full_name || a.username)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.department?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const totalFiltered = filteredAccounts.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const inputClass = `w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all duration-200 text-sm`;
  const inputErrorClass = `w-full bg-white border border-red-500 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all duration-200 text-sm`;

  const getInitials = (name) => (name || "?")[0].toUpperCase();
  const avatarColors = [
    "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700", "from-amber-500 to-amber-700",
    "from-rose-500 to-rose-700", "from-cyan-500 to-cyan-700",
  ];
  const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800" style={{ fontFamily: "'Geist', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        .table-row-hover:hover { background: rgba(34,197,94,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
        @keyframes slide-in-from-top-2 { from { opacity:0; transform:translateY(-1rem); } to { opacity:1; transform:translateY(0); } }
        .animate-in { animation: slide-in-from-top-2 0.2s ease-out; }
        @media (max-width: 640px) {
          .accounts-table thead { display: none; }
          .accounts-table tbody tr { display: block; margin-bottom: 1rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; background: white; }
          .accounts-table tbody td { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; text-align: right; gap: 1rem; }
          .accounts-table tbody td:last-child { border-bottom: none; }
          .accounts-table tbody td::before { content: attr(data-label); font-weight: 600; color: #6b7280; text-align: left; flex: 1; }
        }
      `}</style>

      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={hideToast} />}
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDelete} accountName={accountToDelete?.name} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Accounts</h1>
              <p className="text-gray-500 text-xs mt-0.5">{accounts.length} total · {filteredAccounts.length} shown</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all text-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                resetForm();
                setShowForm(true);
              }}
              className="shine flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Account
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
            <form
              onSubmit={handleSubmit}
              className="modal-enter bg-white rounded-2xl w-full max-w-2xl border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingId ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{editingId ? "Edit Account" : "New Account"}</h3>
                    <p className="text-gray-500 text-xs">{editingId ? "Update account information" : "Add a new accounts user"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Account Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-gray-600 text-xs font-medium mb-1.5">Full Name *</label>
                      <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className={inputClass} placeholder="Enter full name" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-gray-600 text-xs font-medium mb-1.5">Email *</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                        disabled={!!editingId}
                        className={`${inputClass} ${editingId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder={editingId ? "Email cannot be changed" : "Enter email address"}
                      />
                      {!editingId && (
                        <p className="text-xs text-gray-400 mt-1">Username will be auto-generated from email prefix</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-medium mb-1.5">Phone</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handlePhoneChange} 
                        className={phoneError ? inputErrorClass : inputClass}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                      />
                      {phoneError && (
                        <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                      )}
                      {!phoneError && formData.phone && formData.phone.length === 10 && (
                        <p className="text-xs text-green-500 mt-1">✓ Valid phone number</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Optional, exactly 10 digits if provided</p>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-medium mb-1.5">Department</label>
                      <input type="text" name="department" value={formData.department} onChange={handleChange} className={inputClass} placeholder="Department name" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-4 border-t border-gray-200">
                <button 
                  type="submit" 
                  disabled={submitting || !!phoneError} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Account")}
                </button>
                {!editingId && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Credentials will be emailed automatically
                  </p>
                )}
              </div>
            </form>
          </div>
        )}

        {/* View Details Modal - EXACTLY like Mentors page */}
        {viewingAccount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setViewingAccount(null)}>
            <div className="bg-white rounded-2xl w-full max-w-3xl border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Account Details</h3>
                    <p className="text-gray-500 text-xs">View all account information</p>
                  </div>
                </div>
                <button type="button" onClick={() => setViewingAccount(null)} className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-500 text-xs">Full Name</label>
                      <p className="text-gray-800 text-sm mt-1">{viewingAccount.full_name || "—"}</p>
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs">Email</label>
                      <p className="text-gray-800 text-sm mt-1 break-all">{viewingAccount.user?.email || viewingAccount.email || "—"}</p>
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs">Phone</label>
                      <p className="text-gray-800 text-sm mt-1">
                        {viewingAccount.phone ? (
                          <span className="font-mono">{viewingAccount.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}</span>
                        ) : "—"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs">Department</label>
                      <p className="text-gray-800 text-sm mt-1">
                        {viewingAccount.department ? (
                          <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium px-2 py-1 rounded-full">
                            {viewingAccount.department}
                          </span>
                        ) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end">
                <button onClick={() => setViewingAccount(null)} className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 hover:text-gray-800 px-5 py-2 rounded-lg transition-all text-sm font-medium">Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="accounts-table min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Account</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Phone</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Department</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedAccounts.map((a) => (
                <tr key={a.id} className="table-row-hover group">
                  <td data-label="Account" className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(a.full_name || a.user?.username)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {getInitials(a.full_name || a.user?.username)}
                      </div>
                      <button onClick={() => setViewingAccount(a)} className="text-gray-800 text-sm font-medium hover:text-green-600 transition-colors cursor-pointer">
                        {a.full_name || a.user?.username}
                      </button>
                    </div>
                  </td>
                  <td data-label="Email" className="px-4 py-3 text-gray-500 text-sm break-all">{a.user?.email || a.email || "—"}</td>
                  <td data-label="Phone" className="px-4 py-3 text-gray-500 text-sm">{a.phone || "—"}</td>
                  <td data-label="Department" className="px-4 py-3">
                    {a.department ? (
                      <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium px-2 py-1 rounded-full">
                        {a.department}
                      </span>
                    ) : "—"}
                  </td>
                  <td data-label="Actions" className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(a)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button onClick={() => handleDeleteClick(a.id, a.full_name || a.user?.username)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedAccounts.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">{searchTerm ? "No accounts match your search" : "No accounts yet"}</td>
                </tr>
              )}
            </tbody>
          </table>
          {totalFiltered > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row justify-between gap-3 items-center">
              <div className="text-gray-500 text-xs">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered} accounts</div>
              <div className="flex gap-1 flex-wrap justify-center">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100 disabled:hover:bg-transparent">←</button>
                {getPageNumbers().map((page, idx) => page === "..." ? <span key={idx} className="px-2 py-1.5 text-gray-400">...</span> : <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === page ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>{page}</button>)}
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100 disabled:hover:bg-transparent">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Accounts;