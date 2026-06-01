import { useState, useEffect } from "react";
import API from "../api/api";
import toast from "react-hot-toast";

function CreateAssignment({ studentId, reviewSheetUrl, course, onClose }) {
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/reviewers/").then(res => setReviewers(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReviewer) return toast.error("Select a reviewer");
    setLoading(true);
    try {
      await API.post("/review-assignments/", {
        reviewer: selectedReviewer,
        student: studentId,
        review_sheet: reviewSheetUrl,
        course: course,
        status: "pending",
      });
      toast.success("Assignment sent to reviewer");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Assign Reviewer</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium">Select Reviewer</label>
          <select
            className="w-full border rounded-lg p-2 mb-4"
            value={selectedReviewer}
            onChange={(e) => setSelectedReviewer(e.target.value)}
            required
          >
            <option value="">-- Choose --</option>
            {reviewers.map(r => (
              <option key={r.id} value={r.id}>{r.full_name || r.user.username}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg">
              {loading ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAssignment;