// src/pages/UserLogin.jsx (or src/Admin/Login.jsx)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function UserLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 1. Get JWT tokens
      const tokenRes = await axios.post("http://127.0.0.1:8000/api/token/", { username, password });
      const accessToken = tokenRes.data.access;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", tokenRes.data.refresh);

      // 2. Fetch current user info (role)
      const userRes = await axios.get("http://127.0.0.1:8000/api/users/me/", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const user = userRes.data;

      // 3. Redirect based on role
      if (user.is_admin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      setError("Invalid username or password");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-6">User Login</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            className="w-full p-2 border rounded mb-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserLogin;