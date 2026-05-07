// src/pages/mentor/AttendanceMonitor.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API from '../../api/api';

const AttendanceMonitor = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(true);

  // Helper: Get student display name
  const getStudentName = (student) => {
    if (!student) return 'Unknown';
    return student.full_name || student.name || student.username || `Student ${student.id}`;
  };

  // Helper: Format YYYY-MM-DD to a readable date (DD/MM/YYYY)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Fetch students assigned to this mentor
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await API.get('students/list/');
        const studentsData = Array.isArray(res.data) ? res.data : [];
        setStudents(studentsData);
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

  // Fetch attendance when student or date changes
  useEffect(() => {
    if (selectedStudentId && selectedDate) {
      fetchAttendanceForDate();
    } else {
      setAttendance(null);
    }
  }, [selectedStudentId, selectedDate]);

  const fetchAttendanceForDate = async () => {
    setLoading(true);
    try {
      const res = await API.get(`attendance/history/?student_id=${selectedStudentId}&date=${selectedDate}`);
      const records = res.data.results || res.data;
      setAttendance(records.length ? records[0] : null);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id == selectedStudentId);

  if (studentLoading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Student Attendance Monitor</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
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
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
      </div>

      {selectedStudentId && (
        <>
          {loading && <div className="text-center py-8">Loading attendance...</div>}
          {!loading && attendance ? (
            <div className="bg-gray-50 rounded-xl p-5 border">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {getStudentName(selectedStudent)} – {formatDate(selectedDate)}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Check In:</span> {new Date(attendance.check_in).toLocaleTimeString()}</div>
                <div><span className="text-gray-500">Check Out:</span> {attendance.check_out ? new Date(attendance.check_out).toLocaleTimeString() : '—'}</div>
                <div><span className="text-gray-500">Break (min):</span> {attendance.break_minutes ?? 0}</div>
                <div><span className="text-gray-500">Net Hours:</span> <span className="font-semibold text-green-700">{attendance.net_work_hours?.toFixed(2) || 0} hrs</span></div>
                <div className="col-span-2"><span className="text-gray-500">Reason:</span> {attendance.check_out_reason || '—'}</div>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center text-yellow-800">
                No attendance record for {getStudentName(selectedStudent)} on {formatDate(selectedDate)}.
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceMonitor;