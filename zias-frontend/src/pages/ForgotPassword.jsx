import { useState } from "react";
import axios from "axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/request-password-reset/", { email });
      setMessage(res.data.detail);
    } catch (err) {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1623] flex items-center justify-center p-4">
      <div className="bg-[#1a2538] rounded-xl p-6 w-full max-w-md border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">Forgot Password?</h2>
        <p className="text-white/60 mb-4">Enter your email and we'll send you a reset link.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#0f1623] border border-white/10 rounded-lg px-4 py-2 text-white mb-4"
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">Send Reset Link</button>
        </form>
        {message && <p className="mt-4 text-green-400">{message}</p>}
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    </div>
  );
}

export default ForgotPassword;