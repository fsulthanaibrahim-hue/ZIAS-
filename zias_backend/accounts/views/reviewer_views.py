from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.decorators import action

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.core.exceptions import ValidationError, PermissionDenied
import re

from ..models import (
    User, Reviewer, Student, Mentor,
    ReviewFolder, ReviewAssignment,
    ChatMessage, Notification
)

from ..serializers import (
    ReviewerSerializer,
    ReviewFolderSerializer,
    ReviewAssignmentSerializer,
    ChatMessageSerializer,
    StudentSerializer
)

from accounts.base import SafeAPIView, SafeViewSet
from ..permissions import IsMentorOrReviewerOrAdmin


# ------------------------------
# REVIEWER VIEWSET
# ------------------------------
class ReviewerViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Reviewer.objects.all()
    serializer_class = ReviewerSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'me']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def destroy(self, request, *args, **kwargs):
        reviewer = self.get_object()
        reviewer.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        reviewer = Reviewer.objects.filter(user=request.user).first()
        if not reviewer:
            return Response({"detail": "Reviewer profile not found"}, status=404)
        return Response(self.get_serializer(reviewer).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_availability(self, request, pk=None):
        reviewer = self.get_object()

        if request.user != reviewer.user and not request.user.is_admin:
            return Response({"detail": "Not allowed"}, status=403)

        serializer = self.get_serializer(reviewer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ------------------------------
# REVIEWER DASHBOARD
# ------------------------------
class ReviewerDashboardView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviewer = Reviewer.objects.filter(user=request.user).first()
        if not reviewer:
            return Response({"error": "You are not a reviewer"}, status=403)

        students = Student.objects.filter(course=reviewer.course)

        return Response({
            "reviewer_name": reviewer.user.username,
            "total_students": students.count(),
            "students": StudentSerializer(students, many=True).data,
        })


# ------------------------------
# REVIEW ASSIGNMENT VIEWSET
# ------------------------------
class ReviewAssignmentViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = ReviewAssignment.objects.all()
    serializer_class = ReviewAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        try:
            if user.is_mentor:
                mentor = Mentor.objects.get(user=user)
                return ReviewAssignment.objects.filter(mentor=mentor)

            if user.is_reviewer:
                reviewer = Reviewer.objects.get(user=user)
                return ReviewAssignment.objects.filter(reviewer=reviewer)

            if user.is_admin:
                return ReviewAssignment.objects.all()

        except (Mentor.DoesNotExist, Reviewer.DoesNotExist):
            return ReviewAssignment.objects.none()

        return ReviewAssignment.objects.none()

    def perform_create(self, serializer):
        if not self.request.user.is_mentor:
            raise PermissionDenied("Only mentors can create assignments")

        mentor = Mentor.objects.get(user=self.request.user)
        reviewer_id = self.request.data.get("reviewer")

        if not reviewer_id:
            raise ValidationError({"reviewer": "Reviewer ID required"})

        reviewer = Reviewer.objects.get(id=reviewer_id)

        assignment = serializer.save(
            mentor=mentor,
            reviewer=reviewer,
            status="assigned"
        )

        Notification.objects.create(
            user=reviewer.user,
            message=f"New assignment from {mentor.user.username}",
            link="/reviewer/assignments",
            is_read=False
        )

    # ---------------- ACCEPT ----------------
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        assignment = self.get_object()

        if not (request.user.is_reviewer or request.user.is_mentor):
            return Response({"error": "Not allowed"}, status=403)

        assignment.status = "accepted"
        assignment.save()

        return Response({"status": "accepted"})

    # ---------------- REJECT ----------------
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        assignment = self.get_object()

        if not (request.user.is_reviewer or request.user.is_mentor):
            return Response({"error": "Not allowed"}, status=403)

        assignment.status = "rejected"
        assignment.comments = request.data.get("comments", "")
        assignment.save()

        return Response({"status": "rejected"})

    # ---------------- SUGGEST TIME ----------------
    @action(detail=True, methods=['post'])
    def suggest_time(self, request, pk=None):
        assignment = self.get_object()

        if not request.user.is_reviewer:
            return Response({"error": "Only reviewer can suggest time"}, status=403)

        time = request.data.get("proposed_time")
        if not time:
            return Response({"error": "proposed_time required"}, status=400)

        assignment.comments = f"{assignment.comments or ''}\nSuggested time: {time}"
        assignment.status = "pending approval"
        assignment.save()

        return Response({"status": "time suggested"})


# ------------------------------
# REVIEW FOLDER VIEWSET
# ------------------------------
class ReviewFolderViewSet(SafeViewSet, viewsets.ModelViewSet):
    serializer_class = ReviewFolderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReviewFolder.objects.all()

    def perform_create(self, serializer):
        obj = serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )
        self._sync(obj)

    def perform_update(self, serializer):
        obj = serializer.save(updated_by=self.request.user)
        self._sync(obj)

    def _sync(self, obj):
        if not obj.industry_expert:
            return

        reviewer = Reviewer.objects.filter(
            Q(full_name__iexact=obj.industry_expert) |
            Q(user__username__iexact=obj.industry_expert)
        ).first()

        if not reviewer:
            return

        Notification.objects.create(
            user=reviewer.user,
            message="You got a new review folder",
            link="/reviewer/assignments",
            is_read=False
        )


# ------------------------------
# CHAT RESPONSE
# ------------------------------
class RespondToMessageView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        message = get_object_or_404(ChatMessage, id=message_id)

        if not (message.room.reviewer and message.room.reviewer.user == request.user):
            return Response({"error": "Not authorized"}, status=403)

        action = request.data.get("action")

        if action not in ["accepted", "rejected"]:
            return Response({"error": "Invalid action"}, status=400)

        message.action = action
        message.responded_at = timezone.now()
        message.save()

        return Response(ChatMessageSerializer(message).data)