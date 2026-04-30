# accounts/views.py
from rest_framework import viewsets, status, generics, permissions
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.filters import BaseFilterBackend
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError   
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.utils.crypto import get_random_string
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from .models import (
    User, Student, Mentor, Reviewer, Course, Module, Day, Task, Batch,
    StudentModule, PasswordResetToken, ContactMessage, StudentWeekReview, WeekUpdate, ReviewFolder,
    ChatRoom, ChatMessage, CourseStatus, Notification, StudentDocument, MentorDocument
)

from .serializers import (
    StudentSerializer, MentorSerializer, ReviewerSerializer, UserSerializer,
    CourseSerializer, ModuleSerializer, DaySerializer, TaskSerializer, BatchSerializer,
    ContactMessageSerializer, StudentModuleSerializer, StudentWeekReviewSerializer, WeekUpdateSerializer,
    ReviewFolderSerializer, ChatRoomSerializer, ChatMessageSerializer, CourseStatusSerializer, 
    NotificationSerializer, StudentDocumentSerializer, MentorDocumentSerializer
)

# ✅ Corrected import - only use permission classes that exist in permissions.py
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
            try:
                reviewer = Reviewer.objects.get(user=user)
                queryset = queryset.filter(course=reviewer.course)
            except Reviewer.DoesNotExist:
                queryset = queryset.none()
        else:
            queryset = queryset.filter(user=user)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        user = request.user
        if user.is_mentor or user.is_reviewer:
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

    @action(detail=False, methods=['get'], url_path='for-reviewer', permission_classes=[IsAuthenticated])
    def for_reviewer(self, request):
        user = request.user
        if not user.is_reviewer:
            return Response({"detail": "Not authorized"}, status=403)
        try:
            reviewer = Reviewer.objects.get(user=user)
            students = Student.objects.filter(course=reviewer.course)
            data = [{
                "id": s.id,
                "username": s.user.username,
                "full_name": s.full_name,
                "course": s.course,
                "batch": s.batch,
            } for s in students]
            return Response(data)
        except Reviewer.DoesNotExist:
            return Response({"detail": "Reviewer profile not found"}, status=404)

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
# MODULE VIEWSET
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

        if user.is_admin or user.is_mentor or user.is_reviewer:
            if student_id:
                try:
                    student = Student.objects.get(id=student_id)
                except Student.DoesNotExist:
                    return Response([])
            else:
                if user.is_student:
                    student, created = Student.objects.get_or_create(
                        user=user,
                        defaults={'course': '', 'batch': ''}
                    )
                    if created:
                        print(f"Created missing student profile for {user.username}")
                else:
                    return Response([])
        else:
            if not user.is_student:
                return Response([])
            student, created = Student.objects.get_or_create(
                user=user,
                defaults={'course': '', 'batch': ''}
            )
            if created:
                print(f"Created missing student profile for {user.username}")

        common_modules = Module.objects.filter(is_common=True).order_by('order')

        if not student.course:
            serializer = self.get_serializer(common_modules, many=True)
            data = serializer.data
            for item in data:
                item['is_locked'] = False
            return Response(data)

        course_modules = Module.objects.filter(course__name=student.course, is_common=False).order_by('order')

        accessible_course_modules = []
        for mod in course_modules:
            previous_modules = course_modules.filter(order__lt=mod.order)
            if not previous_modules.exists():
                accessible_course_modules.append(mod)
            else:
                all_prev_completed = True
                for prev in previous_modules:
                    try:
                        student_module = StudentModule.objects.get(student=student, module=prev)
                        if not student_module.is_completed:
                            all_prev_completed = False
                            break
                    except StudentModule.DoesNotExist:
                        all_prev_completed = False
                        break
                if all_prev_completed:
                    accessible_course_modules.append(mod)
                else:
                    break

        all_modules = list(common_modules) + accessible_course_modules
        all_modules.sort(key=lambda x: x.order)
        serializer = self.get_serializer(all_modules, many=True)
        data = serializer.data
        for item in data:
            item['is_locked'] = False
        return Response(data)


