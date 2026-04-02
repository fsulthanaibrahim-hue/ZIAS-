import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Helper to decode JWT and extract role (if present)
  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username || !password) {
      alert("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({
        username: username.trim(),
        password: password.trim(),
      });

      // Expect { access, refresh }
      const { access, refresh } = res;
      if (!access) {
        alert("Login failed: No access token received");
        return;
      }

      localStorage.setItem("access", access);
      if (refresh) localStorage.setItem("refresh", refresh);

      // --- Role detection (optional, for future use) ---
      let role = null;
      const tokenRole = decodeToken(access)?.role;
      if (tokenRole) role = tokenRole;
      if (!role) {
        const lowerUser = username.trim().toLowerCase();
        if (lowerUser.includes("admin")) role = "admin";
        else if (lowerUser.includes("mentor")) role = "mentor";
        else if (lowerUser.includes("reviewer")) role = "reviewer";
        else if (lowerUser.includes("student")) role = "student";
        else role = "student";
      }
      localStorage.setItem("role", role);
      console.log("Role set to:", role);

      // --- REDIRECT ---
      // Option A: Use role-based redirect (as originally)
      // if (role === "admin") navigate("/admin/students");
      // else if (role === "student") navigate("/student/dashboard");
      // else navigate("/student/dashboard");

      // Option B: Force all users to student dashboard (for testing)
      navigate("/student/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Login</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username or Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}

export default Login;