import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { clearAuthStorage, saveAuthSession } from "../utils/authStorage";

function UserLogin() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedLoginId = loginId.trim();
    try {
      clearAuthStorage();
      
      const user = await login(trimmedLoginId, password);

      console.log("===== LOGIN SUCCESS =====");
      console.log("User object:", user);
      console.log("user.role:", user.role);
      console.log("user.is_accounts:", user.is_accounts);
      console.log("user.is_student:", user.is_student);
      console.log("user.is_admin:", user.is_admin);
      console.log("user.is_mentor:", user.is_mentor);
      console.log("user.is_reviewer:", user.is_reviewer);
      console.log("=========================");

      if (user.is_admin) {
        console.log("Redirecting to Admin Dashboard");
        navigate("/admin/dashboard");
      } 
      else if (user.is_accounts) {
        console.log("Redirecting to Accounts Dashboard");
        navigate("/accounts/dashboard");
      }
      else if (user.is_mentor) {
        console.log("Redirecting to Mentor Dashboard");
        navigate("/mentor/dashboard");
      } 
      else if (user.is_reviewer) {
        console.log("Redirecting to Reviewer Dashboard");
        navigate("/reviewer/dashboard");
      }
      else if (user.is_student) {
        console.log("Redirecting to Student Dashboard");
        navigate("/student/dashboard");
      } 
      else {
        console.log("No role matched, redirecting to home");
        console.log("Available flags:", {
          is_admin: user.is_admin,
          is_accounts: user.is_accounts,
          is_mentor: user.is_mentor,
          is_reviewer: user.is_reviewer,
          is_student: user.is_student
        });
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
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
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background blur orbs - matching Home/About pages */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-10 -translate-x-1/2" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 mb-5 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#16a34a" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-extrabold text-gray-900 mb-2"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Welcome <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Back</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 text-sm"
          >
            Sign in with your email or username
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-md bg-white/70 rounded-2xl border border-white/30 p-8 shadow-xl"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Email or Username</label>
              <input
                type="text"
                placeholder="you@example.com or username"
                className="w-full bg-white border border-gray-200 hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 text-sm transition-all"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-gray-200 hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none rounded-xl px-4 py-3 pr-12 text-gray-800 placeholder-gray-400 text-sm transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600 transition-colors"
                >
                  {showPassword ? <EyeOpen /> : <EyeClosed />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-300 text-sm shadow-md"
              style={{ boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}
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
            </motion.button>
          </form>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-gray-400 mt-6"
        >
          By signing in, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
}

export default UserLogin;