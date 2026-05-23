// src/Admin/FeeAnalytics.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { toast } from 'react-hot-toast';

function FeeAnalytics() {
  const [period, setPeriod] = useState('monthly');
  const [summary, setSummary] = useState({
    total_collected: 0,
    total_pending: 0,
    total_overdue: 0
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Refs to prevent duplicate API calls
  const initialFetchDone = useRef(false);
  const summaryFetchingRef = useRef(false);
  const studentsFetchedRef = useRef(false);
  const currentPeriodRef = useRef('monthly');

  const fetchSummary = async (periodValue) => {
    // Prevent duplicate summary calls for the same period
    if (summaryFetchingRef.current && currentPeriodRef.current === periodValue) {
      return;
    }
    summaryFetchingRef.current = true;
    currentPeriodRef.current = periodValue;
    
    try {
      const res = await API.get(`/accounts/dashboard/?period=${periodValue}`);
      setSummary({
        total_collected: res.data.total_collected || 0,
        total_pending: res.data.total_pending || 0,
        total_overdue: res.data.total_overdue || 0
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load summary data');
    } finally {
      summaryFetchingRef.current = false;
    }
  };

  const fetchStudents = async () => {
    // Prevent duplicate students fetch
    if (studentsFetchedRef.current) return;
    studentsFetchedRef.current = true;
    
    try {
      const res = await API.get('/accounts/students/');
      let data = res.data;
      if (data.results) data = data.results;
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student fee data');
      studentsFetchedRef.current = false;
    }
  };

  // Initial load - only once
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchSummary('monthly'), fetchStudents()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  // Handle period changes - only when period actually changes
  useEffect(() => {
    if (!initialFetchDone.current) return;
    fetchSummary(period);
  }, [period]);

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

  if (loading) return <div className="p-8 text-center">Loading fee analytics...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Fee Analytics</h1>
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm">
            <button 
              onClick={() => setPeriod('monthly')} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'monthly' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setPeriod('weekly')} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'weekly' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setPeriod('yearly')} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'yearly' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-sm border border-green-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Collected Fees</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(summary.total_collected)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-sm border border-orange-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Fees</p>
                <p className="text-2xl font-bold text-orange-700 mt-1">{formatCurrency(summary.total_pending)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-sm border border-red-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Overdue Fees</p>
                <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(summary.total_overdue)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

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

        {/* Student Fee Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
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
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.week_back_fee_status === 'on_track' 
                            ? 'bg-green-100 text-green-800' 
                            : s.week_back_fee_status === 'delayed' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {s.week_back_fee_status === 'on_track' ? 'On Track' : s.week_back_fee_status === 'delayed' ? 'Delayed' : 'Overdue'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => viewPaymentHistory(s)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : p.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-red-100 text-red-800'
                            }`}>
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
    </div>
  );
}

export default FeeAnalytics;