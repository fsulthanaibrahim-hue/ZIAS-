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
import ReviewerReviewSheet from "./pages/reviewer/ReviewerReviewSheet";
import ReviewerReviewSheetRange from "./pages/reviewer/ReviewerReviewSheetRange";
import ReviewerAssignments from "./pages/reviewer/ReviewerAssignments";

// Mentor pages
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorProfile from "./pages/mentor/MentorProfile";
import MentorStudents from "./pages/mentor/MentorStudents";
import MentorModules from "./pages/mentor/MentorModules";
import MentorReviewEdit from "./pages/mentor/MentorReviewEdit";
import MentorReviewSheetRange from "./pages/mentor/MentorReviewSheetRange";
import ReviewTracker from "./pages/mentor/ReviewTracker";
import MentorReviewFolders from "./pages/mentor/MentorReviewFolders";
import AttendanceMonitor from "./pages/mentor/AttendanceMonitor";
import MentorAssignments from "./pages/mentor/MentorAssignments";
import MentorFeeOverview from "./pages/mentor/MentorFeeOverview";

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
import ContactMessageDetail from "./Admin/ContactMessageDetail";
import ReviewFoldersAdmin from "./Admin/ReviewFoldersAdmin";
import AdminAttendance from "./Admin/AdminAttendance";
import ModuleDetail from "./Admin/ModuleDetail";
import Accounts from "./Admin/Accounts";
import AdminFeeStructure from "./Admin/AdminFeeStructure";

// Common pages
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Notifications
import NotificationPage from "./components/NotificationPage";

// Sidebars
import StudentSidebar from "./components/StudentSidebar";
import MentorSidebar from "./components/MentorSidebar";
import ReviewerSidebar from "./components/ReviewerSidebar";
import MentorModuleDetail from "./pages/mentor/MentorModuleDetail";

// Accounts Pages
import AccountsSidebar from "./components/AccountsSidebar";
import AccountsDashboard from "./pages/accounts/AccountsDashboard";
import AccountsPayments from "./pages/accounts/AccountsPayments";
import AccountsStudents from "./pages/accounts/AccountsStudents";
import AccountsProfile from "./pages/accounts/AccountsProfile";
import AccountsInvoices from "./pages/accounts/AccountsInvoices";
// REMOVED: import AccountsChangePassword from "./pages/accounts/AccountsChangePassword"; // This file doesn't exist

import StudentFees from "./pages/student/StudentFees";
import FeeOverview from "./Admin/FeeOverview";
import AdminStudentFeeManagement from "./Admin/AdminStudentFeeManagement";

// ========== ROUTE GUARDS ==========
function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
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
  if (!token || !user?.is_admin) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function AccountsRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }
  if (!token || !user?.is_accounts) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function ReviewerRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }
  if (!token || !user?.is_reviewer) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function MentorRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }
  if (!token || !user?.is_mentor) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function StudentRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }
  if (!token || !user?.is_student) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Helper function to get user from localStorage
function getUser() {
  const userStr = localStorage.getItem("user");
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const user = getUser();

    // Public routes that don't need redirect
    const publicRoutes = ["/login", "/admin/login", "/forgot-password", "/", "/courses", "/about", "/contact"];
    const isPublicRoute = publicRoutes.some(route => location.pathname === route);
    const isResetPassword = location.pathname.startsWith("/reset-password/");
    
    if (isPublicRoute || isResetPassword) {
      return;
    }

    // If no token, redirect to login
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // If token exists but no user data, stay on current page
    if (!user) {
      return;
    }

    // Check if user is trying to access wrong dashboard
    const path = location.pathname;
    
    // Redirect based on role - ORDER MATTERS! Check accounts BEFORE student
    if (user.is_admin && !path.startsWith("/admin")) {
      navigate("/admin/dashboard", { replace: true });
    } else if (user.is_accounts && !path.startsWith("/accounts")) {
      navigate("/accounts/dashboard", { replace: true });
    } else if (user.is_mentor && !path.startsWith("/mentor")) {
      navigate("/mentor/dashboard", { replace: true });
    } else if (user.is_reviewer && !path.startsWith("/reviewer")) {
      navigate("/reviewer/dashboard", { replace: true });
    } else if (user.is_student && !path.startsWith("/student")) {
      navigate("/student/dashboard", { replace: true });
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

        {/* Redirects - User routes redirect to appropriate role dashboards */}
        <Route path="/user/dashboard" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/user/profile" element={<Navigate to="/student/profile" replace />} />
        <Route path="/user/review-sheet" element={<Navigate to="/student/review-sheet" replace />} />
        <Route path="/user/change-password" element={<Navigate to="/change-password" replace />} />
        <Route path="/student/detailed-review" element={<Navigate to="/student/review-sheet" replace />} />

        {/* Student routes */}
        <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
        <Route path="/student/profile" element={<StudentRoute><StudentProfile /></StudentRoute>} />
        <Route path="/student/review-sheet" element={<StudentRoute><StudentReviewSheet /></StudentRoute>} />
        <Route path="/student/review-sheet/range/:start/:end" element={<StudentRoute><StudentReviewSheetRange /></StudentRoute>} />
        <Route path="/student/week/:weekId" element={<StudentRoute><StudentWeekView /></StudentRoute>} />
        <Route path="/student/course/:courseId" element={<StudentRoute><CourseDetail /></StudentRoute>} />
        <Route path="/student/module/:moduleId" element={<StudentRoute><ModuleView /></StudentRoute>} />
        <Route path="/student/change-password" element={<StudentRoute><ChangePassword /></StudentRoute>} />
        <Route path="/student/dashboard-lock" element={<StudentRoute><DashboardLock /></StudentRoute>} />
        <Route path="/student/modules" element={<StudentRoute><StudentModules /></StudentRoute>} />
        <Route path="/student/review-folders" element={<StudentRoute><StudentReviewFolders /></StudentRoute>} />
        <Route path="/student/in-out-register" element={<StudentRoute><InOutRegister /></StudentRoute>} />
        <Route path="/student/fees" element={<StudentRoute><StudentFees /></StudentRoute>} />
        <Route path="/student/attendance" element={<StudentRoute><StudentAttendance /></StudentRoute>} />
        <Route path="/student/notifications" element={
          <StudentRoute>
            <div style={{ display: "flex" }}>
              <StudentSidebar />
              <NotificationPage />
            </div>
          </StudentRoute>
        } />

        {/* Generic change password route - accessible by all authenticated users */}
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

        {/* Reviewer routes */}
        <Route path="/reviewer/dashboard" element={
          <ReviewerRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerDashboard />
            </div>
          </ReviewerRoute>
        } />
        <Route path="/reviewer/notifications" element={
          <ReviewerRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <NotificationPage />
            </div>
          </ReviewerRoute>
        } />
        <Route path="/reviewer/profile" element={
          <ReviewerRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerProfile />
            </div>
          </ReviewerRoute>
        } />
        <Route path="/reviewer/review-sheet" element={
          <ReviewerRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerReviewSheet />
            </div>
          </ReviewerRoute>
        } />
        <Route path="/reviewer/review-sheet/range/:start/:end" element={
          <ReviewerRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerReviewSheetRange />
            </div>
          </ReviewerRoute>
        } />
        <Route path="/reviewer/assignments" element={
          <ReviewerRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ReviewerAssignments />
            </div>
          </ReviewerRoute>
        } />
        <Route path="/reviewer/change-password" element={
          <ReviewerRoute>
            <div style={{ display: "flex" }}>
              <ReviewerSidebar />
              <ChangePassword />
            </div>
          </ReviewerRoute>
        } />

        {/* Mentor routes */}
        <Route path="/mentor/dashboard" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorDashboard />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/students" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorStudents />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/modules" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorModules />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/profile" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorProfile />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/review-sheet" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorReviewEdit />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/review-sheet/range/:start/:end" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorReviewSheetRange />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/review-tracker" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <ReviewTracker />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/review-folders" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorReviewFolders />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/notifications" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <NotificationPage />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/attendance" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <AttendanceMonitor />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/assignments" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorAssignments />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/module/:moduleId" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorModuleDetail />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/fee-overview" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <MentorFeeOverview />
            </div>
          </MentorRoute>
        } />
        <Route path="/mentor/change-password" element={
          <MentorRoute>
            <div style={{ display: "flex" }}>
              <MentorSidebar />
              <ChangePassword />
            </div>
          </MentorRoute>
        } />

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
        <Route path="/admin/student-review-edit" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><StudentReviewEdit /></div></AdminRoute>} />
        <Route path="/admin/profile" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><AdminProfile /></div></AdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><NotificationPage /></div></AdminRoute>} />
        <Route path="/admin/contact-messages/:id" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ContactMessageDetail /></div></AdminRoute>} />
        <Route path="/admin/review-folders" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><ReviewFoldersAdmin /></div></AdminRoute>} />
        <Route path="/admin/attendance" element={<AdminRoute><div style={{display:"flex"}}><AdminAttendance /></div></AdminRoute>} />
        <Route path="/admin/module/:id" element={<AdminRoute><div style={{ display: "flex" }}><Sidebar /><ModuleDetail /></div></AdminRoute>} />
        <Route path="/admin/accounts" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><Accounts /></div></AdminRoute>} />
        <Route path="/admin/fee-overview" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><FeeOverview /></div></AdminRoute>} />
        <Route path="/admin/fee-structure" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><AdminFeeStructure /></div></AdminRoute>} />
        <Route path="/admin/student-fee-management" element={<AdminRoute><div style={{display:"flex"}}><Sidebar /><AdminStudentFeeManagement /></div></AdminRoute>} />
        <Route path="/admin/change-password" element={
          <AdminRoute>
            <div style={{ display: "flex" }}>
              <Sidebar />
              <ChangePassword />
            </div>
          </AdminRoute>
        } />

        {/* Accounts routes – protected by AccountsRoute */}
        <Route path="/accounts/dashboard" element={
          <AccountsRoute>
            <div style={{ display: "flex" }}>
              <AccountsSidebar />
              <AccountsDashboard />
            </div>
          </AccountsRoute>
        } />
        <Route path="/accounts/payments" element={
          <AccountsRoute>
            <div style={{ display: "flex" }}>
              <AccountsSidebar />
              <AccountsPayments />
            </div>
          </AccountsRoute>
        } />
        <Route path="/accounts/students" element={
          <AccountsRoute>
            <div style={{ display: "flex" }}>
              <AccountsSidebar />
              <AccountsStudents />
            </div>
          </AccountsRoute>
        } />
        <Route path="/accounts/profile" element={
          <AccountsRoute>
            <div style={{ display: "flex" }}>
              <AccountsSidebar />
              <AccountsProfile />
            </div>
          </AccountsRoute>
        } />
        <Route path="/accounts/invoices" element={
          <AccountsRoute>
            <div style={{ display: "flex" }}>
              <AccountsSidebar />
              <AccountsInvoices />
            </div>
          </AccountsRoute>
        } />
        {/* Accounts change password - using generic ChangePassword component */}
        <Route path="/accounts/change-password" element={
          <AccountsRoute>
            <div style={{ display: "flex" }}>
              <AccountsSidebar />
              <ChangePassword />
            </div>
          </AccountsRoute>
        } />

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
