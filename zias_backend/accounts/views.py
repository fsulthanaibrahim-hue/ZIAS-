from rest_framework import viewsets, status
from rest_framework.views import APIView
from .permissions import IsAdminUser
from .permissions import IsAdminOrReadOnly  
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import BaseFilterBackend
from django.utils import timezone
from .permissions import IsStudentOwner
from django.utils.crypto import get_random_string
from datetime import timedelta
from .models import PasswordResetToken
from django.core.mail import send_mail
from django.conf import settings
from .models import User, Student, Mentor, Reviewer, Course, Enrollment, Module, Day, PasswordResetToken, ContactMessage
from .serializers import (
    StudentSerializer, MentorSerializer, ReviewerSerializer, UserSerializer,
    CourseSerializer, EnrollmentSerializer, ModuleSerializer, DaySerializer,
    ContactMessageSerializer
)

# ----------------------------
# Custom Filter Backend for filtering modules by course
# ----------------------------
class CourseFilterBackend(BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        course_id = request.query_params.get('course')
        if course_id:
            return queryset.filter(course_id=course_id)
        return queryset

# ----------------------------
# STUDENT VIEWSET
# ----------------------------
class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsStudentOwner]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        try:
            student = Student.objects.get(user=request.user)
            serializer = self.get_serializer(student)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)

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

# ----------------------------
# COURSE VIEWSET
# ----------------------------
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]

# ----------------------------
# ENROLLMENT VIEWSET
# ----------------------------
class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        try:
            student = Student.objects.get(user=request.user)
            enrollments = Enrollment.objects.filter(student=student)
            serializer = self.get_serializer(enrollments, many=True)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)

# ----------------------------
# MODULE VIEWSET (now with CourseFilterBackend)
# ----------------------------
class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    filter_backends = [CourseFilterBackend]
    permission_classes = [IsAdminOrReadOnly]

# ----------------------------
# DAY VIEWSET
# ----------------------------
class DayViewSet(viewsets.ModelViewSet):
    queryset = Day.objects.all()
    serializer_class = DaySerializer
    permission_classes = [IsAdminUser]

# ----------------------------
# GET CURRENT USER INFO (for frontend role detection)
# ----------------------------
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

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
        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)

# ----------------------------
# SEND BULK EMAIL TO ALL USERS (Admin only)
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
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                recipient_list,
                fail_silently=False,
            )
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
# CONTACT MESSAGE VIEWS (for admin notifications)
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

class ContactMessageDetailView(APIView):
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