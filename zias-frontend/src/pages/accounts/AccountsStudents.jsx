import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

function AccountsStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fetch students and then enrich with additional data
  const fetchStudents = async () => {
    setLoading(true);
    try {
      // 1. Get basic student list
      const res = await API.get('/accounts/students/');
      let data = res.data;
      if (data.results) data = data.results;
      const basicStudents = Array.isArray(data) ? data : [];

      // 2. For each student, fetch extra details (two API calls)
      // To avoid too many requests, we use Promise.all for parallel calls
      const enrichedStudents = await Promise.all(
        basicStudents.map(async (student) => {
          try {
            // First extra API call: get payment details
            const paymentsRes = await API.get(`/accounts/student-payments/${student.id}/`);
            const paymentsData = paymentsRes.data || {};

            // Second extra API call: get due details
            const duesRes = await API.get(`/accounts/student-dues/${student.id}/`);
            const duesData = duesRes.data || {};

            // Merge the extra data into the student object
            return {
              ...student,
              total_paid: paymentsData.total_paid ?? student.total_paid ?? 0,
              last_payment_date: paymentsData.last_payment_date ?? null,
              total_pending: duesData.total_pending ?? student.total_pending ?? 0,
              total_overdue: duesData.total_overdue ?? student.total_overdue ?? 0,
            };
          } catch (err) {
            console.error(`Failed to fetch extra data for student ${student.id}`, err);
            // Return the student without extra data (fallback to original values)
            return student;
          }
        })
      );

      setStudents(enrichedStudents);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Optional: Refresh function (if needed)
  const refreshData = () => {
    setLoading(true);
    fetchStudents();
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading students...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Fee Summary</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={refreshData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Payment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agreement</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escalation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week-back</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map(s => (
              <tr key={s.id}>
                <td className="px-4 py-2 text-sm">{s.name}</td>
                <td className="px-4 py-2 text-sm">{s.email}</td>
                <td className="px-4 py-2 text-sm">{s.phone || '—'}</td>
                <td className="px-4 py-2 text-sm">{s.course || '—'}</td>
                <td className="px-4 py-2 text-sm">{s.reviewer_name}</td>
                <td className="px-4 py-2 text-sm">₹{s.total_paid?.toLocaleString() || 0}</td>
                <td className="px-4 py-2 text-sm">₹{s.total_pending?.toLocaleString() || 0}</td>
                <td className="px-4 py-2 text-sm">₹{s.total_overdue?.toLocaleString() || 0}</td>
                <td className="px-4 py-2 text-sm">{s.last_payment_date ? new Date(s.last_payment_date).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-2 text-sm">{s.agreement_signed ? '✓ Signed' : '✗ Not signed'}</td>
                <td className="px-4 py-2 text-sm">{s.escalation_flag ? '⚠️ Flagged' : '—'}</td>
                <td className="px-4 py-2 text-sm">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.week_back_fee_status === 'on_track' ? 'bg-green-100 text-green-800' :
                    s.week_back_fee_status === 'delayed' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {s.week_back_fee_status === 'on_track' ? 'On Track' :
                     s.week_back_fee_status === 'delayed' ? 'Delayed' : 'Overdue'}
                  </span>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr key="empty">
                <td colSpan="12" className="text-center py-8 text-gray-500">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AccountsStudents;