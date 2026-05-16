// src/pages/mentor/MentorFeeOverview.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

function MentorFeeOverview() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/accounts/students/');
      let data = res.data;
      if (data.results) data = data.results;
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student fee data');
    } finally {
      setLoading(false);
    }
  };

  const viewPaymentHistory = async (student) => {
    setSelectedStudent(student);
    setHistoryLoading(true);
    try {
      const res = await API.get(`/fee-payments/?student=${student.id}`);
      let payments = res.data;
      if (payments.results) payments = payments.results;
      setPaymentHistory(Array.isArray(payments) ? payments : []);
      setShowPaymentHistory(true);
    } catch (err) {
      toast.error('Failed to load payment history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.course?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  if (loading) return <div className="p-8 text-center">Loading fee overview...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student Fee Overview (Mentor)</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by student name, email or course..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agreement</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escalation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week‑back</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map(s => {
              const outstanding = (s.total_pending || 0) + (s.total_overdue || 0);
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{s.course || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {s.agreement_signed ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Signed</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Not signed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {s.escalation_flag ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">⚠️ Flagged</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(s.total_paid)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-yellow-600">{formatCurrency(s.total_pending)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">{formatCurrency(s.total_overdue)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-purple-600">{formatCurrency(outstanding)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.week_back_fee_status === 'on_track' ? 'bg-green-100 text-green-800' : s.week_back_fee_status === 'delayed' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {s.week_back_fee_status === 'on_track' ? 'On Track' : s.week_back_fee_status === 'delayed' ? 'Delayed' : 'Overdue'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button onClick={() => viewPaymentHistory(s)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                  </td>
                 </tr>
              );
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="10" className="text-center py-8 text-gray-500">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment History Modal */}
      {showPaymentHistory && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentHistory(false)}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Payment History – {selectedStudent.name}</h2>
              <button onClick={() => setShowPaymentHistory(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {historyLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : paymentHistory.length === 0 ? (
                <p className="text-center text-gray-500">No payment records found.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentHistory.map(p => (
                      <tr key={p.id}>
                        <td className="py-2 text-sm">{formatCurrency(p.amount)}</td>
                        <td className="py-2 text-sm">{new Date(p.due_date).toLocaleDateString()}</td>
                        <td className="py-2 text-sm">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}</td>
                        <td className="py-2 text-sm">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-800' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2 text-sm text-gray-500">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowPaymentHistory(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MentorFeeOverview;