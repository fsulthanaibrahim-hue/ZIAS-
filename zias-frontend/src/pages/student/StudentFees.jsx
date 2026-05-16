// src/pages/student/StudentFees.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';
import StudentSidebar from '../../components/StudentSidebar';

function StudentFees() {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!feeData) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center text-red-600">
          Unable to load fee information.
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
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
                <span className="text-gray-600">Earliest Due Date</span>
                <span className="font-medium">
                  {feeData.due_date ? new Date(feeData.due_date).toLocaleDateString() : 'No pending dues'}
                </span>
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

          {/* Payments Table – shows each payment with due date & payment date */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">Fee Payment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feeData.payments && feeData.payments.length > 0 ? (
                    feeData.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm">₹{p.amount.toLocaleString()}</td>
                        <td className="px-6 py-3 text-sm">{new Date(p.due_date).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-sm">
                          {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.status === 'paid' ? 'bg-green-100 text-green-800' :
                            p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{p.notes || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No fee records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center mt-6">
            If you have any questions, please contact the accounts team.
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentFees;