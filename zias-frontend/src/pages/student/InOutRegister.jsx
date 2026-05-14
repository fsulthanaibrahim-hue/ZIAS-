// src/pages/student/InOutRegister.jsx – fully optimized & error‑handled
import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

const InOutRegister = ({ showHistory = true }) => {
  const [activeRecord, setActiveRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [checkOutReason, setCheckOutReason] = useState('');
  const [liveTime, setLiveTime] = useState(new Date());
  const fetchedRef = useRef(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch attendance data (active record + history)
  const fetchAttendanceData = async () => {
    try {
      const res = await API.get('attendance/history/');
      let records = Array.isArray(res.data) ? res.data : (res.data.results || []);
      records.sort((a, b) => new Date(b.check_in) - new Date(a.check_in));
      const openRecord = records.find(r => r.check_out === null);
      setActiveRecord(openRecord || null);
      if (showHistory) setHistory(records);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch only once on mount
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAttendanceData();
  }, []);

  // Refresh after check‑in/out
  const refreshData = async () => {
    setLoading(true);
    await fetchAttendanceData();
  };

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      await API.post('attendance/check-in/');
      toast.success('Checked in successfully');
      await refreshData();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Check-in failed';
      toast.error(msg);
      console.error(err.response?.data);
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOutSubmit = async () => {
    setChecking(true);
    try {
      // Force integer, default 0
      const minutes = parseInt(breakMinutes, 10) || 0;
      const payload = {
        break_minutes: minutes,
        check_out_reason: checkOutReason || ''
      };
      console.log('Check-out payload:', payload);

      // Use PUT (the view supports both, but PUT is standard for full update)
      await API.put('attendance/check-out/', payload);
      toast.success('Checked out successfully');
      setShowCheckOutModal(false);
      setBreakMinutes(0);
      setCheckOutReason('');
      await refreshData();
    } catch (err) {
      console.error('Check-out error details:', err.response?.data);
      let errorMsg = 'Check-out failed';
      if (err.response?.data) {
        // DRF often returns { "break_minutes": ["Enter a whole number."] } etc.
        const data = err.response.data;
        if (typeof data === 'object') {
          errorMsg = Object.values(data).flat().join(', ');
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.message) {
          errorMsg = data.message;
        }
      }
      toast.error(errorMsg);
    } finally {
      setChecking(false);
    }
  };

  const isCheckedIn = activeRecord !== null;

  if (loading) return <div className="text-center py-4">Loading attendance...</div>;
  if (!localStorage.getItem('access_token')) return <div className="text-center py-4 text-red-500">Please log in again.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">In/Out Register</h2>
      <div className="flex flex-col items-center space-y-4">
        <div className="text-5xl font-bold text-gray-700">{liveTime.toLocaleTimeString()}</div>
        <div className="flex gap-4">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={checking}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {checking ? 'Processing...' : 'Check In'}
            </button>
          ) : (
            <button
              onClick={() => setShowCheckOutModal(true)}
              disabled={checking}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {checking ? 'Processing...' : 'Check Out'}
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {isCheckedIn ? 'You are currently checked in' : 'You are currently checked out'}
        </p>
      </div>

      {/* Check-out Modal */}
      {showCheckOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Check Out</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Total Break Time (minutes)</label>
              <input
                type="number"
                min="0"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., 30"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Reason for Check‑Out (optional)</label>
              <textarea
                value={checkOutReason}
                onChange={(e) => setCheckOutReason(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows="2"
                placeholder="Early leaving, medical, etc."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCheckOutModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckOutSubmit}
                disabled={checking}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              >
                Confirm Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      {showHistory && history.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Break (min)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Hours</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((record) => {
                  const checkIn = new Date(record.check_in);
                  const checkOut = record.check_out ? new Date(record.check_out) : null;
                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-2 text-sm">{checkIn.toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm">{checkIn.toLocaleTimeString()}</td>
                      <td className="px-4 py-2 text-sm">{checkOut ? checkOut.toLocaleTimeString() : '—'}</td>
                      <td className="px-4 py-2 text-sm">{record.break_minutes ?? 0}</td>
                      <td className="px-4 py-2 text-sm">{(record.net_work_hours || 0).toFixed(2)} hrs</td>
                      <td className="px-4 py-2 text-sm">{record.check_out_reason || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InOutRegister;