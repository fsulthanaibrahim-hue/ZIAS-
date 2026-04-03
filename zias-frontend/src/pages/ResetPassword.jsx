import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/reset-password/${token}/`, {
        new_password: password
      });
      setMessage(res.data.detail);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1623] flex items-center justify-center p-4">
      <div className="bg-[#1a2538] rounded-xl p-6 w-full max-w-md border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-3"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-4"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
          >
            Reset Password
          </button>
        </form>
        {message && <p className="mt-4 text-green-400">{message}</p>}
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    </div>
  );
}

export default ResetPassword;   // ← Make sure this line exists