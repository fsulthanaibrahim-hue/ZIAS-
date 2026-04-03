import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./Admin/Login";
import UserLogin from "./pages/UserLogin";
import UserDashboard from "./pages/UserDashboard";
import ModuleView from "./pages/ModuleView";   // 👈 import the new component
import Sidebar from "./components/Sidebar";
import Dashboard from "./Admin/Dashboard";
import Students from "./Admin/Students";
import Mentors from "./Admin/Mentors";
import Reviewers from "./Admin/Reviewers";
import CoursesAdmin from "./Admin/Courses";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import About from "./pages/About";
import Contact from "./pages/Contact";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  return (
    <Routes>
      {/* Public pages with Navbar */}
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route path="/courses" element={<><Navbar /><Courses /></>} />
      <Route path="/about" element={<><Navbar /><About /></>} />
      <Route path="/contact" element={<><Navbar /><Contact /></>} />
      <Route path="/login" element={<UserLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* User dashboard (protected) */}
      <Route path="/user/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />

      {/* Student-facing module view (protected) */}
      <Route path="/module/:moduleId" element={<PrivateRoute><ModuleView /></PrivateRoute>} />

      {/* Admin routes (protected) */}
      <Route path="/admin/dashboard" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Dashboard /></div></AdminRoute>} />
      <Route path="/admin/students" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Students /></div></AdminRoute>} />
      <Route path="/admin/mentors" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Mentors /></div></AdminRoute>} />
      <Route path="/admin/reviewers" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Reviewers /></div></AdminRoute>} />
      
      {/* Course management route */}
      <Route path="/admin/courses" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><CoursesAdmin /></div></AdminRoute>} />

      {/* 404 */}
      <Route path="*" element={<h1 className="text-white text-center mt-10">404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;