// src/pages/Admin/AdminAttendance.jsx
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import API from '../api/api';
import Sidebar from '../components/Sidebar';

// ---------- Helper: get today's local date in YYYY-MM-DD ----------
const getLocalDateYYYYMMDD = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format YYYY-MM-DD to DD/MM/YYYY
const formatDateDMY = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

// Format datetime to HH:MM:SS (24h)
const formatTimeHHMMSS = (datetimeStr) => {
  if (!datetimeStr) return '—';
  const date = new Date(datetimeStr);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Get local date (YYYY-MM-DD) from any timestamp
const getLocalDateKey = (datetimeStr) => {
  if (!datetimeStr) return '';
  const date = new Date(datetimeStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format decimal hours to "X hr Y min Z sec"
const formatDuration = (decimalHours) => {
  if (decimalHours === undefined || decimalHours === null) return '0 sec';
  const totalSeconds = Math.round(decimalHours * 3600);
  if (totalSeconds === 0) return '0 sec';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} sec${seconds !== 1 ? 's' : ''}`);
  return parts.join(' ');
};

// ---------- Main Component ----------
function AdminAttendance() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDateYYYYMMDD);
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(true);
  const [totalWorkHours, setTotalWorkHours] = useState(0);
  const [totalBreakHours, setTotalBreakHours] = useState(0);
  const studentsFetched = useRef(false);
  const lastFetchStudentRef = useRef(null);

  const getStudentName = (student) => {
    if (!student) return '';
    return student.name || student.full_name || student.username || `Student ${student.id}`;
  };

  const getInitials = (name) =>
    (name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  // Fetch students once
  useEffect(() => {
    if (studentsFetched.current) return;
    studentsFetched.current = true;
    API.get('students/list/')
      .then(res => setStudents(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setStudentLoading(false));
  }, []);

  // Fetch ALL attendance records for the selected student (no date filter)
  const fetchAllAttendance = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await API.get(`attendance/history/?student_id=${studentId}`);
      let data = res.data.results || res.data;
      if (!Array.isArray(data)) data = [];
      // Sort newest first
      data.sort((a, b) => new Date(b.check_in) - new Date(a.check_in));
      setAllRecords(data);
    } catch (err) {
      toast.error('Failed to load attendance records');
      setAllRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // When selected student changes, fetch their attendance
  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== lastFetchStudentRef.current) {
      lastFetchStudentRef.current = selectedStudentId;
      fetchAllAttendance(selectedStudentId);
    } else if (!selectedStudentId) {
      setAllRecords([]);
      setFilteredRecords([]);
    }
  }, [selectedStudentId]);

  // Filter records by selected local date and compute totals
  useEffect(() => {
    const filtered = allRecords.filter(rec => {
      if (!rec.check_in) return false;
      return getLocalDateKey(rec.check_in) === selectedDate;
    });
    setFilteredRecords(filtered);

    const workTotal = filtered.reduce((sum, rec) => sum + (rec.net_work_hours || 0), 0);
    setTotalWorkHours(workTotal);

    const breakTotal = filtered
      .filter(rec => rec.check_out_reason && rec.check_out_reason.toLowerCase().includes('break'))
      .reduce((sum, rec) => sum + (rec.net_work_hours || 0), 0);
    setTotalBreakHours(breakTotal);
  }, [selectedDate, allRecords]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const selectedStudent = students.find(s => s.id == selectedStudentId);

  if (studentLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header / Filter Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Attendance Monitoring</h1>
                <p className="text-gray-500 mt-1">
                  {selectedStudentId ? (
                    <>
                      Net work hours for <span className="font-medium">{getStudentName(selectedStudent)}</span> on{' '}
                      <span className="font-medium">{formatDateDMY(selectedDate)}</span>:
                      <span className="ml-1 font-semibold text-green-600">{totalWorkHours.toFixed(2)} hrs</span>
                    </>
                  ) : (
                    'Select a student to view attendance'
                  )}
                </p>
                {selectedStudentId && (
                  <div className="mt-1 text-sm text-gray-500">
                    ☕ Total break hours: <span className="font-medium text-orange-600">{totalBreakHours.toFixed(2)} hrs</span>
                    <span className="text-gray-400 ml-2">({formatDuration(totalBreakHours)})</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                  >
                    <option value="">-- Choose a student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{getStudentName(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Date (Calendar)</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          {!selectedStudentId ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
              Please select a student from the dropdown above.
            </div>
          ) : loading && allRecords.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-gray-500">Loading attendance records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
              No attendance record for {formatDateDMY(selectedDate)}.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CHECK IN</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CHECK OUT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NET HOURS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredRecords.map((rec, idx) => (
                      <tr key={rec.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-6 py-3 text-sm text-gray-900">{formatDateDMY(getLocalDateKey(rec.check_in))}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 font-mono">{formatTimeHHMMSS(rec.check_in)}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 font-mono">{formatTimeHHMMSS(rec.check_out)}</td>
                        <td className="px-6 py-3 text-sm font-medium text-green-700">{formatDuration(rec.net_work_hours)}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">{rec.check_out_reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminAttendance;