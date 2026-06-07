// pages/accounts/AccountsDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

function AccountsDashboard() {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState({
    total_collected: 0,
    total_pending: 0,
    total_students: 0,
    recent_payments: [],
    student_fee_summary: [],
    summary: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/accounts/dashboard/?period=${period}`);
      console.log("Dashboard response:", res.data);
      
      setData({
        total_collected: res.data.total_collected || 0,
        total_pending: res.data.total_pending || 0,
        total_students: res.data.summary?.total_students || res.data.total_students || 0,
        recent_payments: res.data.recent_payments || [],
        student_fee_summary: res.data.student_fee_summary || [],
        summary: res.data.summary || {}
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load dashboard data';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [period, fetchDashboardData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Paid': 'bg-green-100 text-green-800',
      'Partially Paid': 'bg-yellow-100 text-yellow-800',
      'Pending': 'bg-red-100 text-red-800',
      'No Fee Assigned': 'bg-gray-100 text-gray-600'
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchDashboardData} 
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen w-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with period selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Finance Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Real‑time fee collection overview</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm">
            {['monthly', 'weekly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards - 3 Cards (Collected, Pending, Total Students) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow-sm border border-emerald-100 p-4 sm:p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Collected Fees</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">{formatCurrency(data.total_collected)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl shadow-sm border border-amber-100 p-4 sm:p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Fees</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-2">{formatCurrency(data.total_pending)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-sm border border-blue-100 p-4 sm:p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Students</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-700 mt-2">{data.total_students}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Student-wise Fee Summary */}
        {data.student_fee_summary && data.student_fee_summary.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Student-wise Fee Status</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Fee</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.student_fee_summary.map((student, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-3 text-sm text-gray-800">{student.student_name}</td>
                      <td className="py-3 px-3 text-sm text-gray-500">{student.course || '—'}</td>
                      <td className="py-3 px-3 text-right text-sm font-medium text-gray-900">{formatCurrency(student.total_fee)}</td>
                      <td className="py-3 px-3 text-right text-sm font-medium text-emerald-600">{formatCurrency(student.paid)}</td>
                      <td className="py-3 px-3 text-right text-sm font-medium text-amber-600">{formatCurrency(student.pending)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {data.summary && Object.keys(data.summary).length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="2" className="py-3 px-3 text-sm font-semibold text-gray-800">Total</td>
                      <td className="py-3 px-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(data.summary.total_fee || 0)}</td>
                      <td className="py-3 px-3 text-right text-sm font-semibold text-emerald-700">{formatCurrency(data.summary.total_paid || 0)}</td>
                      <td className="py-3 px-3 text-right text-sm font-semibold text-amber-700">{formatCurrency(data.summary.total_pending_fee || 0)}</td>
                      <td className="py-3 px-3 text-center text-sm font-semibold text-gray-800">
                        {data.summary.collection_rate || 0}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* Status Summary Cards */}
        {(data.summary && data.summary.paid_count !== undefined) && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 text-center border border-emerald-200">
              <p className="text-gray-500 text-xs sm:text-sm">Fully Paid</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-700">{data.summary.paid_count || 0} students</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 sm:p-4 text-center border border-amber-200">
              <p className="text-gray-500 text-xs sm:text-sm">Partially Paid</p>
              <p className="text-lg sm:text-xl font-bold text-amber-700">{data.summary.partially_paid_count || 0} students</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 sm:p-4 text-center border border-red-200">
              <p className="text-gray-500 text-xs sm:text-sm">Pending</p>
              <p className="text-lg sm:text-xl font-bold text-red-700">{data.summary.pending_count || 0} students</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center border border-gray-200">
              <p className="text-gray-500 text-xs sm:text-sm">No Fee Assigned</p>
              <p className="text-lg sm:text-xl font-bold text-gray-700">{data.summary.no_fee_count || 0} students</p>
            </div>
          </div>
        )}

        {/* Recent Payments Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Recent Payments</h2>
            </div>
            <span className="text-xs text-gray-400">Latest transactions</span>
          </div>
          
          {data.recent_payments.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No recent payments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recent_payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-3 text-sm text-gray-800">{p.student_name}</td>
                      <td className="py-3 px-3 text-sm font-medium text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-3 text-sm text-gray-500">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'paid' ? 'bg-green-100 text-green-800' :
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountsDashboard;