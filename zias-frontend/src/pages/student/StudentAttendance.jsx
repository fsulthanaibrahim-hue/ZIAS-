import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';
import StudentSidebar from '../../components/StudentSidebar';

const StudentAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await API.get('attendance/history/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setRecords(data);
      // Calculate total net hours
      const total = data.reduce((sum, rec) => sum + (rec.net_work_hours || 0), 0);
      setTotalHours(total);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">My Attendance History</h1>
            <p className="text-gray-500 mt-1">Total net working hours: <span className="font-semibold text-green-600">{totalHours.toFixed(2)} hrs</span></p>
          </div>

          {records.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
              No attendance records found.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Break (min)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map(rec => {
                      const checkIn = new Date(rec.check_in);
                      const checkOut = rec.check_out ? new Date(rec.check_out) : null;
                      return (
                        <tr key={rec.id}>
                          <td className="px-6 py-3 text-sm">{checkIn.toLocaleDateString()}</td>
                          <td className="px-6 py-3 text-sm">{checkIn.toLocaleTimeString()}</td>
                          <td className="px-6 py-3 text-sm">{checkOut ? checkOut.toLocaleTimeString() : '—'}</td>
                          <td className="px-6 py-3 text-sm">{rec.break_minutes || 0}</td>
                          <td className="px-6 py-3 text-sm font-medium text-green-700">{rec.net_work_hours || 0} hrs</td>
                          <td className="px-6 py-3 text-sm text-gray-500">{rec.check_out_reason || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentAttendance;