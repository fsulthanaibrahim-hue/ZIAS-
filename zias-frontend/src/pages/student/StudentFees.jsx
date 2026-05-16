import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

function StudentFees() {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeeSummary();
  }, []);

  const fetchFeeSummary = async () => {
    try {
      const res = await API.get('/student/fee-summary/');
      setFeeData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load fee information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading fee details...</div>;
  if (!feeData) return <div className="p-8 text-center">Unable to load fee information.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Fee Status</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-gray-600 text-sm">Total Paid</p>
          <p className="text-2xl font-bold text-green-700">₹{feeData.total_paid.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-gray-600 text-sm">Pending Amount</p>
          <p className="text-2xl font-bold text-yellow-700">₹{feeData.total_pending.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-gray-600 text-sm">Overdue Amount</p>
          <p className="text-2xl font-bold text-red-700">₹{feeData.total_overdue.toLocaleString()}</p>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Due Date</span>
            <span className="font-medium">{feeData.due_date ? new Date(feeData.due_date).toLocaleDateString() : 'No pending dues'}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Required Action</span>
            <span className="font-medium text-orange-600">{feeData.required_action}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Payment Received (last 30 days)</span>
            <span className={`font-medium ${feeData.payment_received ? 'text-green-600' : 'text-gray-500'}`}>
              {feeData.payment_received ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Agreement Signed</span>
            <span className="font-medium">{feeData.agreement_signed ? '✓ Signed' : '✗ Not signed'}</span>
          </div>
          {feeData.escalation_flag && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">
              ⚠️ Escalation Flag Active – Please contact accounts immediately.
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center">
        If you have any questions, please contact the accounts team.
      </div>
    </div>
  );
}

export default StudentFees;