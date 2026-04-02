from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    StudentViewSet, MentorViewSet, ReviewerViewSet, CurrentUserView,
    ChangePasswordView, SendBulkEmailView   # add SendBulkEmailView
)

router = DefaultRouter()
router.register('students', StudentViewSet)
router.register('mentors', MentorViewSet)
router.register('reviewers', ReviewerViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/me/', CurrentUserView.as_view(), name='current_user'),
    path('api/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/send-bulk-email/', SendBulkEmailView.as_view(), name='send_bulk_email'),  # new line
]