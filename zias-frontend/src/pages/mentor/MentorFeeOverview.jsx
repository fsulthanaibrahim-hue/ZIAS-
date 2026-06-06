import React, { useEffect, useState, useCallback } from "react";
import API from "../../api/api";
import toast from "react-hot-toast";

function MentorFeeOverview() {
  const [students, setStudents] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Payment history modal
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const BASE_URL = "http://127.0.0.1:8000";
      
      const mentorRes = await fetch(`${BASE_URL}/api/mentors/me/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const mentor = await mentorRes.json();
      const mentorId = mentor.id;
      
      const studentsRes = await fetch(`${BASE_URL}/api/students/?mentor=${mentorId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const studentsData = await studentsRes.json();
      const allStudents = studentsData.results || studentsData;
      
      const mappedStudents = allStudents.map(s => ({
        id: s.id,
        name: s.full_name || s.name || `Student ${s.id}`,
        email: s.user?.email || s.email,
        course: s.course,
        week_back_amount: parseFloat(s.week_back_amount) || 0,
        agreement_signed: s.agreement_signed || false
      }));
      
      setStudents(mappedStudents);
      
      const studentFeesRes = await fetch(`${BASE_URL}/api/student-fees/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const feesData = await studentFeesRes.json();
      let feesList = feesData.results || feesData;
      setStudentFees(Array.isArray(feesList) ? feesList : []);
      
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to load fee data");
    } finally {
      setLoading(false);
    }
  };

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
        feeStatus: feeStatus
      };
    }
    
    return {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      weekBackAmount: student.week_back_amount || 0,
      agreementSigned: student.agreement_signed || false,
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

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = students.filter((s) => {
    const searchLower = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(searchLower) ||
      (s.email || "").toLowerCase().includes(searchLower) ||
      (s.course || "").toLowerCase().includes(searchLower)
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
              <p className="text-sm text-gray-500 mt-1">View student fee details and payment history</p>
            </div>
            <button onClick={fetchData} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all w-full sm:w-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Collected</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Outstanding</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(totalFee - totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Week Back Amount</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(totalWeekBackAmount)}</p>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Students with Fee</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{studentFees.length}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-full sm:max-w-md">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search by student name, email or course..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
          </div>
        </div>

        {/* Students Table - Responsive */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agreement</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Week Back</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">History</th>
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
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.course || "—"}</td>
                        <td className="px-4 py-3">
                          {feeInfo.agreementSigned ? (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Signed</span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Not signed</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{feeInfo.totalAmount > 0 ? formatCurrency(feeInfo.totalAmount) : "—"}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">{feeInfo.paidAmount > 0 ? formatCurrency(feeInfo.paidAmount) : "—"}</td>
                        <td className="px-4 py-3 text-right text-rose-600">{feeInfo.pendingAmount > 0 ? formatCurrency(feeInfo.pendingAmount) : "—"}</td>
                        <td className="px-4 py-3 text-right text-amber-600">{feeInfo.weekBackAmount > 0 ? formatCurrency(feeInfo.weekBackAmount) : "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getFeeStatusBadge(feeInfo.feeStatus)}`}>
                            {feeInfo.feeStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => viewPaymentHistory(student)} className="text-green-600 hover:text-green-800 text-sm font-medium">View</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No students found</div>
            ) : (
              filteredStudents.map((student) => {
                const feeInfo = getStudentFeeInfo(student);
                return (
                  <div key={student.id} className="p-4 space-y-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-xs text-gray-500">{student.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{student.course || "No Course"}</p>
                      </div>
                      <button onClick={() => viewPaymentHistory(student)} className="text-green-600 text-sm font-medium px-3 py-1 border border-green-200 rounded-full">History</button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Agreement</p>
                        {feeInfo.agreementSigned ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Signed</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">✗ Not signed</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getFeeStatusBadge(feeInfo.feeStatus)}`}>
                          {feeInfo.feeStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="font-semibold text-gray-900">{feeInfo.totalAmount > 0 ? formatCurrency(feeInfo.totalAmount) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Paid</p>
                        <p className="font-semibold text-emerald-600">{feeInfo.paidAmount > 0 ? formatCurrency(feeInfo.paidAmount) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pending</p>
                        <p className="font-semibold text-rose-600">{feeInfo.pendingAmount > 0 ? formatCurrency(feeInfo.pendingAmount) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Week Back</p>
                        <p className="font-semibold text-amber-600">{feeInfo.weekBackAmount > 0 ? formatCurrency(feeInfo.weekBackAmount) : "—"}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Payment History Modal - Responsive */}
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
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Payment Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Method</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paymentHistory.map((payment, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{formatDate(payment.payment_date)}</td>
                            <td className="px-3 py-2 text-sm capitalize text-gray-600">{payment.payment_method || "Cash"}</td>
                            <td className="px-3 py-2"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Paid</span></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="1" className="px-3 py-2 text-sm font-semibold">Total</td>
                          <td className="px-3 py-2 text-sm font-bold text-emerald-600">{formatCurrency(paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0))}</td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  {/* Mobile Card View for Payment History */}
                  <div className="block sm:hidden space-y-3">
                    {paymentHistory.map((payment, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Paid</span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>📅 {formatDate(payment.payment_date)}</p>
                          <p>💳 {payment.payment_method || "Cash"}</p>
                          {payment.notes && <p>📝 {payment.notes}</p>}
                        </div>
                      </div>
                    ))}
                    <div className="bg-gray-100 rounded-lg p-3 mt-2">
                      <p className="text-sm font-semibold">Total: {formatCurrency(paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0))}</p>
                    </div>
                  </div>
                </>
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
    </div>
  );
}

export default MentorFeeOverview;