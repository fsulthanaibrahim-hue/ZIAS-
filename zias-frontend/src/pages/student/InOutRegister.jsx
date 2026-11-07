
import React, { useState, useEffect, useRef } from 'react';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

const InOutRegister = ({ showHistory = true }) => {
  const [activeRecord, setActiveRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [checkOutReason, setCheckOutReason] = useState('');
  const [liveTime, setLiveTime] = useState(new Date());

  const fetchedRef = useRef(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      const res = await API.get('attendance/history/');

      const records = Array.isArray(res.data)
        ? res.data
        : (res.data.results || []);

      records.sort(
        (a, b) => new Date(b.check_in) - new Date(a.check_in)
      );

      const openRecord = records.find(
        (record) => !record.check_out
      );

      setActiveRecord(openRecord || null);

      if (showHistory) {
        setHistory(records);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance data only once on mount
  useEffect(() => {
    if (fetchedRef.current) return;

    fetchedRef.current = true;
    fetchAttendanceData();
  }, []);

  // Refresh attendance data
  const refreshData = async () => {
    setLoading(true);
    await fetchAttendanceData();
  };

  // Check In
  const handleCheckIn = async () => {
    setChecking(true);

    try {
      await API.post('attendance/check-in/');

      toast.success('Checked in successfully');

      await refreshData();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Check-in failed';

      toast.error(msg);
      console.error('Check-in error:', err.response?.data);
    } finally {
      setChecking(false);
    }
  };

  // Open Check-out Form
  const handleOpenCheckOut = () => {
    setCheckOutReason('');
    setShowCheckOutModal(true);
  };

  // Cancel Check-out
  const handleCancelCheckOut = () => {
    if (checking) return;

    setShowCheckOutModal(false);
    setCheckOutReason('');
  };

  // Check Out
  const handleCheckOutSubmit = async () => {
    setChecking(true);

    try {
      const payload = {
        break_minutes: 0,
        check_out_reason: checkOutReason.trim()
      };

      console.log('Check-out payload:', payload);

      await API.put('attendance/check-out/', payload);

      toast.success('Checked out successfully');

      setShowCheckOutModal(false);
      setCheckOutReason('');

      await refreshData();
    } catch (err) {
      console.error('Check-out error:', err.response?.data);

      const data = err.response?.data;

      let errorMsg = 'Check-out failed';

      if (data) {
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.detail || data.message) {
          errorMsg = data.detail || data.message;
        } else {
          errorMsg = Object.values(data)
            .flat()
            .join(', ');
        }
      }

      toast.error(errorMsg);
    } finally {
      setChecking(false);
    }
  };

  const isCheckedIn = activeRecord !== null;

  if (loading) {
    return (
      <div className="py-4 text-center">
        Loading attendance...
      </div>
    );
  }

  if (!localStorage.getItem('access_token')) {
    return (
      <div className="py-4 text-center text-red-500">
        Please log in again.
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">

      {/* Heading */}
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        In/Out Register
      </h2>

      {/* Live Clock and Attendance Buttons */}
      <div className="flex flex-col items-center space-y-4">

        <div className="text-5xl font-bold text-gray-700">
          {liveTime.toLocaleTimeString()}
        </div>

        <div className="flex gap-4">

          {!isCheckedIn ? (
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={checking}
              className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? 'Processing...' : 'Check In'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCheckOut}
              disabled={checking || showCheckOutModal}
              className="rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check Out
            </button>
          )}

        </div>

        <p className="text-sm text-gray-500">
          {isCheckedIn
            ? 'You are currently checked in'
            : 'You are currently checked out'}
        </p>

      </div>

      {/* Inline Check-out Form */}
      {showCheckOutModal && (
        <div className="mt-6 w-full rounded-lg border border-gray-200 bg-white p-4">

          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            Check Out
          </h3>

          <div className="mb-4">

            <label
              htmlFor="checkout-reason"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Reason for Check-Out
              <span className="font-normal text-gray-400">
                {' '}(optional)
              </span>
            </label>

            <textarea
              id="checkout-reason"
              value={checkOutReason}
              onChange={(e) => setCheckOutReason(e.target.value)}
              rows={2}
              placeholder="e.g., Early leaving, medical appointment"
              autoComplete="off"
              spellCheck="false"
              disabled={checking}
              className="block w-full resize-y rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
            />

          </div>

          <div className="flex flex-wrap justify-end gap-2">

            <button
              type="button"
              onClick={handleCancelCheckOut}
              disabled={checking}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCheckOutSubmit}
              disabled={checking}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? 'Processing...' : 'Confirm Check Out'}
            </button>

          </div>

        </div>
      )}

      {/* Attendance History */}
      {showHistory && history.length > 0 && (
        <div className="mt-6">

          <h3 className="mb-2 text-lg font-medium text-gray-700">
            Recent Activity
          </h3>

          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-gray-200">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Date
                  </th>

                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Check In
                  </th>

                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Check Out
                  </th>

                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Break (min)
                  </th>

                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Net Hours
                  </th>

                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Reason
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {history.map((record) => {
                  const checkIn = new Date(record.check_in);

                  const checkOut = record.check_out
                    ? new Date(record.check_out)
                    : null;

                  return (
                    <tr key={record.id}>

                      <td className="px-4 py-2 text-sm text-gray-700">
                        {checkIn.toLocaleDateString()}
                      </td>

                      <td className="px-4 py-2 text-sm text-gray-700">
                        {checkIn.toLocaleTimeString()}
                      </td>

                      <td className="px-4 py-2 text-sm text-gray-700">
                        {checkOut
                          ? checkOut.toLocaleTimeString()
                          : '—'}
                      </td>

                      <td className="px-4 py-2 text-sm text-gray-700">
                        {record.break_minutes ?? 0}
                      </td>

                      <td className="px-4 py-2 text-sm text-gray-700">
                        {(Number(record.net_work_hours) || 0).toFixed(2)} hrs
                      </td>

                      <td className="px-4 py-2 text-sm text-gray-700">
                        {record.check_out_reason || '—'}
                      </td>

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
