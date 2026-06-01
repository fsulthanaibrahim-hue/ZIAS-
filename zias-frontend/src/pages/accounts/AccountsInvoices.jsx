import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

function AccountsInvoices() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ student: '', status: '', dateFrom: '', dateTo: '' });
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

  const generateInvoiceNumber = (id) => `INV-${String(id).padStart(6, '0')}`;

  const filteredInvoices = payments.filter(p => {
    if (filters.student && p.student !== parseInt(filters.student)) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.dateFrom && new Date(p.due_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(p.due_date) > new Date(filters.dateTo)) return false;
    return true;
  });

  if (loading) return <div className="p-8 text-center">Loading invoices...</div>;

  return (
    <div className="p-6 w-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <button onClick={() => window.print()} className="bg-green-600 text-white px-4 py-2 rounded-lg">Print / Export PDF</button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4">
        <select value={filters.student} onChange={e => setFilters({...filters, student: e.target.value})} className="border rounded px-3 py-2">
          <option value="">All Students</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="border rounded px-3 py-2">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
        <input type="date" placeholder="Due From" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} className="border rounded px-3 py-2" />
        <input type="date" placeholder="Due To" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} className="border rounded px-3 py-2" />
        <button onClick={() => setFilters({ student: '', status: '', dateFrom: '', dateTo: '' })} className="bg-gray-200 px-3 py-2 rounded">Clear</button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Invoice #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInvoices.map(p => {
              const student = students.find(s => s.id === p.student);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-sm">{generateInvoiceNumber(p.id)}</td>
                  <td className="px-4 py-2 text-sm">{student?.name || '—'}</td>
                  <td className="px-4 py-2 text-sm">₹{p.amount}</td>
                  <td className="px-4 py-2 text-sm">{p.due_date}</td>
                  <td className="px-4 py-2 text-sm">{p.payment_date || '—'}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      p.status === 'paid' ? 'bg-green-100 text-green-700' :
                      p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <button className="text-blue-600 hover:underline">View</button>
                  </td>
                </tr>
              );
            })}
            {filteredInvoices.length === 0 && (
              <tr><td colSpan="7" className="text-center py-8">No invoices found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AccountsInvoices;