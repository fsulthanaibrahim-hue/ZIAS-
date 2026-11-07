import { Navigate } from "react-router-dom";

/**
 * PrivateRoute component for role-based route protection.
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - The protected component to render
 * @param {string} [props.requiredRole] - Optional role flag to check (e.g., 'is_admin', 'is_student', 'is_mentor', 'is_reviewer', 'is_accounts')
 * 
 * If no requiredRole is provided, any authenticated user can access.
 * If requiredRole is provided, the user must have that flag set to true.
 */
const PrivateRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // No token → go to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Role check (if required)
  if (requiredRole) {
    // The backend sends fields like is_admin, is_student, is_mentor, is_reviewer, is_accounts
    const hasRole = user[requiredRole]; // e.g., user.is_accounts
    if (!hasRole) {
      // Redirect to a generic "unauthorized" page or the user's own dashboard
      return <Navigate to="/unauthorized" />;
    }
  }

  return children;
};

export default PrivateRoute;