# ----------------------------
# COMPLETE MODULE VIEW (with CourseStatus update)
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
                course=module.course,
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
        queryset = Day.objects.all()
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
# GET CURRENT USER INFO
# ----------------------------
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Build user dict manually (safe, no serializer)
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
        # For partial updates, you can still use the serializer if needed,
        # but to keep it simple, implement manual update if required.
        # For now, return method not allowed or implement later.
        return Response({"detail": "PATCH not implemented"}, status=405)

# ----------------------------
# CHANGE PASSWORD ENDPOINT
# ----------------------------
class ChangePasswordView(APIView):
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
class SendBulkEmailView(APIView):
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
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ----------------------------
# PASSWORD RESET VIEWS
# ----------------------------
class RequestPasswordResetView(APIView):
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

class ConfirmPasswordResetView(APIView):
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
            return Response({"detail": "Message sent successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UnreadMessagesCountView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if not request.user.is_admin:
            return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        count = ContactMessage.objects.filter(is_read=False).count()
        return Response({"unread_count": count})

class RecentMessagesView(APIView):
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

class ContactMessageDetailView(RetrieveAPIView):
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
# CUSTOM LOGIN VIEW (SAFE VERSION – NO SERIALIZER)
# ----------------------------
class CustomLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
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
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            # Build user dict manually (safe, no serializer)
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

            return Response({
                'refresh': str(refresh),
                'access': str(access),
                'user': user_data,
            })

        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            print(f"Login error: {repr(e)}")
            return Response({'error': 'An internal error occurred. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ----------------------------
# LOGOUT VIEW
# ----------------------------
class LogoutView(APIView):
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
# UPDATE DASHBOARD ACCESS VIEW
# ----------------------------
class UpdateDashboardAccessView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        user.last_dashboard_access = timezone.now()
        user.save(update_fields=['last_dashboard_access'])
        return Response({"detail": "Dashboard access updated."}, status=status.HTTP_200_OK)


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
        if review.total_score is not None:
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
# REVIEW FOLDER VIEWSET
# ----------------------------
class ReviewFolderViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewFolderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_mentor or user.is_reviewer or user.is_admin:
            return ReviewFolder.objects.all()
        elif user.is_student:
            return ReviewFolder.objects.filter(student__user=user)
        return ReviewFolder.objects.none()

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [IsMentorOrReviewerOrAdmin]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


# ----------------------------
# CHAT VIEWS
# ----------------------------
class ChatRoomList(generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_reviewer:
            reviewer = Reviewer.objects.get(user=user)
            return ChatRoom.objects.filter(reviewer=reviewer, mentor__isnull=False, student__isnull=True)
        elif user.is_mentor:
            mentor = Mentor.objects.get(user=user)
            return ChatRoom.objects.filter(mentor=mentor).distinct()
        elif user.is_student:
            student = Student.objects.get(user=user)
            return ChatRoom.objects.filter(student=student)
        return ChatRoom.objects.none()


class ChatMessageList(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return ChatMessage.objects.filter(room_id=room_id).order_by('timestamp')


class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            return ChatMessage.objects.filter(room_id=room_id).order_by('timestamp')
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
            return Response({"marked_read": updated}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RespondToMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        try:
            message = ChatMessage.objects.get(id=message_id)
        except ChatMessage.DoesNotExist:
            return Response({"error": "Message not found"}, status=404)

        # Only the receiver (reviewer) can respond
        room = message.room
        user = request.user
        # Check if user is the reviewer in that room
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

            # Send a system message back to the mentor (or update the existing message)
            # For simplicity, we'll just update the message and the UI will reflect it.

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
        course_obj = get_object_or_404(Course, name=student.course)
        status_obj, created = CourseStatus.objects.get_or_create(
            student=student,
            course=course_obj
        )
        return status_obj


# ----------------------------
# NOTIFICATION VIEWSET
# ----------------------------
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked read'})


# ----------------------------
# STUDENT DOCUMENTS (using StudentDocument model)
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
# MENTOR DOCUMENTS (using MentorDocument model)
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