// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // No token → go to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Role check (if required)
  if (requiredRole) {
    // Your backend sends fields like is_admin, is_student, is_mentor, is_reviewer
    const hasRole = user[requiredRole]; // e.g., user.is_admin
    if (!hasRole) {
      return <Navigate to="/unauthorized" />; // or redirect to user dashboard
    }
  }

  return children;
};

export default PrivateRoute;