// src/Admin/AdminAttendance.jsx (no chart, only date picker + details)
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import API from '../api/api';
import Sidebar from '../components/Sidebar';

function AdminAttendance() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(true);

  // Load student list
  useEffect(() => {
    API.get('students/list/')
      .then(res => setStudents(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setStudentLoading(false));
  }, []);

  // Fetch attendance when student or date changes
  useEffect(() => {
    if (selectedStudentId && selectedDate) {
      fetchAttendanceForDate();
    } else {
      setAttendance(null);
    }
  }, [selectedStudentId, selectedDate]);

  const fetchAttendanceForDate = async () => {
    setLoading(true);
    try {
      const res = await API.get(`attendance/history/?student_id=${selectedStudentId}&date=${selectedDate}`);
      const records = res.data.results || res.data;
      setAttendance(records.length ? records[0] : null);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id == selectedStudentId);

  if (studentLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Attendance Monitoring</h1>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">-- Select Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Attendance details */}
          {selectedStudentId ? (
            <>
              {loading && <div className="text-center py-8">Loading attendance...</div>}
              {!loading && attendance ? (
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h2 className="text-lg font-semibold mb-3">
                    {selectedStudent?.name} – {new Date(selectedDate).toLocaleDateString()}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Check In:</span> {new Date(attendance.check_in).toLocaleTimeString()}</div>
                    <div><span className="text-gray-500">Check Out:</span> {attendance.check_out ? new Date(attendance.check_out).toLocaleTimeString() : '—'}</div>
                    <div><span className="text-gray-500">Break (min):</span> {attendance.break_minutes || 0}</div>
                    <div><span className="text-gray-500">Net Hours:</span> <span className="font-semibold text-green-700">{attendance.net_work_hours?.toFixed(2) || 0} hrs</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Reason:</span> {attendance.check_out_reason || '—'}</div>
                  </div>
                </div>
              ) : (
                !loading && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center text-yellow-800">
                    No attendance record for {selectedStudent?.name} on {selectedDate}.
                  </div>
                )
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 py-12">Select a student to view attendance.</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminAttendance;