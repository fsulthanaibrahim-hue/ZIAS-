// src/components/CreateAssignmentModal.jsx
import { useState, useEffect } from "react";
import API from "../api/api";

function CreateAssignmentModal({ isOpen, onClose, onCreated }) {
  const [students, setStudents] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    reviewer_id: "",
    course: "",
    review_sheet: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      fetchReviewers();
      fetchCourses();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students/");
      let data = res.data.results || res.data;
      if (!Array.isArray(data)) data = [];
      setStudents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviewers = async () => {
    try {
      const res = await API.get("/reviewers/");
      let data = res.data.results || res.data;
      if (!Array.isArray(data)) data = [];
      setReviewers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await API.get("/courses/");
      let data = res.data.results || res.data;
      if (!Array.isArray(data)) data = [];
      setCourses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/review-assignments/", {
        student: formData.student_id,
        reviewer: formData.reviewer_id,   // ✅ key must be 'reviewer'
        course: formData.course,
        review_sheet: formData.review_sheet,
      });
      alert("Assignment created successfully");
      onCreated();   // refresh parent list
      onClose();
      setFormData({ student_id: "", reviewer_id: "", course: "", review_sheet: "" });
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Create Review Assignment</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Student *</label>
            <select name="student_id" value={formData.student_id} onChange={handleChange} required className="mt-1 w-full border rounded px-3 py-2">
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name || s.user?.username || s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reviewer *</label>
            <select name="reviewer_id" value={formData.reviewer_id} onChange={handleChange} required className="mt-1 w-full border rounded px-3 py-2">
              <option value="">Select Reviewer</option>
              {reviewers.map(r => (
                <option key={r.id} value={r.id}>{r.full_name || r.user?.username || r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Course *</label>
            <select name="course" value={formData.course} onChange={handleChange} required className="mt-1 w-full border rounded px-3 py-2">
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Review Sheet URL</label>
            <input type="url" name="review_sheet" value={formData.review_sheet} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" placeholder="https://..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">Create</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAssignmentModal;