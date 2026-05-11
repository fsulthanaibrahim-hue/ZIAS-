// src/pages/mentor/AttendanceMonitor.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API from '../../api/api';

// ---------- Helper: get today's local date in YYYY-MM-DD ----------
const getLocalDateYYYYMMDD = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format YYYY-MM-DD to DD/MM/YYYY for display
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

// Get local date (YYYY-MM-DD) from any timestamp – timezone safe
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
const AttendanceMonitor = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedLocalDate, setSelectedLocalDate] = useState(getLocalDateYYYYMMDD);
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(true);
  const [totalWorkHours, setTotalWorkHours] = useState(0);
  const [totalBreakHours, setTotalBreakHours] = useState(0);
  const studentsFetched = useRef(false);
  const lastFetchStudentRef = useRef(null);

  // Fetch students once
  useEffect(() => {
    if (studentsFetched.current) return;
    studentsFetched.current = true;
    const fetchStudents = async () => {
      try {
        const res = await API.get('students/list/');
        setStudents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.clear();
          navigate('/login');
        } else {
          toast.error('Failed to load students');
        }
      } finally {
        setStudentLoading(false);
      }
    };
    fetchStudents();
  }, [navigate]);

  const getStudentName = (student) =>
    student?.full_name || student?.name || student?.username || `Student ${student?.id}`;

  // Fetch ALL attendance for selected student (no server‑side date filter)
  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== lastFetchStudentRef.current) {
      lastFetchStudentRef.current = selectedStudentId;
      fetchAllAttendance();
    } else if (!selectedStudentId) {
      setAllRecords([]);
      setFilteredRecords([]);
    }
  }, [selectedStudentId]);

  const fetchAllAttendance = async () => {
    setLoading(true);
    try {
      const res = await API.get(`attendance/history/?student_id=${selectedStudentId}`);
      let data = res.data.results || res.data;
      if (!Array.isArray(data)) data = [];
      data.sort((a, b) => new Date(b.check_in) - new Date(a.check_in));
      setAllRecords(data);
    } catch (err) {
      toast.error('Failed to load attendance records');
      setAllRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter records by selected local date and compute totals
  useEffect(() => {
    const filtered = allRecords.filter(rec => {
      if (!rec.check_in) return false;
      return getLocalDateKey(rec.check_in) === selectedLocalDate;
    });
    setFilteredRecords(filtered);

    const workTotal = filtered.reduce((sum, rec) => sum + (rec.net_work_hours || 0), 0);
    setTotalWorkHours(workTotal);

    const breakTotal = filtered
      .filter(rec => rec.check_out_reason && rec.check_out_reason.toLowerCase().includes('break'))
      .reduce((sum, rec) => sum + (rec.net_work_hours || 0), 0);
    setTotalBreakHours(breakTotal);
  }, [selectedLocalDate, allRecords]);

  const handleDateChange = (e) => {
    setSelectedLocalDate(e.target.value);
  };

  const selectedStudent = students.find(s => s.id == selectedStudentId);

  if (studentLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Student Attendance Monitor</h2>

      {/* Student selector + Date picker (layout similar to student side) */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
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
              value={selectedLocalDate}
              onChange={handleDateChange}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {!selectedStudentId ? (
        <div className="text-center py-12 text-gray-400">
          Please select a student from the dropdown above.
        </div>
      ) : loading && allRecords.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-gray-500">Loading attendance records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center text-yellow-800">
          No attendance record for {getStudentName(selectedStudent)} on {formatDateDMY(selectedLocalDate)}.
        </div>
      ) : (
        <>
          {/* Totals header (same as student side) */}
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg flex flex-wrap justify-between items-center text-sm font-medium border border-green-100">
            <span>📊 Totals for {getStudentName(selectedStudent)} on {formatDateDMY(selectedLocalDate)}:</span>
            <div className="space-x-4 flex flex-wrap gap-2">
              <span>⚡ Net work hours: <span className="font-bold text-green-700">{totalWorkHours.toFixed(2)} hrs ({formatDuration(totalWorkHours)})</span></span>
              <span>☕ Total break: <span className="font-bold text-orange-600">{totalBreakHours.toFixed(2)} hrs ({formatDuration(totalBreakHours)})</span></span>
            </div>
          </div>

          {/* Attendance Table (exactly like student side) */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CHECK IN</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CHECK OUT</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NET HOURS</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec, idx) => (
                  <tr key={rec.id} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="border px-4 py-2 text-sm">{formatDateDMY(getLocalDateKey(rec.check_in))}</td>
                    <td className="border px-4 py-2 text-sm font-mono">{formatTimeHHMMSS(rec.check_in)}</td>
                    <td className="border px-4 py-2 text-sm font-mono">{formatTimeHHMMSS(rec.check_out)}</td>
                    <td className="border px-4 py-2 text-sm font-medium text-green-700">{formatDuration(rec.net_work_hours)}</td>
                    <td className="border px-4 py-2 text-sm text-gray-500">{rec.check_out_reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceMonitor;