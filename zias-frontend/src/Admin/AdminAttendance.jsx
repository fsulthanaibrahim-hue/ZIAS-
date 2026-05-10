// src/Admin/AdminAttendance.jsx – prevents duplicate API calls
import React, { useState, useEffect, useRef } from 'react';
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

  // Prevent duplicate students fetch
  const studentsFetched = useRef(false);

  const getStudentName = (student) => {
    if (!student) return '';
    return student.name || student.full_name || student.username || `Student ${student.id}`;
  };

  const getInitials = (name) =>
    (name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  useEffect(() => {
    if (studentsFetched.current) return;
    studentsFetched.current = true;
    API.get('students/list/')
      .then(res => setStudents(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setStudentLoading(false));
  }, []);

  // Use a ref to prevent duplicate attendance fetches for the same params
  const lastFetchRef = useRef({ studentId: null, date: null });

  const fetchAttendanceForDate = async () => {
    if (!selectedStudentId || !selectedDate) return;
    // Prevent duplicate fetch for same student+date
    if (lastFetchRef.current.studentId === selectedStudentId && lastFetchRef.current.date === selectedDate) {
      return;
    }
    lastFetchRef.current = { studentId: selectedStudentId, date: selectedDate };
    setLoading(true);
    try {
      const res = await API.get(`attendance/history/?student_id=${selectedStudentId}&date=${selectedDate}`);
      const records = res.data.results || res.data;
      setAttendance(records.length ? records[0] : null);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceForDate();
  }, [selectedStudentId, selectedDate]);

  const selectedStudent = students.find(s => s.id == selectedStudentId);

  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const formatDate = (d) => new Date(d).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const inputCls =
    "w-full bg-white border border-green-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm transition-all";

  if (studentLoading) {
    return (
      <div className="flex min-h-screen" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center bg-green-50 gap-3">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-green-600 text-xs tracking-widest uppercase">Loading students…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen bg-green-50/40" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Top Banner */}
        <div className="bg-white border-b border-green-100 px-8 py-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-[10px] tracking-[0.2em] uppercase text-green-400 mb-1.5 font-medium">
              Admin Panel
            </p>
            <h1
              className="text-2xl text-gray-800 leading-tight"
              style={{ fontFamily: '"DM Serif Display", serif' }}
            >
              Attendance Monitoring
            </h1>
            <p className="text-gray-400 text-xs mt-1 font-light">
              Review daily check-in and check-out records
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
          {/* Filter Card */}
          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-sm">
            <div className="h-1 bg-gradient-to-r from-green-500 to-green-300" />
            <div className="p-6">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-green-600 mb-4">
                Filter Records
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                    Student
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <select
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full bg-white border border-green-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all appearance-none"
                    >
                      <option value="">Select a student…</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{getStudentName(s)}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                    Date
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full bg-white border border-green-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Area */}
          {!selectedStudentId ? (
            <div className="bg-white rounded-2xl border border-green-100 py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">Select a student to view attendance</p>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-2xl border border-green-100 py-20 flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-green-600 text-xs tracking-widest uppercase">Fetching record…</p>
            </div>
          ) : attendance ? (
            <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-sm">
              <div className="h-1 bg-gradient-to-r from-green-500 to-green-300" />
              <div className="px-6 py-5 border-b border-green-50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                  {getInitials(getStudentName(selectedStudent))}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 text-base">{getStudentName(selectedStudent)}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(selectedDate)}</p>
                </div>
                <span className="ml-auto text-[11px] bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full font-medium">
                  Present
                </span>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50/60 rounded-xl p-4 border border-green-100/60">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-green-400 font-medium">Check In</p>
                  </div>
                  <p className="text-gray-800 font-semibold text-lg leading-tight">{formatTime(attendance.check_in)}</p>
                </div>
                <div className="bg-green-50/60 rounded-xl p-4 border border-green-100/60">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-green-400 font-medium">Check Out</p>
                  </div>
                  <p className="text-gray-800 font-semibold text-lg leading-tight">{formatTime(attendance.check_out)}</p>
                </div>
                <div className="bg-green-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-white/70 font-medium">Net Hours</p>
                  </div>
                  <p className="text-white font-semibold text-lg leading-tight">
                    {attendance.net_work_hours?.toFixed(2) || '0.00'}
                    <span className="text-sm font-normal text-white/70 ml-1">hrs</span>
                  </p>
                </div>
                <div className="bg-green-50/60 rounded-xl p-4 border border-green-100/60">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-green-400 font-medium">Status</p>
                  </div>
                  <p className="text-gray-800 font-semibold text-base leading-tight">Present</p>
                </div>
              </div>
              {attendance.check_out_reason && (
                <div className="px-6 pb-6">
                  <div className="bg-green-50/60 rounded-xl p-4 border border-green-100/60">
                    <p className="text-[10px] uppercase tracking-widest text-green-400 mb-1.5 font-medium">Check-out Reason</p>
                    <p className="text-gray-700 text-sm">{attendance.check_out_reason}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
              <div className="h-1 bg-gradient-to-r from-orange-400 to-amber-300" />
              <div className="p-8 flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-orange-400 mb-1 font-medium">No Record</p>
                  <h3 className="text-gray-800 font-semibold text-base">Absent or Not Recorded</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    No attendance found for{' '}
                    <span className="text-gray-600 font-medium">{getStudentName(selectedStudent)}</span>
                    {' '}on{' '}
                    <span className="text-gray-600 font-medium">{formatDate(selectedDate)}</span>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminAttendance;