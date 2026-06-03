import React, { useEffect, useState, useCallback } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

function AccountsPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    due_date: '',
    status: '',
    payment_method: '',
    notes: ''
  });
  const [addFormData, setAddFormData] = useState({
    student_name: '',
    student_id: '',
    amount: '',
    due_date: '',
    status: 'pending',
    payment_method: '',
    notes: ''
  });
  const [updating, setUpdating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await API.get('/fee-payments/');
      let paymentsData = [];
      if (Array.isArray(res.data)) {
        paymentsData = res.data;
      } else if (res.data && Array.isArray(res.data.results)) {
        paymentsData = res.data.results;
      } else if (res.data && typeof res.data === 'object') {
        paymentsData = [res.data];
      }
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await API.get('/students/');
      let studentsData = [];
      if (Array.isArray(res.data)) {
        studentsData = res.data;
      } else if (res.data && Array.isArray(res.data.results)) {
        studentsData = res.data.results;
      }
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, [fetchPayments, fetchStudents]);

  const handleStudentNameChange = (value) => {
    setAddFormData(prev => ({ ...prev, student_name: value, student_id: '' }));
    
    if (value.length > 0) {
      const filtered = students.filter(s => 
        (s.full_name || s.name || s.user?.username || '').toLowerCase().includes(value.toLowerCase())
      );
      setStudentSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectStudent = (student) => {
    const studentName = student.full_name || student.name || student.user?.username;
    setAddFormData(prev => ({ 
      ...prev, 
      student_name: studentName,
      student_id: student.id
    }));
    setShowSuggestions(false);
  };

  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    setEditFormData({
      amount: payment.amount || '',
      due_date: payment.due_date ? payment.due_date.split('T')[0] : '',
      status: payment.status || 'pending',
      payment_method: payment.payment_method || '',
      notes: payment.notes || ''
    });
    setShowEditModal(true);
  };

  const openAddModal = () => {
    setAddFormData({
      student_name: '',
      student_id: '',
      amount: '',
      due_date: '',
      status: 'pending',
      payment_method: '',
      notes: ''
    });
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setShowAddModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    if (name === 'student_name') {
      handleStudentNameChange(value);
    } else {
      setAddFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveEdit = async () => {
    if (!selectedPayment) return;
    
    setUpdating(true);
    try {
      const payload = {
        amount: parseFloat(editFormData.amount),
        due_date: editFormData.due_date,
        status: editFormData.status,
        payment_method: editFormData.payment_method,
        notes: editFormData.notes
      };
      
      await API.patch(`/fee-payments/${selectedPayment.id}/`, payload);
      toast.success('Payment updated successfully');
      setShowEditModal(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update payment');
    } finally {
      setUpdating(false);
    }
  };

  const addPayment = async () => {
    if (!addFormData.student_id) {
      toast.error('Please select a student from suggestions');
      return;
    }
    if (!addFormData.amount || parseFloat(addFormData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!addFormData.due_date) {
      toast.error('Please select due date');
      return;
    }

    setAdding(true);
    try {
      const payload = {
        student: parseInt(addFormData.student_id),
        amount: parseFloat(addFormData.amount),
        due_date: addFormData.due_date,
        status: addFormData.status,
        payment_method: addFormData.payment_method || null,
        notes: addFormData.notes
      };
      
      await API.post('/fee-payments/', payload);
      toast.success(`Payment of ₹${addFormData.amount} added with ${addFormData.status} status`);
      setShowAddModal(false);
      fetchPayments();
    } catch (error) {
      console.error('Add error:', error);
      toast.error(error.response?.data?.detail || 'Failed to add payment');
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { class: 'bg-green-100 text-green-800', label: 'Paid' },
      pending: { class: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      overdue: { class: 'bg-red-100 text-red-800', label: 'Overdue' },
      cancelled: { class: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const markAsPaid = async (paymentId) => {
    if (!window.confirm('Mark this payment as paid?')) return;
    try {
      await API.post(`/fee-payments/${paymentId}/mark_as_paid/`);
      toast.success('Payment marked as paid');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark as paid');
    }
  };

  const deletePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment record? This action cannot be undone.')) return;
    try {
      await API.delete(`/fee-payments/${paymentId}/`);
      toast.success('Payment deleted successfully');
      fetchPayments();
    } catch (error) {
      toast.error('Failed to delete payment');
    }
  };

  const filteredPayments = Array.isArray(payments) ? payments.filter(payment => {
    const studentName = (payment.student_full_name || payment.student_name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || studentName.includes(search);
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const safePayments = Array.isArray(payments) ? payments : [];
  
  const totalCollected = safePayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalPending = safePayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalOverdue = safePayments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payment Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track all fee payments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            + Add Payment
          </button>
          <button
            onClick={fetchPayments}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            ⟳ Refresh
          </button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-gray-600">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalCollected)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {safePayments.filter(p => p.status === 'paid').length} transactions
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-gray-600">Total Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(totalPending)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {safePayments.filter(p => p.status === 'pending').length} transactions
          </p>
          <p className="text-xs text-yellow-600 mt-1">⚠️ Yet to be paid</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-gray-600">Total Overdue</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalOverdue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {safePayments.filter(p => p.status === 'overdue').length} transactions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="🔍 Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pending Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-400">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => {
                const isPending = payment.status === 'pending' || payment.status === 'overdue';
                const pendingAmount = isPending ? payment.amount : 0;
                
                return (
                  <tr key={payment.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {payment.student_full_name || payment.student_name || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3 font-medium text-orange-600">
                      {isPending ? formatCurrency(pendingAmount) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(payment.due_date)}</td>
                    <td className="px-4 py-3">
                      {payment.status === 'paid' && payment.payment_date ? (
                        <span className="text-green-600 text-sm" title={formatDateTime(payment.payment_date)}>
                          {formatDate(payment.payment_date)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={payment.notes}>
                      {payment.notes || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(payment)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Payment"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {payment.status !== 'paid' && (
                          <button
                            onClick={() => markAsPaid(payment.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Mark as Paid"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => deletePayment(payment.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Add New Payment</h2>
                <p className="text-sm text-gray-500">Create a new fee payment record</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student *</label>
                <input
                  type="text"
                  name="student_name"
                  value={addFormData.student_name}
                  onChange={handleAddChange}
                  placeholder="Type student name..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoComplete="off"
                />
                {showSuggestions && studentSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {studentSuggestions.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => selectStudent(student)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
                      >
                        {student.full_name || student.name || student.user?.username}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  💡 Click on a suggestion to select the student
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={addFormData.amount}
                  onChange={handleAddChange}
                  placeholder="Enter amount"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  name="due_date"
                  value={addFormData.due_date}
                  onChange={handleAddChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={addFormData.status}
                  onChange={handleAddChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="pending">Pending (Unpaid)</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <p className="text-xs text-orange-600 mt-1">
                  💡 Pending status means this amount is yet to be collected
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="payment_method"
                  value={addFormData.payment_method}
                  onChange={handleAddChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Payment Method</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={addFormData.notes}
                  onChange={handleAddChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex gap-2">
              <button
                onClick={addPayment}
                disabled={adding}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Payment'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Edit Payment</h2>
                <p className="text-sm text-gray-500">{selectedPayment.student_full_name || selectedPayment.student_name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="p-6 space-y-4">
              {editFormData.status === 'pending' || editFormData.status === 'overdue' ? (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-orange-700">Pending Amount:</span>
                    <span className="text-xl font-bold text-orange-600">
                      {formatCurrency(editFormData.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-orange-600">
                    {editFormData.status === 'pending' 
                      ? '⚠️ This payment is pending. Amount not yet received.'
                      : '⚠️ This payment is overdue. Please collect immediately.'}
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-green-700">Payment Status:</span>
                    <span className="text-xl font-bold text-green-600">Completed</span>
                  </div>
                  <p className="text-xs text-green-600">
                    ✅ This payment has been received. No pending amount.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={editFormData.amount}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  value={editFormData.due_date}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="pending">Pending (Unpaid)</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="payment_method"
                  value={editFormData.payment_method}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Payment Method</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex gap-2">
              <button
                onClick={saveEdit}
                disabled={updating}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountsPayments;