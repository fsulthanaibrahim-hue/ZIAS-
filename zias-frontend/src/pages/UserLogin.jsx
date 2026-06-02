// UserLogin.jsx - Updated version with correct role order

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import { clearAuthStorage, saveAuthSession } from "../utils/authStorage";

function UserLogin() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedLoginId = loginId.trim();
    try {
      clearAuthStorage();
      const response = await API.post("/login/", {
        email: trimmedLoginId,
        username: trimmedLoginId,
        login: trimmedLoginId,
        password: password,
      });
      const { access, refresh, user } = response.data;

      // Debug logging to see what role is returned
      console.log("User object from backend:", user);
      console.log("User role:", user.role);
      console.log("is_admin:", user.is_admin);
      console.log("is_accounts:", user.is_accounts);
      console.log("is_student:", user.is_student);
      console.log("is_mentor:", user.is_mentor);
      console.log("is_reviewer:", user.is_reviewer);

      saveAuthSession({ access, refresh, user });

      // IMPORTANT: Check accounts BEFORE student
      // The order matters! Put accounts before student
      if (user.is_admin) {
        navigate("/admin/dashboard");
      } 
      else if (user.is_accounts) {  // ← MOVED UP - Check accounts BEFORE student
        navigate("/accounts/dashboard");
      }
      else if (user.is_mentor) {
        navigate("/mentor/dashboard");
      } 
      else if (user.is_reviewer) {
        navigate("/reviewer/dashboard");
      }
      else if (user.is_student) {  // ← Student checked AFTER accounts
        navigate("/student/dashboard");
      } 
      else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Login response:", err.response?.data);
      let errorMsg = "Unable to connect to the server. Please try again later.";
      if (err.response) {
        const { status, data } = err.response;
        if (status === 401) errorMsg = data?.error || "Invalid email or password";
        else if (status === 400) errorMsg = data?.error || data?.message || "Missing email or password";
        else if (status === 500) {
          const serverMsg = data?.error || data?.message || data?.detail || JSON.stringify(data);
          errorMsg = serverMsg ? `Server error: ${serverMsg}` : "Server error (500). Check backend logs.";
        }
      } else if (err.request) {
        errorMsg = "No response from server. Is backend running?";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const EyeOpen = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const EyeClosed = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 border border-green-200 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#16a34a" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in with your email or username</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1.5">Email or username</label>
              <input
                type="text"
                placeholder="you@example.com or username"
                className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 focus:outline-none rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 text-sm transition-colors"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500/30 focus:outline-none rounded-lg px-4 py-2.5 pr-11 text-gray-800 placeholder-gray-400 text-sm transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOpen /> : <EyeClosed />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-green-600 hover:text-green-700 transition-colors">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserLogin;
