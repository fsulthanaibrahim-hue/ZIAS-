import re
from rest_framework import viewsets, status, generics, permissions
from .models import Notification
from rest_framework.generics import RetrieveAPIView
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import BaseFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from django.utils import timezone
from django.db.models import Q, Sum
from django.db import models
from django.shortcuts import get_object_or_404
from django.utils.crypto import get_random_string
from datetime import timedelta, datetime
from django.core.mail import send_mail
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django.contrib.auth import authenticate
from .utils import generate_random_password, send_password_email
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from datetime import datetime
from django.db.models.functions import TruncMonth, TruncWeek, TruncYear
from django.db.models import Count

from .models import (
    User, Student, Mentor, Reviewer, Course, Module, Day, Task, Batch,
    StudentModule, PasswordResetToken, ContactMessage, StudentWeekReview, WeekUpdate, 
    ReviewFolder, ChatRoom, ChatMessage, CourseStatus, Notification, StudentDocument,
    MentorDocument, ReviewAssignment, WeeklySubmission, AttendanceRecord, FeePayment, 
    Accounts, FeeStructure, InstallmentSchedule, StudentFee, StudentFeePayment, Review
)

from .serializers import (
    StudentSerializer, MentorSerializer, ReviewerSerializer, UserSerializer,
    CourseSerializer, ModuleSerializer, DaySerializer, TaskSerializer, BatchSerializer,
    ContactMessageSerializer, StudentModuleSerializer, StudentWeekReviewSerializer, 
    WeekUpdateSerializer, ReviewFolderSerializer, ChatRoomSerializer, ChatMessageSerializer, 
    CourseStatusSerializer, NotificationSerializer, StudentDocumentSerializer, MentorDocumentSerializer, 
    ReviewAssignmentSerializer, WeeklySubmissionSerializer, AttendanceRecordSerializer, FeePaymentSerializer,
    AccountsSerializer, FeeStructureSerializer, InstallmentScheduleSerializer, StudentFeePaymentSerializer, 
    StudentFeeSerializer, ReviewSerializer
)

from .permissions import (
    IsAdminUser, IsAdminOrReadOnly, IsStudentOwner, IsMentorOrReviewerOrAdmin
)

import secrets
import string

def generate_random_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def send_password_email(user, password):
    pass  



# ====================== SAFE ERROR HANDLING ======================
# Convert only unhandled server errors (5xx) into 400 Bad Request.
# Keep client errors (401, 403, 404) unchanged.

class SafeAPIView(APIView):
    def handle_exception(self, exc):
        # Let DRF handle known exceptions with their original status
        if isinstance(exc, (ValidationError, NotFound, PermissionDenied)):
            return super().handle_exception(exc)
        # Do NOT override authentication/permission errors – keep them as is
        if hasattr(exc, 'status_code') and exc.status_code in (401, 403):
            return super().handle_exception(exc)
        # For any other exception (including server errors), return 400
        return Response(
            {"error": "Bad request. Please check your input and try again."},
            status=status.HTTP_400_BAD_REQUEST
        )

class SafeViewSet(viewsets.GenericViewSet):
    def handle_exception(self, exc):
        if isinstance(exc, (ValidationError, NotFound, PermissionDenied)):
            return super().handle_exception(exc)
        if hasattr(exc, 'status_code') and exc.status_code in (401, 403):
            return super().handle_exception(exc)
        return Response(
            {"error": "Bad request. Please check your input and try again."},
            status=status.HTTP_400_BAD_REQUEST
        )
# ================================================================


# ----------------------------
# Custom Filter Backends
# ----------------------------
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


# ----------------------------
# BATCH VIEWSET
# ----------------------------
class BatchViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Batch.objects.annotate(student_count=Count('students'))
    serializer_class = BatchSerializer
    permission_classes = [IsAdminOrReadOnly]


# ----------------------------
# STUDENT VIEWSET
# ----------------------------
class StudentViewSet(SafeViewSet, viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Student.objects.filter(user__is_active=True)
        if user.is_admin:
            mentor_id = self.request.query_params.get('mentor')
            if mentor_id:
                queryset = queryset.filter(mentor_id=mentor_id)
        elif user.is_mentor:
            try:
                mentor = Mentor.objects.get(user=user)
                queryset = queryset.filter(mentor=mentor)
            except Mentor.DoesNotExist:
                queryset = queryset.none()
        elif user.is_reviewer:
            try:
                reviewer = Reviewer.objects.get(user=user)
                if reviewer.course:
                    queryset = queryset.filter(course=reviewer.course)
                else:
                    queryset = queryset.none()
            except Reviewer.DoesNotExist:
                queryset = queryset.none()
        else:
            queryset = queryset.filter(user=user)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create a new student"""
        print("=" * 50)
        print("CREATE STUDENT - DATA:", request.data)
        print("=" * 50)
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print("ERRORS:", serializer.errors)
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            print("✅ Student created")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("❌ ERROR:", str(e))
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        """Update a student"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        data = request.data.copy()
        
        if 'email' in data and data['email'] == instance.user.email:
            data.pop('email')
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        user = request.user
        if user.is_mentor:
            data = []
            for student in queryset.select_related('user'):
                data.append({
                    "id": student.id,
                    "username": student.user.username,
                    "full_name": student.full_name,
                    "course": student.course,
                    "batch": student.batch,
                })
            return Response(data)
        elif user.is_reviewer:
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        user = request.user
        if not user.is_student:
            return Response({"detail": "User is not a student"}, status=status.HTTP_403_FORBIDDEN)
        student, created = Student.objects.get_or_create(
            user=user,
            defaults={
                'course': '',
                'batch': '',
                'full_name': user.get_full_name() or user.username,
            }
        )
        if created:
            print(f"Auto-created student profile for {user.username}")
        serializer = self.get_serializer(student)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='progress')
    def progress(self, request, pk=None):
        try:
            student = self.get_object()
            student_modules = StudentModule.objects.filter(student=student).select_related('module')
            completed_weeks = []
            for sm in student_modules:
                if sm.is_completed and sm.module and sm.module.order is not None:
                    completed_weeks.append(int(sm.module.order))
            current_week = max(completed_weeks) if completed_weeks else 0
            next_week = current_week + 1
            total_weeks = 52
            if student.course:
                course_obj = Course.objects.filter(name=student.course).first()
                if course_obj and course_obj.duration:
                    total_weeks = int(course_obj.duration)
            progress_percent = round((current_week / total_weeks) * 100, 1) if total_weeks else 0
            return Response({
                'student_id': student.id,
                'full_name': student.full_name or student.user.username,
                'course': student.course or '',
                'batch': student.batch or '',
                'completed_weeks': sorted(completed_weeks),
                'current_week': current_week,
                'next_week': next_week if next_week <= total_weeks else None,
                'total_weeks': total_weeks,
                'progress_percent': progress_percent,
            })
        except Exception:
            return Response({"error": "Bad request. Please check your input and try again."}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        student = self.get_object()
        user = student.user
        user.is_active = False
        user.save()
        student.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

# ----------------------------
# MENTOR VIEWSET
# ----------------------------
class MentorViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Mentor.objects.all()
    serializer_class = MentorSerializer
    permission_classes = [IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        mentor = self.get_object()
        user = mentor.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        try:
            mentor = Mentor.objects.get(user=request.user)
            serializer = self.get_serializer(mentor)
            return Response(serializer.data)
        except Mentor.DoesNotExist:
            return Response({"detail": "Mentor profile not found"}, status=status.HTTP_404_NOT_FOUND)


# ----------------------------
# REVIEWER VIEWSET
# ----------------------------
class ReviewerViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Reviewer.objects.all()
    serializer_class = ReviewerSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'me']:
            return [IsAuthenticated()]
        else:
            return [IsAdminUser()]

    def destroy(self, request, *args, **kwargs):
        reviewer = self.get_object()
        user = reviewer.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        try:
            reviewer = Reviewer.objects.get(user=request.user)
            serializer = self.get_serializer(reviewer)
            return Response(serializer.data)
        except Reviewer.DoesNotExist:
            return Response({"detail": "Reviewer profile not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_availability(self, request, pk=None):
        reviewer = self.get_object()
        if request.user != reviewer.user and not request.user.is_admin:
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(reviewer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ----------------------------
# COURSE VIEWSET
# ----------------------------
class CourseViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]


# ----------------------------
# MODULE VIEWSET
# ----------------------------
class ModuleViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    filter_backends = [CourseFilterBackend]
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=['get'], url_path='for-course')
    def for_course(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({"error": "course_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        common_modules = Module.objects.filter(is_common=True)
        course_modules = Module.objects.filter(course_id=course_id, is_common=False)
        all_modules = list(common_modules) + list(course_modules)
        all_modules.sort(key=lambda x: x.order)
        serializer = self.get_serializer(all_modules, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='student-modules', permission_classes=[IsAuthenticated])
    def student_modules(self, request):
        user = request.user
        student_id = request.query_params.get('student_id')

        if user.is_admin or user.is_mentor or user.is_reviewer:
            if student_id:
                student = get_object_or_404(Student, id=student_id)
            else:
                if not user.is_student:
                    return Response([])
                student, _ = Student.objects.get_or_create(
                    user=user,
                    defaults={'course': '', 'batch': ''}
                )
        else:
            if not user.is_student:
                return Response([])
            student, _ = Student.objects.get_or_create(
                user=user,
                defaults={'course': '', 'batch': ''}
            )

        common_modules = Module.objects.filter(is_common=True).order_by('order')
        if not student.course:
            all_modules = list(common_modules)
        else:
            course_modules = Module.objects.filter(course__name=student.course, is_common=False).order_by('order')
            all_modules = list(common_modules) + list(course_modules)
            all_modules.sort(key=lambda x: x.order)

        reviews = StudentWeekReview.objects.filter(student=student)
        completed_weeks = set()
        for review in reviews:
            if review.task_status == 'Task Completed':
                week_order = review.module.order
                if week_order is not None:
                    completed_weeks.add(week_order)
        current_week = max(completed_weeks) if completed_weeks else 0

        result = []
        for module in all_modules:
            week_num = module.order or 0
            is_locked = week_num > current_week + 1
            result.append({
                'id': module.id,
                'title': module.title,
                'content': module.content,
                'order': module.order,
                'course_name': module.course.name if module.course else None,
                'is_common': module.is_common,
                'is_locked': is_locked,
                'completion_percentage': 0,
            })
        return Response(result)


# ----------------------------
# COMPLETE MODULE VIEW
# ----------------------------
class CompleteModuleView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, module_id):
        user = request.user
        if not user.is_student:
            return Response({"detail": "Only students can complete modules."}, status=status.HTTP_403_FORBIDDEN)
        student, created = Student.objects.get_or_create(
            user=user,
            defaults={'course': '', 'batch': ''}
        )
        if created:
            print(f"Created missing student profile for {user.username} during module completion")
        try:
            module = Module.objects.get(id=module_id)
        except Module.DoesNotExist:
            return Response({"detail": "Module not found."}, status=status.HTTP_404_NOT_FOUND)
        student_module, created = StudentModule.objects.get_or_create(student=student, module=module)
        student_module.is_completed = True
        student_module.completed_at = timezone.now()
        student_module.save()
        if module.course and hasattr(module, 'order'):
            course_status, _ = CourseStatus.objects.get_or_create(
                student=student,
                course_name=student.course,
                defaults={'current_week': 1}
            )
            total_weeks = Module.objects.filter(course=module.course).count()
            if module.order == course_status.current_week:
                if course_status.current_week < total_weeks:
                    course_status.current_week += 1
                    course_status.save(update_fields=['current_week'])
                else:
                    course_status.ended_at = timezone.now()
                    course_status.save(update_fields=['ended_at'])
        return Response({"detail": f"Module '{module.title}' marked as completed."}, status=status.HTTP_200_OK)


# ----------------------------
# STUDENT MODULE VIEWSET
# ----------------------------
class StudentModuleViewSet(SafeViewSet, viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin:
            return Module.objects.filter(is_common=False)
        try:
            student = Student.objects.get(user=self.request.user)
            student_modules = StudentModule.objects.filter(student=student)
            module_ids = [sm.module.id for sm in student_modules]
            return Module.objects.filter(id__in=module_ids, is_common=False)
        except Student.DoesNotExist:
            return Module.objects.none()

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# ----------------------------
# DAY VIEWSET
# ----------------------------
class DayViewSet(SafeViewSet, viewsets.ModelViewSet):
    serializer_class = DaySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Day.objects.all().order_by('order', 'id')
        module_id = self.request.query_params.get('module')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        return queryset


# ----------------------------
# TASK VIEWSET
# ----------------------------
class TaskViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends = [DayFilterBackend]
    permission_classes = [IsAdminOrReadOnly]


# ----------------------------
# CURRENT USER VIEW
# ----------------------------
class CurrentUserView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': getattr(user, 'is_admin', False),
            'is_mentor': getattr(user, 'is_mentor', False),
            'is_reviewer': getattr(user, 'is_reviewer', False),
            'is_student': getattr(user, 'is_student', False),
            'is_accounts': getattr(user, 'is_accounts', False),   
            'full_name': user.get_full_name() or user.username,
        }
        return Response(user_data)

    def patch(self, request):
        return Response({"detail": "PATCH not implemented"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

# ----------------------------
# CHANGE PASSWORD
# ----------------------------
class ChangePasswordView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response({"detail": "Both old and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(old_password):
            return Response({"detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({"detail": "New password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.password_changed_at = timezone.now()
        user.save()
        OutstandingToken.objects.filter(user=user).delete()
        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


# ----------------------------
# SEND BULK EMAIL
# ----------------------------
class SendBulkEmailView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.is_admin:
            return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)
        subject = request.data.get('subject')
        message = request.data.get('message')
        if not subject or not message:
            return Response({"detail": "Subject and message are required."}, status=status.HTTP_400_BAD_REQUEST)
        users = User.objects.filter(is_active=True)
        recipient_list = [u.email for u in users if u.email]
        if not recipient_list:
            return Response({"detail": "No recipients found."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list, fail_silently=False)
            return Response({"detail": f"Email sent to {len(recipient_list)} users."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Bad request. Please check your input and try again."}, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------
# PASSWORD RESET
# ----------------------------
class RequestPasswordResetView(SafeAPIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email_iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "If an account with that email exists, a reset link has been sent."}, status=status.HTTP_200_OK)
        PasswordResetToken.objects.filter(user=user).delete()
        token = get_random_string(64)
        expires_at = timezone.now() + timedelta(hours=24)
        PasswordResetToken.objects.create(user=user, token=token, expires_at=expires_at)
        reset_link = f"http://localhost:5173/reset-password/{token}"
        subject = "Password Reset Request"
        message = f"Click the link to reset your password: {reset_link}"
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        return Response({"detail": "Reset link sent to email."}, status=status.HTTP_200_OK)


class ConfirmPasswordResetView(SafeAPIView):
    def post(self, request, token):
        try:
            reset = PasswordResetToken.objects.get(token=token)
        except PasswordResetToken.DoesNotExist:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        if reset.is_expired():
            return Response({"detail": "Token expired."}, status=status.HTTP_400_BAD_REQUEST)
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 6:
            return Response({"detail": "Password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)
        user = reset.user
        user.set_password(new_password)
        user.save()
        reset.delete()
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)


# ----------------------------
# CONTACT MESSAGE VIEWS
# ----------------------------
class ContactMessageView(SafeAPIView):
    permission_classes = []

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            admin_email = getattr(settings, 'ADMIN_EMAIL', settings.DEFAULT_FROM_EMAIL)
            subject = f"New Contact Message: {serializer.data['subject']}"
            message = f"Name: {serializer.data['name']}\nEmail: {serializer.data['email']}\nPhone: {serializer.data['phone']}\nSubject: {serializer.data['subject']}\nMessage: {serializer.data['message']}"
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [admin_email], fail_silently=False)
            return Response({"detail": "Message sent successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnreadMessagesCountView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        count = ContactMessage.objects.filter(is_read=False).count()
        return Response({"unread_count": count})


class RecentMessagesView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        messages = ContactMessage.objects.order_by('-created_at')[:10]
        data = [{
            'id': m.id,
            'name': m.name,
            'email': m.email,
            'phone': m.phone,
            'subject': m.subject,
            'message': m.message,
            'created_at': m.created_at,
            'is_read': m.is_read
        } for m in messages]
        return Response(data)


class ContactMessageDetailView(SafeAPIView, RetrieveAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_admin:
            return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        try:
            msg = ContactMessage.objects.get(pk=pk)
            msg.is_read = True
            msg.save()
            return Response({"detail": "Marked as read"})
        except ContactMessage.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)


# ----------------------------
# CUSTOM LOGIN VIEW
# ----------------------------
class CustomLoginView(SafeAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth import authenticate
        from rest_framework_simplejwt.tokens import RefreshToken

        email = request.data.get('email')
        password = request.data.get('password')
        username = request.data.get('username')

        # If email is provided and username is not, find username from email
        if email and not username:
            try:
                user_obj = User.objects.get(email__iexact=email)
                username = user_obj.username
            except User.DoesNotExist:
                return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        # Validate username is provided
        if not username:
            return Response({'error': 'Email or username required'}, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate user
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response({'error': 'Invalid credentials or account disabled'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({'error': 'Account disabled'}, status=status.HTTP_401_UNAUTHORIZED)

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        # Prepare user data
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': getattr(user, 'is_admin', False),
            'is_mentor': getattr(user, 'is_mentor', False),
            'is_reviewer': getattr(user, 'is_reviewer', False),
            'is_student': getattr(user, 'is_student', False),
            'is_accounts': getattr(user, 'is_accounts', False),
            'full_name': user.get_full_name() or user.username,
        }

        # Add mentor specific data
        if user.is_mentor:
            try:
                mentor = Mentor.objects.get(user=user)
                user_data['mentor_id'] = mentor.id
                user_data['batch'] = mentor.batch.id if mentor.batch and hasattr(mentor.batch, 'id') else None
                user_data['expertise'] = mentor.expertise
                user_data['full_name'] = mentor.full_name or user_data['full_name']
            except Mentor.DoesNotExist:
                pass

        # Add reviewer specific data
        elif user.is_reviewer:
            try:
                reviewer = Reviewer.objects.get(user=user)
                user_data['reviewer_id'] = reviewer.id
                user_data['department'] = reviewer.department
                user_data['full_name'] = reviewer.full_name or user_data['full_name']
            except Reviewer.DoesNotExist:
                pass

        # Add student specific data
        elif user.is_student:
            try:
                student = Student.objects.get(user=user)
                user_data['student_id'] = student.id
                user_data['batch'] = student.batch.id if student.batch and hasattr(student.batch, 'id') else None
                user_data['full_name'] = str(student.full_name) if student.full_name else user_data['full_name']
                user_data['course'] = student.course or ''
            except Student.DoesNotExist:
                pass

        return Response({
            'refresh': str(refresh),
            'access': str(access),
            'user': user_data,
        })
    

# ----------------------------
# LOGOUT VIEW
# ----------------------------
class LogoutView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except TokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------
# UPDATE DASHBOARD ACCESS
# ----------------------------
class UpdateDashboardAccessView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.last_dashboard_access = timezone.now()
        user.save(update_fields=['last_dashboard_access'])
        return Response({"detail": "Dashboard access updated."}, status=status.HTTP_200_OK)


# ----------------------------
# STUDENT LIST VIEW
# ----------------------------
class StudentListView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = self.request.user
        if user.is_reviewer:
            try:
                reviewer = Reviewer.objects.get(user=user)
                students = Student.objects.filter(course=reviewer.course).select_related('user', 'student_batch')
            except Reviewer.DoesNotExist:
                students = Student.objects.none()
        elif user.is_mentor:
            mentor = Mentor.objects.get(user=user)
            students = Student.objects.filter(mentor=mentor).select_related('user', 'student_batch')
        elif user.is_admin:
            students = Student.objects.select_related('user', 'student_batch').all()
        else:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        data = [{
            "id": s.id,
            "name": s.full_name or s.user.username,
            "username": s.user.username,
            "email": s.user.email,
            "course": s.course,
            "batch_name": s.student_batch.name if s.student_batch else s.batch,
            "batch_id": s.student_batch.id if s.student_batch else None,
            "phone": s.phone,
            "date_of_birth": s.date_of_birth,
            "age": s.age,
            "gender": s.gender,
            "fathers_name": s.fathers_name,
            "fathers_contact": s.fathers_contact,
            "mothers_name": s.mothers_name,
            "mothers_contact": s.mothers_contact,
            "address": s.address,
            "educational_qualification": s.educational_qualification,
            "college_school": s.college_school,
        } for s in students]
        return Response(data)


# ----------------------------
# REVIEWER DASHBOARD VIEW
# ----------------------------
class ReviewerDashboardView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            reviewer = Reviewer.objects.get(user=request.user)
        except Reviewer.DoesNotExist:
            return Response({"error": "You are not a reviewer"}, status=status.HTTP_403_FORBIDDEN)
        students = Student.objects.filter(course=reviewer.course)
        student_serializer = StudentSerializer(students, many=True)
        review_folders = ReviewFolder.objects.filter(student__in=students).order_by('-created_at')[:20]
        folder_serializer = ReviewFolderSerializer(review_folders, many=True)
        data = {
            "reviewer_name": reviewer.user.username,
            "batch_name": reviewer.batch.name if reviewer.batch else None,
            "total_students": students.count(),
            "students": student_serializer.data,
            "recent_review_folders": folder_serializer.data,
        }
        return Response(data)


# ----------------------------
# STUDENT REVIEW STATUS VIEW
# ----------------------------
class StudentReviewStatusView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response([])
        reviews = StudentWeekReview.objects.filter(student=student).select_related('module')
        data = []
        for r in reviews:
            if r.total_score is None:
                status = "pending"
            elif r.total_score >= 30:
                status = "completed"
            elif r.total_score >= 15:
                status = "need_improvement"
            else:
                status = "critical"
            data.append({
                "module_id": r.module.id,
                "status": status
            })
        return Response(data)


# ----------------------------
# WEEKLY TOPPERS VIEW
# ----------------------------
class WeeklyToppersView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_admin or user.is_mentor):
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        modules = Module.objects.all().order_by('order')
        toppers_data = []
        for module in modules:
            reviews = StudentWeekReview.objects.filter(
                module=module,
                total_score__isnull=False
            ).select_related('student', 'student__user').order_by('-total_score')[:3]
            week_toppers = []
            for idx, review in enumerate(reviews, 1):
                week_toppers.append({
                    "rank": idx,
                    "student_name": review.student.full_name or review.student.user.username,
                    "score": review.total_score,
                })
            toppers_data.append({
                "week_id": module.id,
                "week_title": module.title,
                "week_order": module.order,
                "toppers": week_toppers,
            })
        return Response(toppers_data)


# ----------------------------
# STUDENT WEEK REVIEW VIEW
# ----------------------------
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
            student = Student.objects.get(id=student_id)
        else:
            if not user.is_student:
                raise PermissionError("Access denied")
            student = Student.objects.get(user=user)
        obj, created = StudentWeekReview.objects.get_or_create(student=student, module_id=module_id)
        return obj

    def perform_update(self, serializer):
        old_instance = serializer.instance
        old_status = old_instance.task_status if old_instance else None
        review = serializer.save()
        if review.task_status == 'Task Completed' and old_status != 'Task Completed':
            Notification.objects.create(
                user=review.student.user,
                message=f"🎉 Congratulations! Your week {review.module.order} review has been marked as completed.",
                link="/student/review-sheet",
                is_read=False
            )
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
                    message=f"🏆 You've completed the module: {review.module.title}. Great work!",
                    link="/student/modules",
                    is_read=False
                )


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    

# ----------------------------
# WEEK UPDATE VIEWSET
# ----------------------------
class WeekUpdateViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = WeekUpdate.objects.all()
    serializer_class = WeekUpdateSerializer
    permission_classes = [IsAuthenticated]


# ----------------------------
# REVIEW FOLDER VIEWSET
# ----------------------------
class ReviewFolderViewSet(SafeViewSet, viewsets.ModelViewSet):
    serializer_class = ReviewFolderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return ReviewFolder.objects.all()

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [IsMentorOrReviewerOrAdmin]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        self._notify_reviewer(instance)
        self._sync_assignment(instance)

    def perform_update(self, serializer):
        old = self.get_object()
        instance = serializer.save(updated_by=self.request.user)
        if old.industry_expert != instance.industry_expert and instance.industry_expert:
            self._notify_reviewer(instance)
            self._sync_assignment(instance)

    def _notify_reviewer(self, review_folder):
        expert_name = review_folder.industry_expert
        if not expert_name:
            return
        reviewer = None
        try:
            first_word = expert_name.split()[0].lower()
            user = User.objects.filter(username__icontains=first_word, is_reviewer=True).first()
            if user:
                reviewer = Reviewer.objects.filter(user=user).first()
        except Exception as e:
            print(f"Error finding reviewer: {e}")
        if not reviewer:
            print(f"Reviewer not found for {expert_name}")
            return
        student = review_folder.student
        student_name = getattr(student, 'full_name', None) or student.user.get_full_name() or student.user.username
        folder_name = review_folder.week_folder or "Review folder"
        message = f"📌 You have been assigned as industry expert for {student_name} in folder '{folder_name}'."
        Notification.objects.create(
            user=reviewer.user,
            message=message,
            link="/reviewer/assignments",
            is_read=False
        )

    def _sync_assignment(self, review_folder):
        from .models import ReviewAssignment

        expert_name = review_folder.industry_expert
        if not expert_name:
            return

        reviewer = Reviewer.objects.filter(
            Q(full_name__iexact=expert_name) | Q(user__username__iexact=expert_name)
        ).first()
        if not reviewer:
            print(f"Reviewer not found for name '{expert_name}', cannot sync assignment")
            return

        student = review_folder.student
        if not student:
            return

        mentor = student.mentor
        if not mentor:
            print(f"No mentor assigned to student {student.id}, cannot create assignment")
            return

        course = student.course or ""

        assignment, created = ReviewAssignment.objects.get_or_create(
            mentor=mentor,
            reviewer=reviewer,
            student=student,
            defaults={
                'course': course,
                'review_sheet': review_folder.review_sheet or "",
                'status': 'assigned',
            }
        )
        if not created:
            pass 


        if created:
            Notification.objects.create(
                user=reviewer.user,
                message=f"New review assignment from {mentor.full_name or mentor.user.username} for student {student.full_name or student.user.username} (Course: {course})",
                link="/reviewer/assignments",
                is_read=False
            )


# ----------------------------
# CHAT VIEWS
# ----------------------------
class ChatRoomList(SafeAPIView, generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        try:
            if user.is_reviewer:
                reviewer = Reviewer.objects.get(user=user)
                return ChatRoom.objects.filter(reviewer=reviewer, mentor__isnull=False, student__isnull=True)
            elif user.is_mentor:
                mentor = Mentor.objects.get(user=user)
                return ChatRoom.objects.filter(mentor=mentor)
            elif user.is_student:
                student = Student.objects.get(user=user)
                return ChatRoom.objects.filter(student=student)
        except Exception as e:
            print(f"ChatRoomList error: {e}")
            return ChatRoom.objects.none()
        return ChatRoom.objects.none()


class ChatMessageList(SafeAPIView, generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return ChatMessage.objects.filter(room_id=room_id).order_by('timestamp')


class ChatMessageListCreateView(SafeAPIView, generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            return ChatMessage.objects.filter(room_id=room_id).order_by('-timestamp')
        return ChatMessage.objects.none()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class ClearChatMessagesView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        room_id = request.query_params.get('room')
        if not room_id:
            return Response({"error": "room parameter required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
        user = request.user
        if not (room.mentor and room.mentor.user == user) and not (room.reviewer and room.reviewer.user == user) and not (room.student and room.student.user == user):
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        room.messages.all().delete()
        return Response({"detail": "All messages cleared"})


class MarkMessagesReadView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        try:
            room = get_object_or_404(ChatRoom, id=room_id)
            updated = ChatMessage.objects.filter(room=room, is_read=False).exclude(sender=request.user).update(
                is_read=True,
                read_at=timezone.now()
            )
            return Response({"marked_read": updated}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Bad request. Please check your input and try again."}, status=status.HTTP_400_BAD_REQUEST)


class RespondToMessageView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            message = ChatMessage.objects.get(id=message_id)
        except ChatMessage.DoesNotExist:
            return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)
        room = message.room
        user = request.user
        if room.reviewer and room.reviewer.user == user:
            action = request.data.get('action')
            suggested_time = request.data.get('suggested_time')
            if action not in ['accepted', 'rejected']:
                return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
            message.action = action
            if suggested_time:
                message.suggested_time = suggested_time
            message.responded_at = timezone.now()
            message.save()
            return Response(ChatMessageSerializer(message).data)
        else:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)


# ----------------------------
# STUDENT COURSE STATUS VIEW
# ----------------------------
class StudentCourseStatusView(SafeAPIView, generics.RetrieveUpdateAPIView):
    serializer_class = CourseStatusSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        student_id = self.request.query_params.get('student_id')
        if not student_id:
            raise ValidationError({"detail": "student_id required"})
        student = get_object_or_404(Student, id=student_id)
        if not student.course:
            raise ValidationError({"detail": "Student has no course assigned"})
        status_obj, created = CourseStatus.objects.get_or_create(
            student=student,
            course_name=student.course
        )
        return status_obj


# ----------------------------
# NOTIFICATION VIEWSET
# ----------------------------
class NotificationPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100


class NotificationViewSet(SafeViewSet, viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked read'})


# ----------------------------
# UNREAD NOTIFICATION COUNT
# ----------------------------
class UnreadNotificationCountView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


# ----------------------------
# STUDENT DOCUMENTS
# ----------------------------
class StudentDocumentListView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)
            docs = student.student_documents.all()
            serializer = StudentDocumentSerializer(docs, many=True, context={'request': request})
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)


class UploadStudentDocumentView(SafeAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        student_id = request.data.get('student')
        if not file or not student_id:
            return Response({'error': 'file and student id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            student = Student.objects.get(id=student_id)
            doc = StudentDocument.objects.create(student=student, file=file)
            serializer = StudentDocumentSerializer(doc, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)


class StudentDocumentDeleteView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, doc_id):
        try:
            doc = StudentDocument.objects.get(id=doc_id)
            doc.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except StudentDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)


# ----------------------------
# MENTOR DOCUMENTS
# ----------------------------
class MentorDocumentListView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, mentor_id):
        try:
            mentor = Mentor.objects.get(id=mentor_id)
            docs = mentor.mentor_documents.all()
            serializer = MentorDocumentSerializer(docs, many=True, context={'request': request})
            return Response(serializer.data)
        except Mentor.DoesNotExist:
            return Response({'error': 'Mentor not found'}, status=status.HTTP_404_NOT_FOUND)


class UploadMentorDocumentView(SafeAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        mentor_id = request.data.get('mentor')
        if not file or not mentor_id:
            return Response({'error': 'file and mentor id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            mentor = Mentor.objects.get(id=mentor_id)
            doc = MentorDocument.objects.create(mentor=mentor, file=file)
            serializer = MentorDocumentSerializer(doc, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Mentor.DoesNotExist:
            return Response({'error': 'Mentor not found'}, status=status.HTTP_404_NOT_FOUND)


class MentorDocumentDeleteView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, doc_id):
        try:
            doc = MentorDocument.objects.get(id=doc_id)
            doc.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except MentorDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)


# ----------------------------
# REVIEW ASSIGNMENT VIEWSET (UPDATED)
# ----------------------------
class ReviewAssignmentViewSet(SafeViewSet, viewsets.ModelViewSet):
    queryset = ReviewAssignment.objects.all()
    serializer_class = ReviewAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        if self.action == 'create':
            return [IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        print(f"User: {user.username}, is_mentor: {user.is_mentor}, is_reviewer: {user.is_reviewer}")
        try:
            if user.is_mentor:
                mentor = Mentor.objects.get(user=user)
                qs = ReviewAssignment.objects.filter(mentor=mentor)
                print(f"Mentor {mentor} found: {qs.count()} assignments")
                return qs
            elif user.is_reviewer:
                reviewer = Reviewer.objects.get(user=user)
                qs = ReviewAssignment.objects.filter(reviewer=reviewer)
                print(f"Reviewer {reviewer} found: {qs.count()} assignments")
                return qs
            elif user.is_admin:
                return ReviewAssignment.objects.all()
        except (Mentor.DoesNotExist, Reviewer.DoesNotExist) as e:
            print(f"Profile missing: {e}")
            return ReviewAssignment.objects.none()
        return ReviewAssignment.objects.none()

    def perform_create(self, serializer):
        if not self.request.user.is_mentor:
            raise PermissionDenied("Only mentors can create assignments")
        mentor = Mentor.objects.get(user=self.request.user)
        reviewer_id = self.request.data.get('reviewer')
        if not reviewer_id:
            raise ValidationError({"reviewer": "Reviewer ID required"})
        reviewer = Reviewer.objects.get(id=reviewer_id)

        work_documents = self.request.data.get('work_documents', '')
        week = self.request.data.get('week', '')

        assignment = serializer.save(
            mentor=mentor,
            reviewer=reviewer,
            status='assigned',
            work_documents=work_documents or None,
            week=week or None
        )

        # Notify reviewer
        Notification.objects.create(
            user=reviewer.user,
            message=f"New review assignment from {mentor.full_name or mentor.user.username} for student {assignment.student.full_name or assignment.student.user.username} (Course: {assignment.course or assignment.student.course})",
            link="/reviewer/assignments",
            is_read=False
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept(self, request, pk=None):
        assignment = self.get_object()
        user = request.user

        is_reviewer = user.is_reviewer and assignment.reviewer.user == user
        is_mentor_creator = user.is_mentor and assignment.mentor.user == user

        if not (is_reviewer or is_mentor_creator):
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        assignment.status = 'accepted'
        assignment.save()

        if is_reviewer:
            Notification.objects.create(
                user=assignment.mentor.user,
                message=f"Reviewer {assignment.reviewer.full_name or assignment.reviewer.user.username} accepted the assignment for {assignment.student.full_name or assignment.student.user.username}.",
                link="/mentor/assignments",
                is_read=False
            )
        else:
            Notification.objects.create(
                user=assignment.reviewer.user,
                message=f"Mentor {assignment.mentor.full_name or assignment.mentor.user.username} marked the assignment as accepted for {assignment.student.full_name or assignment.student.user.username}.",
                link="/reviewer/assignments",
                is_read=False
            )

        return Response({"status": "accepted"})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        assignment = self.get_object()
        user = request.user

        is_reviewer = user.is_reviewer and assignment.reviewer.user == user
        is_mentor_creator = user.is_mentor and assignment.mentor.user == user

        if not (is_reviewer or is_mentor_creator):
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        assignment.status = 'rejected'
        comments = request.data.get('comments', '')
        if comments:
            assignment.comments = comments
        assignment.save()

        if is_reviewer:
            Notification.objects.create(
                user=assignment.mentor.user,
                message=f"Reviewer {assignment.reviewer.full_name or assignment.reviewer.user.username} rejected the assignment for {assignment.student.full_name or assignment.student.user.username}. Reason: {comments or 'No reason provided'}",
                link="/mentor/assignments",
                is_read=False
            )
        else:
            Notification.objects.create(
                user=assignment.reviewer.user,
                message=f"Mentor {assignment.mentor.full_name or assignment.mentor.user.username} rejected the assignment for {assignment.student.full_name or assignment.student.user.username}. Reason: {comments or 'No reason provided'}",
                link="/reviewer/assignments",
                is_read=False
            )

        return Response({"status": "rejected"})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def suggest_time(self, request, pk=None):
        assignment = self.get_object()
        user = request.user

        if not (user.is_reviewer and assignment.reviewer.user == user):
            return Response({"error": "Only the assigned reviewer can suggest a time"}, status=status.HTTP_403_FORBIDDEN)

        if assignment.status != 'assigned':
            return Response({"error": f"Cannot suggest time when status is {assignment.status}"}, status=status.HTTP_400_BAD_REQUEST)

        proposed_time = request.data.get('proposed_time', '')
        if not proposed_time:
            return Response({"error": "proposed_time required"}, status=status.HTTP_400_BAD_REQUEST)

        current_comments = assignment.comments or ""
        cleaned = re.sub(r'Suggested time:.*?(\n|$)', '', current_comments).strip()
        new_comments = f"{cleaned}\nSuggested time: {proposed_time}".strip()
        assignment.comments = new_comments
        assignment.status = 'pending approval'
        assignment.save(update_fields=['comments', 'status'])

        Notification.objects.create(
            user=assignment.mentor.user,
            message=f"Reviewer {assignment.reviewer.full_name or assignment.reviewer.user.username} suggested a time ({proposed_time}) for {assignment.student.full_name or assignment.student.user.username}.",
            link="/mentor/assignments",
            is_read=False
        )

        return Response({"status": "time suggested", "comments": new_comments})


# ----------------------------
# RECENT MESSAGES API
# ----------------------------
class RecentMessagesAPIView(SafeAPIView, generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    pagination_class = LimitOffsetPagination
    pagination_class.default_limit = 10
    pagination_class.max_limit = 1000

    def get_queryset(self):
        return ContactMessage.objects.all().order_by('-created_at')


# ----------------------------
# WEEKLY SUBMISSIONS VIEWS
# ----------------------------
class StudentSubmissionListCreateView(SafeAPIView, generics.ListCreateAPIView):
    serializer_class = WeeklySubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'student_profile'):
            return WeeklySubmission.objects.filter(student=user.student_profile)
        student_id = self.request.query_params.get('student_id')
        week_id = self.request.query_params.get('week_id')
        qs = WeeklySubmission.objects.all()
        if student_id:
            qs = qs.filter(student_id=student_id)
        if week_id:
            qs = qs.filter(week_id=week_id)
        return qs

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'student_profile'):
            raise ValidationError("Only students can submit weekly items.")
        student = self.request.user.student_profile
        submission = serializer.save(student=student)

        if student.mentor:
            Notification.objects.create(
                user=student.mentor.user,
                message=f"{student.full_name or student.user.username} submitted '{submission.get_submission_type_display()}' for week {submission.week.order or submission.week.id}.",
                link=f"/mentor/review-sheet?student_id={student.id}",
                is_read=False
            )


class SubmissionBulkUpdateView(SafeAPIView, generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updates = request.data.get('updates', [])
        for upd in updates:
            submission = WeeklySubmission.objects.get(id=upd['id'])
            old_reviewed = submission.reviewed
            old_marks = submission.marks
            old_feedback = submission.mentor_feedback

            if 'marks' in upd:
                submission.marks = upd['marks']
            if 'mentor_feedback' in upd:
                submission.mentor_feedback = upd['mentor_feedback']
            if 'reviewed' in upd:
                submission.reviewed = upd['reviewed']
                submission.reviewed_at = timezone.now() if upd['reviewed'] else None

            submission.save()

            if submission.reviewed and not old_reviewed:
                Notification.objects.create(
                    user=submission.student.user,
                    message=f"✅ Your {submission.get_submission_type_display()} for week {submission.week.order} has been reviewed. Marks: {submission.marks}/5",
                    link=f"/student/submissions?week_id={submission.week.id}",
                    is_read=False
                )
            elif submission.reviewed and (submission.marks != old_marks or submission.mentor_feedback != old_feedback):
                Notification.objects.create(
                    user=submission.student.user,
                    message=f"📝 Your {submission.get_submission_type_display()} for week {submission.week.order} was updated. New marks: {submission.marks}/5. Feedback: {submission.mentor_feedback or '—'}",
                    link=f"/student/submissions?week_id={submission.week.id}",
                    is_read=False
                )
            elif not submission.reviewed and submission.reviewed != old_reviewed:
                Notification.objects.create(
                    user=submission.student.user,
                    message=f"ℹ️ The review status for your {submission.get_submission_type_display()} was changed back to pending.",
                    link=f"/student/submissions?week_id={submission.week.id}",
                    is_read=False
                )

        return Response({'status': 'ok'})


# ----------------------------
# ATTENDANCE (IN/OUT REGISTER) VIEWS
# ----------------------------
class CheckInView(SafeAPIView, generics.CreateAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        student, created = Student.objects.get_or_create(
            user=user,
            defaults={'course': '', 'batch': ''}
        )
        if created:
            print(f"Auto-created student profile for {user.username} during check‑in")
        serializer.save(student=student, check_in=timezone.now())



class CheckOutView(SafeAPIView, generics.UpdateAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # get student safely
        student = getattr(self.request.user, 'student_profile', None)

        if not student:
            student = get_object_or_404(Student, user=self.request.user)

        # active attendance record
        return get_object_or_404(
            AttendanceRecord,
            student=student,
            check_out__isnull=True
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        instance.check_out = timezone.now()
        instance.break_minutes = int(request.data.get("break_minutes") or 0)
        instance.check_out_reason = request.data.get("check_out_reason", "")

        instance.save()

        return Response(
            {"message": "Checked out successfully"},
            status=200
        )
    


class AttendanceHistoryView(SafeAPIView, generics.ListAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')
        date_str = self.request.query_params.get('date')

        if hasattr(user, 'student_profile'):
            qs = AttendanceRecord.objects.filter(student=user.student_profile)
        elif user.is_mentor:
            mentor = Mentor.objects.get(user=user)
            mentor_student_ids = Student.objects.filter(mentor=mentor).values_list('id', flat=True)
            if student_id:
                if int(student_id) not in mentor_student_ids:
                    qs = AttendanceRecord.objects.none()
                else:
                    qs = AttendanceRecord.objects.filter(student_id=student_id)
            else:
                qs = AttendanceRecord.objects.filter(student_id__in=mentor_student_ids)
        else:
            qs = AttendanceRecord.objects.all()
            if student_id:
                qs = qs.filter(student_id=student_id)

        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                qs = qs.filter(check_in__date=target_date)
            except ValueError:
                pass

        return qs.order_by('-check_in')


class FeePaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FeePaymentSerializer

    def get_queryset(self):
        user = self.request.user
        # ✅ Allow mentors to view fee payments (for mentor fee overview)
        if user.is_admin or user.is_accounts or user.is_mentor:
            qs = FeePayment.objects.all()
            student_id = self.request.query_params.get('student')
            if student_id:
                qs = qs.filter(student_id=student_id)
            return qs
        return FeePayment.objects.none()


class AccountsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Accounts (finance) users. Only admins can access."""
    serializer_class = AccountsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Accounts.objects.all()
        # Non‑admins cannot see accounts list
        return Accounts.objects.none()

    def perform_destroy(self, instance):
        # Delete the associated User as well (optional)
        user = instance.user
        instance.delete()
        user.delete()


class RegisterUserView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = request.data.get('role')
        if role not in ['student', 'mentor', 'reviewer', 'admin', 'accounts']:
            return Response({"detail": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        password = validated_data.pop('password', None)
        if not password:
            password = generate_random_password()

        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            is_student=(role == 'student'),
            is_mentor=(role == 'mentor'),
            is_reviewer=(role == 'reviewer'),
            is_admin=(role == 'admin'),
            is_accounts=(role == 'accounts'),
        )
        user.set_password(password)
        user.save()

        # Try to send email – but never crash the request
        try:
            send_password_email(user, password)
            email_sent = True
        except Exception as e:
            print(f"❌ Email sending failed for {user.email}: {e}")
            email_sent = False

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role,
            "email_sent": email_sent,
            "message": f"{role.capitalize()} user created. {'Email sent.' if email_sent else 'Email could not be sent – check console log.'}"
        }, status=status.HTTP_201_CREATED)


class AccountsDashboardView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            # ✅ Allow both accounts and admin users
            if not (user.is_accounts or user.is_admin):
                return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

            period = request.query_params.get('period', 'monthly')
            now = timezone.now().date()

            if period == 'weekly':
                start_date = now - timedelta(days=now.weekday())
                end_date = start_date + timedelta(days=6)
            elif period == 'yearly':
                start_date = now.replace(month=1, day=1)
                end_date = now.replace(month=12, day=31)
            else:  # monthly
                start_date = now.replace(day=1)
                next_month = start_date.replace(day=28) + timedelta(days=4)
                end_date = next_month - timedelta(days=next_month.day)

            payments = FeePayment.objects.filter(
                payment_date__gte=start_date,
                payment_date__lte=end_date
            )
            total_collected = payments.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
            total_pending = payments.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
            total_overdue = payments.filter(status='overdue').aggregate(total=Sum('amount'))['total'] or 0

            monthly_income = []
            for i in range(11, -1, -1):
                month_date = now.replace(day=1) - timedelta(days=30*i)
                month_start = month_date.replace(day=1)
                if month_start.month == 12:
                    month_end = month_start.replace(year=month_start.year+1, month=1, day=1) - timedelta(days=1)
                else:
                    month_end = month_start.replace(month=month_start.month+1, day=1) - timedelta(days=1)
                month_payments = FeePayment.objects.filter(
                    payment_date__gte=month_start,
                    payment_date__lte=month_end,
                    status='paid'
                )
                total = month_payments.aggregate(total=Sum('amount'))['total'] or 0
                monthly_income.append({
                    'month': month_start.strftime('%B %Y'),
                    'total': float(total)
                })

            reviewer_wise = {}
            all_payments = FeePayment.objects.filter(status='paid').select_related('student__reviewer')
            for p in all_payments:
                reviewer = p.student.reviewer
                reviewer_name = reviewer.full_name if reviewer else 'Unassigned'
                reviewer_wise[reviewer_name] = reviewer_wise.get(reviewer_name, 0) + float(p.amount)
            reviewer_wise_list = [{'reviewer': k, 'total': v} for k, v in reviewer_wise.items()]

            recent_payments = payments.order_by('-payment_date')[:10]
            recent_list = []
            for p in recent_payments:
                recent_list.append({
                    'id': p.id,
                    'student_name': p.student.full_name or p.student.user.username,
                    'amount': float(p.amount),
                    'payment_date': p.payment_date.isoformat(),
                    'status': p.status,
                })

            return Response({
                'period': period,
                'total_collected': float(total_collected),
                'total_pending': float(total_pending),
                'total_overdue': float(total_overdue),
                'monthly_income': monthly_income,
                'reviewer_wise': reviewer_wise_list,
                'recent_payments': recent_list,
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AccountsStudentListView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_accounts or user.is_admin or user.is_mentor):
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        students = Student.objects.all().select_related('user', 'reviewer')
        result = []
        for student in students:
            payments = FeePayment.objects.filter(student=student)
            total_paid = payments.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
            total_pending = payments.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
            total_overdue = payments.filter(status='overdue').aggregate(total=Sum('amount'))['total'] or 0

            # Compute week‑back status safely
            week_back_status = "on_track"
            if total_overdue > 0:
                week_back_status = "overdue"
            elif total_pending > 0:
                oldest_pending = payments.filter(status='pending').order_by('due_date').first()
                if oldest_pending and oldest_pending.due_date:
                    if oldest_pending.due_date < timezone.now().date() - timedelta(days=7):
                        week_back_status = "delayed"

            result.append({
                'id': student.id,
                'name': student.full_name or student.user.username,
                'email': student.user.email,
                'phone': student.phone,
                'course': student.course,
                'batch': student.batch,
                'reviewer_name': student.reviewer.full_name if student.reviewer else '—',
                'total_paid': float(total_paid),
                'total_pending': float(total_pending),
                'total_overdue': float(total_overdue),
                'agreement_signed': student.agreement_signed,
                'escalation_flag': student.escalation_flag,
                'week_back_fee_status': week_back_status,
            })
        return Response(result)


class AccountsProfileView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_accounts:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        try:
            profile = user.accounts_profile
        except Accounts.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': profile.full_name,
            'phone': profile.phone,
            'department': profile.department,
        }
        return Response(data)

    def patch(self, request):
        user = request.user
        if not user.is_accounts:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        try:
            profile = user.accounts_profile
        except Accounts.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        # Update only allowed fields
        full_name = request.data.get('full_name')
        phone = request.data.get('phone')
        department = request.data.get('department')

        if full_name is not None:
            profile.full_name = full_name
        if phone is not None:
            profile.phone = phone
        if department is not None:
            profile.department = department
        profile.save()

        # Also update user's first/last name if needed? Not required, but we can keep sync optional.
        return Response({'detail': 'Profile updated successfully'})


# ----------------------------
# STUDENT FEE SUMMARY VIEW (for students)
# ----------------------------
class StudentFeeSummaryView(APIView):   # replaced SafeAPIView with APIView
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_student:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        try:
            student = user.student_profile
        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)

        # Use your actual payment model – adjust field names as needed
        # Example using FeePayment model (replace with StudentFeePayment if different)
        payments = FeePayment.objects.filter(student=student).order_by('-due_date')
        total_paid = payments.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
        total_pending = payments.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
        total_overdue = payments.filter(status='overdue').aggregate(total=Sum('amount'))['total'] or 0

        pending_payments = payments.filter(status='pending')
        due_date = pending_payments.order_by('due_date').first().due_date if pending_payments.exists() else None

        required_action = "No action needed"
        if total_overdue > 0:
            required_action = "⚠️ Immediate payment required (overdue)"
        elif total_pending > 0 and due_date:
            required_action = f"📅 Pay by {due_date}"
        elif not student.agreement_signed:
            required_action = "✍️ Please sign the fee agreement"

        payment_received = payments.filter(status='paid', payment_date__gte=timezone.now() - timedelta(days=30)).exists()

        payments_list = []
        for p in payments:
            payments_list.append({
                'id': p.id,
                'amount': float(p.amount),
                'due_date': p.due_date,
                'payment_date': p.payment_date,
                'status': p.status,
                'notes': p.notes or '',
            })

        return Response({
            'total_paid': float(total_paid),
            'total_pending': float(total_pending),
            'total_overdue': float(total_overdue),
            'due_date': due_date,
            'required_action': required_action,
            'payment_received': payment_received,
            'agreement_signed': student.agreement_signed,
            'escalation_flag': student.escalation_flag,
            'payments': payments_list,
        })



# ----------------------------
# FEE STRUCTURE VIEWSET
# ----------------------------
class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=['post'])
    def apply_to_students(self, request, pk=None):
        fee_structure = self.get_object()
        students = Student.objects.all()
        if fee_structure.course:
            students = students.filter(course=fee_structure.course)
        if fee_structure.batch:
            students = students.filter(batch=fee_structure.batch)

        created_count = 0
        for student in students:
            if not StudentFee.objects.filter(student=student, fee_structure=fee_structure).exists():
                StudentFee.objects.create(
                    student=student,
                    fee_structure=fee_structure,
                    total_amount=fee_structure.total_amount * (1 - fee_structure.discount_percentage / 100),
                    discount_applied=fee_structure.total_amount * fee_structure.discount_percentage / 100
                )
                created_count += 1
        return Response({"message": f"Fee structure applied to {created_count} students."})




# ----------------------------
# STUDENT FEE VIEWSET (admin)
# ----------------------------
class StudentFeeViewSet(viewsets.ModelViewSet):
    queryset = StudentFee.objects.all()
    serializer_class = StudentFeeSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        student_fee = self.get_object()
        amount = request.data.get('amount')
        if not amount:
            return Response({"error": "Amount required"}, status=status.HTTP_400_BAD_REQUEST)
        payment = StudentFeePayment.objects.create(
            student_fee=student_fee,
            amount=amount,
            payment_method=request.data.get('payment_method', 'cash'),
            notes=request.data.get('notes', '')
        )
        return Response(StudentFeePaymentSerializer(payment).data)


# ----------------------------
# INSTALLMENT SCHEDULE VIEWSET (admin)
# ----------------------------
class InstallmentScheduleViewSet(viewsets.ModelViewSet):
    queryset = InstallmentSchedule.objects.all()
    serializer_class = InstallmentScheduleSerializer
    permission_classes = [permissions.IsAdminUser]


