// src/pages/mentor/AttendanceMonitor.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API from '../../api/api';

const AttendanceMonitor = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(true);
  const [totalBreakSeconds, setTotalBreakSeconds] = useState(0);
  const [totalNetSeconds, setTotalNetSeconds] = useState(0);

  // ----- FILTER STATES -----
  const [selectedWeekdays, setSelectedWeekdays] = useState([]);
  const [breakCategory, setBreakCategory] = useState('all');
  const [reasonKeyword, setReasonKeyword] = useState('');
  const [lastN, setLastN] = useState('all');

  const weekdayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekdayMap = {
    'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0
  };

  // Prevent duplicate student fetch
  const studentsFetched = useRef(false);

  // Helper: format seconds to "Xh Ym Zs"
  const formatTime = (totalSeconds) => {
    if (!totalSeconds) return '0h 0m 0s';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };
  const formatBreak = (minutes) => formatTime((minutes || 0) * 60);

  // Fetch students only once
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

  // Fetch records when student changes
  useEffect(() => {
    if (selectedStudentId) {
      fetchAllAttendance();
    } else {
      setAllRecords([]);
      setFilteredRecords([]);
      setTotalBreakSeconds(0);
      setTotalNetSeconds(0);
    }
  }, [selectedStudentId]);

  const fetchAllAttendance = async () => {
    setLoading(true);
    try {
      const res = await API.get(`attendance/history/?student_id=${selectedStudentId}`);
      const records = res.data.results || res.data;
      const recordsArray = Array.isArray(records) ? records : [];
      setAllRecords(recordsArray);
      applyFilters(recordsArray);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (records) => {
    let filtered = [...records];

    // Weekday filter
    if (selectedWeekdays.length > 0) {
      filtered = filtered.filter(rec => {
        const day = new Date(rec.check_in).getDay();
        return selectedWeekdays.some(w => weekdayMap[w] === day);
      });
    }

    // Break category
    if (breakCategory !== 'all') {
      filtered = filtered.filter(rec => {
        const mins = rec.break_minutes || 0;
        if (breakCategory === 'none') return mins === 0;
        if (breakCategory === 'short') return mins > 0 && mins <= 30;
        if (breakCategory === 'long') return mins > 30;
        return true;
      });
    }

    // Reason keyword
    if (reasonKeyword.trim()) {
      const kw = reasonKeyword.trim().toLowerCase();
      filtered = filtered.filter(rec =>
        (rec.check_out_reason || '').toLowerCase().includes(kw)
      );
    }

    // Last N entries
    if (lastN !== 'all') {
      const limit = parseInt(lastN);
      filtered = filtered.sort((a, b) => new Date(b.check_in) - new Date(a.check_in)).slice(0, limit);
    } else {
      filtered = filtered.sort((a, b) => new Date(b.check_in) - new Date(a.check_in));
    }

    setFilteredRecords(filtered);
    const totalBreakSecs = filtered.reduce((sum, rec) => sum + ((rec.break_minutes || 0) * 60), 0);
    const totalNetSecs = filtered.reduce((sum, rec) => sum + (rec.net_work_hours ? rec.net_work_hours * 3600 : 0), 0);
    setTotalBreakSeconds(totalBreakSecs);
    setTotalNetSeconds(totalNetSecs);
  };

  // Re‑apply filters when any filter changes
  useEffect(() => {
    if (allRecords.length) applyFilters(allRecords);
  }, [selectedWeekdays, breakCategory, reasonKeyword, lastN]);

  const toggleWeekday = (day) => {
    setSelectedWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const clearAllFilters = () => {
    setSelectedWeekdays([]);
    setBreakCategory('all');
    setReasonKeyword('');
    setLastN('all');
  };

  const selectedStudent = students.find(s => s.id == selectedStudentId);
  if (studentLoading) return <div className="text-center py-8">Loading students...</div>;

  return (
    <div className="bg-white rounded-xl w-screen shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Student Attendance Monitor</h2>

      {/* Student selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="">-- Choose a student --</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{getStudentName(s)}</option>
          ))}
        </select>
      </div>

      {selectedStudentId && (
        <>
          {/* Filter bar */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">🎯 Smart filters</span>
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>

            {/* Weekdays */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">📅 Weekdays</label>
              <div className="flex flex-wrap gap-2">
                {weekdayOptions.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleWeekday(day)}
                    className={`px-3 py-1 text-sm rounded-full transition ${
                      selectedWeekdays.includes(day)
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Break, Reason, Last N */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">☕ Break length</label>
                <select
                  value={breakCategory}
                  onChange={(e) => setBreakCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="all">All breaks</option>
                  <option value="none">No break</option>
                  <option value="short">Short break (1‑30 min)</option>
                  <option value="long">Long break (&gt;30 min)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">🔍 Reason contains</label>
                <input
                  type="text"
                  placeholder="e.g., medical, early"
                  value={reasonKeyword}
                  onChange={(e) => setReasonKeyword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">📋 Show last</label>
                <select
                  value={lastN}
                  onChange={(e) => setLastN(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="all">All records</option>
                  <option value="10">Last 10 entries</option>
                  <option value="20">Last 20 entries</option>
                  <option value="50">Last 50 entries</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading && <div className="text-center py-8">Loading attendance records...</div>}
          {!loading && filteredRecords.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center text-yellow-800">
              No attendance records match the selected filters for {getStudentName(selectedStudent)}.
            </div>
          )}
          {!loading && filteredRecords.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-4 py-2">Date</th>
                      <th className="border px-4 py-2">Check In</th>
                      <th className="border px-4 py-2">Check Out</th>
                      <th className="border px-4 py-2">Break</th>
                      <th className="border px-4 py-2">Net Hours</th>
                      <th className="border px-4 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(rec => {
                      const checkIn = new Date(rec.check_in);
                      const checkOut = rec.check_out ? new Date(rec.check_out) : null;
                      const netSeconds = Math.round((rec.net_work_hours || 0) * 3600);
                      return (
                        <tr key={rec.id}>
                          <td className="border px-4 py-2">{checkIn.toLocaleDateString()}</td>
                          <td className="border px-4 py-2">{checkIn.toLocaleTimeString()}</td>
                          <td className="border px-4 py-2">{checkOut ? checkOut.toLocaleTimeString() : '—'}</td>
                          <td className="border px-4 py-2 font-mono">{formatBreak(rec.break_minutes)}</td>
                          <td className="border px-4 py-2 font-mono">{formatTime(netSeconds)}</td>
                          <td className="border px-4 py-2">{rec.check_out_reason || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg flex justify-between items-center text-sm font-medium border border-green-100">
                <span>📊 Totals for {getStudentName(selectedStudent)} (filtered results):</span>
                <div className="space-x-4">
                  <span>⏱️ Total Break: <span className="font-bold text-orange-600">{formatTime(totalBreakSeconds)}</span></span>
                  <span>⚡ Total Net Hours: <span className="font-bold text-green-700">{formatTime(totalNetSeconds)}</span></span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceMonitor;