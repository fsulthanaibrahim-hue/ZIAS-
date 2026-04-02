from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import StudentViewSet, MentorViewSet, ReviewerViewSet, CurrentUserView  # import CurrentUserView

router = DefaultRouter()
router.register('students', StudentViewSet)
router.register('mentors', MentorViewSet)
router.register('reviewers', ReviewerViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/me/', CurrentUserView.as_view(), name='current_user'),  # add this line
]