import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [syncing, setSyncing] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Use ref to prevent duplicate calls
  const isFetching = useRef(false);
  const fetchTimeout = useRef(null);
  const initialLoadDone = useRef(false);
  const studentIdRef = useRef(null);

  // Calculate total from payments
  const calculateTotalFromPayments = useCallback(() => {
    return allPayments.reduce((sum, payment) => {
      if (payment.status === 'paid' || payment.status === 'completed') {
        return sum + (Number(payment.amount) || 0);
      }
      return sum;
    }, 0);
  }, [allPayments]);

  // FORCE SYNC - Update the database paid_amount to match payments
  const forceSyncPaidAmount = async () => {
    if (!studentFee?.id) {
      toast.error('No fee record found to sync');
      return;
    }
    
    const paymentsTotal = calculateTotalFromPayments();
    const currentPaidAmount = Number(studentFee.paid_amount) || 0;
    
    setSyncing(true);
    try {
      console.log(`Syncing: Current DB paid_amount = ${currentPaidAmount}, Payments total = ${paymentsTotal}`);
      
      const response = await API.patch(`/student-fees/${studentFee.id}/`, {
        paid_amount: paymentsTotal
      });
      
      setStudentFee(response.data);
      toast.success(`Payment amount synchronized! Paid amount updated from ${formatCurrency(currentPaidAmount)} to ${formatCurrency(paymentsTotal)}`);
      await fetchStudentData(true);
      
    } catch (error) {
      console.error('Failed to sync paid_amount:', error);
      toast.error('Failed to sync payments. Please contact support.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchStudentData = useCallback(async (force = false) => {
    if (isFetching.current && !force) {
      console.log('Already fetching, skipping...');
      return;
    }
    
    isFetching.current = true;
    
    if (!initialLoadDone.current || force) {
      setLoading(true);
    }
    
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
      
      studentIdRef.current = student.id;
      
      setStudentInfo(student);
      setWeekBackAmount(student.week_back_amount || 0);
      setAgreementSigned(student.agreement_signed || false);

      const feeRes = await API.get(`/student-fees/?student=${student.id}`);
      let feeData = feeRes.data;
      if (feeData.results) feeData = feeData.results;
      
      if (feeData && feeData.length > 0) {
        const fee = feeData[0];
        setStudentFee(fee);
      }

      const paymentRes = await API.get(`/fee-payments/?student=${student.id}`);
      let payments = paymentRes.data;
      if (payments.results) payments = payments.results;
      
      const sortedPayments = Array.isArray(payments) 
        ? payments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        : [];
      
      setAllPayments(sortedPayments);
      initialLoadDone.current = true;

    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load fee information');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const debouncedRefresh = useCallback(() => {
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }
    fetchTimeout.current = setTimeout(() => {
      fetchStudentData(true);
    }, 500);
  }, [fetchStudentData]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      fetchStudentData();
    }
    
    const handleFeeUpdate = (event) => {
      console.log('Fee data changed, refreshing...', event);
      debouncedRefresh();
    };
    
    window.addEventListener('studentFeeUpdated', handleFeeUpdate);
    window.addEventListener('feeDataChanged', handleFeeUpdate);
    
    return () => {
      window.removeEventListener('studentFeeUpdated', handleFeeUpdate);
      window.removeEventListener('feeDataChanged', handleFeeUpdate);
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
    };
  }, [fetchStudentData, debouncedRefresh]);

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

  // Generate receipt for a payment
  const generateReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const printReceipt = () => {
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 20px; background: #f0fdf4; }
          .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .amount { font-size: 32px; color: #059669; font-weight: bold; text-align: center; margin: 20px 0; }
          .details { border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
          .footer { text-align: center; padding: 20px; background: #f9fafb; font-size: 12px; color: #6b7280; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">ZIAS Academy</div>
            <p style="margin:5px 0 0;opacity:0.9">Payment Receipt</p>
          </div>
          <div class="content">
            <div class="detail-row"><span><strong>Receipt No:</strong></span><span>${selectedPayment.id}</span></div>
            <div class="detail-row"><span><strong>Student Name:</strong></span><span>${studentInfo?.full_name || studentInfo?.name || 'Student'}</span></div>
            <div class="detail-row"><span><strong>Email:</strong></span><span>${studentInfo?.email || studentInfo?.user?.email || '—'}</span></div>
            <div class="amount">${formatCurrency(selectedPayment.amount)}</div>
            <div class="details">
              <div class="detail-row"><span>Payment Date:</span><span>${formatDate(selectedPayment.payment_date)}</span></div>
              <div class="detail-row"><span>Payment Method:</span><span>${selectedPayment.payment_method?.toUpperCase() || 'CASH'}</span></div>
              <div class="detail-row"><span>Status:</span><span style="color:#059669">${selectedPayment.status?.toUpperCase() || 'PAID'}</span></div>
              ${selectedPayment.notes ? `<div class="detail-row"><span>Notes:</span><span>${selectedPayment.notes}</span></div>` : ''}
            </div>
            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>This is a computer generated receipt.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const win = window.open();
    win.document.write(receiptHtml);
    win.document.close();
    win.print();
    toast.success('Receipt generated');
  };

  // Use the database paid_amount after sync
  const actualPaidAmount = studentFee?.paid_amount || 0;
  const totalAmount = studentFee?.total_amount || 0;
  const pendingAmount = totalAmount - actualPaidAmount;
  const paymentPercentage = totalAmount > 0 ? ((actualPaidAmount / totalAmount) * 100).toFixed(1) : 0;
  
  // Calculate payments total for display
  const paymentsTotal = calculateTotalFromPayments();
  const hasMismatch = Math.abs(paymentsTotal - actualPaidAmount) > 1;

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

  const handleManualRefresh = () => {
    toast.loading('Refreshing fee data...', { id: 'refresh' });
    fetchStudentData(true).then(() => {
      toast.success('Fee data updated!', { id: 'refresh' });
    }).catch(() => {
      toast.error('Failed to refresh', { id: 'refresh' });
    });
  };

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
            {/* Header with Buttons */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Fee Status</h1>
                <p className="text-gray-500 text-sm mt-1">View your complete fee details, payment history, and week back amount</p>
              </div>
              <div className="flex gap-2">
                {hasMismatch && (
                  <button 
                    onClick={forceSyncPaidAmount}
                    disabled={syncing}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    {syncing ? 'Fixing...' : '🔧 Fix Payment Amount'}
                  </button>
                )}
                <button 
                  onClick={handleManualRefresh}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Mismatch Warning */}
            {hasMismatch && (
              <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 text-lg">Payment Data Mismatch Detected!</h3>
                    <p className="text-red-700 text-sm mt-1">
                      Your payment records show <strong className="font-bold">{formatCurrency(paymentsTotal)}</strong> paid, 
                      but the system has recorded <strong className="font-bold">{formatCurrency(actualPaidAmount)}</strong>.
                    </p>
                    <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                      <p className="text-sm font-medium text-gray-700">How to fix:</p>
                      <p className="text-sm text-gray-600 mt-1">
                        1️⃣ Click the <strong className="text-red-600">"Fix Payment Amount"</strong> button above<br/>
                        2️⃣ This will update the database to match your actual payment records<br/>
                        3️⃣ Your correct paid amount will be {formatCurrency(paymentsTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Student Info Card */}
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

            {/* Payment History Table - No Delete Button */}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
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
                          <td className="px-6 py-4 text-sm">
                            <button 
                              onClick={() => generateReceipt(payment)}
                              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="1" className="px-6 py-3 text-sm font-semibold text-gray-700">Total</td>
                        <td className="px-6 py-3 text-sm font-bold text-emerald-600">{formatCurrency(paymentsTotal)}</td>
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
                You have made <strong>{allPayments.length}</strong> payment(s) totaling <strong>{formatCurrency(paymentsTotal)}</strong>.
                Your current paid amount is <strong>{formatCurrency(actualPaidAmount)}</strong>.
                Your current pending balance is <strong>{formatCurrency(pendingAmount)}</strong>.
                {weekBackAmount > 0 && ` You also have a week back amount of ${formatCurrency(weekBackAmount)} that needs to be cleared.`}
                {pendingAmount > 0 && ' Please complete your pending payment at the earliest.'}
              </p>
              {hasMismatch && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700">
                  ⚠️ Note: There's a mismatch between your payment records and the system. Please click the "Fix Payment Amount" button above.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReceiptModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Payment Receipt</h2>
              <button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">ZIAS Academy</h3>
                <p className="text-gray-500 text-sm">Payment Receipt</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Receipt No:</span>
                  <span className="font-medium">#{selectedPayment.id}</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Student:</span>
                  <span className="font-medium">{studentInfo?.full_name || studentInfo?.name}</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-emerald-600 text-lg">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Date:</span>
                  <span>{formatDate(selectedPayment.payment_date)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Method:</span>
                  <span className="capitalize">{selectedPayment.payment_method || 'Cash'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-emerald-600 font-medium">Paid</span>
                </div>
                {selectedPayment.notes && (
                  <div className="pb-2 border-b">
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-sm mt-1">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex gap-3">
              <button onClick={printReceipt} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition text-sm">
                Print / Download
              </button>
              <button onClick={() => setShowReceiptModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg font-medium transition text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentFees;