import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const tokenRes = await axios.post("http://127.0.0.1:8000/api/token/", { username, password });
      const accessToken = tokenRes.data.access;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", tokenRes.data.refresh);

      const userRes = await axios.get("http://127.0.0.1:8000/api/users/me/", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const user = userRes.data;
      localStorage.setItem("user", JSON.stringify(user));

      if (user.is_admin) {
        navigate("/admin/dashboard");
      } else {
        setError("You are not authorized as admin.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Invalid username or password.");
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "#0d1117",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#e6edf3",
    fontSize: "14px",
    fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "300px",
          background: "radial-gradient(ellipse, rgba(59,110,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#161b22",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          padding: "36px 32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div
          style={{
            fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
            fontSize: "12px",
            color: "rgba(255,255,255,0.3)",
            marginBottom: "6px",
            letterSpacing: "0.04em",
          }}
        >
          zias-admin <span style={{ color: "#3b6eff" }}>~</span> $ authenticate
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: "600", color: "#e6edf3", margin: "0 0 4px" }}>Admin Login</h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", margin: "0 0 28px" }}>ZIAS Portal — Authorized access only</p>
        {error && (
          <div
            style={{
              background: "rgba(255,80,80,0.08)",
              border: "1px solid rgba(255,80,80,0.25)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#ff6b6b",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" style={{ flexShrink: 0 }}>
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "500",
                color: "rgba(255,255,255,0.45)",
                marginBottom: "6px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Username
            </label>
            <input
              type="text"
              placeholder="enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "rgba(59,110,255,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "500",
                color: "rgba(255,255,255,0.45)",
                marginBottom: "6px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "rgba(59,110,255,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px",
              background: loading ? "rgba(59,110,255,0.4)" : "#3b6eff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#2d5ce0"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#3b6eff"; }}
          >
            {loading ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ animation: "spin 0.8s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Authenticating...
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                  <path d="M8 1a4 4 0 014 4v1h1a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1h1V5a4 4 0 014-4zm0 1.5A2.5 2.5 0 005.5 5v1h5V5A2.5 2.5 0 008 2.5z" />
                </svg>
                Sign in
              </>
            )}
          </button>
        </form>
        <p style={{ marginTop: "24px", fontSize: "11px", color: "rgba(255,255,255,0.2)", textAlign: "center", fontFamily: "'DM Mono', 'Fira Code', monospace" }}>
          © {new Date().getFullYear()} ZIAS · Secure session
        </p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

export default Login;
