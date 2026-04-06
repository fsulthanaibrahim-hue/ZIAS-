import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./Admin/Login";
import UserLogin from "./pages/UserLogin";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
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
import ModulesAdmin from "./Admin/Modules";        // ✅ new import
import ContactMessages from "./Admin/ContactMessages";
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
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route path="/courses" element={<><Navbar /><Courses /></>} />
      <Route path="/about" element={<><Navbar /><About /></>} />
      <Route path="/contact" element={<><Navbar /><Contact /></>} />
      <Route path="/login" element={<UserLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

      {/* Protected user routes */}
      <Route path="/user/dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
      <Route path="/user/profile" element={<PrivateRoute><StudentProfile /></PrivateRoute>} />
      <Route path="/course/:courseId" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
      <Route path="/module/:moduleId" element={<PrivateRoute><ModuleView /></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Dashboard /></div></AdminRoute>} />
      <Route path="/admin/students" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Students /></div></AdminRoute>} />
      <Route path="/admin/mentors" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Mentors /></div></AdminRoute>} />
      <Route path="/admin/reviewers" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Reviewers /></div></AdminRoute>} />
      <Route path="/admin/courses" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><CoursesAdmin /></div></AdminRoute>} />
      <Route path="/admin/modules" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ModulesAdmin /></div></AdminRoute>} />  {/* ✅ new route */}
      <Route path="/admin/messages" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ContactMessages /></div></AdminRoute>} />

      {/* 404 */}
      <Route path="*" element={<h1 className="text-white text-center mt-10">404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;