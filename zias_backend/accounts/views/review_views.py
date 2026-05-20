from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404

from ..models import (
    Student, StudentWeekReview, Module,
    WeekUpdate, Review,
    StudentModule, Notification
)

from ..serializers import (
    StudentWeekReviewSerializer,
    WeekUpdateSerializer,
    ReviewSerializer
)

from accounts.base import SafeAPIView, SafeViewSet


# ------------------------------
# STUDENT WEEK REVIEW
# ------------------------------
class StudentWeekReviewView(SafeAPIView, generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StudentWeekReviewSerializer

    def get_object(self):
        module_id = self.kwargs.get('module_id')
        user = self.request.user
        student_id = self.request.query_params.get('student_id')

        if user.is_admin or user.is_mentor or user.is_reviewer:
            if not student_id:
                raise ValidationError({"detail": "student_id required"})
            student = get_object_or_404(Student, id=student_id)
        else:
            if not hasattr(user, "is_student") or not user.is_student:
                raise PermissionDenied("Access denied")
            student = get_object_or_404(Student, user=user)

        obj, _ = StudentWeekReview.objects.get_or_create(
            student=student,
            module_id=module_id
        )
        return obj

    def perform_update(self, serializer):
        old_instance = serializer.instance
        old_status = old_instance.task_status if old_instance else None

        review = serializer.save()

        # Task completed notification
        if review.task_status == 'Task Completed' and old_status != 'Task Completed':
            Notification.objects.create(
                user=review.student.user,
                message=f"🎉 Week {review.module.order} review completed!",
                link="/student/review-sheet",
                is_read=False
            )

        # Module completion logic
        if review.total_score is not None and review.total_score >= 30:
            student_module, created = StudentModule.objects.get_or_create(
                student=review.student,
                module=review.module
            )

            if not student_module.is_completed:
                student_module.is_completed = True
                student_module.completed_at = timezone.now()
                student_module.save()

                Notification.objects.create(
                    user=review.student.user,
                    message=f"🏆 Module completed: {review.module.title}",
                    link="/student/modules",
                    is_read=False
                )


# ------------------------------
# WEEK UPDATE VIEWSET
# ------------------------------
class WeekUpdateViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = WeekUpdate.objects.all()
    serializer_class = WeekUpdateSerializer
    permission_classes = [IsAuthenticated]


# ------------------------------
# REVIEW VIEWSET
# ------------------------------
class ReviewViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]