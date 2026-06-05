import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { toast } from 'react-hot-toast';

function FeeOverview() {
  const [students, setStudents] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    total_amount: "",
    paid_amount: ""
  });
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get all students
      const studentsRes = await API.get('/admin/students-fee/');
      let studentsData = studentsRes.data;
      if (studentsData.results) studentsData = studentsData.results;
      
      // Get all student fees (contains total_amount and paid_amount for each student)
      const studentFeesRes = await API.get('/student-fees/');
      let studentFeesData = studentFeesRes.data;
      if (studentFeesData.results) studentFeesData = studentFeesData.results;
      
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setStudentFees(Array.isArray(studentFeesData) ? studentFeesData : []);
      
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load fee data');
      setStudents([]);
      setStudentFees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Listen for updates from Student Fee Management page
    const handleUpdate = () => {
      fetchData();
    };
    window.addEventListener('studentFeeUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('studentFeeUpdated', handleUpdate);
    };
  }, []);

  // Get fee info for a specific student from StudentFee model
  const getStudentFeeInfo = (student) => {
    // Find the StudentFee record for this student
    const studentFeeRecord = studentFees.find(sf => sf.student === student.id);
    
    if (studentFeeRecord) {
      const totalAmount = Number(studentFeeRecord.total_amount) || 0;
      const paidAmount = Number(studentFeeRecord.paid_amount) || 0;
      const pendingAmount = totalAmount - paidAmount;
      
      let status = 'Pending';
      if (pendingAmount === 0 && totalAmount > 0) {
        status = 'Paid';
      } else if (paidAmount > 0 && pendingAmount > 0) {
        status = 'Partially Paid';
      } else if (pendingAmount === totalAmount && totalAmount > 0) {
        status = 'Pending';
      } else if (totalAmount === 0) {
        status = 'No Fee Assigned';
      }
      
      return {
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
        status: status,
        feeStructureId: studentFeeRecord.fee_structure,
        studentFeeId: studentFeeRecord.id,
        studentName: studentFeeRecord.student_name || student.name || student.full_name,
        courseName: studentFeeRecord.course_name || student.course
      };
    }
    
    // No fee record found for this student
    return {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      status: 'No Fee Assigned',
      feeStructureId: null,
      studentFeeId: null
    };
  };

  // Handle Edit Click
  const handleEditClick = (student) => {
    const feeInfo = getStudentFeeInfo(student);
    if (!feeInfo.studentFeeId) {
      toast.error('No fee record found. Please apply fee structure first.');
      return;
    }
    
    setEditingStudent(student);
    setEditFormData({
      total_amount: feeInfo.totalAmount.toString(),
      paid_amount: feeInfo.paidAmount.toString()
    });
    setShowEditModal(true);
  };

  // Handle Update Fee
  const handleUpdateFee = async () => {
    if (!editingStudent) return;
    
    const feeInfo = getStudentFeeInfo(editingStudent);
    if (!feeInfo.studentFeeId) {
      toast.error('No fee record found');
      setShowEditModal(false);
      return;
    }
    
    setUpdating(true);
    try {
      const payload = {
        total_amount: parseFloat(editFormData.total_amount) || 0,
        paid_amount: parseFloat(editFormData.paid_amount) || 0
      };
      
      await API.patch(`/student-fees/${feeInfo.studentFeeId}/`, payload);
      
      toast.success('Fee updated successfully');
      setShowEditModal(false);
      setEditingStudent(null);
      
      // Refresh data
      await fetchData();
      
      // Dispatch event to notify other pages
      window.dispatchEvent(new Event('studentFeeUpdated'));
      
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update fee');
    } finally {
      setUpdating(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = search.toLowerCase();
    const feeInfo = getStudentFeeInfo(student);
    return (
      (student.name || '').toLowerCase().includes(searchLower) ||
      (student.full_name || '').toLowerCase().includes(searchLower) ||
      (student.course || '').toLowerCase().includes(searchLower) ||
      feeInfo.status.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount) => {
    return '₹' + (amount || 0).toLocaleString('en-IN');
  };

  // Summary statistics - from StudentFee model
  const totalStudents = students.length;
  const studentsWithFee = studentFees.length;
  
  const totalFee = studentFees.reduce((sum, sf) => {
    return sum + (Number(sf.total_amount) || 0);
  }, 0);
  
  const totalPaid = studentFees.reduce((sum, sf) => {
    return sum + (Number(sf.paid_amount) || 0);
  }, 0);
  
  const totalPending = totalFee - totalPaid;
  
  const paidCount = students.filter(s => {
    const feeInfo = getStudentFeeInfo(s);
    return feeInfo.status === 'Paid';
  }).length;
  
  const partiallyPaidCount = students.filter(s => {
    const feeInfo = getStudentFeeInfo(s);
    return feeInfo.status === 'Partially Paid';
  }).length;
  
  const pendingCount = students.filter(s => {
    const feeInfo = getStudentFeeInfo(s);
    return feeInfo.status === 'Pending';
  }).length;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-800';
      case 'Partially Paid': return 'bg-amber-100 text-amber-800';
      case 'Pending': return 'bg-rose-100 text-rose-800';
      case 'No Fee Assigned': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading fee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fee Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Student-wise fee summary from Student Fee structure</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
          >
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <p className="text-gray-500 text-sm">Total Students</p>
            <p className="text-2xl font-bold text-blue-700">{totalStudents}</p>
            <p className="text-xs text-blue-600 mt-1">With Fee: {studentsWithFee}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
            <p className="text-gray-500 text-sm">Total Fee</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalFee)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
            <p className="text-gray-500 text-sm">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-5 border border-rose-200">
            <p className="text-gray-500 text-sm">Total Pending</p>
            <p className="text-2xl font-bold text-rose-700">{formatCurrency(totalPending)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
            <p className="text-gray-500 text-sm">Collection Rate</p>
            <p className="text-2xl font-bold text-orange-700">
              {totalFee > 0 ? ((totalPaid / totalFee) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Payment Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
            <p className="text-gray-500 text-sm">Fully Paid</p>
            <p className="text-xl font-bold text-emerald-700">{paidCount} students</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
            <p className="text-gray-500 text-sm">Partially Paid</p>
            <p className="text-xl font-bold text-amber-700">{partiallyPaidCount} students</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-200 text-center">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-xl font-bold text-rose-700">{pendingCount} students</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by student name, course or payment status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Fee</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const feeInfo = getStudentFeeInfo(student);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{student.name || student.full_name || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.course || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {feeInfo.totalAmount > 0 ? formatCurrency(feeInfo.totalAmount) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                        {feeInfo.paidAmount > 0 ? formatCurrency(feeInfo.paidAmount) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600 font-medium">
                        {feeInfo.pendingAmount > 0 ? formatCurrency(feeInfo.pendingAmount) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(feeInfo.status)}`}>
                          {feeInfo.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleEditClick(student)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          disabled={feeInfo.status === 'No Fee Assigned'}
                          title={feeInfo.status === 'No Fee Assigned' ? 'Apply fee structure first' : 'Edit fee'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2">📌 Fee Summary Information</h3>
          <p className="text-sm text-yellow-800">
            This page shows fee details from <strong>Student Fee table</strong>. Each student's Total Fee, Paid Amount, and Pending Balance are displayed.
            If a student shows "No Fee Assigned", please apply a fee structure to that student from the Student Fee Management page.
            Click the <strong>Edit</strong> button to modify individual student fees.
          </p>
          <div className="mt-2 text-xs text-yellow-700">
            <strong>Summary:</strong> Total Fee: {formatCurrency(totalFee)} | Total Paid: {formatCurrency(totalPaid)} | Total Pending: {formatCurrency(totalPending)} | Collection Rate: {totalFee > 0 ? ((totalPaid / totalFee) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Student Fee</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Student: {editingStudent.name || editingStudent.full_name}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.total_amount}
                  onChange={(e) => setEditFormData({...editFormData, total_amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.paid_amount}
                  onChange={(e) => setEditFormData({...editFormData, paid_amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateFee}
                disabled={updating}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeeOverview;