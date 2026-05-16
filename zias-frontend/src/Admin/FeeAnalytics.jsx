// src/Admin/FeeAnalytics.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { toast } from 'react-hot-toast';

function FeeAnalytics() {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState({
    total_collected: 0,
    total_pending: 0,
    total_overdue: 0,
    monthly_income: [],
    reviewer_wise: [],
    recent_payments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/accounts/dashboard/?period=${period}`);
      setData({
        total_collected: res.data.total_collected || 0,
        total_pending: res.data.total_pending || 0,
        total_overdue: res.data.total_overdue || 0,
        monthly_income: res.data.monthly_income || [],
        reviewer_wise: res.data.reviewer_wise || [],
        recent_payments: res.data.recent_payments || []
      });
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to load data';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fee Analytics (Read‑only)</h1>
        <div className="flex gap-2">
          <button onClick={() => setPeriod('monthly')} className={`px-4 py-2 rounded-lg ${period === 'monthly' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Monthly</button>
          <button onClick={() => setPeriod('weekly')} className={`px-4 py-2 rounded-lg ${period === 'weekly' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Weekly</button>
          <button onClick={() => setPeriod('yearly')} className={`px-4 py-2 rounded-lg ${period === 'yearly' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Yearly</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-gray-500 text-sm">Collected Fees</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(data.total_collected)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-gray-500 text-sm">Pending Fees</h3>
          <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(data.total_pending)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-gray-500 text-sm">Overdue Fees</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(data.total_overdue)}</p>
        </div>
      </div>

      {/* Weekly/Monthly Income */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {period === 'weekly' ? 'Weekly Income (last 12 weeks)' : period === 'yearly' ? 'Monthly Income (last 12 months)' : 'Monthly Income (last 12 months)'}
        </h2>
        {data.monthly_income.length === 0 ? (
          <p className="text-gray-500">No data available.</p>
        ) : (
          <div className="space-y-3">
            {data.monthly_income.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">{item.month}</span>
                <span className="font-semibold text-green-600">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewer-wise Collection */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Reviewer-wise Fee Collection</h2>
        {data.reviewer_wise.length === 0 ? (
          <p className="text-gray-500">No data available.</p>
        ) : (
          <div className="space-y-3">
            {data.reviewer_wise.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">{item.reviewer}</span>
                <span className="font-semibold text-green-600">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Payments (read‑only) */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Payments</h2>
        {data.recent_payments.length === 0 ? (
          <p className="text-gray-500">No recent payments.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left py-2">Student</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2">{p.student_name}</td>
                    <td className="py-2">{formatCurrency(p.amount)}</td>
                    <td className="py-2">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        p.status === 'paid' ? 'bg-green-100 text-green-700' :
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeeAnalytics;