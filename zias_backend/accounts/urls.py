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
    WeekUpdateViewSet, ReviewFolderViewSet, ChatRoomList, ChatMessageList, CreateMessageView
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

urlpatterns = [
    path('api/students/list/', StudentListView.as_view(), name='student-list'),
    path('api/students/me/', StudentViewSet.as_view({'get': 'get_me'}), name='student-me'),
    path('api/', include(router.urls)),
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
    path('api/chat-messages/', CreateMessageView.as_view(), name='create-message'),
]