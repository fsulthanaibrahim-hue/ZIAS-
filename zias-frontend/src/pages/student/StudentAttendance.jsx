// src/pages/student/StudentAttendance.jsx – optimized and error‑free
import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';
import StudentSidebar from '../../components/StudentSidebar';

const StudentAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const initialFetchDone = useRef(false);

  const fetchAttendance = async (date) => {
    setLoading(true);
    try {
      const res = await API.get(`attendance/history/?date=${date}`);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setRecords(data);
      const total = data.reduce((sum, rec) => sum + (rec.net_work_hours || 0), 0);
      setTotalHours(total);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch only once (prevents duplicate call in StrictMode)
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchAttendance(selectedDate);
  }, []);

  // Re‑fetch when date changes (but not on mount)
  useEffect(() => {
    if (initialFetchDone.current) {
      fetchAttendance(selectedDate);
    }
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
                <p className="text-gray-500 mt-1">
                  Net work hours on <span className="font-medium">{formatDate(selectedDate)}</span>:
                  <span className="ml-1 font-semibold text-green-600">{totalHours.toFixed(2)} hrs</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
              No attendance record for {formatDate(selectedDate)}.
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
                          <td className="px-6 py-3 text-sm font-medium text-green-700">{rec.net_work_hours ?? 0} hrs</td>
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