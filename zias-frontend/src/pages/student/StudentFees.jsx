import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';
import StudentSidebar from '../../components/StudentSidebar';

function StudentFees() {
  const [studentInfo, setStudentInfo] = useState(null);
  const [studentFee, setStudentFee] = useState(null);
  const [allPayments, setAllPayments] = useState([]);
  const [weekBackAmount, setWeekBackAmount] = useState(0);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      let student = null;
      
      try {
        const profileRes = await API.get('/students/me/');
        student = profileRes.data;
      } catch (err1) {
        try {
          const userRes = await API.get('/users/me/');
          const userId = userRes.data.id;
          const studentRes = await API.get(`/students/?user=${userId}`);
          let studentData = studentRes.data;
          if (studentData.results) studentData = studentData.results;
          if (studentData && studentData.length > 0) {
            student = studentData[0];
          }
        } catch (err2) {
          console.error('Error fetching student:', err2);
        }
      }
      
      if (!student) {
        toast.error('Could not fetch student information');
        setLoading(false);
        return;
      }
      
      setStudentInfo(student);
      setWeekBackAmount(student.week_back_amount || 0);
      setAgreementSigned(student.agreement_signed || false);

      // Get student's fee record
      const feeRes = await API.get(`/student-fees/?student=${student.id}`);
      let feeData = feeRes.data;
      if (feeData.results) feeData = feeData.results;
      
      if (feeData && feeData.length > 0) {
        const fee = feeData[0];
        setStudentFee(fee);
      }

      // Get ALL payments for this student
      const paymentRes = await API.get(`/fee-payments/?student=${student.id}`);
      let payments = paymentRes.data;
      if (payments.results) payments = payments.results;
      
      const sortedPayments = Array.isArray(payments) 
        ? payments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        : [];
      
      setAllPayments(sortedPayments);

    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load fee information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '₹0';
    return '₹' + numAmount.toLocaleString('en-IN');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Calculate actual paid amount from payments
  const actualPaidAmount = allPayments.reduce((sum, payment) => {
    if (payment.status === 'paid' || payment.status === 'completed') {
      return sum + (Number(payment.amount) || 0);
    }
    return sum;
  }, 0);

  const totalAmount = studentFee?.total_amount || 0;
  const pendingAmount = totalAmount - actualPaidAmount;
  const paymentPercentage = totalAmount > 0 ? ((actualPaidAmount / totalAmount) * 100).toFixed(1) : 0;

  let feeStatus = 'Pending';
  let statusColor = 'bg-rose-100 text-rose-800';
  let statusBadgeColor = 'bg-rose-500';
  if (pendingAmount <= 0 && totalAmount > 0) {
    feeStatus = 'Paid';
    statusColor = 'bg-emerald-100 text-emerald-800';
    statusBadgeColor = 'bg-emerald-500';
  } else if (actualPaidAmount > 0 && pendingAmount > 0) {
    feeStatus = 'Partially Paid';
    statusColor = 'bg-amber-100 text-amber-800';
    statusBadgeColor = 'bg-amber-500';
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading your fee information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Fee Status</h1>
              <p className="text-gray-500 text-sm mt-1">View your complete fee details, payment history, and week back amount</p>
            </div>

            {/* Student Info Card - Student ID Removed */}
            {studentInfo && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{studentInfo.full_name || studentInfo.name || 'Student'}</h2>
                    <p className="text-gray-500 text-sm">{studentInfo.email || studentInfo.user?.email}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        📚 {studentInfo.course || 'Course not assigned'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        🎓 Batch: {studentInfo.batch || studentInfo.batch_name || 'Not assigned'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${agreementSigned ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {agreementSigned ? '✅ Agreement Signed' : '❌ Agreement Not Signed'}
                      </span>
                    </div>
                  </div>
                  {/* Student ID section completely removed */}
                </div>
              </div>
            )}

            {/* Fee Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Fee</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                  </div>
                  <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Amount Paid</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(actualPaidAmount)}</p>
                  </div>
                  <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Pending Amount</p>
                    <p className="text-2xl font-bold text-rose-600">{formatCurrency(pendingAmount)}</p>
                  </div>
                  <div className="w-11 h-11 bg-rose-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Week Back Amount</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(weekBackAmount)}</p>
                  </div>
                  <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status Badge */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Payment Status</p>
                  <p className={`text-2xl font-bold ${feeStatus === 'Paid' ? 'text-emerald-600' : feeStatus === 'Partially Paid' ? 'text-amber-600' : 'text-rose-600'}`}>
                    {feeStatus}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full text-white text-sm font-medium ${statusBadgeColor}`}>
                  {paymentPercentage}% Completed
                </div>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${feeStatus === 'Paid' ? 'bg-emerald-500' : feeStatus === 'Partially Paid' ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
            </div>

            {/* Week Back Alert */}
            {weekBackAmount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-8 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800">Week Back Amount Alert</h3>
                    <p className="text-orange-700 text-sm mt-1">
                      You have a week back amount of <strong className="text-lg">{formatCurrency(weekBackAmount)}</strong>.
                      Please clear this amount at your earliest convenience to avoid any issues.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-800">Payment History</h3>
                <p className="text-xs text-gray-500 mt-0.5">Complete record of all your payments</p>
              </div>
              
              <div className="overflow-x-auto">
                {allPayments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No payment records found.</p>
                    <p className="text-xs mt-1">Once you make a payment, it will appear here.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allPayments.map((payment, index) => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(payment.payment_date)}</td>
                          <td className="px-6 py-4 text-sm capitalize text-gray-600">
                            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                              {payment.payment_method || 'Cash'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {payment.status || 'Paid'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{payment.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="1" className="px-6 py-3 text-sm font-semibold text-gray-700">Total</td>
                        <td className="px-6 py-3 text-sm font-bold text-emerald-600">{formatCurrency(actualPaidAmount)}</td>
                        <td colSpan="4"></td>
                       </tr>
                    </tfoot>
                   </table>
                )}
              </div>
            </div>

            {/* Summary Note */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">📌 Fee Summary</h3>
              <p className="text-sm text-blue-700">
                Your total fee is <strong>{formatCurrency(totalAmount)}</strong>. 
                You have made <strong>{allPayments.length}</strong> payment(s) totaling <strong>{formatCurrency(actualPaidAmount)}</strong>.
                Your current pending balance is <strong>{formatCurrency(pendingAmount)}</strong>.
                {weekBackAmount > 0 && ` You also have a week back amount of ${formatCurrency(weekBackAmount)} that needs to be cleared.`}
                {pendingAmount > 0 && ' Please complete your pending payment at the earliest.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentFees;