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

// Format decimal hours to "X hr Y min Z sec" (no decimals)
const formatDuration = (decimalHours) => {
  if (decimalHours === undefined || decimalHours === null) return '0 sec';
  const totalSeconds = Math.round(decimalHours * 3600);
  if (totalSeconds <= 0) return '0 sec';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} sec${seconds !== 1 ? 's' : ''}`);
  return parts.join(' ');
};

// Format seconds directly (for gross duration) – rounds to whole seconds
const formatDurationFromSeconds = (totalSeconds) => {
  const rounded = Math.round(totalSeconds);
  if (rounded <= 0) return '0 sec';
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
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
  const [totalGrossHours, setTotalGrossHours] = useState(0);
  const [totalBreakHours, setTotalBreakHours] = useState(0);
  const [totalNetHours, setTotalNetHours] = useState(0);
  const initialFetchDone = useRef(false);

  // Fetch all attendance records
  const fetchAllAttendance = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await API.get(`attendance/history/`);
      } catch (err) {
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

  // Process records for a given day: sort by check_in, compute gaps as break minutes
  const processDayRecords = (records) => {
    const dayRecords = records.filter(rec => {
      if (!rec.check_in) return false;
      return getLocalDateKey(rec.check_in) === selectedLocalDate;
    });

    if (dayRecords.length === 0) return { processed: [], grossSec: 0, breakSec: 0, netSec: 0 };

    // Sort by check_in time
    const sorted = [...dayRecords].sort((a, b) => new Date(a.check_in) - new Date(b.check_in));

    let totalGrossSec = 0;
    let totalBreakSec = 0;

    const enriched = sorted.map((rec, idx) => {
      let breakSec = 0;
      if (idx > 0) {
        const prev = sorted[idx - 1];
        if (prev.check_out) {
          const prevCheckout = new Date(prev.check_out);
          const currCheckin = new Date(rec.check_in);
          if (currCheckin > prevCheckout) {
            breakSec = (currCheckin - prevCheckout) / 1000;
            totalBreakSec += breakSec;
          }
        }
      }

      let grossSec = 0;
      if (rec.check_in && rec.check_out) {
        const start = new Date(rec.check_in);
        const end = new Date(rec.check_out);
        if (end > start) {
          grossSec = (end - start) / 1000;
          totalGrossSec += grossSec;
        }
      }

      return {
        ...rec,
        computedBreakMinutes: Math.round(breakSec / 60),
        grossDurationSec: grossSec,
      };
    });

    const netSec = totalGrossSec - totalBreakSec;
    return { processed: enriched, grossSec: totalGrossSec, breakSec: totalBreakSec, netSec };
  };

  // Recalculate whenever selected date or all records change
  useEffect(() => {
    const { processed, grossSec, breakSec, netSec } = processDayRecords(allRecords);
    setFilteredRecords(processed);
    setTotalGrossHours(grossSec / 3600);
    setTotalBreakHours(breakSec / 3600);
    setTotalNetHours(netSec / 3600);
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
                    ⏱️ Gross work time (including gaps) on <span className="font-medium">{formatDateDMY(selectedLocalDate)}</span>:
                    <span className="ml-1 font-semibold text-blue-600">{totalGrossHours.toFixed(2)} hrs</span>
                    <span className="text-sm text-gray-400 ml-2">({formatDuration(totalGrossHours)})</span>
                  </p>
                  <p className="text-gray-600">
                    ☕ Total break time (gaps between sessions) on <span className="font-medium">{formatDateDMY(selectedLocalDate)}</span>:
                    <span className="ml-1 font-semibold text-orange-600">{totalBreakHours.toFixed(2)} hrs</span>
                    <span className="text-sm text-gray-400 ml-2">({formatDuration(totalBreakHours)})</span>
                  </p>
                  <p className="text-gray-600">
                    📅 Net work hours (gross − breaks) on <span className="font-medium">{formatDateDMY(selectedLocalDate)}</span>:
                    <span className="ml-1 font-semibold text-green-600">{totalNetHours.toFixed(2)} hrs</span>
                    <span className="text-sm text-gray-400 ml-2">({formatDuration(totalNetHours)})</span>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BREAK (min) *</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GROSS DURATION</th>
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
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {rec.computedBreakMinutes > 0 ? `${rec.computedBreakMinutes} min` : '—'}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-blue-700">
                          {formatDurationFromSeconds(rec.grossDurationSec)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{rec.check_out_reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400 border-t">
                * Break minutes shown are the gap between this record's check‑in and the previous record's check‑out.
                For the first record of the day, break is 0.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentAttendance;