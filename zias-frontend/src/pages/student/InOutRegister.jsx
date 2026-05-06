// src/pages/student/InOutRegister.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

const InOutRegister = () => {
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [checkOutReason, setCheckOutReason] = useState('');
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayStatus();
    fetchHistory();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const res = await API.get('attendance/history/');
      let records = Array.isArray(res.data) ? res.data : (res.data.results || []);
      const today = new Date().toLocaleDateString();
      const todayRecordObj = records.find(r => new Date(r.check_in).toLocaleDateString() === today);
      setTodayRecord(todayRecordObj || null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await API.get('attendance/history/');
      let records = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setHistory(records);
    } catch (err) {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      await API.post('attendance/check-in/');
      toast.success('Checked in successfully');
      fetchTodayStatus();
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Check-in failed');
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOutSubmit = async () => {
    setChecking(true);
    try {
      await API.patch('attendance/check-out/', {
        break_minutes: breakMinutes,
        check_out_reason: checkOutReason
      });
      toast.success('Checked out successfully');
      setShowCheckOutModal(false);
      setBreakMinutes(0);
      setCheckOutReason('');
      fetchTodayStatus();
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Check-out failed');
    } finally {
      setChecking(false);
    }
  };

  const isCheckedIn = todayRecord && !todayRecord.check_out;

  if (loading) return <div className="text-center py-4">Loading attendance...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">In/Out Register</h2>
      <div className="flex flex-col items-center space-y-4">
        <div className="text-5xl font-bold text-gray-700">
          {liveTime.toLocaleTimeString()}
        </div>
        <div className="flex gap-4">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={checking}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {checking ? 'Processing...' : 'Check In'}
            </button>
          ) : (
            <button
              onClick={() => setShowCheckOutModal(true)}
              disabled={checking}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {checking ? 'Processing...' : 'Check Out'}
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {isCheckedIn ? 'You are currently checked in' : 'You are currently checked out'}
        </p>
      </div>

      {/* Check‑out Modal */}
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
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
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
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Confirm Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Table – includes net work hours and reason */}
      {history.length > 0 && (
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
                {history.map(record => {
                  const checkIn = new Date(record.check_in);
                  const checkOut = record.check_out ? new Date(record.check_out) : null;
                  const breakMin = record.break_minutes || 0;
                  const netHours = record.net_work_hours || 0;
                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-2 text-sm">{checkIn.toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm">{checkIn.toLocaleTimeString()}</td>
                      <td className="px-4 py-2 text-sm">{checkOut ? checkOut.toLocaleTimeString() : '—'}</td>
                      <td className="px-4 py-2 text-sm">{breakMin}</td>
                      <td className="px-4 py-2 text-sm">{netHours} hrs</td>
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