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
        week_back_amount: s.week_back_amount || 0,
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
      
      try {
        await API.patch(`/students/${editingStudent.id}/`, {
          agreement_signed: editFormData.agreement_signed
        });
      } catch (agreeErr) {
        console.log("Agreement update failed:", agreeErr);
      }
      
      try {
        await API.patch(`/students/${editingStudent.id}/`, {
          week_back_amount: parseFloat(editFormData.week_back_amount) || 0
        });
      } catch (weekErr) {
        console.log("Week back amount update failed:", weekErr.response?.data);
      }
      
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
      setPaymentHistory(Array.isArray(payments) ? payments : []);
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
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .details { margin-bottom: 20px; }
            .amount { font-size: 24px; color: green; font-weight: bold; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>ZIAS - Payment Receipt</h2>
              <p>Payment Confirmation</p>
            </div>
            <div class="details">
              <p><strong>Receipt No:</strong> ${payment.id}</p>
              <p><strong>Student:</strong> ${student?.name || student?.full_name}</p>
              <p><strong>Email:</strong> ${student?.email || '—'}</p>
              <p><strong>Amount Paid:</strong> ${formatCurrency(payment.amount)}</p>
              <p><strong>Payment Date:</strong> ${formatDate(payment.payment_date)}</p>
              <p><strong>Payment Method:</strong> ${payment.payment_method || 'Cash'}</p>
              <p><strong>Status:</strong> ${payment.status}</p>
              ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
            </div>
            <div class="amount">Amount Paid: ${formatCurrency(payment.amount)}</div>
            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>This is a computer generated receipt.</p>
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
      const report = {
        generated_on: new Date().toISOString(),
        total_students: students.length,
        students_with_fee: studentFees.length,
        total_fee_amount: studentFees.reduce((sum, sf) => sum + (Number(sf.total_amount) || 0), 0),
        total_paid_amount: studentFees.reduce((sum, sf) => sum + (Number(sf.paid_amount) || 0), 0),
        total_pending_amount: studentFees.reduce((sum, sf) => sum + (Number(sf.total_amount) - Number(sf.paid_amount) || 0), 0),
        paid_count: students.filter((s) => getStudentFeeInfo(s).feeStatus === "Paid").length,
        partially_paid_count: students.filter((s) => getStudentFeeInfo(s).feeStatus === "Partially Paid").length,
        pending_count: students.filter((s) => getStudentFeeInfo(s).feeStatus === "Pending").length,
        no_fee_count: students.filter((s) => getStudentFeeInfo(s).feeStatus === "No Fee Assigned").length,
        collection_rate: studentFees.length > 0 
          ? ((studentFees.reduce((sum, sf) => sum + (Number(sf.paid_amount) || 0), 0) / 
             studentFees.reduce((sum, sf) => sum + (Number(sf.total_amount) || 0), 0)) * 100).toFixed(1)
          : 0
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

  const exportReportCSV = () => {
    if (!reportData) return;
    
    const csvRows = [
      ["Fee Report - ZIAS"],
      [`Generated on: ${new Date(reportData.generated_on).toLocaleString()}`],
      [],
      ["Metric", "Value"],
      ["Total Students", reportData.total_students],
      ["Students with Fee Assigned", reportData.students_with_fee],
      ["Total Fee Amount", reportData.total_fee_amount],
      ["Total Paid Amount", reportData.total_paid_amount],
      ["Total Pending Amount", reportData.total_pending_amount],
      ["Collection Rate", `${reportData.collection_rate}%`],
      [],
      ["Payment Status Summary", ""],
      ["Fully Paid", reportData.paid_count],
      ["Partially Paid", reportData.partially_paid_count],
      ["Pending", reportData.pending_count],
      ["No Fee Assigned", reportData.no_fee_count]
    ];
    
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Report exported successfully");
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

  // FIXED: Proper formatCurrency function
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "₹0";
    // Convert to number and handle decimal places
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "₹0";
    return "₹" + numAmount.toLocaleString('en-IN');
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN");
  };

  const totalCollected = students.reduce((sum, s) => {
    const feeInfo = getStudentFeeInfo(s);
    return sum + feeInfo.paidAmount;
  }, 0);

  const totalOutstanding = students.reduce((sum, s) => {
    const feeInfo = getStudentFeeInfo(s);
    return sum + feeInfo.pendingAmount;
  }, 0);

  const totalWeekBackAmount = students.reduce((sum, s) => {
    const feeInfo = getStudentFeeInfo(s);
    return sum + feeInfo.weekBackAmount;
  }, 0);

  const getFeeStatusBadge = (status) => {
    switch(status) {
      case "Paid": return "bg-green-100 text-green-800";
      case "Partially Paid": return "bg-yellow-100 text-yellow-800";
      case "Pending": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading student fee data...</p>
        </div>
      </div>
    );
  }

  const hasAnyFeeApplied = studentFees.length > 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Fee Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage student fees, track payments, and generate reports</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={generateFeeReport}
              disabled={generatingReport}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              📊 Fee Reports
            </button>
            {!hasAnyFeeApplied && feeStructures.length > 0 && (
              <button onClick={handleApplyFeeToAll} disabled={applying} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50">
                {applying ? "Applying..." : "Apply Fee to All Students"}
              </button>
            )}
            <button onClick={() => fetchData()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-5 border border-green-200">
            <p className="text-gray-500 text-sm">Total Collected</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalCollected)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-5 border border-red-200">
            <p className="text-gray-500 text-sm">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
            <p className="text-gray-500 text-sm">Total Week Back Amount</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalWeekBackAmount)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <p className="text-gray-500 text-sm">Students with Fee</p>
            <p className="text-2xl font-bold text-blue-700">{studentFees.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <table className="min-w-full w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week Back</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const feeInfo = getStudentFeeInfo(s);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-800">{s.name || s.full_name}</p>
                          <p className="text-xs text-gray-500">{s.email}</p>
                          <p className="text-xs text-gray-400">{s.course || "--"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {feeInfo.totalAmount > 0 ? formatCurrency(feeInfo.totalAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">
                        {feeInfo.paidAmount > 0 ? formatCurrency(feeInfo.paidAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium">
                        {feeInfo.pendingAmount > 0 ? formatCurrency(feeInfo.pendingAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-orange-600">
                        {feeInfo.weekBackAmount > 0 ? formatCurrency(feeInfo.weekBackAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getFeeStatusBadge(feeInfo.feeStatus)}`}>
                          {feeInfo.feeStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleEditClick(s)} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => { setPaymentStudent(s); setShowPaymentModal(true); }} className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition" title="Add Payment">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button onClick={() => viewPaymentHistory(s)} className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition" title="Payment History">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDeleteStudentFee(s)} className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!hasAnyFeeApplied && feeStructures.length > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">No Fee Structure Applied Yet</h3>
            <p className="text-sm text-yellow-700">Click the "Apply Fee to All Students" button above to apply the fee structure to all students.</p>
          </div>
        )}

        {feeStructures.length === 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2">No Fee Structure Found</h3>
            <p className="text-sm text-red-700">Please go to Fee Structure Management page and create a fee structure first.</p>
          </div>
        )}
      </div>

      {/* Edit Modal - Same as before */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Student Fee</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Student: {editingStudent.name}</p>
              <p className="text-xs text-gray-500">{editingStudent.email}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
                <input type="number" step="0.01" value={editFormData.total_amount} onChange={(e) => setEditFormData({...editFormData, total_amount: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label>
                <input type="number" step="0.01" value={editFormData.paid_amount} onChange={(e) => setEditFormData({...editFormData, paid_amount: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week Back Amount (₹)</label>
                <input type="number" step="0.01" value={editFormData.week_back_amount} onChange={(e) => setEditFormData({...editFormData, week_back_amount: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editFormData.agreement_signed} onChange={(e) => setEditFormData({...editFormData, agreement_signed: e.target.checked})} className="w-4 h-4 text-green-600 rounded" />
                  <span className="text-sm text-gray-700">Agreement Signed</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleUpdateStudentFee} disabled={applying} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {applying ? "Updating..." : "Update"}
              </button>
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && paymentStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Student: {paymentStudent.name}</p>
              <p className="text-xs text-gray-500">{paymentStudent.email}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input type="date" value={paymentData.payment_date} onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={paymentData.payment_method} onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea value={paymentData.notes} onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})} rows="2" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAddPayment} disabled={addingPayment} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {addingPayment ? "Processing..." : "Add Payment"}
              </button>
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentHistory(false)}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Payment History - {selectedStudent.name}</h2>
              <button onClick={() => setShowPaymentHistory(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {historyLoading ? (
                <div className="text-center py-8">Loading payments...</div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No payment records found for this student.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentHistory.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-2 text-sm">{p.payment_date ? formatDate(p.payment_date) : "--"}</td>
                          <td className="px-4 py-2 text-sm capitalize">{p.payment_method || "—"}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button onClick={() => generateReceipt(p)} className="text-blue-600 hover:text-blue-800 text-sm">📄 Receipt</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowPaymentHistory(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Report Modal */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Fee Report</h2>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">ZIAS - Fee Report</h3>
                <p className="text-gray-500">Generated on: {new Date(reportData.generated_on).toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm">Total Students</p>
                  <p className="text-2xl font-bold text-blue-700">{reportData.total_students}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm">Students with Fee</p>
                  <p className="text-2xl font-bold text-purple-700">{reportData.students_with_fee}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm">Total Collected</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(reportData.total_paid_amount)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm">Total Pending</p>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(reportData.total_pending_amount)}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Payment Status Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span>Fully Paid</span>
                    <span className="font-bold">{reportData.paid_count} students</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span>Partially Paid</span>
                    <span className="font-bold">{reportData.partially_paid_count} students</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span>Pending</span>
                    <span className="font-bold">{reportData.pending_count} students</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>No Fee Assigned</span>
                    <span className="font-bold">{reportData.no_fee_count} students</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-gray-600">Collection Rate</p>
                <p className="text-3xl font-bold text-orange-600">{reportData.collection_rate}%</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
              <button onClick={exportReportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">📥 Export to CSV</button>
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStudentFeeManagement;