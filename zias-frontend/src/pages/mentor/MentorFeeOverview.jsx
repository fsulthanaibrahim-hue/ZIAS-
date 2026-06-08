import React, { useEffect, useState, useCallback, useRef } from "react";
import API from "../../api/api";
import toast from "react-hot-toast";

// Cache to prevent duplicate requests
let cachedData = null;
let fetchPromise = null;
let initialFetchDone = false;

function MentorFeeOverview() {
  const [students, setStudents] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState(false);
  
  // Payment history modal
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Receipt modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Fetch data - only one API call at a time
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      cachedData = null;
      fetchPromise = null;
    }
    
    if (cachedData && !forceRefresh) {
      setStudents(cachedData.students);
      setStudentFees(cachedData.studentFees);
      setLoading(false);
      return;
    }
    
    if (fetchPromise && !forceRefresh) {
      try {
        const data = await fetchPromise;
        setStudents(data.students);
        setStudentFees(data.studentFees);
        setLoading(false);
        return;
      } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    
    fetchPromise = (async () => {
      try {
        const token = localStorage.getItem("access_token");
        const BASE_URL = "http://127.0.0.1:8000";
        
        // Fetch mentor profile
        const mentorRes = await fetch(`${BASE_URL}/api/mentors/me/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const mentor = await mentorRes.json();
        const mentorId = mentor.id;
        
        // Fetch all students
        const studentsRes = await fetch(`${BASE_URL}/api/students/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const studentsData = await studentsRes.json();
        const allStudents = studentsData.results || studentsData;
        
        // Filter students by mentor
        const mentorStudents = allStudents.filter(s => s.mentor === mentorId);
        
        // Get student IDs for this mentor
        const mentorStudentIds = mentorStudents.map(s => s.id);
        
        const mappedStudents = mentorStudents.map(s => ({
          id: s.id,
          name: s.full_name || s.name || `Student ${s.id}`,
          full_name: s.full_name,
          email: s.user?.email || s.email,
          course: s.course,
          batch: s.batch || s.batch_name,
          week_back_amount: parseFloat(s.week_back_amount) || 0,
          agreement_signed: s.agreement_signed || false,
          phone: s.phone
        }));
        
        // Fetch all student fees
        const studentFeesRes = await fetch(`${BASE_URL}/api/student-fees/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const feesData = await studentFeesRes.json();
        let feesList = feesData.results || feesData;
        
        // ** IMPORTANT: Filter fees to only this mentor's students **
        const filteredFees = Array.isArray(feesList) 
          ? feesList.filter(fee => mentorStudentIds.includes(fee.student))
          : [];
        
        const result = {
          students: mappedStudents,
          studentFees: filteredFees
        };
        
        cachedData = result;
        return result;
        
      } catch (err) {
        console.error("Error:", err);
        toast.error("Failed to load fee data");
        throw err;
      } finally {
        fetchPromise = null;
      }
    })();
    
    try {
      const data = await fetchPromise;
      setStudents(data.students);
      setStudentFees(data.studentFees);
    } catch (err) {
      // Error already handled
    } finally {
      setLoading(false);
    }
  }, []);

  const getStudentFeeInfo = (student) => {
    const studentFeeRecord = studentFees.find((sf) => sf.student === student.id);
    
    if (studentFeeRecord) {
      const totalAmount = Number(studentFeeRecord.total_amount) || 0;
      const paidAmount = Number(studentFeeRecord.paid_amount) || 0;
      const pendingAmount = totalAmount - paidAmount;
      
      let feeStatus = "Pending";
      if (pendingAmount <= 0 && totalAmount > 0) feeStatus = "Paid";
      else if (pendingAmount > 0 && paidAmount > 0) feeStatus = "Partially Paid";
      else if (pendingAmount === totalAmount && totalAmount > 0) feeStatus = "Pending";
      else if (totalAmount === 0) feeStatus = "No Fee Assigned";
      
      return {
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
        weekBackAmount: student.week_back_amount || 0,
        agreementSigned: student.agreement_signed || false,
        studentFeeId: studentFeeRecord.id,
        feeStatus: feeStatus
      };
    }
    
    return {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      weekBackAmount: student.week_back_amount || 0,
      agreementSigned: student.agreement_signed || false,
      studentFeeId: null,
      feeStatus: "No Fee Assigned"
    };
  };

  const viewPaymentHistory = async (student) => {
    setSelectedStudent(student);
    setHistoryLoading(true);
    setShowPaymentHistory(true);
    try {
      const token = localStorage.getItem("access_token");
      const BASE_URL = "http://127.0.0.1:8000";
      
      const res = await fetch(`${BASE_URL}/api/fee-payments/?student=${student.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      let payments = await res.json();
      payments = payments.results || payments;
      
      const filteredPayments = Array.isArray(payments) 
        ? payments.filter(p => p.student === student.id)
        : [];
      
      setPaymentHistory(filteredPayments);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const printReceipt = () => {
    if (!selectedPayment || !selectedStudent) return;
    
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
            <div class="detail-row"><span><strong>Student Name:</strong></span><span>${selectedStudent.name}</span></div>
            <div class="detail-row"><span><strong>Email:</strong></span><span>${selectedStudent.email || '—'}</span></div>
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

  // Only fetch once on mount
  useEffect(() => {
    if (!initialFetchDone) {
      initialFetchDone = true;
      fetchData();
    }
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const filteredStudents = students.filter((s) => {
    const searchLower = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(searchLower) ||
      (s.email || "").toLowerCase().includes(searchLower) ||
      (s.course || "").toLowerCase().includes(searchLower) ||
      (s.batch || "").toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "₹0";
    let numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "₹0";
    return "₹" + Math.round(numAmount).toLocaleString('en-IN');
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  // ** FIXED: Calculate totals ONLY for mentor's students **
  // These calculations now use studentFees which is already filtered
  const totalFee = studentFees.reduce((sum, sf) => sum + (Number(sf.total_amount) || 0), 0);
  const totalPaid = studentFees.reduce((sum, sf) => sum + (Number(sf.paid_amount) || 0), 0);
  const totalWeekBackAmount = students.reduce((sum, s) => sum + (s.week_back_amount || 0), 0);

  const getFeeStatusBadge = (status) => {
    const styles = {
      "Paid": "bg-emerald-100 text-emerald-800",
      "Partially Paid": "bg-amber-100 text-amber-800",
      "Pending": "bg-rose-100 text-rose-800",
      "No Fee Assigned": "bg-gray-100 text-gray-600"
    };
    return styles[status] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading fee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Fee Overview</h1>
              <p className="text-sm text-gray-500 mt-1">View your students' fee details and payment history</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={handleRefresh} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Now showing ONLY mentor's students data */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Collected</p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Outstanding</p>
            <p className="text-lg sm:text-2xl font-bold text-rose-600">{formatCurrency(totalFee - totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Week Back Amount</p>
            <p className="text-lg sm:text-2xl font-bold text-amber-600">{formatCurrency(totalWeekBackAmount)}</p>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">My Students</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{students.length}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-full sm:max-w-md">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search by student name, email or course..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" 
            />
          </div>
        </div>

        {/* Students Table - Desktop */}
        <div className="hidden lg:block bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course/Batch</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Agreement</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Week Back</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-gray-500">No students found</td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const feeInfo = getStudentFeeInfo(student);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                         </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">{student.course || "No Course"}</p>
                          <p className="text-xs text-gray-400">Batch: {student.batch || "Not assigned"}</p>
                         </td>
                        <td className="px-4 py-3 text-center">
                          {feeInfo.agreementSigned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Signed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Not signed
                            </span>
                          )}
                         </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getFeeStatusBadge(feeInfo.feeStatus)}`}>
                            {feeInfo.feeStatus}
                          </span>
                         </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">
                          {feeInfo.totalAmount > 0 ? formatCurrency(feeInfo.totalAmount) : "—"}
                         </td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium text-sm">
                          {feeInfo.paidAmount > 0 ? formatCurrency(feeInfo.paidAmount) : "—"}
                         </td>
                        <td className="px-4 py-3 text-right text-rose-600 font-medium text-sm">
                          {feeInfo.pendingAmount > 0 ? formatCurrency(feeInfo.pendingAmount) : "—"}
                         </td>
                        <td className="px-4 py-3 text-right text-amber-600 font-medium text-sm">
                          {feeInfo.weekBackAmount > 0 ? formatCurrency(feeInfo.weekBackAmount) : "—"}
                         </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => viewPaymentHistory(student)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 rounded-lg transition-colors text-xs font-medium"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            History
                          </button>
                         </td>
                       </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">No students found</div>
          ) : (
            filteredStudents.map((student) => {
              const feeInfo = getStudentFeeInfo(student);
              return (
                <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{student.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{student.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{student.course || "No Course"}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getFeeStatusBadge(feeInfo.feeStatus)}`}>
                      {feeInfo.feeStatus}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Agreement</p>
                      {feeInfo.agreementSigned ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Signed</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Not signed</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-sm font-semibold text-gray-900">{feeInfo.totalAmount > 0 ? formatCurrency(feeInfo.totalAmount) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Paid</p>
                      <p className="text-sm font-semibold text-emerald-600">{feeInfo.paidAmount > 0 ? formatCurrency(feeInfo.paidAmount) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pending</p>
                      <p className="text-sm font-semibold text-rose-600">{feeInfo.pendingAmount > 0 ? formatCurrency(feeInfo.pendingAmount) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Week Back</p>
                      <p className="text-sm font-semibold text-amber-600">{feeInfo.weekBackAmount > 0 ? formatCurrency(feeInfo.weekBackAmount) : "—"}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => viewPaymentHistory(student)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 rounded-lg transition-colors text-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      History
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Payment History Modal */}
      {showPaymentHistory && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentHistory(false)}>
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b bg-gray-50">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Payment History</h2>
                <p className="text-xs sm:text-sm text-gray-500">{selectedStudent.name}</p>
              </div>
              <button onClick={() => setShowPaymentHistory(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading payments...</p>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No payment records found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Payment Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Method</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentHistory.map((payment, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{formatDate(payment.payment_date)}</td>
                          <td className="px-3 py-2 text-sm capitalize text-gray-600">{payment.payment_method || "Cash"}</td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => generateReceipt(payment)} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                              📄 Receipt
                            </button>
                          </td>
                         </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="1" className="px-3 py-2 text-sm font-semibold">Total</td>
                        <td className="px-3 py-2 text-sm font-bold text-emerald-600">
                          {formatCurrency(paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0))}
                        </td>
                        <td colSpan="2"></td>
                       </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
            
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowPaymentHistory(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReceiptModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Payment Receipt</h2>
              <button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
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
                  <span className="font-medium">{selectedStudent.name}</span>
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

export default MentorFeeOverview;