from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser

from django.shortcuts import get_object_or_404
from django.utils import timezone

from ..models import (
    User, Student, Mentor, Reviewer,
    Module, StudentModule, Course, CourseStatus,
    StudentDocument, WeeklySubmission,
    StudentWeekReview, Notification
)

from ..serializers import (
    StudentSerializer, ModuleSerializer,
    StudentDocumentSerializer, WeeklySubmissionSerializer,
    CourseStatusSerializer, StudentModuleSerializer
)

from ..base import SafeAPIView, SafeViewSet


# Helper to safely get course name (CharField – already string)
def _get_course_name(student):
    return student.course if student.course else None


# Helper to safely get batch name – handles possible field names
def _get_batch_name(student):
    # Try common field names for batch
    batch_obj = None
    if hasattr(student, 'student_batch'):
        batch_obj = student.student_batch
    elif hasattr(student, 'batch'):
        batch_obj = student.batch
    elif hasattr(student, 'batch_id'):
        batch_obj = student.batch_id

    if not batch_obj:
        return None
    if hasattr(batch_obj, 'name'):
        return batch_obj.name
    return str(batch_obj)


# =====================================================
# STUDENT VIEWSET
# =====================================================
class StudentViewSet(SafeViewSet, viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Student.objects.filter(user__is_active=True)

        if getattr(user, 'is_admin', False):
            mentor_id = self.request.query_params.get('mentor')
            if mentor_id:
                qs = qs.filter(mentor_id=mentor_id)
            return qs

        if getattr(user, 'is_mentor', False):
            try:
                mentor = Mentor.objects.get(user=user)
                return qs.filter(mentor=mentor)
            except Mentor.DoesNotExist:
                return qs.none()

        if getattr(user, 'is_reviewer', False):
            try:
                reviewer = Reviewer.objects.get(user=user)
                if reviewer.course:
                    return qs.filter(course=reviewer.course)
            except Reviewer.DoesNotExist:
                pass
            return qs.none()

        return qs.filter(user=user)

    def list(self, request, *args, **kwargs):
        try:
            user = request.user
            is_admin = getattr(user, 'is_admin', False)
            is_mentor = getattr(user, 'is_mentor', False)

            if is_admin or is_mentor:
                # ✅ Fixed: use 'mentor__user' to follow the mentor -> user relation
                students = Student.objects.select_related('user', 'student_batch', 'mentor__user').all()
                data = []
                for s in students:
                    # Safely get course name (supports CharField or ForeignKey)
                    course_name = None
                    if s.course:
                        if hasattr(s.course, 'name'):
                            course_name = s.course.name
                        else:
                            course_name = str(s.course)

                    # Safely get batch name
                    batch_name = None
                    if s.student_batch:
                        batch_name = s.student_batch.name if hasattr(s.student_batch, 'name') else str(s.student_batch)

                    item = {
                        "id": s.id,
                        "full_name": s.full_name or s.user.username,
                        "email": s.user.email,
                        "course": course_name,
                        "batch": batch_name,
                        "phone": s.phone,
                        "date_of_birth": s.date_of_birth,
                        "age": s.age,
                        "gender": s.gender,
                        "mentor": s.mentor.id if s.mentor else None,
                    }
                    data.append(item)
                return Response(data)

            # Other roles (reviewer, student) use the full serializer
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"{type(e).__name__}: {str(e)}"}, status=400)

    @action(detail=False, methods=['get'])
    def me(self, request):
        student, _ = Student.objects.get_or_create(
            user=request.user,
            defaults={
                "course": "",
                "full_name": request.user.username
            }
        )
        return Response(self.get_serializer(student).data)

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        student = self.get_object()
        modules = StudentModule.objects.filter(student=student)
        completed = [
            m.module.order for m in modules
            if m.is_completed and m.module and m.module.order is not None
        ]
        current = max(completed) if completed else 0
        total = 52
        percent = round((current / total) * 100, 2) if total else 0
        return Response({
            "student": student.full_name,
            "completed_weeks": sorted(completed),
            "current_week": current,
            "progress": percent
        })

    def destroy(self, request, *args, **kwargs):
        student = self.get_object()
        student.user.is_active = False
        student.user.save()
        student.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    


# =====================================================
# STUDENT LIST (Simple endpoint – kept for backward compatibility)
# =====================================================
class StudentListView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if getattr(user, 'is_reviewer', False):
            reviewer = Reviewer.objects.get(user=user)
            students = Student.objects.filter(course=reviewer.course)
        elif getattr(user, 'is_mentor', False):
            mentor = Mentor.objects.get(user=user)
            students = Student.objects.filter(mentor=mentor)
        elif getattr(user, 'is_admin', False):
            students = Student.objects.all()
        else:
            return Response({"detail": "Not authorized"}, status=403)

        return Response([
            {
                "id": s.id,
                "name": s.full_name,
                "email": s.user.email,
                "course": _get_course_name(s),
                "batch": _get_batch_name(s),
            }
            for s in students
        ])


# =====================================================
# COURSE STATUS
# =====================================================
class StudentCourseStatusView(SafeAPIView, generics.RetrieveUpdateAPIView):
    serializer_class = CourseStatusSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        student_id = self.request.query_params.get("student_id")
        if not student_id:
            raise ValidationError("student_id required")
        student = get_object_or_404(Student, id=student_id)
        if not student.course:
            raise ValidationError("Student has no course")
        obj, _ = CourseStatus.objects.get_or_create(
            student=student,
            course_name=student.course
        )
        return obj


# =====================================================
# MODULE COMPLETE
# =====================================================
class CompleteModuleView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, module_id):
        student = Student.objects.get(user=request.user)
        module = Module.objects.get(id=module_id)
        obj, _ = StudentModule.objects.get_or_create(student=student, module=module)
        obj.is_completed = True
        obj.completed_at = timezone.now()
        obj.save()
        return Response({"message": "Module completed"})


# =====================================================
# DOCUMENTS
# =====================================================
class UploadStudentDocumentView(SafeAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        student_id = request.data.get("student")
        if not file or not student_id:
            return Response({"error": "file + student required"}, status=400)
        student = Student.objects.get(id=student_id)
        doc = StudentDocument.objects.create(student=student, file=file)
        return Response(StudentDocumentSerializer(doc).data)


class StudentDocumentListView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)
            docs = student.student_documents.all()
            serializer = StudentDocumentSerializer(docs, many=True, context={'request': request})
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)


class StudentDocumentDeleteView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, doc_id):
        try:
            doc = StudentDocument.objects.get(id=doc_id)
            doc.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except StudentDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)


# =====================================================
# SUBMISSIONS
# =====================================================
class StudentSubmissionListCreateView(SafeAPIView, generics.ListCreateAPIView):
    serializer_class = WeeklySubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "student_profile"):
            return WeeklySubmission.objects.filter(student=user.student_profile)
        return WeeklySubmission.objects.all()

    def perform_create(self, serializer):
        if not hasattr(self.request.user, "student_profile"):
            raise ValidationError("Only students allowed")
        student = self.request.user.student_profile
        submission = serializer.save(student=student)
        if student.mentor:
            Notification.objects.create(
                user=student.mentor.user,
                message=f"{student.full_name} submitted work",
                link="/mentor/review"
            )


# =====================================================
# REVIEW STATUS
# =====================================================
class StudentReviewStatusView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response([])
        reviews = StudentWeekReview.objects.filter(student=student)
        data = []
        for r in reviews:
            if r.total_score is None:
                status_val = "pending"
            elif r.total_score >= 30:
                status_val = "completed"
            elif r.total_score >= 15:
                status_val = "need_improvement"
            else:
                status_val = "critical"
            data.append({
                "module_id": r.module.id,
                "status": status_val
            })
        return Response(data)


# =====================================================
# STUDENT MODULE
# =====================================================
class StudentModuleViewSet(SafeViewSet, viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self.request.user, 'is_admin', False):
            return Module.objects.filter(is_common=False)
        student = Student.objects.filter(user=self.request.user).first()
        if not student:
            return Module.objects.none()
        module_ids = StudentModule.objects.filter(student=student).values_list('module_id', flat=True)
        return Module.objects.filter(id__in=module_ids, is_common=False)
    