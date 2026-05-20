from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action

from django.utils import timezone

from ..models import (
    Mentor,
    Student,
    Module,
    StudentWeekReview,
    WeeklySubmission,
    MentorDocument,
    Notification
)

from ..serializers import (
    MentorSerializer,
    MentorDocumentSerializer
)

from accounts.base import SafeAPIView, SafeViewSet


# ------------------------------
# MENTOR VIEWSET
# ------------------------------
class MentorViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Mentor.objects.all()
    serializer_class = MentorSerializer
    permission_classes = [IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        mentor = self.get_object()
        mentor.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        mentor = Mentor.objects.filter(user=request.user).first()
        if not mentor:
            return Response({"detail": "Mentor profile not found"}, status=404)
        return Response(self.get_serializer(mentor).data)


# ------------------------------
# WEEKLY TOPPERS
# ------------------------------
class WeeklyToppersView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not (user.is_admin or user.is_mentor):
            return Response({"detail": "Not authorized"}, status=403)

        modules = Module.objects.all().order_by('order')

        data = []

        for module in modules:
            reviews = StudentWeekReview.objects.filter(
                module=module,
                total_score__isnull=False
            ).select_related('student', 'student__user').order_by('-total_score')[:3]

            toppers = []
            for i, r in enumerate(reviews, 1):
                toppers.append({
                    "rank": i,
                    "student_name": r.student.full_name or r.student.user.username,
                    "score": r.total_score
                })

            data.append({
                "week_id": module.id,
                "week_title": module.title,
                "week_order": module.order,
                "toppers": toppers
            })

        return Response(data)


# ------------------------------
# BULK SUBMISSION UPDATE
# ------------------------------
class SubmissionBulkUpdateView(SafeAPIView, generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updates = request.data.get("updates", [])

        for upd in updates:
            submission = WeeklySubmission.objects.get(id=upd["id"])

            old_reviewed = submission.reviewed
            old_marks = submission.marks
            old_feedback = submission.mentor_feedback

            if "marks" in upd:
                submission.marks = upd["marks"]

            if "mentor_feedback" in upd:
                submission.mentor_feedback = upd["mentor_feedback"]

            if "reviewed" in upd:
                submission.reviewed = upd["reviewed"]
                submission.reviewed_at = timezone.now() if upd["reviewed"] else None

            submission.save()

            # Notifications
            if submission.reviewed and not old_reviewed:
                Notification.objects.create(
                    user=submission.student.user,
                    message=f"✅ Reviewed: Week {submission.week.order}",
                    link="/student/submissions",
                    is_read=False
                )

            elif submission.reviewed and (submission.marks != old_marks or submission.mentor_feedback != old_feedback):
                Notification.objects.create(
                    user=submission.student.user,
                    message=f"📝 Updated review for week {submission.week.order}",
                    link="/student/submissions",
                    is_read=False
                )

            elif not submission.reviewed and submission.reviewed != old_reviewed:
                Notification.objects.create(
                    user=submission.student.user,
                    message=f"ℹ️ Review reverted to pending",
                    link="/student/submissions",
                    is_read=False
                )

        return Response({"status": "ok"})


# ------------------------------
# MENTOR DOCUMENTS
# ------------------------------
class MentorDocumentListView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, mentor_id):
        mentor = Mentor.objects.filter(id=mentor_id).first()
        if not mentor:
            return Response({"error": "Mentor not found"}, status=404)

        docs = mentor.mentor_documents.all()
        return Response(MentorDocumentSerializer(docs, many=True).data)


class UploadMentorDocumentView(SafeAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        mentor_id = request.data.get("mentor")

        if not file or not mentor_id:
            return Response({"error": "file and mentor required"}, status=400)

        mentor = Mentor.objects.filter(id=mentor_id).first()
        if not mentor:
            return Response({"error": "Mentor not found"}, status=404)

        doc = MentorDocument.objects.create(mentor=mentor, file=file)

        return Response(MentorDocumentSerializer(doc).data, status=201)


class MentorDocumentDeleteView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, doc_id):
        doc = MentorDocument.objects.filter(id=doc_id).first()

        if not doc:
            return Response({"error": "Document not found"}, status=404)

        doc.delete()
        return Response(status=204)
    



