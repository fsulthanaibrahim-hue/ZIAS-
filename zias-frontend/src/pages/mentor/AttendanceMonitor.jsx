// src/pages/mentor/AttendanceMonitor.jsx (updated)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api';
import { toast } from 'react-hot-toast';

const AttendanceMonitor = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentListLoading, setStudentListLoading] = useState(true);

  useEffect(() => {
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
        setStudentListLoading(false);
      }
    };
    fetchStudents();
  }, [navigate]);

  const fetchAllAttendance = async () => {
    setLoading(true);
    try {
      const res = await API.get('attendance/history/');
      const records = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setAllRecords(records);
      setFilteredRecords(records);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAttendance();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      setFilteredRecords(allRecords.filter(rec => rec.student == selectedStudentId));
    } else {
      setFilteredRecords(allRecords);
    }
  }, [selectedStudentId, allRecords]);

  if (studentListLoading || loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Student Attendance Monitor</h2>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Student</label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="">-- All Students --</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      {filteredRecords.length === 0 ? (
        <div className="text-center text-gray-500 py-4">No records found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-4 py-2">Student</th>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Check In</th>
                <th className="border px-4 py-2">Check Out</th>
                <th className="border px-4 py-2">Break (min)</th>
                <th className="border px-4 py-2">Net Hours</th>
                <th className="border px-4 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(rec => {
                const studentName = students.find(s => s.id == rec.student)?.name || `ID ${rec.student}`;
                const ci = new Date(rec.check_in);
                const co = rec.check_out ? new Date(rec.check_out) : null;
                const netHours = rec.net_work_hours || 0;
                return (
                  <tr key={rec.id}>
                    <td className="border px-4 py-2">{studentName}</td>
                    <td className="border px-4 py-2">{ci.toLocaleDateString()}</td>
                    <td className="border px-4 py-2">{ci.toLocaleTimeString()}</td>
                    <td className="border px-4 py-2">{co ? co.toLocaleTimeString() : '—'}</td>
                    <td className="border px-4 py-2">{rec.break_minutes || 0}</td>
                    <td className="border px-4 py-2">{netHours} hrs</td>
                    <td className="border px-4 py-2">{rec.check_out_reason || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceMonitor;