# accounts/views/core_views.py
import re
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q, Sum, Count
from django.db.models.functions import TruncMonth, TruncWeek, TruncYear
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import viewsets, status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.filters import BaseFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import RetrieveAPIView
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied

from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

# ✅ Fixed relative imports (two dots to go up to accounts/)
from ..base import SafeAPIView, SafeViewSet
from ..models import (
    User, Student, Course, Module, Day, Task, Batch, StudentModule,
    ContactMessage, StudentWeekReview, ChatRoom, ChatMessage,
)
from ..serializers import (
    CourseSerializer, ModuleSerializer, DaySerializer, TaskSerializer, BatchSerializer,
    ContactMessageSerializer, ChatRoomSerializer, ChatMessageSerializer,
)
from ..permissions import IsAdminOrReadOnly, IsStudentOwner, IsMentorOrReviewerOrAdmin


# =============================
# FILTER BACKENDS
# =============================
class CourseFilterBackend(BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        course_id = request.query_params.get('course')
        if course_id:
            return queryset.filter(course_id=course_id)
        return queryset


class DayFilterBackend(BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        day_id = request.query_params.get('day')
        if day_id:
            return queryset.filter(day_id=day_id)
        return queryset


# =============================
# BATCH
# =============================
class BatchViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Batch.objects.annotate(student_count=Count('students'))
    serializer_class = BatchSerializer
    permission_classes = [IsAdminOrReadOnly]


# =============================
# COURSE
# =============================
class CourseViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]


# =============================
# MODULE
# =============================
class ModuleViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    filter_backends = [CourseFilterBackend]
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=['get'], url_path='for-course')
    def for_course(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({"error": "course_id required"}, status=status.HTTP_400_BAD_REQUEST)

        common = Module.objects.filter(is_common=True)
        course = Module.objects.filter(course_id=course_id, is_common=False)

        modules = list(common) + list(course)
        modules.sort(key=lambda x: x.order or 0)

        return Response(self.get_serializer(modules, many=True).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def student_modules(self, request):
        try:
            user = request.user
            student_id = request.query_params.get('student_id')

            # Get student object
            if user.is_admin or user.is_mentor or user.is_reviewer:
                if not student_id:
                    return Response({"error": "student_id required"}, status=400)
                student = get_object_or_404(Student, id=student_id)
            else:
                student = Student.objects.filter(user=user).first()

            if not student:
                return Response([])

            # Start with common modules
            modules = list(Module.objects.filter(is_common=True).order_by('order'))

            # Add course‑specific modules if the student has a course
            if student.course:
                # Handle both string and FK course
                course_obj = student.course
                # If it's a string, try to get the Course object by name
                if isinstance(course_obj, str):
                    try:
                        from ..models import Course
                        course_obj = Course.objects.get(name=course_obj)
                    except Course.DoesNotExist:
                        course_obj = None
                if course_obj:
                    course_modules = Module.objects.filter(
                        course=course_obj,
                        is_common=False
                    ).order_by('order')
                    modules.extend(course_modules)
                    modules.sort(key=lambda x: x.order or 0)

            # Determine completed weeks from reviews
            reviews = StudentWeekReview.objects.filter(student=student)
            completed = {
                r.module.order for r in reviews
                if r.task_status == 'Task Completed' and r.module.order is not None
            }
            current_week = max(completed) if completed else 0

            data = []
            for m in modules:
                week = m.order or 0
                data.append({
                    "id": m.id,
                    "title": m.title,
                    "order": m.order,
                    "is_common": m.is_common,
                    "is_locked": week > current_week + 1
                })

            return Response(data)

        except Exception as e:
            import traceback
            traceback.print_exc()
            # Return detailed error to client for debugging
            return Response({"error": f"{type(e).__name__}: {str(e)}"}, status=400)



# =============================
# DAY
# =============================
class DayViewSet(SafeViewSet, viewsets.ModelViewSet):
    serializer_class = DaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Day.objects.all().order_by('order')
        module_id = self.request.query_params.get('module')
        if module_id:
            qs = qs.filter(module_id=module_id)
        return qs


# =============================
# TASK
# =============================
class TaskViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends = [DayFilterBackend]
    permission_classes = [IsAdminOrReadOnly]


# =============================
# EMAIL
# =============================
class SendBulkEmailView(SafeAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_admin:
            return Response({"detail": "Admin only"}, status=403)

        subject = request.data.get("subject")
        message = request.data.get("message")

        users = User.objects.filter(is_active=True).exclude(email__isnull=True)
        emails = [u.email for u in users]

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, emails)
        return Response({"detail": "Emails sent"})


# =============================
# CONTACT
# =============================
class ContactMessageView(SafeAPIView):
    permission_classes = []

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Sent"}, status=201)
        return Response(serializer.errors, status=400)


class UnreadMessagesCountView(SafeAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({"detail": "Unauthorized"}, status=403)

        count = ContactMessage.objects.filter(is_read=False).count()
        return Response({"unread_count": count})


class RecentMessagesView(SafeAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        msgs = ContactMessage.objects.order_by('-created_at')[:10]
        return Response(ContactMessageSerializer(msgs, many=True).data)


class ContactMessageDetailView(SafeAPIView, RetrieveAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_admin:
            return Response({"detail": "Unauthorized"}, status=403)

        msg = get_object_or_404(ContactMessage, pk=pk)
        msg.is_read = True
        msg.save()
        return Response({"detail": "Marked read"})


# =============================
# CHAT
# =============================
class ChatRoomList(SafeAPIView, generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_reviewer:
            return ChatRoom.objects.filter(reviewer__user=user)

        if user.is_mentor:
            return ChatRoom.objects.filter(mentor__user=user)

        if user.is_student:
            return ChatRoom.objects.filter(student__user=user)

        return ChatRoom.objects.none()


class ChatMessageListCreateView(SafeAPIView, generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room = self.request.query_params.get("room")
        return ChatMessage.objects.filter(room_id=room).order_by("-timestamp")

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class ClearChatMessagesView(SafeAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        room_id = request.query_params.get("room")
        room = get_object_or_404(ChatRoom, id=room_id)

        if not (
            room.mentor and room.mentor.user == request.user or
            room.student and room.student.user == request.user or
            room.reviewer and room.reviewer.user == request.user
        ):
            return Response({"detail": "Not allowed"}, status=403)

        room.messages.all().delete()
        return Response({"detail": "Cleared"})


# =============================
# UTILITY (optional, if not already present elsewhere)
# =============================
class UpdateDashboardAccessView(SafeAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.last_dashboard_access = timezone.now()
        user.save(update_fields=['last_dashboard_access'])
        return Response({"detail": "Dashboard access updated."})


class RecentMessagesAPIView(SafeAPIView, generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        return ContactMessage.objects.all().order_by('-created_at')
    


class MarkMessagesReadView(SafeAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        try:
            room = get_object_or_404(ChatRoom, id=room_id)
            updated = ChatMessage.objects.filter(room=room, is_read=False).exclude(sender=request.user).update(
                is_read=True,
                read_at=timezone.now()
            )
            return Response({"marked_read": updated}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Bad request"}, status=status.HTTP_400_BAD_REQUEST)
        