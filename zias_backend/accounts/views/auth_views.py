from rest_framework import status, generics, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate

from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from datetime import timedelta

from ..models import User, PasswordResetToken, Mentor, Reviewer, Student
from ..serializers import UserSerializer
from accounts.base import SafeAPIView
from ..utils import generate_random_password, send_password_email



# ==============================
# LOGIN
# ==============================
class CustomLoginView(SafeAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email")

        # If username is provided, use it directly
        if username:
            user = authenticate(username=username, password=password)
        
        # If email is provided instead
        elif email:
            user_obj = User.objects.filter(email__iexact=email).first()
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)
            else:
                user = None
        else:
            return Response(
                {"error": "Username or email required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user or not user.is_active:
            return Response(
                {"error": "Invalid credentials or account disabled"},
                status=status.HTTP_401_UNAUTHORIZED
            )


        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": getattr(user, "is_admin", False),
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "is_mentor": getattr(user, "is_mentor", False),
            "is_reviewer": getattr(user, "is_reviewer", False),
            "is_student": getattr(user, "is_student", False),
            "is_accounts": getattr(user, "is_accounts", False),
            "full_name": user.get_full_name() or user.username,
        }

        mentor = Mentor.objects.filter(user=user).first()
        if mentor:
            user_data["mentor_id"] = mentor.id
            user_data["batch"] = mentor.batch.id if mentor.batch else None
            user_data["expertise"] = mentor.expertise
            user_data["full_name"] = mentor.full_name or user_data["full_name"]

        reviewer = Reviewer.objects.filter(user=user).first()
        if reviewer:
            user_data["reviewer_id"] = reviewer.id
            user_data["department"] = reviewer.department
            user_data["full_name"] = reviewer.full_name or user_data["full_name"]

        student = Student.objects.filter(user=user).first()
        if student:
            user_data["student_id"] = student.id
            user_data["batch"] = student.batch.id if student.batch else None
            user_data["full_name"] = student.full_name or user_data["full_name"]

        return Response(
            {
                "refresh": str(refresh),
                "access": str(access),
                "user": user_data,
            },
            status=status.HTTP_200_OK
        )


# ==============================
# LOGOUT
# ==============================
class LogoutView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")

            if not refresh_token:
                return Response(
                    {"error": "Refresh token required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "Logged out successfully"},
                status=status.HTTP_200_OK
            )

        except TokenError:
            return Response(
                {"error": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST
            )


# ==============================
# REGISTER USER
# ==============================
class RegisterUserView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        role = request.data.get("role")

        if role not in ["student", "mentor", "reviewer", "admin", "accounts"]:
            return Response(
                {"detail": "Invalid role"},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        password = data.get("password") or generate_random_password()

        user = User(
            username=data["username"],
            email=data["email"],
            is_student=(role == "student"),
            is_mentor=(role == "mentor"),
            is_reviewer=(role == "reviewer"),
            is_admin=(role == "admin"),
            is_accounts=(role == "accounts"),
        )

        user.set_password(password)
        user.save()

        try:
            send_password_email(user, password)
            email_sent = True
        except Exception:
            email_sent = False

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": role,
                "email_sent": email_sent,
            },
            status=status.HTTP_201_CREATED
        )


# ==============================
# CHANGE PASSWORD
# ==============================
class ChangePasswordView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"detail": "Both passwords required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {"detail": "Wrong current password"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            return Response(
                {"detail": "Password too short"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        # invalidate tokens
        OutstandingToken.objects.filter(user=user).delete()

        return Response(
            {"detail": "Password changed successfully"},
            status=status.HTTP_200_OK
        )


# ==============================
# PASSWORD RESET REQUEST
# ==============================
class RequestPasswordResetView(SafeAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"detail": "Email required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email__iexact=email).first()

        if not user:
            return Response(
                {"detail": "If account exists, reset email sent"},
                status=status.HTTP_200_OK
            )

        PasswordResetToken.objects.filter(user=user).delete()

        token = get_random_string(64)
        expires = timezone.now() + timedelta(hours=24)

        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=expires
        )

        reset_link = f"http://localhost:5173/reset-password/{token}"

        send_mail(
            "Password Reset Request",
            f"Reset your password: {reset_link}",
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False
        )

        return Response(
            {"detail": "Reset email sent"},
            status=status.HTTP_200_OK
        )


class ConfirmPasswordResetView(SafeAPIView):
    def post(self, request):
        return Response({"message": "reset confirmed"})





class CurrentUserView(SafeAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": getattr(user, "is_admin", False),
            "is_student": getattr(user, "is_student", False),
            "is_mentor": getattr(user, "is_mentor", False),
            "is_reviewer": getattr(user, "is_reviewer", False),
            "is_accounts": getattr(user, "is_accounts", False),
        })
    
    