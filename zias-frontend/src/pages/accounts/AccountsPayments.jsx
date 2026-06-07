// pages/accounts/AccountsPayments.jsx
import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

function AccountsPayments() {
  const [students, setStudents] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [applyingFee, setApplyingFee] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    total_amount: "",
    paid_amount: ""
  });
  const [updating, setUpdating] = useState(false);

  // Apply Fee Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState(null);
  const [applyingToAll, setApplyingToAll] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch students
      const studentsRes = await API.get('/accounts/students/');
      let studentsData = studentsRes.data;
      if (studentsData.results) studentsData = studentsData.results;
      
      // Fetch student fees (payment records)
      const studentFeesRes = await API.get('/student-fees/');
      let studentFeesData = studentFeesRes.data;
      if (studentFeesData.results) studentFeesData = studentFeesData.results;
      
      // Fetch fee structures
      const feeStructuresRes = await API.get('/fee-structures/');
      let feeStructuresData = feeStructuresRes.data;
      if (feeStructuresData.results) feeStructuresData = feeStructuresData.results;
      
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setStudentFees(Array.isArray(studentFeesData) ? studentFeesData : []);
      setFeeStructures(Array.isArray(feeStructuresData) ? feeStructuresData : []);
      
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load payment data');
      setStudents([]);
      setStudentFees([]);
      setFeeStructures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApplyFeeToAll = async () => {
    if (!selectedFeeStructure) {
      toast.error('Please select a fee structure');
      return;
    }
    
    const studentsWithFeeIds = studentFees.map(sf => sf.student);
    const studentsWithoutFee = students.filter(s => !studentsWithFeeIds.includes(s.id));
    
    if (studentsWithoutFee.length === 0) {
      toast.info('All students already have fee assigned');
      setShowApplyModal(false);
      return;
    }
    
    setApplyingToAll(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const student of studentsWithoutFee) {
      try {
        const totalAmount = parseFloat(selectedFeeStructure.total_amount) || 0;
        const discount = parseFloat(selectedFeeStructure.discount_percentage) || 0;
        const finalAmount = totalAmount * (1 - discount / 100);
        
        await API.post('/student-fees/', {
          student: student.id,
          fee_structure: selectedFeeStructure.id,
          total_amount: finalAmount,
          paid_amount: 0,
          discount_applied: discount
        });
        successCount++;
      } catch (err) {
        console.error(`Failed for ${student.name}:`, err);
        failCount++;
      }
    }
    
    if (successCount > 0) {
      toast.success(`Fee assigned to ${successCount} students${failCount > 0 ? `, ${failCount} failed` : ''}`);
    } else {
      toast.error('Failed to assign fees');
    }
    
    setShowApplyModal(false);
    setSelectedFeeStructure(null);
    await fetchData();
    setApplyingToAll(false);
  };

  const handleApplyFeeToIndividual = async (student) => {
    if (!selectedFeeStructure) {
      toast.error('Please select a fee structure');
      return;
    }
    
    setApplyingFee(true);
    try {
      const totalAmount = parseFloat(selectedFeeStructure.total_amount) || 0;
      const discount = parseFloat(selectedFeeStructure.discount_percentage) || 0;
      const finalAmount = totalAmount * (1 - discount / 100);
      
      await API.post('/student-fees/', {
        student: student.id,
        fee_structure: selectedFeeStructure.id,
        total_amount: finalAmount,
        paid_amount: 0,
        discount_applied: discount
      });
      
      toast.success(`Fee assigned to ${student.name}`);
      setShowApplyModal(false);
      setSelectedFeeStructure(null);
      await fetchData();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to assign fee');
    } finally {
      setApplyingFee(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const handleUpdate = () => {
      fetchData();
    };
    window.addEventListener('studentFeeUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('studentFeeUpdated', handleUpdate);
    };
  }, [fetchData]);

  const getStudentFeeInfo = (student) => {
    const studentFeeRecord = studentFees.find(sf => sf.student === student.id);
    
    if (studentFeeRecord) {
      const totalAmount = Number(studentFeeRecord.total_amount) || 0;
      const paidAmount = Number(studentFeeRecord.paid_amount) || 0;
      // Ensure pending amount never goes negative
      const pendingAmount = Math.max(0, totalAmount - paidAmount);
      
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
        courseName: studentFeeRecord.course_name || student.course,
        discountApplied: studentFeeRecord.discount_applied || 0
      };
    }
    
    return {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      status: 'No Fee Assigned',
      feeStructureId: null,
      studentFeeId: null,
      discountApplied: 0
    };
  };

  const handleEditClick = (student) => {
    const feeInfo = getStudentFeeInfo(student);
    if (!feeInfo.studentFeeId) {
      // If no fee record, open apply modal instead
      setSelectedFeeStructure(null);
      setShowApplyModal(true);
      setEditingStudent(student);
      return;
    }
    
    setEditingStudent(student);
    setEditFormData({
      total_amount: feeInfo.totalAmount.toString(),
      paid_amount: feeInfo.paidAmount.toString()
    });
    setShowEditModal(true);
    setMobileMenuOpen(false);
  };

  const handleUpdateFee = async () => {
    if (!editingStudent) return;
    
    const feeInfo = getStudentFeeInfo(editingStudent);
    if (!feeInfo.studentFeeId) {
      toast.error('No fee record found');
      setShowEditModal(false);
      return;
    }
    
    // Validate inputs
    const newTotalAmount = parseFloat(editFormData.total_amount) || 0;
    const newPaidAmount = parseFloat(editFormData.paid_amount) || 0;
    
    if (newTotalAmount < 0) {
      toast.error('Total amount cannot be negative');
      return;
    }
    
    if (newPaidAmount < 0) {
      toast.error('Paid amount cannot be negative');
      return;
    }
    
    if (newPaidAmount > newTotalAmount) {
      toast.error('Paid amount cannot exceed total amount');
      return;
    }
    
    setUpdating(true);
    try {
      const payload = {
        total_amount: newTotalAmount,
        paid_amount: newPaidAmount
      };
      
      await API.patch(`/student-fees/${feeInfo.studentFeeId}/`, payload);
      
      toast.success('Payment updated successfully');
      setShowEditModal(false);
      setEditingStudent(null);
      
      await fetchData();
      window.dispatchEvent(new Event('studentFeeUpdated'));
      
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteFee = async (student) => {
    const feeInfo = getStudentFeeInfo(student);
    if (!feeInfo.studentFeeId) {
      toast.error('No fee record to delete');
      return;
    }
    
    if (!window.confirm(`Delete fee record for ${student.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await API.delete(`/student-fees/${feeInfo.studentFeeId}/`);
      toast.success('Fee record deleted successfully');
      await fetchData();
      window.dispatchEvent(new Event('studentFeeUpdated'));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete fee record');
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = search.toLowerCase();
    const feeInfo = getStudentFeeInfo(student);
    return (
      (student.name || '').toLowerCase().includes(searchLower) ||
      (student.full_name || '').toLowerCase().includes(searchLower) ||
      (student.course || '').toLowerCase().includes(searchLower) ||
      (student.email || '').toLowerCase().includes(searchLower) ||
      feeInfo.status.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount) => {
    if (amount === 0 || !amount) return '₹0';
    return '₹' + amount.toLocaleString('en-IN');
  };

  // Calculate summary statistics with proper validation
  const totalStudents = students.length;
  const studentsWithFee = studentFees.length;
  const studentsWithoutFee = totalStudents - studentsWithFee;
  
  const totalFee = studentFees.reduce((sum, sf) => {
    return sum + (Math.max(0, Number(sf.total_amount)) || 0);
  }, 0);
  
  const totalPaid = studentFees.reduce((sum, sf) => {
    return sum + (Math.max(0, Number(sf.paid_amount)) || 0);
  }, 0);
  
  const totalPending = Math.max(0, totalFee - totalPaid);
  
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

  const collectionRate = totalFee > 0 ? ((totalPaid / totalFee) * 100).toFixed(1) : 0;

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
          <p className="text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Payment Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Student-wise fee collection and payment summary</p>
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
          <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-2`}>
            {studentsWithoutFee > 0 && feeStructures.length > 0 && (
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setSelectedFeeStructure(null);
                  setShowApplyModal(true);
                }}
                disabled={applyingFee}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 text-sm whitespace-nowrap"
              >
                {applyingFee ? 'Applying...' : `Apply Fee (${studentsWithoutFee})`}
              </button>
            )}
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-sm whitespace-nowrap"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 sm:p-5 border border-blue-200">
            <p className="text-gray-500 text-xs sm:text-sm">Total Students</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{totalStudents}</p>
            <p className="text-xs text-blue-600 mt-1">With Fee: {studentsWithFee}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 sm:p-5 border border-purple-200">
            <p className="text-gray-500 text-xs sm:text-sm">Total Fee</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-700">{formatCurrency(totalFee)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 sm:p-5 border border-emerald-200">
            <p className="text-gray-500 text-xs sm:text-sm">Total Paid</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 sm:p-5 border border-rose-200">
            <p className="text-gray-500 text-xs sm:text-sm">Total Pending</p>
            <p className="text-xl sm:text-2xl font-bold text-rose-700">{formatCurrency(totalPending)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 sm:p-5 border border-orange-200">
            <p className="text-gray-500 text-xs sm:text-sm">Collection Rate</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-700">{collectionRate}%</p>
          </div>
        </div>

        {/* Payment Status Cards - No Fee Assigned removed */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl p-3 sm:p-4 border border-emerald-200 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">Fully Paid</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-700">{paidCount} students</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">Partially Paid</p>
            <p className="text-lg sm:text-xl font-bold text-amber-700">{partiallyPaidCount} students</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-3 sm:p-4 border border-rose-200 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">Pending</p>
            <p className="text-lg sm:text-xl font-bold text-rose-700">{pendingCount} students</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by student name, course, email or payment status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
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
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-sm">{student.name || student.full_name || '—'}</p>
                        {student.email && (
                          <p className="text-xs text-gray-400">{student.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.course || student.class_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 text-sm">
                        {feeInfo.totalAmount > 0 ? formatCurrency(feeInfo.totalAmount) : '—'}
                        {feeInfo.discountApplied > 0 && (
                          <p className="text-xs text-green-600">-{feeInfo.discountApplied}% off</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium text-sm">
                        {feeInfo.paidAmount > 0 ? formatCurrency(feeInfo.paidAmount) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600 font-medium text-sm">
                        {feeInfo.pendingAmount > 0 ? formatCurrency(feeInfo.pendingAmount) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(feeInfo.status)}`}>
                          {feeInfo.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditClick(student)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={feeInfo.status === 'No Fee Assigned' ? 'Apply fee' : 'Edit payment'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {feeInfo.status !== 'No Fee Assigned' && (
                            <button
                              onClick={() => handleDeleteFee(student)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete fee record"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              No students found.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const feeInfo = getStudentFeeInfo(student);
              return (
                <div key={student.id} className="bg-white rounded-xl shadow border border-gray-200 p-4">
                  {/* Student Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-base">{student.name || student.full_name || '—'}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{student.course || student.class_name || '—'}</p>
                      {student.email && (
                        <p className="text-xs text-gray-400 mt-0.5">{student.email}</p>
                      )}
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(feeInfo.status)}`}>
                      {feeInfo.status}
                    </span>
                  </div>
                  
                  {/* Payment Details */}
                  <div className="grid grid-cols-3 gap-3 mb-3 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Fee</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {feeInfo.totalAmount > 0 ? formatCurrency(feeInfo.totalAmount) : '—'}
                      </p>
                      {feeInfo.discountApplied > 0 && (
                        <p className="text-xs text-green-600">-{feeInfo.discountApplied}%</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Paid</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        {feeInfo.paidAmount > 0 ? formatCurrency(feeInfo.paidAmount) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pending</p>
                      <p className="text-sm font-semibold text-rose-600">
                        {feeInfo.pendingAmount > 0 ? formatCurrency(feeInfo.pendingAmount) : '—'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEditClick(student)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 rounded-lg transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {feeInfo.status === 'No Fee Assigned' ? 'Apply Fee' : 'Edit'}
                    </button>
                    {feeInfo.status !== 'No Fee Assigned' && (
                      <button
                        onClick={() => handleDeleteFee(student)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-lg transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Note Section */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2">📌 Payment Information</h3>
          <p className="text-xs sm:text-sm text-yellow-800">
            This page shows student-wise fee details including Total Fee, Paid Amount, and Pending Balance.
            {studentsWithoutFee > 0 && (
              <span> <strong>{studentsWithoutFee} student(s)</strong> have no fee assigned. Click the <strong>Apply Fee</strong> button to assign fee.</span>
            )}
            Click the <strong>Edit</strong> button to modify individual student payments. Click <strong>Delete</strong> to remove a fee record.
          </p>
          <div className="mt-2 text-xs text-yellow-700 break-words">
            <strong>Summary:</strong> Total Fee: {formatCurrency(totalFee)} | Total Paid: {formatCurrency(totalPaid)} | Total Pending: {formatCurrency(totalPending)} | Collection Rate: {collectionRate}%
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Edit Student Payment</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Student: <span className="font-semibold text-gray-800">{editingStudent.name || editingStudent.full_name}</span></p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.total_amount}
                  onChange={(e) => setEditFormData({...editFormData, total_amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.paid_amount}
                  onChange={(e) => setEditFormData({...editFormData, paid_amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Amount already collected from student</p>
              </div>
              {parseFloat(editFormData.paid_amount) > parseFloat(editFormData.total_amount) && (
                <p className="text-xs text-red-600">⚠️ Paid amount cannot exceed total amount</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateFee}
                disabled={updating || parseFloat(editFormData.paid_amount) > parseFloat(editFormData.total_amount)}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                {updating ? 'Updating...' : 'Update Payment'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Fee Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowApplyModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Apply Fee Structure</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            {editingStudent && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Student: <span className="font-semibold text-gray-800">{editingStudent.name || editingStudent.full_name}</span></p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Fee Structure</label>
                <select
                  value={selectedFeeStructure?.id || ''}
                  onChange={(e) => {
                    const selected = feeStructures.find(fs => fs.id === parseInt(e.target.value));
                    setSelectedFeeStructure(selected);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="">Select a fee structure...</option>
                  {feeStructures.filter(fs => fs.is_active).map(fs => (
                    <option key={fs.id} value={fs.id}>
                      {fs.name} - {formatCurrency(fs.total_amount)} {fs.discount_percentage > 0 ? `(${fs.discount_percentage}% off)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedFeeStructure && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700">Fee Details:</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Original Amount: {formatCurrency(selectedFeeStructure.total_amount)}</p>
                    {selectedFeeStructure.discount_percentage > 0 && (
                      <>
                        <p className="text-green-600">Discount: {selectedFeeStructure.discount_percentage}%</p>
                        <p className="font-semibold">Final Amount: {formatCurrency(selectedFeeStructure.total_amount * (1 - selectedFeeStructure.discount_percentage / 100))}</p>
                      </>
                    )}
                    <p>Duration: {selectedFeeStructure.number_of_months} months</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={editingStudent ? () => handleApplyFeeToIndividual(editingStudent) : handleApplyFeeToAll}
                disabled={!selectedFeeStructure || applyingFee || applyingToAll}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                {applyingFee || applyingToAll ? 'Applying...' : 'Apply Fee'}
              </button>
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setEditingStudent(null);
                  setSelectedFeeStructure(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
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

export default AccountsPayments;