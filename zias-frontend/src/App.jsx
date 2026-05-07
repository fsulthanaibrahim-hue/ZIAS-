import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AdminLogin from "./Admin/Login";
import UserLogin from "./pages/UserLogin";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import StudentReviewSheet from "./pages/student/StudentReviewSheet";
import StudentReviewSheetRange from "./pages/student/StudentReviewSheetRange";
import StudentWeekView from "./pages/student/StudentWeekView";
import CourseDetail from "./pages/student/CourseDetail";
import ModuleView from "./pages/student/ModuleView";
import ChangePassword from "./pages/ChangePassword";
import DashboardLock from "./pages/student/DashboardLock";
import StudentReviewFolders from "./pages/student/StudentReviewFolders";
import StudentModules from "./pages/student/StudentModules";
import InOutRegister from "./pages/student/InOutRegister";
import StudentAttendance from "./pages/student/StudentAttendance";

// Reviewer pages
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard";
import ReviewerProfile from "./pages/reviewer/ReviewerProfile";
import ReviewerReviewFolders from "./pages/reviewer/ReviewerReviewFolders";
import ReviewerReviewSheet from "./pages/reviewer/ReviewerReviewSheet";
import ReviewerReviewSheetRange from "./pages/reviewer/ReviewerReviewSheetRange";
import ReviewerNotifications from "./pages/reviewer/ReviewerNotifications";
import ReviewerAssignments from "./pages/reviewer/ReviewerAssignments";

// Mentor pages
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorProfile from "./pages/mentor/MentorProfile";
import MentorStudents from "./pages/mentor/MentorStudents";
import MentorModules from "./pages/mentor/MentorModules";
import MentorReviewEdit from "./pages/mentor/MentorReviewEdit";
import MentorReviewSheetRange from "./pages/mentor/MentorReviewSheetRange";
import MentorNotifications from "./pages/mentor/MentorNotifications";
import ReviewTracker from "./pages/mentor/ReviewTracker";
import MentorReviewFolders from "./pages/mentor/MentorReviewFolders";
import AttendanceMonitor from "./pages/mentor/AttendanceMonitor";

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
import StudentReviewEdit from "./Admin/StudentReviewEdit";
import AdminProfile from "./Admin/AdminProfile";
import NotificationsPage from "./Admin/NotificationsPage";
import ContactMessageDetail from "./Admin/ContactMessageDetail";
import ReviewFoldersAdmin from "./Admin/ReviewFoldersAdmin";
import AdminAttendance from "./Admin/AdminAttendance";

// Common pages
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Sidebars
import MentorSidebar from "./components/MentorSidebar";
import ReviewerSidebar from "./components/ReviewerSidebar";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }
  return token && user?.is_admin ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }

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
    <>
      <Toaster position="top-right" />
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

        {/* Redirect /student/detailed-review to review sheet */}
        <Route path="/student/detailed-review" element={<Navigate to="/student/review-sheet" replace />} />

        {/* Student routes */}
        <Route path="/student/dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
        <Route path="/student/profile" element={<PrivateRoute><StudentProfile /></PrivateRoute>} />
        <Route path="/student/review-sheet" element={<PrivateRoute><StudentReviewSheet /></PrivateRoute>} />
        <Route path="/student/review-sheet/range/:start/:end" element={<PrivateRoute><StudentReviewSheetRange /></PrivateRoute>} />
        <Route path="/student/week/:weekId" element={<PrivateRoute><StudentWeekView /></PrivateRoute>} />
        <Route path="/student/course/:courseId" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
        <Route path="/student/module/:moduleId" element={<PrivateRoute><ModuleView /></PrivateRoute>} />
        <Route path="/student/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
        <Route path="/student/dashboard-lock" element={<PrivateRoute><DashboardLock /></PrivateRoute>} />
        <Route path="/student/modules" element={<PrivateRoute><StudentModules /></PrivateRoute>} />
        <Route path="/student/review-folders" element={<PrivateRoute><StudentReviewFolders /></PrivateRoute>} />
        <Route path="/student/in-out-register" element={<PrivateRoute><InOutRegister /></PrivateRoute>} />
        <Route path="/student/attendance" element={<PrivateRoute><StudentAttendance /></PrivateRoute>} />  {/* ✅ ADDED student attendance route */}

        {/* Generic change password route */}
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

        {/* Reviewer routes with sidebar */}
        <Route path="/reviewer/dashboard" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerDashboard />
            </div>
          </PrivateRoute>
        } />
        <Route path="/reviewer/notifications" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerNotifications />
            </div>
          </PrivateRoute>
        } />
        <Route path="/reviewer/review-folders" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerReviewFolders />
            </div>
          </PrivateRoute>
        } />
        <Route path="/reviewer/profile" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerProfile />
            </div>
          </PrivateRoute>
        } />
        <Route path="/reviewer/review-sheet" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerReviewSheet />
            </div>
          </PrivateRoute>
        } />
        <Route path="/reviewer/review-sheet/range/:start/:end" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerReviewSheetRange />
            </div>
          </PrivateRoute>
        } />
        <Route path="/reviewer/assignments" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerAssignments />
            </div>
          </PrivateRoute>
        } />

        {/* Mentor routes with sidebar */}
        <Route path="/mentor/dashboard" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorDashboard />
            </div>
          </PrivateRoute>
        } />
        <Route path="/mentor/students" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorStudents />
            </div>
          </PrivateRoute>
        } />
        <Route path="/mentor/modules" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorModules />
            </div>
          </PrivateRoute>
        } />
        <Route path="/mentor/profile" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorProfile />
            </div>
          </PrivateRoute>
        } />
        <Route path="/mentor/review-sheet" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorReviewEdit />
            </div>
          </PrivateRoute>
        } />
        <Route path="/mentor/review-sheet/range/:start/:end" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorReviewSheetRange />
            </div>
          </PrivateRoute>
        } />
        <Route path="/mentor/review-tracker" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <ReviewTracker />
            </div>
          </PrivateRoute>
        } />
        <Route path="/mentor/review-folders" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorReviewFolders />
            </div>
          </PrivateRoute>
        } />
        <Route path="/mentor/notifications" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorNotifications />
            </div>
          </PrivateRoute>
        } />
        <Route path="/mentor/attendance" element={
          <PrivateRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <AttendanceMonitor />
            </div>
          </PrivateRoute>
        } />

        {/* Admin routes (protected by AdminRoute) */}
        <Route path="/admin/dashboard" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Dashboard /></div></AdminRoute>} />
        <Route path="/admin/students" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Students /></div></AdminRoute>} />
        <Route path="/admin/mentors" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Mentors /></div></AdminRoute>} />
        <Route path="/admin/reviewers" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Reviewers /></div></AdminRoute>} />
        <Route path="/admin/courses" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><CoursesAdmin /></div></AdminRoute>} />
        <Route path="/admin/modules" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ModulesAdmin /></div></AdminRoute>} />
        <Route path="/admin/messages" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ContactMessages /></div></AdminRoute>} />
        <Route path="/admin/batches" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Batches /></div></AdminRoute>} />
        <Route path="/admin/review-sheets" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ReviewSheets /></div></AdminRoute>} />
        <Route path="/admin/student-review-edit" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><StudentReviewEdit /></div></AdminRoute>} />
        <Route path="/admin/profile" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><AdminProfile /></div></AdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><div style={{display: "flex"}}><Sidebar /><NotificationsPage /></div></AdminRoute>} />
        <Route path="/admin/contact-messages/:id" element={<AdminRoute><div style={{display: "flex"}}><Sidebar /><ContactMessageDetail /></div></AdminRoute>} />
        <Route path="/admin/review-folders" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ReviewFoldersAdmin /></div></AdminRoute>} />
        <Route path="/admin/attendance" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><AdminAttendance /></div></AdminRoute>} />  {/* ✅ fixed duplicate, uses AdminRoute + Sidebar */}

        {/* 404 page */}
        <Route path="*" element={
          <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
            <h1 className="text-white text-2xl">404 - Page Not Found</h1>
          </div>
        } />
      </Routes>
    </>
  );
}

export default App;