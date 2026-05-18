// src/Admin/AdminStudentFeeManagement.jsx
import { useEffect, useState } from "react";
import API from "../api/api";
import toast from "react-hot-toast";

function AdminStudentFeeManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [feeStructureMap, setFeeStructureMap] = useState({}); // studentId -> fee structure name
  const [fsLoading, setFsLoading] = useState({});

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await API.get("/accounts/students/");
      let data = res.data;
      if (data.results) data = data.results;
      setStudents(Array.isArray(data) ? data : []);
      // After loading students, fetch each one's assigned fee structure
      for (const s of data) {
        fetchStudentFeeStructure(s.id);
      }
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentFeeStructure = async (studentId) => {
    setFsLoading(prev => ({ ...prev, [studentId]: true }));
    try {
      // Try to get the fee structure assigned to this student
      // Adjust the endpoint as per your backend.
      // Example: GET /students/${studentId}/fee-structure/
      const res = await API.get(`/students/${studentId}/fee-structure/`);
      const fsName = res.data.name || `${res.data.total_amount} (${res.data.number_of_installments} installments)`;
      setFeeStructureMap(prev => ({ ...prev, [studentId]: fsName }));
    } catch (err) {
      // If no fee structure assigned, leave as "—"
      setFeeStructureMap(prev => ({ ...prev, [studentId]: "—" }));
    } finally {
      setFsLoading(prev => ({ ...prev, [studentId]: false }));
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
      toast.error("Failed to load payment history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.course?.toLowerCase().includes(search.toLowerCase())
  );

  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount || 0);
  };

  if (loading) return <div className="p-8 text-center">Loading student data...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Fee Management</h1>
        <button onClick={fetchStudents} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">⟳ Refresh</button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email or course..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
        <table className="min-w-[1000px] w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Fee Structure</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending Fee Details</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week‑back Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agreement Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escalation Flags</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Payment History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map(s => {
              const outstanding = (s.total_pending || 0) + (s.total_overdue || 0);
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
                    {fsLoading[s.id] ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      <span className="text-gray-700">{feeStructureMap[s.id]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <span className="text-yellow-600">Pending: {formatCurrency(s.total_pending)}</span><br />
                      <span className="text-red-600">Overdue: {formatCurrency(s.total_overdue)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.week_back_fee_status === "on_track" ? "bg-green-100 text-green-800" :
                      s.week_back_fee_status === "delayed" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                    }`}>
                      {s.week_back_fee_status === "on_track" ? "On Track" :
                       s.week_back_fee_status === "delayed" ? "Delayed" : "Overdue"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {s.agreement_signed ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Signed</span>
                    ) : (
                      <button
                        onClick={async () => {
                          // Optional: update agreement status inline
                          toast("Agreement update feature – implement your own PATCH");
                        }}
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        ✗ Not signed (click to update)
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-purple-600">
                    {formatCurrency(outstanding)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {s.escalation_flag ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">⚠️ Flagged</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <button
                      onClick={() => viewPaymentHistory(s)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment History Modal – same as before */}
      {showPaymentHistory && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentHistory(false)}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Payment History – {selectedStudent.name}</h2>
              <button onClick={() => setShowPaymentHistory(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
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
                    {paymentHistory.map(p => (
                      <tr key={p.id}>
                        <td className="py-2 text-sm">{formatCurrency(p.amount)}</td>
                        <td className="py-2 text-sm">{new Date(p.due_date).toLocaleDateString()}</td>
                        <td className="py-2 text-sm">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"}</td>
                        <td className="py-2 text-sm">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.status === "paid" ? "bg-green-100 text-green-800" :
                            p.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2 text-sm text-gray-500">{p.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowPaymentHistory(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStudentFeeManagement;