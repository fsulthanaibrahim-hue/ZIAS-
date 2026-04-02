import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Admin/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./Admin/Dashboard";
import Students from "./Admin/Students";
import Mentors from "./Admin/Mentors";
import Reviewers from "./Admin/Reviewers";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  return (
    <Routes>
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      {/* Admin login */}
      <Route path="/admin/login" element={<Login />} />

      {/* Dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <Dashboard />
            </div>
          </PrivateRoute>
        }
      />

      {/* Students */}
      <Route
        path="/admin/students"
        element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <Students />
            </div>
          </PrivateRoute>
        }
      />

      {/* Mentors */}
      <Route
        path="/admin/mentors"
        element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <Mentors />
            </div>
          </PrivateRoute>
        }
      />

      {/* Reviewers */}
      <Route
        path="/admin/reviewers"
        element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <Reviewers />
            </div>
          </PrivateRoute>
        }
      />

      {/* Fallback 404 */}
      <Route path="*" element={<h1 style={{ color: "white", textAlign: "center", marginTop: "50px" }}>404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;