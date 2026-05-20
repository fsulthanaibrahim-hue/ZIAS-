from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# =========================
# STUDENT VIEWS
# =========================
from .views.student_views import (
    StudentViewSet,
    StudentListView,
    CompleteModuleView,
    UploadStudentDocumentView,
    StudentSubmissionListCreateView,
)

# =========================
# AUTH VIEWS
# =========================
from .views.auth_views import (
    CustomLoginView,
    LogoutView,
    RegisterUserView,
    ChangePasswordView,
    RequestPasswordResetView,
    ConfirmPasswordResetView,
    CurrentUserView,
)

# =========================
# MAIN VIEWSETS
# =========================
from .views import (
    MentorViewSet,
    ReviewerViewSet,
    CourseViewSet,
    ModuleViewSet,
    DayViewSet,
    TaskViewSet,
    BatchViewSet,
    StudentModuleViewSet,
    WeekUpdateViewSet,
    ReviewFolderViewSet,
    NotificationViewSet,
    ReviewAssignmentViewSet,
    FeePaymentViewSet,
    FeeStructureViewSet,
    StudentFeeViewSet,
    InstallmentScheduleViewSet,
    ReviewViewSet,
    AccountsViewSet,
)

# =========================
# OTHER VIEWS (corrected imports)
# =========================
from .views import (
    SendBulkEmailView,
    UpdateDashboardAccessView,
    WeeklyToppersView,
    StudentWeekReviewView,

    ChatRoomList,
    ChatMessageListCreateView,   # use this instead of ChatMessageList
    ClearChatMessagesView,
    MarkMessagesReadView,        # now exists
    RespondToMessageView,

    UploadMentorDocumentView,
    MentorDocumentListView,
    MentorDocumentDeleteView,

    StudentDocumentListView,
    StudentDocumentDeleteView,

    UnreadMessagesCountView,
    RecentMessagesView,
    ContactMessageView,
    ContactMessageDetailView,

    UnreadNotificationCountView,
    StudentReviewStatusView,

    SubmissionBulkUpdateView,
    CheckInView,
    CheckOutView,
    AttendanceHistoryView,

    AccountsDashboardView,
    AccountsStudentListView,
    AccountsProfileView,
    StudentFeeSummaryView,
)

# =========================
# ROUTER
# =========================
router = DefaultRouter()

router.register('students', StudentViewSet, basename='student')
router.register('mentors', MentorViewSet)
router.register('reviewers', ReviewerViewSet)

router.register('courses', CourseViewSet)
router.register('modules', ModuleViewSet, basename='module')
router.register('days', DayViewSet, basename='day')
router.register('tasks', TaskViewSet)
router.register('batches', BatchViewSet)

router.register('accounts', AccountsViewSet, basename='accounts')
router.register('student-modules', StudentModuleViewSet, basename='student-module')
router.register('week-updates', WeekUpdateViewSet, basename='week-update')
router.register('review-folders', ReviewFolderViewSet, basename='review-folder')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('review-assignments', ReviewAssignmentViewSet, basename='review-assignment')
router.register('fee-payments', FeePaymentViewSet, basename='fee-payment')
router.register('fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register('student-fees', StudentFeeViewSet, basename='student-fees')
router.register('installments', InstallmentScheduleViewSet, basename='installments')
router.register('reviews', ReviewViewSet, basename='review')

# =========================
# URL PATTERNS
# =========================
urlpatterns = [

    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='custom_login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    path('users/me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),

    path('request-password-reset/', RequestPasswordResetView.as_view(), name='request_password_reset'),
    path('reset-password/<str:token>/', ConfirmPasswordResetView.as_view(), name='reset_password'),

    path('send-bulk-email/', SendBulkEmailView.as_view(), name='send_bulk_email'),

    path('contact/', ContactMessageView.as_view(), name='contact'),
    path('contact-messages/<int:pk>/', ContactMessageDetailView.as_view(), name='contact_message_detail'),
    path('unread-messages/', UnreadMessagesCountView.as_view(), name='unread_messages'),
    path('recent-messages/', RecentMessagesView.as_view(), name='recent_messages'),

    path('update-dashboard-access/', UpdateDashboardAccessView.as_view(), name='update-dashboard-access'),
    path('accounts/dashboard/', AccountsDashboardView.as_view(), name='accounts-dashboard'),
    path('accounts/students/', AccountsStudentListView.as_view(), name='accounts-students'),
    path('accounts/profile/', AccountsProfileView.as_view(), name='accounts-profile'),
    path('student/fee-summary/', StudentFeeSummaryView.as_view(), name='student-fee-summary'),

    path('students/list/', StudentListView.as_view(), name='student-list'),
    path('modules/<int:module_id>/complete/', CompleteModuleView.as_view(), name='complete-module'),
    path('week-review/<int:module_id>/', StudentWeekReviewView.as_view(), name='week-review'),
    path('weekly-toppers/', WeeklyToppersView.as_view(), name='weekly-toppers'),

    # Chat URLs – fixed duplicate names and missing view
    path('chat-rooms/', ChatRoomList.as_view(), name='chat-rooms'),
    path('chat-rooms/<int:room_id>/messages/', ChatMessageListCreateView.as_view(), name='chat-room-messages'),
    path('chat-messages/', ChatMessageListCreateView.as_view(), name='chat-messages-list'),
    path('chat-messages/clear/', ClearChatMessagesView.as_view(), name='clear-chat'),
    path('chat-messages/mark-read/<int:room_id>/', MarkMessagesReadView.as_view(), name='mark-read'),
    path('chat-messages/<int:message_id>/respond/', RespondToMessageView.as_view(), name='respond'),

    path('upload-student-document/', UploadStudentDocumentView.as_view(), name='upload-student-doc'),
    path('students/<int:student_id>/documents/', StudentDocumentListView.as_view(), name='student-docs'),
    path('student-documents/<int:doc_id>/', StudentDocumentDeleteView.as_view(), name='delete-student-doc'),

    path('upload-mentor-document/', UploadMentorDocumentView.as_view(), name='upload-mentor-doc'),
    path('mentors/<int:mentor_id>/documents/', MentorDocumentListView.as_view(), name='mentor-docs'),
    path('mentor-documents/<int:doc_id>/', MentorDocumentDeleteView.as_view(), name='delete-mentor-doc'),

    path('submissions/', StudentSubmissionListCreateView.as_view(), name='submissions'),
    path('submissions/bulk-update/', SubmissionBulkUpdateView.as_view(), name='submission-bulk-update'),

    path('attendance/check-in/', CheckInView.as_view(), name='check-in'),
    path('attendance/check-out/', CheckOutView.as_view(), name='check-out'),
    path('attendance/history/', AttendanceHistoryView.as_view(), name='attendance-history'),

    path('notifications/unread-count/', UnreadNotificationCountView.as_view(), name='unread-count'),

    path('', include(router.urls)),
]