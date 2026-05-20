from ..base import SafeAPIView, SafeViewSet

# Auth
from .auth_views import (
    CustomLoginView, LogoutView, RegisterUserView, ChangePasswordView,
    RequestPasswordResetView, ConfirmPasswordResetView, CurrentUserView
)

# Student
from .student_views import (
    StudentViewSet, StudentListView, StudentCourseStatusView,
    CompleteModuleView, UploadStudentDocumentView, StudentDocumentDeleteView,
    StudentSubmissionListCreateView, StudentReviewStatusView, StudentModuleViewSet,
    StudentDocumentListView   # <-- this must be present
)

# Mentor
from .mentor_views import (
    MentorViewSet, WeeklyToppersView, SubmissionBulkUpdateView,
    MentorDocumentListView, UploadMentorDocumentView, MentorDocumentDeleteView
)

# Reviewer
from .reviewer_views import (
    ReviewerViewSet, ReviewerDashboardView, ReviewAssignmentViewSet,
    ReviewFolderViewSet, RespondToMessageView
)

# Attendance
from .attendance_views import CheckInView, CheckOutView, AttendanceHistoryView

# Review
from .review_views import StudentWeekReviewView, WeekUpdateViewSet, ReviewViewSet

# Fee
from .fee_views import (
    FeePaymentViewSet, AccountsViewSet, AccountsDashboardView,
    AccountsStudentListView, AccountsProfileView, StudentFeeSummaryView,
    FeeStructureViewSet, StudentFeeViewSet, InstallmentScheduleViewSet
)

# Notification
from .notification_views import NotificationViewSet, UnreadNotificationCountView

# Core (Batch, Course, Module, Day, Task, Contact, Chat, Email, Utilities)
from .core_views import (
    BatchViewSet, CourseViewSet, ModuleViewSet, DayViewSet, TaskViewSet,
    SendBulkEmailView, ContactMessageView, UnreadMessagesCountView,
    RecentMessagesView, ContactMessageDetailView, ChatRoomList,
    ChatMessageListCreateView, ClearChatMessagesView, MarkMessagesReadView,
    UpdateDashboardAccessView, RecentMessagesAPIView
)

# Alias for backward compatibility
ChatMessageList = ChatMessageListCreateView