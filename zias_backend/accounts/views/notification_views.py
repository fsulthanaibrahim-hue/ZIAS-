from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.decorators import action   # ✅ FIX ADDED

from ..models import Notification
from ..serializers import NotificationSerializer
from accounts.base import SafeAPIView, SafeViewSet


# ------------------------------
# PAGINATION
# ------------------------------
class NotificationPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100


# ------------------------------
# NOTIFICATION VIEWSET
# ------------------------------
class NotificationViewSet(SafeViewSet, viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked read'})


# ------------------------------
# UNREAD COUNT API
# ------------------------------
class UnreadNotificationCountView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()

        return Response({'unread_count': count})