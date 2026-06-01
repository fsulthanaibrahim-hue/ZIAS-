import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';
import StudentSidebar from '../../components/StudentSidebar';

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

const formatTimeHHMMSS = (datetimeStr) => {
  if (!datetimeStr) return '—';
  const date = new Date(datetimeStr);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const getLocalDateKey = (datetimeStr) => {
  if (!datetimeStr) return '';
  const date = new Date(datetimeStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [dayStats, setDayStats] = useState({
    firstCheckIn: null,
    lastCheckOut: null,
    totalDaySpanSec: 0,
    totalBreakSec: 0,
    netSec: 0,
    checkInCount: 0,
    breakCount: 0,
  });
  const initialFetchDone = useRef(false);

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

  // Process day records: compute day span, total break (gaps), net, and enrich each record with break before it
  const processDayRecords = (records) => {
    const dayRecords = records.filter(rec => {
      if (!rec.check_in) return false;
      return getLocalDateKey(rec.check_in) === selectedLocalDate;
    });

    if (dayRecords.length === 0) {
      return {
        processed: [],
        firstCheckIn: null,
        lastCheckOut: null,
        totalDaySpanSec: 0,
        totalBreakSec: 0,
        netSec: 0,
        checkInCount: 0,
        breakCount: 0,
      };
    }

    // Sort by check‑in time ascending
    const sorted = [...dayRecords].sort((a, b) => new Date(a.check_in) - new Date(b.check_in));

    let totalBreakSec = 0;
    let breakCount = 0;
    const enriched = [];

    for (let i = 0; i < sorted.length; i++) {
      const rec = sorted[i];
      let breakSec = 0;
      if (i > 0) {
        const prev = sorted[i - 1];
        if (prev.check_out) {
          const prevOut = new Date(prev.check_out);
          const currIn = new Date(rec.check_in);
          if (currIn > prevOut) {
            breakSec = (currIn - prevOut) / 1000;
            totalBreakSec += breakSec;
            breakCount++;
          }
        }
      }
      enriched.push({
        ...rec,
        breakSeconds: breakSec,
      });
    }

    // Day span: from first check‑in to last check‑out
    const firstCheckIn = sorted[0]?.check_in ? new Date(sorted[0].check_in) : null;
    const lastCheckOut = sorted[sorted.length - 1]?.check_out ? new Date(sorted[sorted.length - 1].check_out) : null;
    let daySpanSec = 0;
    if (firstCheckIn && lastCheckOut && lastCheckOut > firstCheckIn) {
      daySpanSec = (lastCheckOut - firstCheckIn) / 1000;
    }

    const netSec = daySpanSec - totalBreakSec;

    return {
      processed: enriched,
      firstCheckIn,
      lastCheckOut,
      totalDaySpanSec: daySpanSec,
      totalBreakSec,
      netSec,
      checkInCount: sorted.length,
      breakCount,
    };
  };

  useEffect(() => {
    const stats = processDayRecords(allRecords);
    setFilteredRecords(stats.processed);
    setDayStats({
      firstCheckIn: stats.firstCheckIn,
      lastCheckOut: stats.lastCheckOut,
      totalDaySpanSec: stats.totalDaySpanSec,
      totalBreakSec: stats.totalBreakSec,
      netSec: stats.netSec,
      checkInCount: stats.checkInCount,
      breakCount: stats.breakCount,
    });
  }, [selectedLocalDate, allRecords]);

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchAllAttendance();
  }, []);

  const handleDateChange = (e) => setSelectedLocalDate(e.target.value);

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

  const daySpanHours = dayStats.totalDaySpanSec / 3600;
  const breakHours = dayStats.totalBreakSec / 3600;
  const netHours = dayStats.netSec / 3600;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header Card – Day Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">My Attendance</h1>
                <div className="space-y-1 text-gray-600">
                  <p className="text-sm">
                    📅 Date: <span className="font-medium">{formatDateDMY(selectedLocalDate)}</span><br />
                    🕐 First check‑in: <span className="font-mono">{dayStats.firstCheckIn ? formatTimeHHMMSS(dayStats.firstCheckIn) : '—'}</span> &nbsp;|&nbsp;
                    Last check‑out: <span className="font-mono">{dayStats.lastCheckOut ? formatTimeHHMMSS(dayStats.lastCheckOut) : '—'}</span>
                  </p>
                  <p>
                    🚪 Total check‑ins: <span className="font-semibold">{dayStats.checkInCount}</span> &nbsp;|&nbsp;
                    ☕ Break periods: <span className="font-semibold">{dayStats.breakCount}</span>
                  </p>
                  <p>
                    ⏱️ Total day span (first in → last out): 
                    <span className="ml-1 font-semibold text-blue-600">{daySpanHours.toFixed(2)} hrs</span>
                    <span className="text-sm text-gray-400 ml-2">({formatDuration(daySpanHours)})</span>
                  </p>
                  <p>
                    ☕ Total break time (gaps between sessions): 
                    <span className="ml-1 font-semibold text-orange-600">{breakHours.toFixed(2)} hrs</span>
                    <span className="text-sm text-gray-400 ml-2">({formatDuration(breakHours)})</span>
                  </p>
                  <p>
                    📅 Net work hours (day span − breaks): 
                    <span className="ml-1 font-semibold text-green-600">{netHours.toFixed(2)} hrs</span>
                    <span className="text-sm text-gray-400 ml-2">({formatDuration(netHours)})</span>
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  value={selectedLocalDate}
                  onChange={handleDateChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Attendance Table – each row with break before it and session duration */}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DATE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CHECK IN</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CHECK OUT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BREAK BEFORE (min)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SESSION DURATION</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">REASON</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredRecords.map((rec, idx) => {
                      // Calculate session duration (check_out - check_in)
                      let sessionSec = 0;
                      if (rec.check_in && rec.check_out) {
                        const start = new Date(rec.check_in);
                        const end = new Date(rec.check_out);
                        if (end > start) sessionSec = (end - start) / 1000;
                      }
                      return (
                        <tr key={rec.id} className={`hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-6 py-3 text-sm text-gray-900">
                            {formatDateDMY(getLocalDateKey(rec.check_in))}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700 font-mono">{formatTimeHHMMSS(rec.check_in)}</td>
                          <td className="px-6 py-3 text-sm text-gray-700 font-mono">{formatTimeHHMMSS(rec.check_out)}</td>
                          <td className="px-6 py-3 text-sm text-gray-700">
                            {rec.breakSeconds > 0 ? `${Math.round(rec.breakSeconds / 60)} min` : '—'}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-blue-700">
                            {formatDurationFromSeconds(sessionSec)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">{rec.check_out_reason || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400 border-t">
                * “Break before” is the gap from previous check‑out to this check‑in. First record has no break.<br />
                Day span = first check‑in to last check‑out. Net work = day span − total break time.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentAttendance;