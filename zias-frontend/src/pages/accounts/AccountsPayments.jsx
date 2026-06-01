import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

function AccountsPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    student: '',
    amount: '',
    due_date: '',
    status: 'pending',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ status: '', student: '', dateFrom: '', dateTo: '' });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        API.get('/fee-payments/'),
        API.get('/accounts/students/')
      ]);
      let paymentsData = paymentsRes.data;
      if (paymentsData.results) paymentsData = paymentsData.results;
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      let studentsData = studentsRes.data;
      if (studentsData.results) studentsData = studentsData.results;
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ student: '', amount: '', due_date: '', status: 'pending', notes: '' });
    setEditingPayment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student || !formData.amount || !formData.due_date) {
      toast.error('Student, amount, and due date are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        student: formData.student,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        status: formData.status,
        notes: formData.notes
      };
      if (editingPayment) {
        await API.patch(`/fee-payments/${editingPayment.id}/`, payload);
        toast.success('Payment updated');
      } else {
        await API.post('/fee-payments/', payload);
        toast.success('Payment created');
      }
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await API.delete(`/fee-payments/${id}/`);
      toast.success('Payment deleted');
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setFormData({
      student: payment.student,
      amount: payment.amount,
      due_date: payment.due_date,
      status: payment.status,
      notes: payment.notes || ''
    });
    setModalOpen(true);
  };

  const filteredPayments = payments.filter(p => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.student && p.student !== parseInt(filters.student)) return false;
    if (filters.dateFrom && new Date(p.payment_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(p.payment_date) > new Date(filters.dateTo)) return false;
    return true;
  });

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 w-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fee Payments</h1>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg">+ Add Payment</button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4">
        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="border rounded px-3 py-2">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
        <select value={filters.student} onChange={e => setFilters({...filters, student: e.target.value})} className="border rounded px-3 py-2">
          <option value="">All Students</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" placeholder="From" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} className="border rounded px-3 py-2" />
        <input type="date" placeholder="To" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} className="border rounded px-3 py-2" />
        <button onClick={() => setFilters({ status: '', student: '', dateFrom: '', dateTo: '' })} className="bg-gray-200 px-3 py-2 rounded">Clear</button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Notes</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPayments.map(p => {
              const student = students.find(s => s.id === p.student);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-sm">{student?.name || '—'}</td>
                  <td className="px-4 py-2 text-sm">₹{p.amount}</td>
                  <td className="px-4 py-2 text-sm">{p.due_date}</td>
                  <td className="px-4 py-2 text-sm">{p.payment_date || '—'}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{p.notes || '—'}</td>
                  <td className="px-4 py-2 text-sm">
                    <button onClick={() => openEditModal(p)} className="text-blue-600 mr-2">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              );
            })}
            {filteredPayments.length === 0 && <tr><td colSpan="7" className="text-center py-8">No payments found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{editingPayment ? 'Edit Payment' : 'Add Payment'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select name="student" value={formData.student} onChange={handleInputChange} required className="w-full border rounded px-3 py-2">
                <option value="">Select Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="number" name="amount" placeholder="Amount (₹)" value={formData.amount} onChange={handleInputChange} required className="w-full border rounded px-3 py-2" />
              <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} required className="w-full border rounded px-3 py-2" />
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border rounded px-3 py-2">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              <textarea name="notes" placeholder="Notes (optional)" value={formData.notes} onChange={handleInputChange} className="w-full border rounded px-3 py-2" rows="2"></textarea>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 text-white py-2 rounded-lg">{submitting ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountsPayments;