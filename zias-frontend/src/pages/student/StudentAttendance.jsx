// src/pages/student/StudentAttendance.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';
import StudentSidebar from '../../components/StudentSidebar';

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
const StudentAttendance = () => {
  const [selectedLocalDate, setSelectedLocalDate] = useState(getLocalDateYYYYMMDD);
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalWorkHours, setTotalWorkHours] = useState(0);
  const [totalBreakHours, setTotalBreakHours] = useState(0);
  const initialFetchDone = useRef(false);

  // Fetch all attendance records (client-side filtering avoids timezone issues)
  const fetchAllAttendance = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await API.get(`attendance/history/`);
      } catch (err) {
        // Fallback: last 90 days
        const endDate = new Date().toISOString().slice(0, 10);
        const startDate = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
        res = await API.get(`attendance/history/?start_date=${startDate}&end_date=${endDate}`);
      }
      let data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      data.sort((a, b) => new Date(b.check_in) - new Date(a.check_in));
      setAllRecords(data);
    } catch (err) {
      toast.error('Failed to load attendance records');
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

    // Total work hours (all records)
    const workTotal = filtered.reduce((sum, rec) => sum + (rec.net_work_hours || 0), 0);
    setTotalWorkHours(workTotal);

    // Total break hours: sum net_work_hours where reason contains "Break"
    const breakTotal = filtered
      .filter(rec => rec.check_out_reason && rec.check_out_reason.toLowerCase().includes('break'))
      .reduce((sum, rec) => sum + (rec.net_work_hours || 0), 0);
    setTotalBreakHours(breakTotal);
  }, [selectedLocalDate, allRecords]);

  // Fetch once on mount
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchAllAttendance();
  }, []);

  const handleDateChange = (e) => {
    setSelectedLocalDate(e.target.value);
  };

  if (loading && allRecords.length === 0) {
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
        <div className="max-w-6xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-600">
                    📅 Net work hours on <span className="font-medium">{formatDateDMY(selectedLocalDate)}</span>:
                    <span className="ml-1 font-semibold text-green-600">{totalWorkHours.toFixed(2)} hrs</span>
                    <span className="text-sm text-gray-400 ml-2">({formatDuration(totalWorkHours)})</span>
                  </p>
                  <p className="text-gray-600">
                    ☕ Total break hours on <span className="font-medium">{formatDateDMY(selectedLocalDate)}</span>:
                    <span className="ml-1 font-semibold text-orange-600">{totalBreakHours.toFixed(2)} hrs</span>
                    <span className="text-sm text-gray-400 ml-2">({formatDuration(totalBreakHours)})</span>
                  </p>
                </div>
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

          {/* Attendance Table */}
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
              No attendance record for {formatDateDMY(selectedLocalDate)}.
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
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {formatDateDMY(getLocalDateKey(rec.check_in))}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 font-mono">{formatTimeHHMMSS(rec.check_in)}</td>
                        <td className="px-6 py-3 text-sm text-gray-700 font-mono">{formatTimeHHMMSS(rec.check_out)}</td>
                        <td className="px-6 py-3 text-sm font-medium text-green-700">
                          {formatDuration(rec.net_work_hours)}
                        </td>
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
};

export default StudentAttendance;