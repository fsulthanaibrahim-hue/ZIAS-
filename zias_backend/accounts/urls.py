from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    StudentViewSet, MentorViewSet, ReviewerViewSet, CurrentUserView,
    ChangePasswordView, SendBulkEmailView, CourseViewSet,
    ModuleViewSet, DayViewSet, TaskViewSet, BatchViewSet, StudentModuleViewSet,
    RequestPasswordResetView, ConfirmPasswordResetView,
    ContactMessageView, UnreadMessagesCountView, RecentMessagesView, ContactMessageDetailView,
    CustomLoginView, LogoutView, UpdateDashboardAccessView,
    CompleteModuleView, StudentWeekReviewView, StudentListView, WeeklyToppersView,
    WeekUpdateViewSet, ReviewFolderViewSet, ChatRoomList, ChatMessageList,
    ChatMessageListCreateView, ClearChatMessagesView, MarkMessagesReadView,
    UploadStudentDocumentView, NotificationViewSet, StudentDocumentListView,
    StudentDocumentDeleteView, MentorDocumentListView, UploadMentorDocumentView,
    MentorDocumentDeleteView, RespondToMessageView, ReviewAssignmentViewSet, 
    UnreadNotificationCountView, StudentReviewStatusView, StudentSubmissionListCreateView,
    SubmissionBulkUpdateView, 
)

router = DefaultRouter()
router.register('students', StudentViewSet, basename='student')
router.register('mentors', MentorViewSet)
router.register('reviewers', ReviewerViewSet)
router.register('courses', CourseViewSet)
router.register('modules', ModuleViewSet, basename='module')
router.register('days', DayViewSet, basename='day')
router.register('tasks', TaskViewSet)
router.register('batches', BatchViewSet)
router.register('student-modules', StudentModuleViewSet, basename='student-module')
router.register('week-updates', WeekUpdateViewSet, basename='week-update')
router.register('review-folders', ReviewFolderViewSet, basename='review-folder')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('review-assignments', ReviewAssignmentViewSet, basename='review-assignment')

urlpatterns = [
    # 👇 SPECIFIC PATHS MUST COME BEFORE THE ROUTER 👇
    path('api/notifications/unread-count/', UnreadNotificationCountView.as_view(), name='unread-count'),
    path('api/students/list/', StudentListView.as_view(), name='student-list'),
    path('api/', include(router.urls)),   # Router handles all other /api/... endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/me/', CurrentUserView.as_view(), name='current_user'),
    path('api/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/send-bulk-email/', SendBulkEmailView.as_view(), name='send_bulk_email'),
    path('api/request-password-reset/', RequestPasswordResetView.as_view(), name='request_password_reset'),
    path('api/reset-password/<str:token>/', ConfirmPasswordResetView.as_view(), name='reset_password'),
    path('api/contact/', ContactMessageView.as_view(), name='contact'),
    path('api/unread-messages/', UnreadMessagesCountView.as_view(), name='unread_messages'),
    path('api/recent-messages/', RecentMessagesView.as_view(), name='recent_messages'),
    path('api/contact-messages/<int:pk>/', ContactMessageDetailView.as_view(), name='contact_message_detail'),
    path('api/login/', CustomLoginView.as_view(), name='custom_login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/update-dashboard-access/', UpdateDashboardAccessView.as_view(), name='update-dashboard-access'),
    path('api/modules/<int:module_id>/complete/', CompleteModuleView.as_view(), name='complete-module'),
    path('api/week-review/<int:module_id>/', StudentWeekReviewView.as_view(), name='week-review'),
    path('api/weekly-toppers/', WeeklyToppersView.as_view(), name='weekly-toppers'),
    path('api/chat-rooms/', ChatRoomList.as_view(), name='chat-rooms'),
    path('api/chat-rooms/<int:room_id>/messages/', ChatMessageList.as_view(), name='chat-messages'),
    path('api/chat-messages/', ChatMessageListCreateView.as_view(), name='chat-messages'),
    path('api/chat-messages/clear/', ClearChatMessagesView.as_view(), name='clear-chat-messages'),
    path('api/chat-messages/mark-read/<int:room_id>/', MarkMessagesReadView.as_view(), name='mark-read'),
    path('api/chat-messages/<int:message_id>/respond/', RespondToMessageView.as_view(), name='respond_to_message'),
    # Student document endpoints
    path('api/upload-student-document/', UploadStudentDocumentView.as_view(), name='upload-student-doc'),
    path('api/students/<int:student_id>/documents/', StudentDocumentListView.as_view(), name='student-documents'),
    path('api/student-documents/<int:doc_id>/', StudentDocumentDeleteView.as_view(), name='delete-student-doc'),
    # Mentor document endpoints
    path('api/upload-mentor-document/', UploadMentorDocumentView.as_view(), name='upload-mentor-doc'),
    path('api/mentors/<int:mentor_id>/documents/', MentorDocumentListView.as_view(), name='mentor-documents'),
    path('api/mentor-documents/<int:doc_id>/', MentorDocumentDeleteView.as_view(), name='delete-mentor-doc'),
    path('api/student/review-status/', StudentReviewStatusView.as_view(), name='student-review-status'),
    path('api/submissions/', StudentSubmissionListCreateView.as_view(), name='submissions'),
    path('api/submissions/bulk-update/', SubmissionBulkUpdateView.as_view(), name='submission-bulk-update'),
]