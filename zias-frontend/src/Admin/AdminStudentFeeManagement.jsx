import { useEffect, useState } from "react";
import API from "../api/api";
import toast from "react-hot-toast";

function AdminStudentFeeManagement() {
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    total_amount: "",
    paid_amount: "",
    week_back_amount: "",
    agreement_signed: false
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_date: "",
    payment_method: "cash",
    notes: ""
  });
  const [addingPayment, setAddingPayment] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, feeRes, studentFeesRes] = await Promise.all([
        API.get("/students/"),
        API.get("/fee-structures/"),
        API.get("/student-fees/")
      ]);
      
      let studentsData = studentsRes.data;
      if (studentsData.results) studentsData = studentsData.results;
      
      const mappedStudents = studentsData.map(s => ({
        id: s.id,
        name: s.full_name || s.name || `Student ${s.id}`,
        full_name: s.full_name,
        email: s.user?.email || s.email,
        course: s.course,
        week_back_amount: parseFloat(s.week_back_amount) || 0,
        agreement_signed: s.agreement_signed || false
      }));
      
      setStudents(mappedStudents);
      
      let feeData = feeRes.data;
      if (feeData.results) feeData = feeData.results;
      setFeeStructures(Array.isArray(feeData) ? feeData : []);
      
      let studentFeesData = studentFeesRes.data;
      if (studentFeesData.results) studentFeesData = studentFeesData.results;
      setStudentFees(Array.isArray(studentFeesData) ? studentFeesData : []);
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
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
      let weekBackAmount = student.week_back_amount || 0;
      
      let feeStatus = "Pending";
      if (pendingAmount <= 0 && totalAmount > 0) feeStatus = "Paid";
      else if (pendingAmount > 0 && paidAmount > 0) feeStatus = "Partially Paid";
      else if (pendingAmount === totalAmount && totalAmount > 0) feeStatus = "Pending";
      else if (totalAmount === 0) feeStatus = "No Fee Assigned";
      
      return {
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
        weekBackAmount: weekBackAmount,
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

  const handleEditClick = (student) => {
    const feeInfo = getStudentFeeInfo(student);
    setEditingStudent(student);
    setEditFormData({
      total_amount: feeInfo.totalAmount.toString(),
      paid_amount: feeInfo.paidAmount.toString(),
      week_back_amount: feeInfo.weekBackAmount.toString(),
      agreement_signed: feeInfo.agreementSigned
    });
    setShowEditModal(true);
    setMobileMenuOpen(false);
  };

  const handleUpdateStudentFee = async () => {
    if (!editingStudent) return;
    
    setApplying(true);
    try {
      const studentFeeRes = await API.get(`/student-fees/?student=${editingStudent.id}`);
      let studentFeesList = studentFeeRes.data;
      if (studentFeesList.results) studentFeesList = studentFeesList.results;
      
      if (studentFeesList && studentFeesList.length > 0) {
        const feePayload = {
          total_amount: parseFloat(editFormData.total_amount),
          paid_amount: parseFloat(editFormData.paid_amount)
        };
        const studentFeeId = studentFeesList[0].id;
        await API.patch(`/student-fees/${studentFeeId}/`, feePayload);
      }
      
      const studentPayload = {
        agreement_signed: editFormData.agreement_signed,
        week_back_amount: parseFloat(editFormData.week_back_amount) || 0
      };
      
      await API.patch(`/students/${editingStudent.id}/`, studentPayload);
      
      setShowEditModal(false);
      setEditingStudent(null);
      toast.success("Student updated successfully");
      await fetchData();
      
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update student");
    } finally {
      setApplying(false);
    }
  };

  const handleApplyFeeToAll = async () => {
    if (feeStructures.length === 0) {
      toast.error("No fee structure available. Create one first.");
      return;
    }
    
    setApplying(true);
    try {
      const feeStructure = feeStructures[0];
      const response = await API.post(`/fee-structures/${feeStructure.id}/apply_to_students/`, {});
      
      if (response.data) {
        toast.success(response.data.message || "Fee applied successfully to all students");
        await fetchData();
      }
    } catch (err) {
      console.error("Apply error:", err);
      toast.error("Failed to apply fee");
    } finally {
      setApplying(false);
    }
  };

  const viewPaymentHistory = async (student) => {
    setSelectedStudent(student);
    setHistoryLoading(true);
    setShowPaymentHistory(true);
    try {
      const res = await API.get(`/fee-payments/?student=${student.id}`);
      let payments = res.data;
      if (payments.results) payments = payments.results;
      
      const filteredPayments = Array.isArray(payments) 
        ? payments.filter(p => p.student === student.id)
        : [];
      
      setPaymentHistory(filteredPayments);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment history");
      setShowPaymentHistory(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentStudent) return;
    
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setAddingPayment(true);
    try {
      const feeInfo = getStudentFeeInfo(paymentStudent);
      const paymentDate = paymentData.payment_date || new Date().toISOString().split('T')[0];
      
      const paymentPayload = {
        student: paymentStudent.id,
        amount: parseFloat(paymentData.amount),
        due_date: paymentDate,
        payment_date: paymentDate,
        payment_method: paymentData.payment_method,
        notes: paymentData.notes || "",
        status: "paid"
      };
      
      await API.post("/fee-payments/", paymentPayload);
      
      if (feeInfo.studentFeeId) {
        const newPaidAmount = feeInfo.paidAmount + parseFloat(paymentData.amount);
        await API.patch(`/student-fees/${feeInfo.studentFeeId}/`, {
          paid_amount: newPaidAmount
        });
      }
      
      toast.success(`Payment of ${formatCurrency(paymentData.amount)} added successfully`);
      setShowPaymentModal(false);
      setPaymentStudent(null);
      setPaymentData({ amount: "", payment_date: "", payment_method: "cash", notes: "" });
      await fetchData();
      
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Failed to add payment");
    } finally {
      setAddingPayment(false);
    }
  };

  const generateReceipt = async (payment) => {
    try {
      const student = students.find((s) => s.id === payment.student);
      const receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; }
            .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .amount { font-size: 32px; color: #059669; font-weight: bold; text-align: center; margin: 20px 0; }
            .details { border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
            .footer { text-align: center; padding: 20px; background: #f9fafb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2 style="margin:0">ZIAS Academy</h2>
              <p style="margin:5px 0 0;opacity:0.9">Payment Receipt</p>
            </div>
            <div class="content">
              <div class="detail-row"><span><strong>Receipt No:</strong></span><span>${payment.id}</span></div>
              <div class="detail-row"><span><strong>Student Name:</strong></span><span>${student?.name || student?.full_name}</span></div>
              <div class="detail-row"><span><strong>Email:</strong></span><span>${student?.email || '—'}</span></div>
              <div class="amount">${formatCurrency(payment.amount)}</div>
              <div class="details">
                <div class="detail-row"><span>Payment Date:</span><span>${formatDate(payment.payment_date)}</span></div>
                <div class="detail-row"><span>Payment Method:</span><span>${payment.payment_method?.toUpperCase() || 'CASH'}</span></div>
                <div class="detail-row"><span>Status:</span><span style="color:#059669">${payment.status?.toUpperCase()}</span></div>
                ${payment.notes ? `<div class="detail-row"><span>Notes:</span><span>${payment.notes}</span></div>` : ''}
              </div>
              <div class="footer"><p>Thank you for your payment!</p><p>This is a computer generated receipt.</p></div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const win = window.open();
      win.document.write(receiptHtml);
      win.document.close();
      win.print();
      
      toast.success("Receipt generated");
    } catch (err) {
      console.error("Receipt error:", err);
      toast.error("Failed to generate receipt");
    }
  };

  const generateFeeReport = async () => {
    setGeneratingReport(true);
    try {
      const totalFee = studentFees.reduce((sum, sf) => sum + (Number(sf.total_amount) || 0), 0);
      const totalPaid = studentFees.reduce((sum, sf) => sum + (Number(sf.paid_amount) || 0), 0);
      
      const report = {
        generated_on: new Date().toISOString(),
        total_students: students.length,
        students_with_fee: studentFees.length,
        total_fee_amount: totalFee,
        total_paid_amount: totalPaid,
        total_pending_amount: totalFee - totalPaid,
        paid_count: students.filter((s) => getStudentFeeInfo(s).feeStatus === "Paid").length,
        partially_paid_count: students.filter((s) => getStudentFeeInfo(s).feeStatus === "Partially Paid").length,
        pending_count: students.filter((s) => getStudentFeeInfo(s).feeStatus === "Pending").length,
        no_fee_count: students.filter((s) => getStudentFeeInfo(s).feeStatus === "No Fee Assigned").length,
        collection_rate: totalFee > 0 ? ((totalPaid / totalFee) * 100).toFixed(1) : 0
      };
      
      setReportData(report);
      setShowReportModal(true);
    } catch (err) {
      console.error("Report error:", err);
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDeleteStudentFee = async (student) => {
    const feeInfo = getStudentFeeInfo(student);
    if (!feeInfo.studentFeeId) {
      toast.error("No fee record to delete");
      return;
    }
    
    if (!window.confirm(`Delete fee record for ${student.name}? This action cannot be undone.`)) {
      return;
    }
    
    setApplying(true);
    try {
      await API.delete(`/student-fees/${feeInfo.studentFeeId}/`);
      toast.success("Fee record deleted successfully");
      await fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete fee record");
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = students.filter((s) => {
    const searchLower = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(searchLower) ||
      (s.full_name || "").toLowerCase().includes(searchLower) ||
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
  const totalOutstanding = totalFee - totalPaid;
  const totalCollected = totalPaid;
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading fee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Student Fee Management</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage student fees, track payments, and generate reports</p>
            </div>
            
            {/* Mobile Menu Toggle */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Actions
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-3`}>
              <button onClick={generateFeeReport} disabled={generatingReport} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Fee Reports
              </button>
              <button onClick={fetchData} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs sm:text-sm text-gray-500 mb-1">Total Collected</p><p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalCollected)}</p></div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs sm:text-sm text-gray-500 mb-1">Total Outstanding</p><p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</p></div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-100 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs sm:text-sm text-gray-500 mb-1">Week Back Amount</p><p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalWeekBackAmount)}</p></div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div><p className="text-xs sm:text-sm text-gray-500 mb-1">Students with Fee</p><p className="text-xl sm:text-2xl font-bold text-gray-900">{studentFees.length}</p></div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center"><svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md w-full">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search by name, email or course..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Week Back</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => {
                  const feeInfo = getStudentFeeInfo(student);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3"><div><p className="font-medium text-gray-900 text-sm">{student.name}</p><p className="text-xs text-gray-500">{student.email}</p><p className="text-xs text-gray-400 mt-0.5">{student.course || "No Course"}</p></div></td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">{feeInfo.totalAmount > 0 ? formatCurrency(feeInfo.totalAmount) : "—"}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium text-sm">{feeInfo.paidAmount > 0 ? formatCurrency(feeInfo.paidAmount) : "—"}</td>
                      <td className="px-4 py-3 text-right text-rose-600 font-medium text-sm">{feeInfo.pendingAmount > 0 ? formatCurrency(feeInfo.pendingAmount) : "—"}</td>
                      <td className="px-4 py-3 text-right text-amber-600 font-medium text-sm">{feeInfo.weekBackAmount > 0 ? formatCurrency(feeInfo.weekBackAmount) : "—"}</td>
                      <td className="px-4 py-3 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getFeeStatusBadge(feeInfo.feeStatus)}`}>{feeInfo.feeStatus}</span></td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEditClick(student)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button onClick={() => { setPaymentStudent(student); setShowPaymentModal(true); }} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Add Payment"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                          <button onClick={() => viewPaymentHistory(student)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="History"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                          <button onClick={() => handleDeleteStudentFee(student)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-12 text-gray-500"><svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              No students found
            </div>
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
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getFeeStatusBadge(feeInfo.feeStatus)}`}>{feeInfo.feeStatus}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3 pt-2 border-t border-gray-100">
                    <div><p className="text-xs text-gray-500">Total</p><p className="text-sm font-semibold text-gray-900">{feeInfo.totalAmount > 0 ? formatCurrency(feeInfo.totalAmount) : "—"}</p></div>
                    <div><p className="text-xs text-gray-500">Paid</p><p className="text-sm font-semibold text-emerald-600">{feeInfo.paidAmount > 0 ? formatCurrency(feeInfo.paidAmount) : "—"}</p></div>
                    <div><p className="text-xs text-gray-500">Pending</p><p className="text-sm font-semibold text-rose-600">{feeInfo.pendingAmount > 0 ? formatCurrency(feeInfo.pendingAmount) : "—"}</p></div>
                    <div><p className="text-xs text-gray-500">Week Back</p><p className="text-sm font-semibold text-amber-600">{feeInfo.weekBackAmount > 0 ? formatCurrency(feeInfo.weekBackAmount) : "—"}</p></div>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => handleEditClick(student)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 rounded-lg transition-colors text-xs"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Edit</button>
                    <button onClick={() => { setPaymentStudent(student); setShowPaymentModal(true); }} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-200 rounded-lg transition-colors text-xs"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Pay</button>
                    <button onClick={() => viewPaymentHistory(student)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 rounded-lg transition-colors text-xs"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>History</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Student Fee</h2><button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button></div>
            <p className="text-sm text-gray-600 mb-4 pb-3 border-b break-words">{editingStudent.name}</p>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label><input type="number" step="0.01" value={editFormData.total_amount} onChange={(e) => setEditFormData({...editFormData, total_amount: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label><input type="number" step="0.01" value={editFormData.paid_amount} onChange={(e) => setEditFormData({...editFormData, paid_amount: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Week Back Amount (₹)</label><input type="number" step="0.01" value={editFormData.week_back_amount} onChange={(e) => setEditFormData({...editFormData, week_back_amount: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" /></div>
              <div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editFormData.agreement_signed} onChange={(e) => setEditFormData({...editFormData, agreement_signed: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded" /><span className="text-sm text-gray-700">Agreement Signed</span></label></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={handleUpdateStudentFee} disabled={applying} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium transition text-sm">Update</button><button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition text-sm">Cancel</button></div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && paymentStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg sm:text-xl font-bold text-gray-900">Add Payment</h2><button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button></div>
            <p className="text-sm text-gray-600 mb-4 pb-3 border-b break-words">{paymentStudent.name}</p>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label><input type="number" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label><input type="date" value={paymentData.payment_date} onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label><select value={paymentData.payment_method} onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option><option value="online">Online</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label><textarea value={paymentData.notes} onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})} rows="2" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={handleAddPayment} disabled={addingPayment} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium transition text-sm">Add Payment</button><button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition text-sm">Cancel</button></div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentHistory(false)}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b bg-gray-50"><h2 className="text-base sm:text-lg font-semibold text-gray-900">Payment History - {selectedStudent.name}</h2><button onClick={() => setShowPaymentHistory(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button></div>
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              {historyLoading ? (<div className="text-center py-8">Loading payments...</div>) : paymentHistory.length === 0 ? (<div className="text-center py-8 text-gray-500">No payment records found.</div>) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th><th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Receipt</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentHistory.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{formatDate(p.payment_date)}</td>
                          <td className="px-3 py-2 text-sm capitalize text-gray-600">{p.payment_method || "—"}</td>
                          <td className="px-3 py-2 text-center"><button onClick={() => generateReceipt(p)} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">📄 Receipt</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex justify-end"><button onClick={() => setShowPaymentHistory(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition">Close</button></div>
          </div>
        </div>
      )}

      {/* Fee Report Modal */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b bg-gray-50"><h2 className="text-base sm:text-lg font-semibold text-gray-900">Fee Report</h2><button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button></div>
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              <div className="text-center mb-6"><h3 className="text-lg sm:text-xl font-bold text-gray-900">ZIAS - Fee Report</h3><p className="text-gray-500 text-xs sm:text-sm">Generated on: {new Date(reportData.generated_on).toLocaleString()}</p></div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-blue-50 rounded-xl p-3"><p className="text-gray-600 text-xs">Total Students</p><p className="text-lg sm:text-xl font-bold text-blue-700">{reportData.total_students}</p></div>
                <div className="bg-purple-50 rounded-xl p-3"><p className="text-gray-600 text-xs">Students with Fee</p><p className="text-lg sm:text-xl font-bold text-purple-700">{reportData.students_with_fee}</p></div>
                <div className="bg-emerald-50 rounded-xl p-3"><p className="text-gray-600 text-xs">Total Collected</p><p className="text-lg sm:text-xl font-bold text-emerald-700">{formatCurrency(reportData.total_paid_amount)}</p></div>
                <div className="bg-rose-50 rounded-xl p-3"><p className="text-gray-600 text-xs">Total Pending</p><p className="text-lg sm:text-xl font-bold text-rose-700">{formatCurrency(reportData.total_pending_amount)}</p></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl text-sm"><span>Fully Paid</span><span className="font-bold text-emerald-700">{reportData.paid_count} students</span></div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl text-sm"><span>Partially Paid</span><span className="font-bold text-amber-700">{reportData.partially_paid_count} students</span></div>
                <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl text-sm"><span>Pending</span><span className="font-bold text-rose-700">{reportData.pending_count} students</span></div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-sm"><span>No Fee Assigned</span><span className="font-bold text-gray-700">{reportData.no_fee_count} students</span></div>
              </div>
              <div className="mt-6 bg-orange-50 rounded-xl p-4 text-center"><p className="text-gray-600 text-sm">Collection Rate</p><p className="text-2xl sm:text-3xl font-bold text-orange-600">{reportData.collection_rate}%</p></div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex justify-end"><button onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStudentFeeManagement;