import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import API from '../api/api';
import Sidebar from '../components/Sidebar';

// ---------- Helper functions ----------
const getLocalDateYYYYMMDD = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const formatTime12Hour = (datetimeStr) => {
  if (!datetimeStr) return '—';
  const date = new Date(datetimeStr);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes}:${seconds} ${ampm}`;
};

const getLocalDateKey = (datetimeStr) => {
  if (!datetimeStr) return '';
  const date = new Date(datetimeStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateHoursBetween = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  let diffMs = endDate - startDate;
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }
  return diffMs / (1000 * 60 * 60);
};

const formatDuration = (hours) => {
  if (hours === undefined || hours === null || hours === 0) return '0 sec';
  const totalSeconds = Math.abs(Math.round(hours * 3600));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const parts = [];
  if (hrs > 0) parts.push(`${hrs} hr${hrs !== 1 ? 's' : ''}`);
  if (mins > 0) parts.push(`${mins} min${mins !== 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} sec${secs !== 1 ? 's' : ''}`);
  return parts.join(' ');
};

const formatHoursDecimal = (hours) => {
  if (hours === undefined || hours === null) return '0';
  return hours.toFixed(2);
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
  const [stats, setStats] = useState({
    firstCheckIn: null,
    lastCheckOut: null,
    totalCheckIns: 0,
    breakPeriods: 0,
    totalDaySpan: 0,
    totalBreakTime: 0,
    netWorkHours: 0
  });
  const studentsFetched = useRef(false);
  const lastFetchStudentRef = useRef(null);

  const getStudentName = (student) => {
    if (!student) return '';
    return student.name || student.full_name || student.username || `Student ${student.id}`;
  };

  useEffect(() => {
    if (studentsFetched.current) return;
    studentsFetched.current = true;
    API.get('students/list/')
      .then(res => setStudents(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setStudentLoading(false));
  }, []);

  const fetchAllAttendance = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await API.get(`attendance/history/?student_id=${studentId}`);
      let data = res.data.results || res.data;
      if (!Array.isArray(data)) data = [];
      
      // Process records
      const processedData = data.map(record => ({
        ...record,
        net_work_hours: calculateHoursBetween(record.check_in, record.check_out)
      }));
      
      processedData.sort((a, b) => new Date(a.check_in) - new Date(b.check_in));
      setAllRecords(processedData);
    } catch (err) {
      console.warn('Error fetching attendance:', err);
      setAllRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== lastFetchStudentRef.current) {
      lastFetchStudentRef.current = selectedStudentId;
      fetchAllAttendance(selectedStudentId);
    } else if (!selectedStudentId) {
      setAllRecords([]);
      setFilteredRecords([]);
    }
  }, [selectedStudentId]);

  // Calculate statistics for the selected date
  useEffect(() => {
    // Filter records for the selected date
    const filtered = allRecords.filter(rec => {
      if (!rec.check_in) return false;
      const recordDate = getLocalDateKey(rec.check_in);
      return recordDate === selectedDate;
    });
    setFilteredRecords(filtered);

    if (filtered.length === 0) {
      setStats({
        firstCheckIn: null,
        lastCheckOut: null,
        totalCheckIns: 0,
        breakPeriods: 0,
        totalDaySpan: 0,
        totalBreakTime: 0,
        netWorkHours: 0
      });
      return;
    }

    // Sort by check_in time
    const sortedByCheckIn = [...filtered].sort((a, b) => 
      new Date(a.check_in) - new Date(b.check_in)
    );
    
    const firstCheckIn = sortedByCheckIn[0].check_in;
    const lastCheckOut = sortedByCheckIn[sortedByCheckIn.length - 1].check_out;
    const totalCheckIns = filtered.length;
    
    // Calculate total day span (first check-in to last check-out)
    const daySpan = calculateHoursBetween(firstCheckIn, lastCheckOut);
    
    // Calculate break time (gaps between sessions)
    let totalBreakTime = 0;
    let breakCount = 0;
    
    for (let i = 0; i < sortedByCheckIn.length - 1; i++) {
      const currentCheckOut = sortedByCheckIn[i].check_out;
      const nextCheckIn = sortedByCheckIn[i + 1].check_in;
      
      if (currentCheckOut && nextCheckIn) {
        const gap = calculateHoursBetween(currentCheckOut, nextCheckIn);
        if (gap > 0) {
          totalBreakTime += gap;
          breakCount++;
        }
      }
    }
    
    // Net work hours = day span - break time
    const netWorkHours = daySpan - totalBreakTime;
    
    setStats({
      firstCheckIn,
      lastCheckOut,
      totalCheckIns,
      breakPeriods: breakCount,
      totalDaySpan: daySpan,
      totalBreakTime,
      netWorkHours
    });
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
    <div className="flex min-h-screen w-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
            <p className="text-gray-500 text-sm mt-1">View your attendance records and work hours</p>
          </div>

          {/* Student and Date Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Choose a student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{getStudentName(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

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
            <>
              {/* Stats Cards - Same as Student Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Left Column - Date Info */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Date</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{formatDateDMY(selectedDate)}</p>
                  <p className="text-xs text-gray-400 mt-2">Selected date</p>
                </div>

                {/* Right Column - Check-in/out Info */}
                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border border-green-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Timings</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium text-gray-600">First check-in:</span>{' '}
                    <span className="text-gray-800">{stats.firstCheckIn ? formatTime12Hour(stats.firstCheckIn) : '—'}</span>
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-medium text-gray-600">Last check-out:</span>{' '}
                    <span className="text-gray-800">{stats.lastCheckOut ? formatTime12Hour(stats.lastCheckOut) : '—'}</span>
                  </p>
                  <div className="mt-3 pt-2 border-t border-green-100">
                    <p className="text-xs text-gray-500">
                      🚪 Total check-ins: {stats.totalCheckIns} | ☕ Break periods: {stats.breakPeriods}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">⏱️ Total day span</p>
                  <p className="text-xl font-bold text-blue-700">{formatHoursDecimal(stats.totalDaySpan)} hrs</p>
                  <p className="text-xs text-gray-400">{formatDuration(stats.totalDaySpan)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-orange-100 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">☕ Total break time</p>
                  <p className="text-xl font-bold text-orange-700">{formatHoursDecimal(stats.totalBreakTime)} hrs</p>
                  <p className="text-xs text-gray-400">{formatDuration(stats.totalBreakTime)}</p>
                  <p className="text-xs text-orange-600 mt-1">Gaps between sessions</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">📅 Net work hours</p>
                  <p className="text-xl font-bold text-green-700">{formatHoursDecimal(stats.netWorkHours)} hrs</p>
                  <p className="text-xs text-gray-400">{formatDuration(stats.netWorkHours)}</p>
                </div>
              </div>

              {/* Sessions Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-base font-semibold text-gray-800">Sessions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CHECK IN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CHECK OUT</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SESSION DURATION</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REASON</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredRecords.map((rec, idx) => {
                        const hours = rec.net_work_hours || 0;
                        const isOvernight = (() => {
                          if (!rec.check_in || !rec.check_out) return false;
                          const checkIn = new Date(rec.check_in);
                          const checkOut = new Date(rec.check_out);
                          return checkOut < checkIn;
                        })();
                        
                        return (
                          <tr key={rec.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-6 py-3 text-sm text-gray-900">
                              {formatDateDMY(getLocalDateKey(rec.check_in))}
                              {isOvernight && <span className="ml-1 text-xs text-blue-500">(next day)</span>}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-700">{formatTime12Hour(rec.check_in)}</td>
                            <td className="px-6 py-3 text-sm text-gray-700">{formatTime12Hour(rec.check_out)}</td>
                            <td className="px-6 py-3 text-sm font-medium text-green-700">{formatDuration(hours)}</td>
                            <td className="px-6 py-3 text-sm text-gray-500">{rec.check_out_reason || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminAttendance;