import { useEffect, useState } from "react";
import API from "../api/api";
import toast from "react-hot-toast";

function AdminStudentFeeManagement() {
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fee_structure_id: "",
    total_amount: "",
    paid_amount: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, feeRes] = await Promise.all([
        API.get("/admin/students-fee/"),
        API.get("/fee-structures/")
      ]);
      
      let studentsData = studentsRes.data;
      if (studentsData.results) studentsData = studentsData.results;
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      
      let feeData = feeRes.data;
      if (feeData.results) feeData = feeData.results;
      setFeeStructures(Array.isArray(feeData) ? feeData : []);
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getStudentFeeInfo = (student) => {
    const totalAmount = (Number(student.total_paid) || 0) + (Number(student.total_pending) || 0) + (Number(student.total_overdue) || 0);
    
    let feeName = "—";
    let feeId = null;
    if (student.fee_structure_id && feeStructures.length > 0) {
      const fs = feeStructures.find(function(f) { return f.id === student.fee_structure_id; });
      if (fs) {
        feeName = fs.name;
        feeId = fs.id;
      }
    }
    
    return {
      feeName: feeName,
      feeId: feeId,
      totalAmount: totalAmount,
      paidAmount: Number(student.total_paid) || 0,
      pendingAmount: Number(student.total_pending) || 0,
      overdueAmount: Number(student.total_overdue) || 0,
      agreementSigned: student.agreement_signed || false
    };
  };

  const handleEditClick = (student) => {
    const feeInfo = getStudentFeeInfo(student);
    setEditingStudent(student);
    setEditFormData({
      fee_structure_id: feeInfo.feeId || "",
      total_amount: feeInfo.totalAmount.toString(),
      paid_amount: feeInfo.paidAmount.toString()
    });
    setShowEditModal(true);
  };

  const handleUpdateStudentFee = async () => {
    if (!editingStudent) return;
    
    try {
      const payload = {
        total_amount: parseFloat(editFormData.total_amount),
        paid_amount: parseFloat(editFormData.paid_amount),
        fee_structure_id: editFormData.fee_structure_id || null
      };
      
      // Try to find the student_fee record first
      const studentFeeRes = await API.get(`/student-fees/?student=${editingStudent.id}`);
      let studentFeesList = studentFeeRes.data;
      if (studentFeesList.results) studentFeesList = studentFeesList.results;
      
      if (studentFeesList && studentFeesList.length > 0) {
        const studentFeeId = studentFeesList[0].id;
        await API.patch(`/student-fees/${studentFeeId}/`, payload);
        toast.success("Student fee updated successfully!");
      } else {
        // If no student fee record exists, create one
        await API.post("/student-fees/", {
          student: editingStudent.id,
          fee_structure: editFormData.fee_structure_id || null,
          total_amount: parseFloat(editFormData.total_amount),
          paid_amount: parseFloat(editFormData.paid_amount)
        });
        toast.success("Student fee created successfully!");
      }
      
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update student fee: " + (err.response?.data?.error || err.message));
    }
  };

  const handleApplyFeeToAll = async () => {
    if (feeStructures.length === 0) {
      toast.error("No fee structure available. Create one first in Fee Structure Management page.");
      return;
    }
    
    setApplying(true);
    try {
      const feeStructure = feeStructures[0];
      const response = await API.post(`/fee-structures/${feeStructure.id}/apply_to_students/`, {});
      
      if (response.data) {
        toast.success(response.data.message || "Fee applied successfully to all students!");
        setTimeout(function() {
          fetchData();
        }, 1000);
      }
    } catch (err) {
      console.error("Apply error:", err);
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error("Failed to apply fee. Please check if fee structure is active.");
      }
    } finally {
      setApplying(false);
    }
  };

  const viewPaymentHistory = async (student) => {
    setSelectedStudent(student);
    setHistoryLoading(true);
    try {
      const res = await API.get(`/fee-payments/?student=${student.id}`);
      let payments = res.data;
      if (payments.results) payments = payments.results;
      setPaymentHistory(Array.isArray(payments) ? payments : []);
      setShowPaymentHistory(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(function() {
    fetchData();
  }, []);

  const filteredStudents = students.filter(function(s) {
    const searchLower = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(searchLower) ||
      (s.email || "").toLowerCase().includes(searchLower) ||
      (s.course || "").toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = function(amount) {
    return "₹" + (amount || 0).toLocaleString("en-IN");
  };

  const totalCollected = students.reduce(function(sum, s) {
    return sum + (Number(s.total_paid) || 0);
  }, 0);

  const totalOutstanding = students.reduce(function(sum, s) {
    return sum + (Number(s.total_pending) || 0) + (Number(s.total_overdue) || 0);
  }, 0);

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

  const hasAnyFeeApplied = students.some(function(s) {
    return s.total_paid > 0 || s.total_pending > 0 || s.total_overdue > 0;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Student Fee Management</h1>
          <div className="flex gap-2">
            {!hasAnyFeeApplied && feeStructures.length > 0 && (
              <button 
                onClick={handleApplyFeeToAll}
                disabled={applying}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {applying ? "Applying..." : "Apply Fee to All Students"}
              </button>
            )}
            <button onClick={fetchData} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-5 border border-green-200">
            <p className="text-gray-500 text-sm">Total Collected</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalCollected)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-5 border border-red-200">
            <p className="text-gray-500 text-sm">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalOutstanding)}</p>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email or course..."
            value={search}
            onChange={function(e) { setSearch(e.target.value); }}
            className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <table className="min-w-[1100px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Structure</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agreement</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map(function(s) {
                  const feeInfo = getStudentFeeInfo(s);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.email}</p>
                          <p className="text-xs text-gray-400">{s.course || "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {feeInfo.feeName !== "—" ? (
                          <span className="text-gray-700">{feeInfo.feeName}</span>
                        ) : (
                          <span className="text-red-500">No fee applied</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(feeInfo.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">
                        {formatCurrency(feeInfo.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-yellow-600 font-medium">
                        {formatCurrency(feeInfo.pendingAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium">
                        {formatCurrency(feeInfo.overdueAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={"inline-flex px-2 py-0.5 rounded-full text-xs font-medium " + (
                          s.week_back_fee_status === "on_track" 
                            ? "bg-green-100 text-green-800"
                            : s.week_back_fee_status === "delayed" 
                              ? "bg-yellow-100 text-yellow-800" 
                              : "bg-red-100 text-red-800"
                        )}>
                          {s.week_back_fee_status === "on_track" 
                            ? "On Track"
                            : s.week_back_fee_status === "delayed" 
                              ? "Delayed" 
                              : "Overdue"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {feeInfo.agreementSigned ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Signed</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Not signed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={function() { handleEditClick(s); }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={function() { viewPaymentHistory(s); }}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            History
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
            <p className="text-sm text-yellow-700">
              Click the <strong>"Apply Fee to All Students"</strong> button above to apply the fee structure to all students.
            </p>
          </div>
        )}

        {feeStructures.length === 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2">No Fee Structure Found</h3>
            <p className="text-sm text-red-700">
              Please go to <strong>Fee Structure Management</strong> page and create a fee structure first.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={function() { setShowEditModal(false); }}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={function(e) { e.stopPropagation(); }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Student Fee</h2>
              <button onClick={function() { setShowEditModal(false); }} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Student: <span className="font-semibold">{editingStudent.name}</span></p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure</label>
                <select
                  value={editFormData.fee_structure_id || ""}
                  onChange={function(e) { setEditFormData({...editFormData, fee_structure_id: e.target.value}); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Fee Structure</option>
                  {feeStructures.map(function(fs) {
                    return <option key={fs.id} value={fs.id}>{fs.name} - ₹{fs.total_amount}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
                <input
                  type="number"
                  value={editFormData.total_amount}
                  onChange={function(e) { setEditFormData({...editFormData, total_amount: e.target.value}); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label>
                <input
                  type="number"
                  value={editFormData.paid_amount}
                  onChange={function(e) { setEditFormData({...editFormData, paid_amount: e.target.value}); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                {editFormData.total_amount && editFormData.paid_amount && (
                  <p className="text-xs text-blue-600 mt-1">
                    Pending: ₹{(parseFloat(editFormData.total_amount) - parseFloat(editFormData.paid_amount)).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleUpdateStudentFee} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                Update
              </button>
              <button onClick={function() { setShowEditModal(false); }} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={function() { setShowPaymentHistory(false); }}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl" onClick={function(e) { e.stopPropagation(); }}>
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Payment History – {selectedStudent.name}</h2>
              <button onClick={function() { setShowPaymentHistory(false); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {historyLoading ? (
                <div className="text-center py-8">Loading payments...</div>
              ) : paymentHistory.length === 0 ? (
                <p className="text-center text-gray-500">No payment records found.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentHistory.map(function(p) {
                      return (
                        <tr key={p.id}>
                          <td className="py-2 text-sm">{formatCurrency(p.amount)}</td>
                          <td className="py-2 text-sm">{new Date(p.due_date).toLocaleDateString()}</td>
                          <td className="py-2 text-sm">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"}</td>
                          <td className="py-2 text-sm">
                            <span className={"inline-flex px-2 py-0.5 rounded-full text-xs font-medium " + (
                              p.status === "paid" 
                                ? "bg-green-100 text-green-800"
                                : p.status === "pending" 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : "bg-red-100 text-red-800"
                            )}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2 text-sm text-gray-500">{p.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button onClick={function() { setShowPaymentHistory(false); }} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStudentFeeManagement;