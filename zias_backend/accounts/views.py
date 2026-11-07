import re
import secrets
import string
from datetime import timedelta, datetime

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.db.models import Q, Sum, Count
from django.db.models.functions import TruncMonth, TruncWeek, TruncYear
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import Group, User
from django.apps import apps

from rest_framework import status, viewsets, permissions, generics
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from rest_framework.filters import BaseFilterBackend
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from .models import (
    User, Student, Mentor, Reviewer, Course, Module, Day, Task, Batch,
    StudentModule, PasswordResetToken, ContactMessage, StudentWeekReview, WeekUpdate, 
    ReviewFolder, ChatRoom, ChatMessage, CourseStatus, Notification, StudentDocument,
    MentorDocument, ReviewAssignment, WeeklySubmission, AttendanceRecord, Accounts,
)

from .serializers import (
    StudentSerializer, MentorSerializer, ReviewerSerializer, UserSerializer,
    CourseSerializer, ModuleSerializer, DaySerializer, TaskSerializer, BatchSerializer,
    ContactMessageSerializer, StudentModuleSerializer, StudentWeekReviewSerializer, 
    WeekUpdateSerializer, ReviewFolderSerializer, ChatRoomSerializer, ChatMessageSerializer, 
    CourseStatusSerializer, NotificationSerializer, StudentDocumentSerializer, MentorDocumentSerializer, 
    ReviewAssignmentSerializer, WeeklySubmissionSerializer, AttendanceRecordSerializer,
    AccountsSerializer
)

from .permissions import (
    IsAdminUser, IsAdminOrReadOnly, IsStudentOwner, IsMentorOrReviewerOrAdmin
)


def generate_random_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def send_password_email(user, password):
    pass


# ====================== SAFE ERROR HANDLING ======================
class SafeAPIView(APIView):
    def handle_exception(self, exc):
        if isinstance(exc, (ValidationError, NotFound, PermissionDenied)):
            return super().handle_exception(exc)
        if hasattr(exc, 'status_code') and exc.status_code in (401, 403):
            return super().handle_exception(exc)
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
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # Force dates to be saved as-is without timezone conversion
        if data.get('start_date'):
            if isinstance(data['start_date'], str):
                data['start_date'] = data['start_date'][:10]  # Take only YYYY-MM-DD
        if data.get('end_date'):
            if isinstance(data['end_date'], str):
                data['end_date'] = data['end_date'][:10]
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        data = request.data.copy()
        
        if data.get('start_date'):
            if isinstance(data['start_date'], str):
                data['start_date'] = data['start_date'][:10]
        if data.get('end_date'):
            if isinstance(data['end_date'], str):
                data['end_date'] = data['end_date'][:10]
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


# ----------------------------
# STUDENT VIEWSET
# ----------------------------
class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Student.objects.all()

        user_role = getattr(user, 'role', None)

        if user_role == 'admin':
            return Student.objects.all()

        if user_role == 'mentor':
            mentor = Mentor.objects.filter(user=user).first()

            if mentor and mentor.batch:
                return Student.objects.filter(student_batch=mentor.batch)

            return Student.objects.none()

        if user_role == 'student':
            return Student.objects.filter(user=user)

        return Student.objects.none()

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()

            mentor_id = request.query_params.get('mentor')
            if mentor_id:
                mentor = Mentor.objects.filter(id=mentor_id).first()

                if mentor and mentor.batch:
                    queryset = queryset.filter(
                        student_batch=mentor.batch
                    )
                else:
                    queryset = queryset.none()

            batch = request.query_params.get('batch')
            if batch:
                queryset = queryset.filter(student_batch=batch)

            serializer = self.get_serializer(queryset, many=True)

            return Response({
                'count': queryset.count(),
                'next': None,
                'previous': None,
                'results': serializer.data
            })

        except Exception as e:
            import traceback
            traceback.print_exc()

            return Response(
                {
                    'error': str(e),
                    'detail': 'Failed to fetch students'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        try:
            student = Student.objects.filter(user=request.user).first()

            if not student:
                return Response(
                    {'detail': 'Student profile not found for this user.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = self.get_serializer(student)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def create(self, request, *args, **kwargs):
        user_role = getattr(request.user, 'role', None)

        if not (
            request.user.is_superuser
            or user_role == 'admin'
            or user_role == 'mentor'
        ):
            return Response(
                {'detail': 'Only Admin and Mentor can create students.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            serializer = self.get_serializer(data=request.data)

            if serializer.is_valid():
                student = serializer.save()

                # Ensure the linked user belongs to the Students group
                # so that user.is_student / user.role work everywhere.
                if getattr(student, 'user', None):
                    students_group, _ = Group.objects.get_or_create(
                        name='Students'
                    )
                    student.user.groups.add(students_group)

                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            import traceback
            traceback.print_exc()

            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        user_role = getattr(request.user, 'role', None)

        if not (
            request.user.is_superuser
            or user_role == 'admin'
            or user_role == 'mentor'
        ):
            return Response(
                {'detail': 'Only Admin and Mentor can update students.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()

            serializer = self.get_serializer(
                instance,
                data=request.data,
                partial=partial
            )

            if serializer.is_valid():
                student = serializer.save()

                # Keep the group consistent on update as well
                if getattr(student, 'user', None):
                    students_group, _ = Group.objects.get_or_create(
                        name='Students'
                    )
                    student.user.groups.add(students_group)

                return Response(
                    serializer.data,
                    status=status.HTTP_200_OK
                )

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        except ObjectDoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            import traceback
            traceback.print_exc()

            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        user_role = getattr(request.user, 'role', None)

        if not (
            request.user.is_superuser
            or user_role == 'admin'
            or user_role == 'mentor'
        ):
            return Response(
                {'detail': 'Only Admin and Mentor can delete students.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            instance = self.get_object()

            from .models import (
                StudentWeekReview,
                AttendanceRecord,
                WeeklySubmission,
                StudentModule,
                TaskCompletion,
                ReviewFolder,
                ReviewAssignment,
                CourseStatus,
                StudentDocument,
                ChatRoom,
            )

            # 1. Delete direct children that reference this student
            StudentWeekReview.objects.filter(student=instance).delete()
            AttendanceRecord.objects.filter(student=instance).delete()
            WeeklySubmission.objects.filter(student=instance).delete()
            StudentModule.objects.filter(student=instance).delete()
            TaskCompletion.objects.filter(student=instance).delete()
            ReviewFolder.objects.filter(student=instance).delete()
            ReviewAssignment.objects.filter(student=instance).delete()
            CourseStatus.objects.filter(student=instance).delete()
            StudentDocument.objects.filter(student=instance).delete()

            # 2. Delete chat rooms and their messages
            for room in ChatRoom.objects.filter(student=instance):
                room.messages.all().delete()
                room.delete()

            # 3. Clear many-to-many documents
            if hasattr(instance, 'documents'):
                instance.documents.clear()

            # 4. Finally delete the student
            instance.delete()

            return Response(status=status.HTTP_204_NO_CONTENT)

        except ObjectDoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            # Print the real traceback to Render logs for debugging
            import traceback
            traceback.print_exc()

            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        except ObjectDoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


# ----------------------------
# MENTOR VIEWSET
# ----------------------------
class MentorViewSet(viewsets.ModelViewSet):
    queryset = Mentor.objects.all()
    serializer_class = MentorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or getattr(user, 'role', '') == 'admin':
            return Mentor.objects.all()
        elif getattr(user, 'role', '') == 'mentor':
            return Mentor.objects.filter(user=user)
        return Mentor.objects.none()

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        try:
            mentor = Mentor.objects.filter(user=request.user).first()
            if not mentor:
                return Response(
                    {'detail': 'Mentor profile not found for this user.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = self.get_serializer(mentor)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        try:
            print("=" * 50)
            print("Received data:", request.data)
            print("=" * 50)
            
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                mentor = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            print("Validation Errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Exception:", str(e))
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------
# REVIEWER VIEWSET
# ----------------------------
class ReviewerViewSet(viewsets.ModelViewSet):
    queryset = Reviewer.objects.all()
    serializer_class = ReviewerSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        reviewer = Reviewer.objects.filter(user=request.user).first()
        if not reviewer:
            return Response(
                {'detail': 'Reviewer profile not found for this user.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(reviewer)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        try:
            print("=" * 50)
            print("Data received:", request.data)
            print("=" * 50)

            serializer = self.get_serializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                reviewer = serializer.save()
                return Response(serializer.data, status=201)
            print("Errors:", serializer.errors)
            return Response(serializer.errors, status=400)
        except Exception as e:
            print("Exception:", str(e))
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=400)


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
            return Response(
                {"error": "course_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        common_modules = Module.objects.filter(is_common=True)

        course_modules = Module.objects.filter(
            course_id=course_id,
            is_common=False
        )

        all_modules = (
            common_modules | course_modules
        ).distinct().order_by('order', 'id')

        serializer = self.get_serializer(all_modules, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=['get'],
        url_path='student-modules',
        permission_classes=[IsAuthenticated]
    )
    def student_modules(self, request):

        user = request.user
        student_id = request.query_params.get('student_id')

        # 1. Identify the student
        is_admin = user.is_superuser or user.is_staff or getattr(
            user, 'is_admin', False
        )
        is_mentor = getattr(user, 'is_mentor', False)
        is_reviewer = getattr(user, 'is_reviewer', False)

        if is_admin or is_mentor or is_reviewer:

            if not student_id:
                return Response(
                    {"error": "Please provide student_id"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            student = get_object_or_404(Student, id=student_id)

            # NOTE:
            # Add mentor/reviewer-to-student relationship checks here
            # using your existing assignment models before production use.

        else:
            student = Student.objects.filter(user=user).first()

            if not student:
                return Response(
                    {"error": "Student profile not found"},
                    status=status.HTTP_403_FORBIDDEN
                )

        # 2. Foundation modules: available to all students
        foundation_modules = Module.objects.filter(
            is_common=True
        )

        # 3. Custom modules: only for the student's course
        student_course = (student.course or '').strip()

        custom_modules = Module.objects.none()

        if student_course:
            custom_modules = Module.objects.filter(
                is_common=False,
                course__name__iexact=student_course
            )

        # 4. Combine available modules
        available_modules = (
            foundation_modules | custom_modules
        ).distinct().select_related('course').order_by('order', 'id')

        # 5. Retrieve existing student completion records
        assignments = {
            assignment.module_id: assignment
            for assignment in StudentModule.objects.filter(
                student=student,
                module__in=available_modules
            )
        }

        # 6. Retrieve completed review weeks
        reviews = StudentWeekReview.objects.filter(
            student=student,
            task_status='Task Completed'
        ).select_related('module')

        completed_weeks = {
            review.module.order
            for review in reviews
            if review.module.order is not None
        }

        current_week = max(completed_weeks) if completed_weeks else 0

        # 7. Build response
        result = []

        for module in available_modules:

            assignment = assignments.get(module.id)

            week_num = module.order or 0
            is_locked = week_num > current_week + 1

            result.append({
                'id': module.id,
                'title': module.title,
                'content': module.content,
                'order': module.order,
                'module_order': module.order,
                'course_name': (
                    module.course.name if module.course else None
                ),
                'is_common': module.is_common,
                'is_locked': is_locked,
                'is_completed': (
                    assignment.is_completed if assignment else False
                ),
                'completion_percentage': (
                    100 if assignment and assignment.is_completed else 0
                ),
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
            return Response({"detail": "Only students can complete modules."}, status=400)
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
    serializer_class = StudentModuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Admin can view all student-module assignments
        if user.is_superuser or user.is_staff:
            return StudentModule.objects.select_related(
                'student',
                'module',
                'module__course'
            ).all().order_by('order', 'id')

        # Find the logged-in student's profile
        student = Student.objects.filter(user=user).first()

        if not student:
            return StudentModule.objects.none()

        # Students can see all modules assigned to their own account,
        # including common modules assigned by Admin.
        return StudentModule.objects.filter(
            student=student
        ).select_related(
            'student',
            'module',
            'module__course'
        ).order_by('order', 'module__order', 'id')



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

        is_admin = user.is_superuser or user.is_staff
        is_accounts = user.groups.filter(name='Accounts').exists()
        is_reviewer = user.groups.filter(name='Reviewers').exists()
        is_mentor = user.groups.filter(name='Mentors').exists()
        is_student = Student.objects.filter(user=user).exists()

        role = 'user'

        if is_admin:
            role = 'admin'
        elif is_accounts:
            role = 'accounts'
        elif is_reviewer:
            role = 'reviewer'
        elif is_mentor:
            role = 'mentor'
        elif is_student:
            role = 'student'

        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': role,
            'is_admin': is_admin,
            'is_accounts': is_accounts,
            'is_reviewer': is_reviewer,
            'is_mentor': is_mentor,
            'is_student': is_student,
            'full_name': user.get_full_name() or user.username,
        }

        return Response(user_data)

    def patch(self, request):
        return Response({"detail": "PATCH not implemented"}, status=400)



# ----------------------------
# CHANGE PASSWORD
# ----------------------------
class ChangePasswordView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password') or request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        if not new_password:
            return Response({"detail": "New password is required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({"detail": "New password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)
        if confirm_password and new_password != confirm_password:
            return Response({"detail": "New passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.password_changed_at = timezone.now()
        user.save()
        try:
            OutstandingToken.objects.filter(user=user).delete()
        except Exception:
            pass
        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


# ----------------------------
# SEND BULK EMAIL
# ----------------------------
class SendBulkEmailView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.is_admin:
            return Response({"detail": "Admin access required."}, status=400)
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
            user = User.objects.get(email=email)
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
            return Response({"detail": "Unauthorized"}, status=400)
        count = ContactMessage.objects.filter(is_read=False).count()
        return Response({"unread_count": count})


class RecentMessagesView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({"detail": "Unauthorized"}, status=404)
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
            return Response({"detail": "Unauthorized"}, status=400)
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

# ----------------------------
# CUSTOM LOGIN VIEW
# ----------------------------
class CustomLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        login_id = (
            request.data.get('email')
            or request.data.get('username')
            or request.data.get('login')
        )
        password = request.data.get('password')

        print("=" * 50)
        print(f"Login attempt: {login_id}")
        print("=" * 50)

        if not login_id or not password:
            return Response(
                {'error': 'Username/email and password are required'},
                status=400
            )

        login_id = login_id.strip()

        user = None

        # --------------------------------
        # 1. Try username login first
        # --------------------------------
        try:
            user = User.objects.get(username__iexact=login_id)
            print(f"Found by username: {user.username}")

        except User.DoesNotExist:

            # --------------------------------
            # 2. If username not found, try email
            # --------------------------------
            matching_users = User.objects.filter(
                email__iexact=login_id,
                is_active=True
            )

            if not matching_users.exists():
                return Response(
                    {'error': 'No account found'},
                    status=401
                )

            # --------------------------------
            # 3. Match password against accounts
            # --------------------------------
            password_matches = [
                candidate
                for candidate in matching_users
                if candidate.check_password(password)
            ]

            if len(password_matches) == 0:
                return Response(
                    {'error': 'Password is incorrect'},
                    status=401
                )

            if len(password_matches) > 1:
                return Response(
                    {
                        'error': (
                            'Multiple accounts match this email and password. '
                            'Please contact the administrator.'
                        )
                    },
                    status=409
                )

            user = password_matches[0]

            print(f"Found by email: {user.username}")

        # --------------------------------
        # 4. Check account status and password
        # --------------------------------
        if not user.is_active:
            return Response(
                {'error': 'Account is disabled'},
                status=401
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Password is incorrect'},
                status=401
            )

        # --------------------------------
        # 5. Determine user role
        # --------------------------------
        role = 'user'
        is_admin = False
        is_mentor = False
        is_reviewer = False
        is_student = False
        is_accounts = False

        if user.is_superuser or user.is_staff:
            role = 'admin'
            is_admin = True

        elif user.groups.filter(name='Accounts').exists():
            role = 'accounts'
            is_accounts = True

        elif user.groups.filter(name='Reviewers').exists():
            role = 'reviewer'
            is_reviewer = True

        elif user.groups.filter(name='Mentors').exists():
            role = 'mentor'
            is_mentor = True

        elif Student.objects.filter(user=user).exists():
            role = 'student'
            is_student = True

        elif user.groups.filter(name='Students').exists():
            role = 'student'
            is_student = True

        print(f"Determined role: {role}")
        print(f"User groups: {[g.name for g in user.groups.all()]}")

        # --------------------------------
        # 6. Generate JWT tokens
        # --------------------------------
        refresh = RefreshToken.for_user(user)

        # --------------------------------
        # 7. Prepare user response
        # --------------------------------
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': role,
            'is_admin': is_admin,
            'is_mentor': is_mentor,
            'is_reviewer': is_reviewer,
            'is_student': is_student,
            'is_accounts': is_accounts,
            'full_name': user.get_full_name() or user.username,
        }

        print(f"Response user_data: {user_data}")
        print("=" * 50)

        # --------------------------------
        # 8. Return response
        # --------------------------------
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
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
        user = request.user

        # ----------------------------
        # REVIEWER: View students in their course
        # ----------------------------
        if user.is_reviewer:
            try:
                reviewer = Reviewer.objects.get(user=user)

                students = Student.objects.filter(
                    course=reviewer.course
                ).select_related('user', 'student_batch')

            except Reviewer.DoesNotExist:
                students = Student.objects.none()

        # ----------------------------
        # MENTOR: View students in their assigned batch
        # ----------------------------
        elif user.is_mentor:
            try:
                mentor = Mentor.objects.get(user=user)

                if mentor.batch:
                    students = Student.objects.filter(
                        student_batch=mentor.batch
                    ).select_related('user', 'student_batch')
                else:
                    students = Student.objects.none()

            except Mentor.DoesNotExist:
                students = Student.objects.none()

        # ----------------------------
        # ADMIN: View all students
        # ----------------------------
        elif user.is_admin:
            students = Student.objects.select_related(
                'user',
                'student_batch'
            ).all()

        # ----------------------------
        # OTHER USERS: No permission
        # ----------------------------
        else:
            return Response(
                {"detail": "Not authorized"},
                status=status.HTTP_403_FORBIDDEN
            )

        # ----------------------------
        # PREPARE STUDENT RESPONSE DATA
        # ----------------------------
        data = [
            {
                "id": s.id,
                "name": s.full_name or s.user.username,
                "username": s.user.username,
                "email": s.user.email,
                "course": s.course,
                "batch_name": (
                    s.student_batch.name
                    if s.student_batch
                    else s.batch
                ),
                "batch_id": (
                    s.student_batch.id
                    if s.student_batch
                    else None
                ),
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
            }
            for s in students
        ]

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
            return Response({"error": "You are not a reviewer"}, status=400)
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


# ----------------------------
# WEEKLY TOPPERS VIEW
# ----------------------------
class WeeklyToppersView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_admin or user.is_mentor):
            return Response({"detail": "Not authorized"}, status=404)
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

        # 1. Admin, mentor, and reviewer access
        if user.is_superuser or user.is_staff or getattr(user, 'role', '') in ['admin', 'mentor', 'reviewer']:
            if not student_id:
                raise ValidationError({"detail": "student_id required"})

            try:
                student = Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                raise NotFound("Student not found")

        # 2. Student access (Bulletproof check)
        else:
            try:
                student = Student.objects.get(user=user)
            except Student.DoesNotExist:
                raise PermissionDenied("Student profile not found for this user.")

        # Get or create the student's weekly review
        obj, created = StudentWeekReview.objects.get_or_create(
            student=student,
            module_id=module_id
        )

        return obj

    def perform_update(self, serializer):
        old_instance = serializer.instance
        old_status = (
            old_instance.task_status
            if old_instance else None
        )

        # Save the updated review
        review = serializer.save()

        # Notify student when weekly review is completed
        if (
            review.task_status == 'Task Completed'
            and old_status != 'Task Completed'
        ):
            Notification.objects.create(
                user=review.student.user,
                message=(
                    f"🎉 Congratulations! Your week "
                    f"{review.module.order} review has been marked "
                    f"as completed."
                ),
                link="/student/review-sheet",
                is_read=False
            )

        # Mark module as completed when total score is 30 or above
        if (
            review.total_score is not None
            and review.total_score >= 30
        ):
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
                    message=(
                        f"🏆 You've completed the module: "
                        f"{review.module.title}. Great work!"
                    ),
                    link="/student/modules",
                    is_read=False
                )


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

    # ----------------------------
    # GET QUERYSET
    # ----------------------------

    def get_queryset(self):
        user = self.request.user

        # 1. Admin / Superuser
        if user.is_superuser or getattr(user, 'role', '') == 'admin':
            return ReviewFolder.objects.all().order_by('-created_at')

        # 2. Accounts
        if getattr(user, 'role', '') == 'accounts':
            return ReviewFolder.objects.all().order_by('-created_at')

        # 3. Mentor
        if getattr(user, 'role', '') == 'mentor':
            try:
                mentor = Mentor.objects.get(user=user)

                if not mentor.batch:
                    return ReviewFolder.objects.none()

                student_ids = Student.objects.filter(
                    student_batch=mentor.batch
                ).values_list('id', flat=True)

                return ReviewFolder.objects.filter(
                    student__id__in=student_ids
                ).order_by('-created_at')

            except Mentor.DoesNotExist:
                return ReviewFolder.objects.none()

        # 4. Reviewer
        if getattr(user, 'role', '') == 'reviewer':
            try:
                reviewer = Reviewer.objects.get(user=user)

                return ReviewFolder.objects.filter(
                    industry_expert__icontains=reviewer.full_name
                ).order_by('-created_at')

            except Reviewer.DoesNotExist:
                return ReviewFolder.objects.none()

        # 5. Student (Bulletproof check)
        try:
            student = Student.objects.get(user=user)
            # Return folders matching the student ID, their batch, or their course
            return ReviewFolder.objects.filter(
                Q(student=student) | 
                Q(student__student_batch=student.student_batch) |
                Q(course__iexact=student.course)
            ).distinct().order_by('-created_at')
        except Student.DoesNotExist:
            pass

        return ReviewFolder.objects.none()

    # ----------------------------
    # BYPASS SERIALIZER FOR LIST
    # ----------------------------
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = []
        for folder in queryset:
            data.append({
                "id": folder.id,
                "week_folder": folder.week_folder,
                "week": folder.week,
                "course": folder.course,
                "review_date": folder.review_date,
                "is_done": folder.is_done,
                "student_id": folder.student.id if folder.student else None,
                "student_name": folder.student.full_name if folder.student else "Unknown",
                "work_documents": folder.work_documents,
                "meeting_link": folder.meeting_link,
                "review_sheet": folder.review_sheet,
                "industry_expert": folder.industry_expert,
            })
        return Response(data)

    # ----------------------------
    # PERMISSIONS
    # ----------------------------

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [IsAuthenticated]
        else:
            self.permission_classes = [IsAuthenticated]

        return super().get_permissions()

    # ----------------------------
    # CREATE REVIEW FOLDER
    # ----------------------------

    def perform_create(self, serializer):
        instance = serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

        self._notify_reviewer(instance)
        self._sync_assignment(instance)

    # ----------------------------
    # UPDATE REVIEW FOLDER
    # ----------------------------

    def perform_update(self, serializer):
        old = self.get_object()

        # Store old values before saving because save() updates the instance.
        old_expert = old.industry_expert
        old_week = old.week

        instance = serializer.save(
            updated_by=self.request.user
        )

        # If the reviewer changes, notify the new reviewer.
        if old_expert != instance.industry_expert:
            self._notify_reviewer(instance)
            self._sync_assignment(instance)

        # If the week changes, sync the assignment.
        elif old_week != instance.week:
            self._sync_assignment(instance)

    # ----------------------------
    # NOTIFY REVIEWER
    # ----------------------------

    def _notify_reviewer(self, review_folder):
        expert_name = review_folder.industry_expert

        if not expert_name:
            return

        reviewer = Reviewer.objects.filter(
            Q(full_name__iexact=expert_name) |
            Q(user__username__iexact=expert_name)
        ).first()

        if not reviewer:
            print(f"Reviewer not found for {expert_name}")
            return

        student = review_folder.student

        if not student:
            return

        student_name = (
            getattr(student, 'full_name', None)
            or student.user.get_full_name()
            or student.user.username
        )

        folder_name = review_folder.week_folder or "Review folder"

        message = (
            f"📌 You have been assigned as industry expert "
            f"for {student_name} in folder '{folder_name}'."
        )

        Notification.objects.create(
            user=reviewer.user,
            message=message,
            link="/reviewer/assignments",
            is_read=False
        )

    # ----------------------------
    # SYNC REVIEW ASSIGNMENT
    # ----------------------------

    def _sync_assignment(self, review_folder):
        from .models import ReviewAssignment

        expert_name = review_folder.industry_expert

        if not expert_name:
            return

        # Find the reviewer.
        reviewer = Reviewer.objects.filter(
            Q(full_name__iexact=expert_name) |
            Q(user__username__iexact=expert_name)
        ).first()

        if not reviewer:
            print(
                f"Reviewer not found for name '{expert_name}'. "
                "Cannot sync assignment."
            )
            return

        # Get the student.
        student = review_folder.student

        if not student:
            print("No student found for this review folder.")
            return

        # Student is connected to Batch through student_batch.
        batch = student.student_batch

        if not batch:
            print(
                f"No batch assigned to student {student.id}. "
                "Cannot create assignment."
            )
            return

        # Find all mentors connected to this student's batch.
        mentors = Mentor.objects.filter(batch=batch).select_related('user')

        if not mentors.exists():
            print(
                f"No mentors found for batch {batch}. "
                "Cannot create assignment."
            )
            return

        course = student.course or ""
        week = review_folder.week or ""

        # Create or update an assignment for each mentor.
        for mentor in mentors:

            assignment, created = ReviewAssignment.objects.update_or_create(
                mentor=mentor,
                reviewer=reviewer,
                student=student,
                week=week,
                defaults={
                    'course': course,
                    'review_sheet': review_folder.review_sheet or "",
                    'work_documents': review_folder.work_documents or "",
                    'status': 'assigned',
                }
            )

            print(
                f"Assignment {'created' if created else 'updated'} "
                f"for mentor {mentor.full_name}, "
                f"student {student.full_name}, "
                f"week {week}, "
                f"status {assignment.status}"
            )

            # ----------------------------
            # NOTIFICATIONS
            # ----------------------------

            if created:

                # Notify mentor.
                Notification.objects.create(
                    user=mentor.user,
                    message=(
                        f"✅ Review assignment created for "
                        f"{student.full_name or student.user.username} "
                        f"(Week {week}) with reviewer "
                        f"{reviewer.full_name or reviewer.user.username}"
                    ),
                    link="/mentor/assignments",
                    is_read=False
                )

                # Notify reviewer.
                Notification.objects.create(
                    user=reviewer.user,
                    message=(
                        f"📋 New review assignment from "
                        f"{mentor.full_name or mentor.user.username} "
                        f"for student "
                        f"{student.full_name or student.user.username} "
                        f"(Course: {course}, Week: {week})"
                    ),
                    link="/reviewer/assignments",
                    is_read=False
                )

            else:

                # If the assignment was rejected, reassign it.
                if assignment.status == 'rejected':

                    assignment.status = 'assigned'

                    assignment.save(
                        update_fields=['status']
                    )

                    Notification.objects.create(
                        user=reviewer.user,
                        message=(
                            f"🔄 Review assignment re-assigned for "
                            f"{student.full_name or student.user.username} "
                            f"(Week {week}) by "
                            f"{mentor.full_name or mentor.user.username}"
                        ),
                        link="/reviewer/assignments",
                        is_read=False
                    )

                # Notify mentor about the update.
                Notification.objects.create(
                    user=mentor.user,
                    message=(
                        f"📝 Updated assignment for "
                        f"{student.full_name or student.user.username} "
                        f"with reviewer "
                        f"{reviewer.full_name or reviewer.user.username} "
                        f"(Week: {week})"
                    ),
                    link="/mentor/assignments",
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
            return Response({"error": "Not authorized"}, status=400)
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
            return Response({"error": "Not authorized"}, status=400)


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


class UploadStudentDocumentView(APIView):  # ✅ Changed from SafeAPIView to APIView
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        student_id = request.data.get('student')
        
        if not file or not student_id:
            # Debug: Show exactly what the backend received
            return Response({
                'error': 'file and student id required',
                'debug': {
                    'files_received': list(request.FILES.keys()),
                    'data_received': list(request.data.keys()),
                }
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            student = Student.objects.get(id=student_id)
            doc = StudentDocument.objects.create(student=student, file=file)
            serializer = StudentDocumentSerializer(doc, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        

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
# REVIEW ASSIGNMENT VIEWSET
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
        try:
            if user.is_mentor:
                mentor = Mentor.objects.get(user=user)
                return ReviewAssignment.objects.filter(mentor=mentor)
            elif user.is_reviewer:
                reviewer = Reviewer.objects.get(user=user)
                return ReviewAssignment.objects.filter(reviewer=reviewer)
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
            return Response({"error": "Not allowed"}, status=404)

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
            return Response({"error": "Not allowed"}, status=404)

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
            return Response({"error": "Only the assigned reviewer can suggest a time"}, status=status.HTTP_404_NOT_FOUND)

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

        # Notify all mentors in the student's batch
        if student.student_batch:
            mentors = Mentor.objects.filter(
                batch=student.student_batch
            ).select_related('user')

            for mentor in mentors:
                Notification.objects.create(
                    user=mentor.user,
                    message=(
                        f"{student.full_name or student.user.username} submitted "
                        f"'{submission.get_submission_type_display()}' for week "
                        f"{submission.week.order or submission.week.id}."
                    ),
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
        student = getattr(self.request.user, 'student_profile', None)
        if not student:
            raise NotFound("Only students can check out.")
        record = AttendanceRecord.objects.filter(
            student=student, check_out__isnull=True
        ).order_by('-check_in').first()
        if not record:
            raise NotFound("No active check‑in found for this student.")
        return record

    def perform_update(self, serializer):
        raw_break = self.request.data.get('break_minutes', 0)
        try:
            break_minutes = int(raw_break)
        except (TypeError, ValueError):
            break_minutes = 0
        break_minutes = max(0, break_minutes)

        check_out_reason = self.request.data.get('check_out_reason', '')

        serializer.save(
            check_out=timezone.now(),
            break_minutes=break_minutes,
            check_out_reason=check_out_reason
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

# ----------------------------
# ACCOUNTS VIEWSET
# ----------------------------
class AccountsViewSet(viewsets.ModelViewSet):

    queryset = Accounts.objects.all()
    serializer_class = AccountsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser or user.role == 'admin':
            return Accounts.objects.select_related('user').all()

        if user.role == 'accounts':
            return Accounts.objects.filter(user=user)

        return Accounts.objects.none()

    def create(self, request, *args, **kwargs):

        user_id = request.data.get('user')

        if user_id:
            existing = Accounts.objects.filter(
                user_id=user_id
            ).first()

            if existing:
                return Response(
                    {'error': 'User already has an accounts profile'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            try:
                account = serializer.save()

                return Response({
                    'id': account.id,
                    'user': {
                        'id': account.user.id,
                        'username': account.user.username,
                        'email': account.user.email,
                    },
                    'full_name': account.full_name,
                    'phone': account.phone,
                    'department': account.department,
                    'is_accounts': account.user.is_accounts,
                    'role': account.user.role,
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def update(self, request, *args, **kwargs):

        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        if 'user' in request.data:
            return Response(
                {'error': 'Cannot change the user associated with accounts profile'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if 'email' in request.data:
            return Response(
                {'error': 'Email cannot be changed. Please contact admin.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial
        )

        if serializer.is_valid():
            self.perform_update(serializer)

            return Response({
                'id': instance.id,
                'user': {
                    'id': instance.user.id,
                    'username': instance.user.username,
                    'email': instance.user.email,
                },
                'full_name': instance.full_name,
                'phone': instance.phone,
                'department': instance.department,
                'is_accounts': instance.user.is_accounts,
                'role': instance.user.role,
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):

        instance = self.get_object()
        user = instance.user

        accounts_group = Group.objects.filter(
            name='Accounts'
        ).first()

        if accounts_group:
            user.groups.remove(accounts_group)

        instance.delete()

        return Response(
            {'message': 'Accounts profile deleted successfully'},
            status=status.HTTP_200_OK
        )


# ----------------------------
# REGISTER USER VIEW
# ----------------------------
class RegisterUserView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = request.data.get('role', 'student')
        
        if role not in ['student', 'mentor', 'reviewer', 'admin', 'accounts']:
            return Response({"detail": "Invalid role. Choose from: student, mentor, reviewer, admin, accounts"}, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        password = validated_data.pop('password', None)
        if not password:
            password = generate_random_password()

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        group_name = role.capitalize()
        group, created = Group.objects.get_or_create(name=group_name)
        user.groups.add(group)

        if role == 'admin':
            user.is_staff = True
            user.is_superuser = True
            user.save(update_fields=['is_staff, is_superuser'])
        
        if role == 'student':
            Student.objects.get_or_create(user=user, defaults={'full_name': user.get_full_name() or user.username})
        elif role == 'mentor':
            Mentor.objects.get_or_create(user=user, defaults={'full_name': user.get_full_name() or user.username})
        elif role == 'reviewer':
            Reviewer.objects.get_or_create(user=user, defaults={'full_name': user.get_full_name() or user.username})
        elif role == 'accounts':
            Accounts.objects.get_or_create(user=user, defaults={
                'full_name': user.get_full_name() or user.username,
                'department': 'Finance'
            })

        try:
            send_mail(
                f'Your {role} account has been created',
                f'Your account has been created.\nUsername: {user.username}\nPassword: {password}\nRole: {role}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False
            )
            email_sent = True
        except Exception as e:
            print(f"❌ Email sending failed for {user.email}: {e}")
            email_sent = False

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role,
            "groups": [g.name for g in user.groups.all()],
            "email_sent": email_sent,
            "message": f"{role.capitalize()} user created successfully. {'Email sent.' if email_sent else 'Email could not be sent.'}"
        }, status=status.HTTP_201_CREATED)


# ----------------------------
# ACCOUNTS DASHBOARD VIEW
# ----------------------------
class AccountsDashboardView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            if not (user.is_accounts or user.is_admin):
                return Response({"detail": "Not authorized"}, status=400)

            period = request.query_params.get('period', 'monthly')
            students = Student.objects.all().select_related('user')

            student_details = []
            for student in students:
                student_details.append({
                    'student_name': student.full_name or student.user.username,
                    'course': student.course,
                })

            return Response({
                'period': period,
                'student_summary': student_details,
                'summary': {
                    'total_students': students.count(),
                }
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

# ----------------------------
# ACCOUNTS PROFILE VIEW
# ----------------------------
class AccountsProfileView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_accounts:
            return Response({"detail": "Not authorized"}, status=400)
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
            return Response({"detail": "Not authorized"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            profile = user.accounts_profile
        except Accounts.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

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

        return Response({'detail': 'Profile updated successfully'})




# ----------------------------
# ACCOUNTS STUDENT LIST VIEW
# ----------------------------
class AccountsStudentListView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_accounts or user.is_admin or user.is_mentor):
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        students = Student.objects.all().select_related('user', 'reviewer')

        result = []
        for student in students:
            result.append({
                'id': student.id,
                'name': student.full_name or student.user.username,
                'email': student.user.email,
                'phone': student.phone,
                'course': student.course,
                'batch': student.batch,
                'reviewer_name': student.reviewer.full_name if student.reviewer else '—',
            })

        return Response(result)




class StudentProgressView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        user = request.user
        # Check permissions
        if not (user.is_accounts or user.is_admin or user.is_mentor):
            return Response({"detail": "Not authorized"}, status=403)
        
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found"}, status=404)
        
        # Get all modules for the student's course
        if student.course:
            modules = Module.objects.filter(
                Q(is_common=True) | Q(course__name=student.course)
            ).order_by('order')
        else:
            modules = Module.objects.filter(is_common=True).order_by('order')
        
        # Get completed weeks from StudentWeekReview in ONE query
        completed_reviews = StudentWeekReview.objects.filter(
            student=student,
            task_status='Task Completed'
        ).values_list('module_id', flat=True)
        
        # Get module orders for completed weeks
        completed_modules = Module.objects.filter(id__in=completed_reviews)
        completed_weeks = [m.order for m in completed_modules if m.order]
        completed_weeks.sort()
        
        total_weeks = modules.count()
        last_completed = completed_weeks[-1] if completed_weeks else 0
        current_week = last_completed + 1
        progress_percent = round((len(completed_weeks) / total_weeks) * 100) if total_weeks > 0 else 0
        
        return Response({
            'student_id': student.id,
            'student_name': student.full_name or student.user.username,
            'course': student.course or '—',
            'batch': student.batch or '—',
            'completed_weeks': completed_weeks,
            'current_week': current_week,
            'next_week': current_week + 1 if current_week < total_weeks else None,
            'total_weeks': total_weeks,
            'progress_percent': progress_percent,
        })




# accounts/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Q, Count, Case, When, Value, IntegerField
from .models import Student, Module, Day, Task, TaskCompletion
from .serializers import TaskCompletionSerializer

class ModuleProgressView(APIView):
    """
    Get a student's progress for a specific module
    GET /api/module-progress/?student=<student_id>&module=<module_id>
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        student_id = request.query_params.get('student')
        module_id = request.query_params.get('module')
        
        # Validate parameters
        if not student_id:
            return Response(
                {"error": "student parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not module_id:
            return Response(
                {"error": "module parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the student and module
            student = Student.objects.get(id=student_id)
            module = Module.objects.get(id=module_id)
            
            # Get all days for this module
            days = Day.objects.filter(module=module)
            
            # Get all tasks for all days in this module
            tasks = Task.objects.filter(day__in=days)
            total_tasks = tasks.count()
            
            # Get completed tasks for this student
            completed_tasks = TaskCompletion.objects.filter(
                student=student,
                task__in=tasks,
                completed=True
            )
            completed_count = completed_tasks.count()
            
            # Create a dictionary of task completions
            task_completions = {}
            for completion in completed_tasks:
                task_completions[str(completion.task.id)] = {
                    'completed': True,
                    'completed_at': completion.completed_at,
                    'title': completion.task.title
                }
            
            # For tasks not completed, add false entry
            for task in tasks:
                if str(task.id) not in task_completions:
                    task_completions[str(task.id)] = {
                        'completed': False,
                        'completed_at': None,
                        'title': task.title
                    }
            
            # Calculate overall percentage
            overall_percentage = (completed_count / total_tasks * 100) if total_tasks > 0 else 0
            
            # Get module completion status
            module_completed = completed_count == total_tasks if total_tasks > 0 else False
            
            # Prepare response
            response_data = {
                'student_id': student.id,
                'student_name': student.full_name or student.username,
                'student_email': student.email,
                'module_id': module.id,
                'module_title': module.title,
                'module_order': module.order,
                'total_tasks': total_tasks,
                'completed_tasks': completed_count,
                'overall_percentage': round(overall_percentage, 1),
                'module_completed': module_completed,
                'task_completions': task_completions,
                'days_progress': {}
            }
            
            # Calculate progress per day
            for day in days:
                day_tasks = Task.objects.filter(day=day)
                day_total = day_tasks.count()
                day_completed = TaskCompletion.objects.filter(
                    student=student,
                    task__in=day_tasks,
                    completed=True
                ).count()
                
                response_data['days_progress'][str(day.id)] = {
                    'day_title': day.title,
                    'total_tasks': day_total,
                    'completed_tasks': day_completed,
                    'percentage': round((day_completed / day_total * 100), 1) if day_total > 0 else 0
                }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Student.DoesNotExist:
            return Response(
                {"error": f"Student with id {student_id} not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Module.DoesNotExist:
            return Response(
                {"error": f"Module with id {module_id} not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TaskCompletionToggleView(APIView):
    """
    Toggle task completion status for a student
    POST /api/task-completion/toggle/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        student_id = request.data.get('student_id')
        task_id = request.data.get('task_id')
        completed = request.data.get('completed', True)
        
        if not student_id or not task_id:
            return Response(
                {"error": "student_id and task_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = Student.objects.get(id=student_id)
            task = Task.objects.get(id=task_id)
            
            completion, created = TaskCompletion.objects.get_or_create(
                student=student,
                task=task,
                defaults={'completed': completed}
            )
            
            if not created:
                completion.completed = completed
                if completed and not completion.completed_at:
                    from django.utils import timezone
                    completion.completed_at = timezone.now()
                completion.save()
            
            serializer = TaskCompletionSerializer(completion)
            
            # Get updated module progress
            module = task.day.module
            tasks_in_module = Task.objects.filter(day__module=module)
            total_tasks = tasks_in_module.count()
            completed_tasks = TaskCompletion.objects.filter(
                student=student,
                task__in=tasks_in_module,
                completed=True
            ).count()
            
            return Response({
                'task_completion': serializer.data,
                'module_progress': {
                    'total_tasks': total_tasks,
                    'completed_tasks': completed_tasks,
                    'percentage': round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0
                }
            }, status=status.HTTP_200_OK)
            
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)


# ====================== BATCH ENDPOINTS FOR OPTIMIZATION ======================
# Add these after your existing ModuleProgressView and TaskCompletionToggleView

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_get_student_modules(request):
    """
    Get modules for MULTIPLE students in ONE request.
    This replaces 4 separate API calls with 1 call.
    
    Request body: { "student_ids": [30, 17, 16, 15] }
    Response: { "30": [...modules...], "17": [...modules...] }
    """
    student_ids = request.data.get('student_ids', [])
    
    if not student_ids:
        return Response(
            {"error": "student_ids array is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    results = {}
    
    for student_id in student_ids:
        try:
            # Get modules for this student
            modules = Module.objects.filter(
                studentmodule__student_id=student_id
            ).order_by('order')
            
            from .serializers import ModuleSerializer
            serializer = ModuleSerializer(modules, many=True)
            results[str(student_id)] = serializer.data
        except Exception as e:
            results[str(student_id)] = []
    
    return Response(results)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_create_review_folders(request):
    """
    Create MULTIPLE review folders in ONE request.
    This replaces 4 separate POST calls with 1 call.
    
    Request body: { "folders": [{
        "student": 30,
        "week_folder": "May 1st Week",
        "week": "5",
        "course": "Course Name",
        "review_date": "2025-05-01",
        "work_documents": "https://...",
        "review_sheet": "https://...",
        "industry_expert": "",
        "meeting_link": "",
        "is_done": false
    }, ...] }
    """
    folders_data = request.data.get('folders', [])
    
    if not folders_data:
        return Response(
            {"error": "folders array is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    created_folders = []
    errors = []
    
    for folder_data in folders_data:
        folder_data['created_by'] = request.user.id
        
        from .serializers import ReviewFolderSerializer
        serializer = ReviewFolderSerializer(data=folder_data)
        if serializer.is_valid():
            folder = serializer.save()
            created_folders.append(serializer.data)
        else:
            errors.append({
                'student_id': folder_data.get('student'),
                'errors': serializer.errors
            })
    
    return Response({
        'success': created_folders,
        'errors': errors,
        'success_count': len(created_folders),
        'error_count': len(errors)
    }, status=status.HTTP_201_CREATED if created_folders else status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_create_week_reviews(request):
    """
    Create MULTIPLE week reviews in ONE request.
    This replaces multiple POST calls with 1 call.
    
    Request body: { "reviews": [{
        "student": 30,
        "module": 2,
        "task_status": "Pending",
        "feedback": "",
        "reviewer_name": "",
        "advisor_name": "",
        "extra_workouts": "Not Completed",
        "review_date": "2025-05-01",
        "english_score": 0,
        "extra_workouts_mark": 0,
        "progress_video": "",
        "progress_video_mark": 0,
        "review_score": 0,
        "english_review": ""
    }, ...] }
    """
    reviews_data = request.data.get('reviews', [])
    
    if not reviews_data:
        return Response(
            {"error": "reviews array is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    created_reviews = []
    errors = []
    
    for review_data in reviews_data:
        from .serializers import WeekReviewSerializer
        serializer = WeekReviewSerializer(data=review_data)
        if serializer.is_valid():
            review = serializer.save()
            created_reviews.append(serializer.data)
        else:
            errors.append({
                'student_id': review_data.get('student'),
                'errors': serializer.errors
            })
    
    return Response({
        'success': created_reviews,
        'errors': errors,
        'success_count': len(created_reviews),
        'error_count': len(errors)
    }, status=status.HTTP_201_CREATED if created_reviews else status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_check_week_reviews(request):
    """
    Check if week reviews exist for multiple students in ONE request.
    
    Request body: { "checks": [
        {"student_id": 30, "module_id": 2},
        {"student_id": 17, "module_id": 2}
    ] }
    """
    checks_data = request.data.get('checks', [])
    
    if not checks_data:
        return Response(
            {"error": "checks array is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from .models import WeekReview
    
    results = []
    
    for check in checks_data:
        student_id = check.get('student_id')
        module_id = check.get('module_id')
        
        try:
            review = WeekReview.objects.get(student_id=student_id, module_id=module_id)
            results.append({
                'student_id': student_id,
                'module_id': module_id,
                'exists': True,
                'review_id': review.id
            })
        except WeekReview.DoesNotExist:
            results.append({
                'student_id': student_id,
                'module_id': module_id,
                'exists': False,
                'review_id': None
            })
    
    return Response(results)
