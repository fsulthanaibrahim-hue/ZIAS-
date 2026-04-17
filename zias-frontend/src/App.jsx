// src/App.jsx
import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import AdminLogin from "./Admin/Login";
import UserLogin from "./pages/UserLogin";
// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import StudentReviewSheet from "./pages/student/StudentReviewSheet";
import StudentWeekView from "./pages/student/StudentWeekView";
import CourseDetail from "./pages/student/CourseDetail";
import ModuleView from "./pages/student/ModuleView";
import ChangePassword from "./pages/ChangePassword";
import DashboardLock from "./pages/student/DashboardLock";
// Reviewer pages
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard";
import ReviewerProfile from "./pages/reviewer/ReviewerProfile";
// Mentor pages
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorProfile from "./pages/mentor/MentorProfile";
// Admin pages
import Sidebar from "./components/Sidebar";
import Dashboard from "./Admin/Dashboard";
import Students from "./Admin/Students";
import Mentors from "./Admin/Mentors";
import Reviewers from "./Admin/Reviewers";
import CoursesAdmin from "./Admin/Courses";
import ModulesAdmin from "./Admin/Modules";
import ContactMessages from "./Admin/ContactMessages";
import Batches from "./Admin/Batches";
import ReviewSheets from "./Admin/ReviewSheets";
// Common pages
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  return token && user?.is_admin ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (location.pathname === "/login" || location.pathname === "/admin/login") {
      return;
    }

    if (token && user) {
      const resetPaths = ["/forgot-password", "/reset-password/:token"];
      const isResetPath = resetPaths.some(path => location.pathname === path);
      if (isResetPath) {
        if (user.is_admin) navigate("/admin/dashboard", { replace: true });
        else if (user.is_student) navigate("/student/dashboard", { replace: true });
        else if (user.is_mentor) navigate("/mentor/dashboard", { replace: true });
        else if (user.is_reviewer) navigate("/reviewer/dashboard", { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route path="/courses" element={<><Navbar /><Courses /></>} />
      <Route path="/about" element={<><Navbar /><About /></>} />
      <Route path="/contact" element={<><Navbar /><Contact /></>} />
      <Route path="/login" element={<UserLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Redirect old /user/* paths to new /student/* */}
      <Route path="/user/dashboard" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/user/profile" element={<Navigate to="/student/profile" replace />} />
      <Route path="/user/review-sheet" element={<Navigate to="/student/review-sheet" replace />} />
      <Route path="/user/change-password" element={<Navigate to="/change-password" replace />} />

      {/* Redirect any /student/detailed-review to the new review sheet */}
      <Route path="/student/detailed-review" element={<Navigate to="/student/review-sheet" replace />} />

      {/* Student routes */}
      <Route path="/student/dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
      <Route path="/student/profile" element={<PrivateRoute><StudentProfile /></PrivateRoute>} />
      <Route path="/student/review-sheet" element={<PrivateRoute><StudentReviewSheet /></PrivateRoute>} />
      <Route path="/student/week/:weekId" element={<PrivateRoute><StudentWeekView /></PrivateRoute>} />
      <Route path="/student/course/:courseId" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
      <Route path="/student/module/:moduleId" element={<PrivateRoute><ModuleView /></PrivateRoute>} />
      <Route path="/student/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
      <Route path="/student/dashboard-lock" element={<PrivateRoute><DashboardLock /></PrivateRoute>} />

      {/* Generic change password route (for all roles) */}
      <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

      {/* Reviewer routes */}
      <Route path="/reviewer/dashboard" element={<PrivateRoute><ReviewerDashboard /></PrivateRoute>} />
      <Route path="/reviewer/profile" element={<PrivateRoute><ReviewerProfile /></PrivateRoute>} />

      {/* Mentor routes */}
      <Route path="/mentor/dashboard" element={<PrivateRoute><MentorDashboard /></PrivateRoute>} />
      <Route path="/mentor/profile" element={<PrivateRoute><MentorProfile /></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Dashboard /></div></AdminRoute>} />
      <Route path="/admin/students" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Students /></div></AdminRoute>} />
      <Route path="/admin/mentors" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Mentors /></div></AdminRoute>} />
      <Route path="/admin/reviewers" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Reviewers /></div></AdminRoute>} />
      <Route path="/admin/courses" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><CoursesAdmin /></div></AdminRoute>} />
      <Route path="/admin/modules" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ModulesAdmin /></div></AdminRoute>} />
      <Route path="/admin/messages" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ContactMessages /></div></AdminRoute>} />
      <Route path="/admin/batches" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Batches /></div></AdminRoute>} />
      <Route path="/admin/review-sheets" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ReviewSheets /></div></AdminRoute>} />

      {/* 404 page */}
      <Route path="*" element={
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
          <h1 className="text-white text-2xl">404 - Page Not Found</h1>
        </div>
      } />
    </Routes>
  );
}

export default App;