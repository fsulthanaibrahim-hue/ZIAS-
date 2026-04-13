// src/App.jsx
import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import AdminLogin from "./Admin/Login";
import UserLogin from "./pages/UserLogin";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import StudentReviewSheet from "./pages/StudentReviewSheet";
import CourseDetail from "./pages/CourseDetail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ModuleView from "./pages/ModuleView";
import Sidebar from "./components/Sidebar";
import Dashboard from "./Admin/Dashboard";
import Students from "./Admin/Students";
import Mentors from "./Admin/Mentors";
import Reviewers from "./Admin/Reviewers";
import CoursesAdmin from "./Admin/Courses";
import ModulesAdmin from "./Admin/Modules";
import ContactMessages from "./Admin/ContactMessages";
import Batches from "./Admin/Batches";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ChangePassword from "./pages/ChangePassword";

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

  // Auto‑redirect logged‑in users away from public pages (except login pages)
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    // ✅ Do NOT redirect from the actual login pages
    if (location.pathname === "/login" || location.pathname === "/admin/login") {
      return;
    }

    if (token && user) {
      // Only redirect from other public paths like forgot-password, reset-password
      const publicPaths = ["/forgot-password", "/reset-password/:token"];
      const isPublicPath = publicPaths.some(path => location.pathname === path);

      if (isPublicPath) {
        if (user.is_admin) {
          navigate("/admin/dashboard");
        } else if (user.is_student) {
          navigate("/user/dashboard");
        } else if (user.is_mentor) {
          navigate("/mentor/dashboard");
        } else if (user.is_reviewer) {
          navigate("/reviewer/dashboard");
        }
      }
    }
  }, [location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route path="/courses" element={<><Navbar /><Courses /></>} />
      <Route path="/about" element={<><Navbar /><About /></>} />
      <Route path="/contact" element={<><Navbar /><Contact /></>} />
      <Route path="/login" element={<UserLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

      <Route path="/user/dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
      <Route path="/user/profile" element={<PrivateRoute><StudentProfile /></PrivateRoute>} />
      <Route path="/user/review-sheet" element={<PrivateRoute><StudentReviewSheet /></PrivateRoute>} />
      <Route path="/course/:courseId" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
      <Route path="/module/:moduleId" element={<PrivateRoute><ModuleView /></PrivateRoute>} />

      <Route path="/admin/dashboard" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Dashboard /></div></AdminRoute>} />
      <Route path="/admin/students" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Students /></div></AdminRoute>} />
      <Route path="/admin/mentors" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Mentors /></div></AdminRoute>} />
      <Route path="/admin/reviewers" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Reviewers /></div></AdminRoute>} />
      <Route path="/admin/courses" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><CoursesAdmin /></div></AdminRoute>} />
      <Route path="/admin/modules" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ModulesAdmin /></div></AdminRoute>} />
      <Route path="/admin/messages" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ContactMessages /></div></AdminRoute>} />
      <Route path="/admin/batches" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Batches /></div></AdminRoute>} />

      <Route path="*" element={<h1 className="text-white text-center mt-10">404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;


