from rest_framework import viewsets, status, generics, permissions
from .models import Notification
from rest_framework.generics import RetrieveAPIView
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import BaseFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError, NotFound
from django.utils import timezone
from django.db.models import Q
from django.db import models
from django.shortcuts import get_object_or_404
from django.utils.crypto import get_random_string
from datetime import timedelta
from django.core.mail import send_mail
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from datetime import datetime

from .models import (
    User, Student, Mentor, Reviewer, Course, Module, Day, Task, Batch,
    StudentModule, PasswordResetToken, ContactMessage, StudentWeekReview, WeekUpdate, 
    ReviewFolder, ChatRoom, ChatMessage, CourseStatus, Notification, StudentDocument,
    MentorDocument, ReviewAssignment, WeeklySubmission, AttendanceRecord
)

from .serializers import (
    StudentSerializer, MentorSerializer, ReviewerSerializer, UserSerializer,
    CourseSerializer, ModuleSerializer, DaySerializer, TaskSerializer, BatchSerializer,
    ContactMessageSerializer, StudentModuleSerializer, StudentWeekReviewSerializer, 
    WeekUpdateSerializer, ReviewFolderSerializer, ChatRoomSerializer, ChatMessageSerializer, 
    CourseStatusSerializer, NotificationSerializer, StudentDocumentSerializer, MentorDocumentSerializer, 
    ReviewAssignmentSerializer, WeeklySubmissionSerializer, AttendanceRecordSerializer
)

from .permissions import (
    IsAdminUser, IsAdminOrReadOnly, IsStudentOwner, IsMentorOrReviewerOrAdmin
)


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
class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAdminOrReadOnly]


# ----------------------------
# STUDENT VIEWSET
# ----------------------------
class StudentViewSet(viewsets.ModelViewSet):
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
            queryset = Student.objects.none()
        else:
            queryset = queryset.filter(user=user)
        return queryset

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
            return Response([])
        else:
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        user = request.user
        if not user.is_student:
            return Response({"detail": "User is not a student"}, status=403)
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
        except Exception as e:
            return Response({"error": str(e)}, status=500)

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
class MentorViewSet(viewsets.ModelViewSet):
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
            return Response({"detail": "Mentor profile not found"}, status=404)


# ----------------------------
# REVIEWER VIEWSET
# ----------------------------
class ReviewerViewSet(viewsets.ModelViewSet):
    queryset = Reviewer.objects.all()
    serializer_class = ReviewerSerializer
    permission_classes = [IsAdminUser]

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
            return Response({"detail": "Reviewer profile not found"}, status=404)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_availability(self, request, pk=None):
        reviewer = self.get_object()
        if request.user != reviewer.user and not request.user.is_admin:
            return Response({"detail": "Not allowed"}, status=403)
        serializer = self.get_serializer(reviewer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ----------------------------
# COURSE VIEWSET
# ----------------------------
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]


# ----------------------------
# MODULE VIEWSET – WITH LOCKING LOGIC BASED ON TASK_STATUS
# ----------------------------
class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    filter_backends = [CourseFilterBackend]
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=['get'], url_path='for-course')
    def for_course(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({"error": "course_id is required"}, status=400)
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

        # Get student object
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

        # Build module list: common modules + course-specific modules
        common_modules = Module.objects.filter(is_common=True).order_by('order')
        if not student.course:
            all_modules = list(common_modules)
        else:
            course_modules = Module.objects.filter(course__name=student.course, is_common=False).order_by('order')
            all_modules = list(common_modules) + list(course_modules)
            all_modules.sort(key=lambda x: x.order)

        # 🔁 Determine completed weeks based on task_status, not total_score
        reviews = StudentWeekReview.objects.filter(student=student)
        completed_weeks = set()
        for review in reviews:
            if review.task_status == 'Task Completed':
                week_order = review.module.order
                if week_order is not None:
                    completed_weeks.add(week_order)
        current_week = max(completed_weeks) if completed_weeks else 0

        # Build response with is_locked flag
        result = []
        for module in all_modules:
            week_num = module.order or 0
            # Next week unlocks only if previous week is task_status = 'Task Completed'
            is_locked = week_num > current_week + 1
            result.append({
                'id': module.id,
                'title': module.title,
                'content': module.content,
                'order': module.order,
                'course_name': module.course.name if module.course else None,
                'is_common': module.is_common,
                'is_locked': is_locked,
                'completion_percentage': 0,  # optional
            })
        return Response(result)


# ----------------------------
# COMPLETE MODULE VIEW
# ----------------------------
class CompleteModuleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, module_id):
        user = request.user
        if not user.is_student:
            return Response({"detail": "Only students can complete modules."}, status=403)
        student, created = Student.objects.get_or_create(
            user=user,
            defaults={'course': '', 'batch': ''}
        )
        if created:
            print(f"Created missing student profile for {user.username} during module completion")
        try:
            module = Module.objects.get(id=module_id)
        except Module.DoesNotExist:
            return Response({"detail": "Module not found."}, status=404)
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
        return Response({"detail": f"Module '{module.title}' marked as completed."}, status=200)


# ----------------------------
# STUDENT MODULE VIEWSET
# ----------------------------
class StudentModuleViewSet(viewsets.ModelViewSet):
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
class DayViewSet(viewsets.ModelViewSet):
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
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends = [DayFilterBackend]
    permission_classes = [IsAdminOrReadOnly]   


# ----------------------------
# CURRENT USER VIEW
# ----------------------------
class CurrentUserView(APIView):
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
            'full_name': user.get_full_name() or user.username,
        }
        return Response(user_data)
    def patch(self, request):
        return Response({"detail": "PATCH not implemented"}, status=405)


# ----------------------------
# CHANGE PASSWORD
# ----------------------------
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response({"detail": "Both old and new passwords are required."}, status=400)
        if not user.check_password(old_password):
            return Response({"detail": "Current password is incorrect."}, status=400)
        if len(new_password) < 6:
            return Response({"detail": "New password must be at least 6 characters."}, status=400)
        user.set_password(new_password)
        user.password_changed_at = timezone.now()
        user.save()
        OutstandingToken.objects.filter(user=user).delete()
        return Response({"detail": "Password changed successfully."}, status=200)


# ----------------------------
# SEND BULK EMAIL
# ----------------------------
class SendBulkEmailView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        if not user.is_admin:
            return Response({"detail": "Admin access required."}, status=403)
        subject = request.data.get('subject')
        message = request.data.get('message')
        if not subject or not message:
            return Response({"detail": "Subject and message are required."}, status=400)
        users = User.objects.filter(is_active=True)
        recipient_list = [u.email for u in users if u.email]
        if not recipient_list:
            return Response({"detail": "No recipients found."}, status=400)
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list, fail_silently=False)
            return Response({"detail": f"Email sent to {len(recipient_list)} users."}, status=200)
        except Exception as e:
            return Response({"detail": str(e)}, status=500)


# ----------------------------
# PASSWORD RESET
# ----------------------------
class RequestPasswordResetView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"detail": "Email is required."}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "If an account with that email exists, a reset link has been sent."}, status=200)
        PasswordResetToken.objects.filter(user=user).delete()
        token = get_random_string(64)
        expires_at = timezone.now() + timedelta(hours=24)
        PasswordResetToken.objects.create(user=user, token=token, expires_at=expires_at)
        reset_link = f"http://localhost:5173/reset-password/{token}"
        subject = "Password Reset Request"
        message = f"Click the link to reset your password: {reset_link}"
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        return Response({"detail": "Reset link sent to email."}, status=200)

class ConfirmPasswordResetView(APIView):
    def post(self, request, token):
        try:
            reset = PasswordResetToken.objects.get(token=token)
        except PasswordResetToken.DoesNotExist:
            return Response({"detail": "Invalid or expired token."}, status=400)
        if reset.is_expired():
            return Response({"detail": "Token expired."}, status=400)
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 6:
            return Response({"detail": "Password must be at least 6 characters."}, status=400)
        user = reset.user
        user.set_password(new_password)
        user.save()
        reset.delete()
        return Response({"detail": "Password reset successful."}, status=200)


# ----------------------------
# CONTACT MESSAGE VIEWS
# ----------------------------
class ContactMessageView(APIView):
    permission_classes = []
    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            admin_email = getattr(settings, 'ADMIN_EMAIL', settings.DEFAULT_FROM_EMAIL)
            subject = f"New Contact Message: {serializer.data['subject']}"
            message = f"Name: {serializer.data['name']}\nEmail: {serializer.data['email']}\nPhone: {serializer.data['phone']}\nSubject: {serializer.data['subject']}\nMessage: {serializer.data['message']}"
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [admin_email], fail_silently=False)
            return Response({"detail": "Message sent successfully."}, status=201)
        return Response(serializer.errors, status=400)

class UnreadMessagesCountView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if not request.user.is_admin:
            return Response({"detail": "Unauthorized"}, status=403)
        count = ContactMessage.objects.filter(is_read=False).count()
        return Response({"unread_count": count})

class RecentMessagesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if not request.user.is_admin:
            return Response({"detail": "Unauthorized"}, status=403)
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

class ContactMessageDetailView(RetrieveAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated]
    def patch(self, request, pk):
        if not request.user.is_admin:
            return Response({"detail": "Unauthorized"}, status=403)
        try:
            msg = ContactMessage.objects.get(pk=pk)
            msg.is_read = True
            msg.save()
            return Response({"detail": "Marked as read"})
        except ContactMessage.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)


# ----------------------------
# CUSTOM LOGIN VIEW
# ----------------------------
class CustomLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        username = request.data.get('username')

        if email:
            try:
                user_obj = User.objects.get(email=email)
                username = user_obj.username
            except User.DoesNotExist:
                return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        if not username:
            return Response({'error': 'Email or username required'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user or not user.is_active:
            return Response({'error': 'Invalid credentials or account disabled'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': getattr(user, 'is_admin', False),
            'is_mentor': getattr(user, 'is_mentor', False),
            'is_reviewer': getattr(user, 'is_reviewer', False),
            'is_student': getattr(user, 'is_student', False),
            'full_name': user.get_full_name() or user.username,
        }

        if user.is_mentor:
            try:
                mentor = Mentor.objects.get(user=user)
                user_data['mentor_id'] = mentor.id
                user_data['batch'] = mentor.batch.id if mentor.batch and hasattr(mentor.batch, 'id') else None
                user_data['expertise'] = mentor.expertise
                user_data['full_name'] = mentor.full_name or user_data['full_name']
            except Mentor.DoesNotExist:
                pass

        elif user.is_reviewer:
            try:
                reviewer = Reviewer.objects.get(user=user)
                user_data['reviewer_id'] = reviewer.id
                user_data['department'] = reviewer.department
                user_data['full_name'] = reviewer.full_name or user_data['full_name']
            except Reviewer.DoesNotExist:
                pass

        elif user.is_student:
            try:
                student = Student.objects.get(user=user)
                user_data['student_id'] = student.id
                user_data['batch'] = student.batch.id if student.batch and hasattr(student.batch, 'id') else None
                user_data['full_name'] = str(student.full_name) if student.full_name else user_data['full_name']
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
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'error': 'Refresh token required'}, status=400)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully'}, status=200)
        except TokenError:
            return Response({'error': 'Invalid token'}, status=400)


# ----------------------------
# UPDATE DASHBOARD ACCESS
# ----------------------------
class UpdateDashboardAccessView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        user.last_dashboard_access = timezone.now()
        user.save(update_fields=['last_dashboard_access'])
        return Response({"detail": "Dashboard access updated."}, status=200)


# ----------------------------
# STUDENT LIST VIEW
# ----------------------------
class StudentListView(APIView):
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
            return Response({"detail": "Not authorized"}, status=403)
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
class ReviewerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            reviewer = Reviewer.objects.get(user=request.user)
        except Reviewer.DoesNotExist:
            return Response({"error": "You are not a reviewer"}, status=403)
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
class StudentReviewStatusView(APIView):
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
class WeeklyToppersView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        if not (user.is_admin or user.is_mentor):
            return Response({"detail": "Not authorized"}, status=403)
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
class StudentWeekReviewView(generics.RetrieveUpdateAPIView):
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
        review = serializer.save()
        # Auto-complete module if total score passes threshold (>=30) – optional, can be removed
        if review.total_score is not None and review.total_score >= 30:
            student_module, created = StudentModule.objects.get_or_create(
                student=review.student,
                module=review.module
            )
            if not student_module.is_completed:
                student_module.is_completed = True
                student_module.completed_at = timezone.now()
                student_module.save()


# ----------------------------
# WEEK UPDATE VIEWSET
# ----------------------------
class WeekUpdateViewSet(viewsets.ModelViewSet):
    queryset = WeekUpdate.objects.all()
    serializer_class = WeekUpdateSerializer
    permission_classes = [IsAuthenticated]


# ----------------------------
# REVIEW FOLDER VIEWSET (SINGLE, WITH NOTIFICATIONS)
# ----------------------------
class ReviewFolderViewSet(viewsets.ModelViewSet):
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

    def perform_update(self, serializer):
        old = self.get_object()
        instance = serializer.save(updated_by=self.request.user)
        if old.industry_expert != instance.industry_expert and instance.industry_expert:
            self._notify_reviewer(instance)

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
            link="/reviewer/review-folders",
            is_read=False
        )


# ----------------------------
# CHAT VIEWS
# ----------------------------
class ChatRoomList(generics.ListAPIView):
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


class ChatMessageList(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return ChatMessage.objects.filter(room_id=room_id).order_by('timestamp')


class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            return ChatMessage.objects.filter(room_id=room_id).order_by('-timestamp')
        return ChatMessage.objects.none()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class ClearChatMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        room_id = request.query_params.get('room')
        if not room_id:
            return Response({"error": "room parameter required"}, status=400)
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Room not found"}, status=404)
        user = request.user
        if not (room.mentor and room.mentor.user == user) and not (room.reviewer and room.reviewer.user == user) and not (room.student and room.student.user == user):
            return Response({"error": "Not authorized"}, status=403)
        room.messages.all().delete()
        return Response({"detail": "All messages cleared"})


class MarkMessagesReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        try:
            room = get_object_or_404(ChatRoom, id=room_id)
            updated = ChatMessage.objects.filter(room=room, is_read=False).exclude(sender=request.user).update(
                is_read=True,
                read_at=timezone.now()
            )
            return Response({"marked_read": updated}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class RespondToMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            message = ChatMessage.objects.get(id=message_id)
        except ChatMessage.DoesNotExist:
            return Response({"error": "Message not found"}, status=404)
        room = message.room
        user = request.user
        if room.reviewer and room.reviewer.user == user:
            action = request.data.get('action')
            suggested_time = request.data.get('suggested_time')
            if action not in ['accepted', 'rejected']:
                return Response({"error": "Invalid action"}, status=400)
            message.action = action
            if suggested_time:
                message.suggested_time = suggested_time
            message.responded_at = timezone.now()
            message.save()
            return Response(ChatMessageSerializer(message).data)
        else:
            return Response({"error": "Not authorized"}, status=403)


# ----------------------------
# STUDENT COURSE STATUS VIEW
# ----------------------------
class StudentCourseStatusView(generics.RetrieveUpdateAPIView):
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
# NOTIFICATION VIEWSET (with pagination)
# ----------------------------
class NotificationPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100

class NotificationViewSet(viewsets.ModelViewSet):
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
class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


# ----------------------------
# STUDENT DOCUMENTS
# ----------------------------
class StudentDocumentListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)
            docs = student.student_documents.all()
            serializer = StudentDocumentSerializer(docs, many=True, context={'request': request})
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)

class UploadStudentDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request):
        file = request.FILES.get('file')
        student_id = request.data.get('student')
        if not file or not student_id:
            return Response({'error': 'file and student id required'}, status=400)
        try:
            student = Student.objects.get(id=student_id)
            doc = StudentDocument.objects.create(student=student, file=file)
            serializer = StudentDocumentSerializer(doc, context={'request': request})
            return Response(serializer.data, status=201)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)

class StudentDocumentDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, doc_id):
        try:
            doc = StudentDocument.objects.get(id=doc_id)
            doc.delete()
            return Response(status=204)
        except StudentDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)


# ----------------------------
# MENTOR DOCUMENTS
# ----------------------------
class MentorDocumentListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, mentor_id):
        try:
            mentor = Mentor.objects.get(id=mentor_id)
            docs = mentor.mentor_documents.all()
            serializer = MentorDocumentSerializer(docs, many=True, context={'request': request})
            return Response(serializer.data)
        except Mentor.DoesNotExist:
            return Response({'error': 'Mentor not found'}, status=404)

class UploadMentorDocumentView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request):
        file = request.FILES.get('file')
        mentor_id = request.data.get('mentor')
        if not file or not mentor_id:
            return Response({'error': 'file and mentor id required'}, status=400)
        try:
            mentor = Mentor.objects.get(id=mentor_id)
            doc = MentorDocument.objects.create(mentor=mentor, file=file)
            serializer = MentorDocumentSerializer(doc, context={'request': request})
            return Response(serializer.data, status=201)
        except Mentor.DoesNotExist:
            return Response({'error': 'Mentor not found'}, status=404)

class MentorDocumentDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, doc_id):
        try:
            doc = MentorDocument.objects.get(id=doc_id)
            doc.delete()
            return Response(status=204)
        except MentorDocument.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)


# ----------------------------
# REVIEW ASSIGNMENT VIEWSET
# ----------------------------
class ReviewAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ReviewAssignment.objects.all()
    serializer_class = ReviewAssignmentSerializer
    permission_classes = [IsMentorOrReviewerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_reviewer:
            reviewer = Reviewer.objects.get(user=user)
            return ReviewAssignment.objects.filter(reviewer=reviewer)
        elif user.is_mentor:
            mentor = Mentor.objects.get(user=user)
            return ReviewAssignment.objects.filter(mentor=mentor)
        return ReviewAssignment.objects.all()

    def perform_create(self, serializer):
        if self.request.user.is_mentor:
            mentor = Mentor.objects.get(user=self.request.user)
            assignment = serializer.save(mentor=mentor)
            Notification.objects.create(
                user=assignment.reviewer.user,
                message=f"You have a new review assignment from {mentor.full_name or mentor.user.username} for student {assignment.student.full_name or assignment.student.user.username} (Course: {assignment.course})",
                link="/reviewer/assignments"
            )
        else:
            raise PermissionError("Only mentors can create assignments")

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.is_reviewer:
            allowed_fields = ['status', 'comments']
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            serializer = self.get_serializer(instance, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            if 'status' in data and data['status'] in ['accepted', 'rejected']:
                Notification.objects.create(
                    user=instance.mentor.user,
                    message=f"Reviewer {instance.reviewer.full_name or instance.reviewer.user.username} has {data['status']} the assignment for student {instance.student.full_name or instance.student.user.username} (Course: {instance.course})",
                    link="/mentor/assignments"
                )
            return Response(serializer.data)
        elif request.user.is_mentor or request.user.is_admin:
            return super().update(request, *args, **kwargs)
        else:
            return Response({"error": "Not allowed"}, status=403)


# ----------------------------
# RECENT MESSAGES API (with LimitOffsetPagination)
# ----------------------------
class RecentMessagesAPIView(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    pagination_class = LimitOffsetPagination
    pagination_class.default_limit = 10   
    pagination_class.max_limit = 1000     

    def get_queryset(self):
        return ContactMessage.objects.all().order_by('-created_at')


# ----------------------------
# WEEKLY SUBMISSIONS VIEWS
# ----------------------------
class StudentSubmissionListCreateView(generics.ListCreateAPIView):
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
        serializer.save(student=student)

class SubmissionBulkUpdateView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updates = request.data.get('updates', [])
        for upd in updates:
            submission = WeeklySubmission.objects.get(id=upd['id'])
            if 'marks' in upd:
                submission.marks = upd['marks']
            if 'mentor_feedback' in upd:
                submission.mentor_feedback = upd['mentor_feedback']
            if 'reviewed' in upd:
                submission.reviewed = upd['reviewed']
                submission.reviewed_at = timezone.now() if upd['reviewed'] else None
            submission.save()
        return Response({'status': 'ok'})


# ----------------------------
# ATTENDANCE (IN/OUT REGISTER) VIEWS
# ----------------------------
class CheckInView(generics.CreateAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        
        # Ensure the student profile exists (create if missing)
        student, created = Student.objects.get_or_create(
            user=user,
            defaults={'course': '', 'batch': ''}
        )
        if created:
            print(f"Auto-created student profile for {user.username} during check‑in")

        today = timezone.now().date()
        existing = AttendanceRecord.objects.filter(student=student, check_in__date=today).first()
        if existing and existing.check_out is None:
            raise ValidationError("You are already checked in today. Please check out first.")
        
        serializer.save(student=student, check_in=timezone.now())

class CheckOutView(generics.UpdateAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        student = getattr(self.request.user, 'student_profile', None)
        if not student:
            raise NotFound("Only students can check out.")
        today = timezone.now().date()
        record = AttendanceRecord.objects.filter(
            student=student, check_in__date=today, check_out__isnull=True
        ).first()
        if not record:
            raise NotFound("No active check-in found for today.")
        return record

    def perform_update(self, serializer):
        break_minutes = self.request.data.get('break_minutes', 0)
        check_out_reason = self.request.data.get('check_out_reason', '')
        serializer.save(
            check_out=timezone.now(),
            break_minutes=break_minutes,
            check_out_reason=check_out_reason
        )

class AttendanceHistoryView(generics.ListAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')
        date_str = self.request.query_params.get('date')

        # ---- Students see only their own records ----
        if hasattr(user, 'student_profile'):
            qs = AttendanceRecord.objects.filter(student=user.student_profile)

        # ---- Mentors see only their assigned students ----
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

        # ---- Admin / reviewer see all, optionally filtered by student_id ----
        else:
            qs = AttendanceRecord.objects.all()
            if student_id:
                qs = qs.filter(student_id=student_id)

        # ✅ APPLY DATE FILTER (exact day, ignores time of day)
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                qs = qs.filter(check_in__date=target_date)
            except ValueError:
                pass

        return qs
    
    