// src/Admin/Accounts.jsx
import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { toast } from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await API.get('/accounts/');
      let data = res.data;
      if (data && data.results && Array.isArray(data.results)) {
        data = data.results;
      } else if (!Array.isArray(data)) {
        data = [];
      }
      setAccounts(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const generateUsername = (fullName, email) => {
    let base = fullName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    if (!base && email) {
      base = email.split('@')[0];
    }
    if (!base) {
      base = 'user';
    }
    const suffix = Math.floor(Math.random() * 1000);
    return `${base}${suffix}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: digits });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', email: '', phone: '', department: '' });
    setEditingAccount(null);
  };

  const validatePhone = (phone) => {
    if (phone && phone.length !== 10) return false;
    return true;
  };

  const handleCreate = async () => {
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    if (!formData.full_name) {
      toast.error('Full name is required');
      return;
    }
    if (!validatePhone(formData.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    setSubmitting(true);
    try {
      const username = generateUsername(formData.full_name, formData.email);
      const payload = {
        username: username,
        email: formData.email,
        role: 'accounts',
        full_name: formData.full_name
      };
      const registerRes = await API.post('/register/', payload);
      const newUserId = registerRes.data.id;

      // Update Accounts profile with full_name, phone, department
      if (formData.full_name || formData.phone || formData.department) {
        const accountsRes = await API.get('/accounts/');
        let allAccounts = accountsRes.data;
        if (allAccounts.results) allAccounts = allAccounts.results;
        const newAccount = allAccounts.find(acc => acc.user === newUserId);
        if (newAccount) {
          await API.patch(`/accounts/${newAccount.id}/`, {
            full_name: formData.full_name,
            phone: formData.phone || '',
            department: formData.department || ''
          });
        }
      }
      toast.success(`Account created for ${formData.full_name}. Login credentials sent to ${formData.email}.`);
      setModalOpen(false);
      resetForm();
      fetchAccounts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.full_name) {
      toast.error('Full name is required');
      return;
    }
    if (!validatePhone(formData.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    setSubmitting(true);
    try {
      // Update only the Accounts profile fields (email is not changed)
      await API.patch(`/accounts/${editingAccount.id}/`, {
        full_name: formData.full_name,
        phone: formData.phone || '',
        department: formData.department || ''
      });
      toast.success('Account updated successfully');
      setModalOpen(false);
      resetForm();
      fetchAccounts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      await API.delete(`/accounts/${accountToDelete.id}/`);
      toast.success(`Account "${accountToDelete.full_name}" deleted`);
      fetchAccounts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Delete failed');
    } finally {
      setShowConfirmModal(false);
      setAccountToDelete(null);
    }
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setFormData({
      full_name: account.full_name || '',
      email: account.user?.email || '',
      phone: account.phone || '',
      department: account.department || ''
    });
    setModalOpen(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center">Loading accounts...</div>;

  const inputClass = `
    w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800
    placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30
    transition-all duration-200 text-sm
  `;

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800">
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        accountName={accountToDelete?.full_name || accountToDelete?.user?.username}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Accounts</h1>
              <p className="text-gray-500 text-xs mt-0.5">{accounts.length} total accounts</p>
            </div>
          </div>
          <button onClick={openAddModal} className="shine flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md w-full sm:w-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Account
          </button>
        </div>

        {/* Accounts Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Full Name</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Phone</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Department</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {accounts.map((acc) => (
                <tr key={acc.id} className="table-row-hover transition-colors duration-150 group">
                  <td className="px-4 py-3 text-gray-800 text-sm">{acc.full_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm break-all">{acc.user?.email || acc.email}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{acc.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {acc.department ? (
                      <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium px-2 py-1 rounded-full">
                        {acc.department}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(acc)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button onClick={() => handleDeleteClick(acc)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 sm:py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No accounts found</p>
                      <p className="text-gray-400 text-xs">Click "Add Account" to create one</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
            <form
              onSubmit={(e) => { e.preventDefault(); editingAccount ? handleUpdate() : handleCreate(); }}
              className="modal-enter bg-white rounded-2xl w-full max-w-md border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingAccount ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{editingAccount ? "Edit Account" : "Add Account"}</h3>
                    <p className="text-gray-500 text-xs">{editingAccount ? "Update account details" : "Create a new accounts user"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-4 sm:px-6 py-5 space-y-4">
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required className={inputClass} placeholder="e.g. John Doe" />
                </div>
                {!editingAccount && (
                  <div>
                    <label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={inputClass} placeholder="john@example.com" />
                  </div>
                )}
                {editingAccount && (
                  <div>
                    <label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Email (read‑only)</label>
                    <input type="email" value={formData.email} readOnly className={`${inputClass} bg-gray-100 cursor-not-allowed`} />
                  </div>
                )}
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} placeholder="10-digit mobile number" maxLength={10} />
                  <p className="text-xs text-gray-400 mt-1">Optional, exactly 10 digits if provided</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-xs font-medium mb-1.5 uppercase tracking-wider">Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleInputChange} className={inputClass} placeholder="e.g. Finance" />
                </div>
                {!editingAccount && (
                  <p className="text-xs text-gray-500">Login credentials (email + generated password) will be sent to the email address.</p>
                )}
              </div>

              <div className="flex gap-2 px-4 sm:px-6 py-4 border-t border-gray-200">
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-all text-sm font-medium shadow-sm disabled:opacity-50">
                  {submitting ? (editingAccount ? "Updating..." : "Creating...") : (editingAccount ? "Save Changes" : "Create Account")}
                </button>
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-all text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .table-row-hover:hover { background: rgba(34,197,94,0.04); }
        .modal-enter { animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .shine { position:relative; overflow:hidden; }
        .shine::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation: shine 3s infinite; }
        @keyframes shine { to { left:150%; } }
      `}</style>
    </div>
  );
}

export default Accounts;