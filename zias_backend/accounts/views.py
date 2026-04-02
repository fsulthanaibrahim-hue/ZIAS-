from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Student, Mentor, Reviewer
from .serializers import StudentSerializer, MentorSerializer, ReviewerSerializer, UserSerializer

# ----------------------------
# STUDENT VIEWSET
# ----------------------------
class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def destroy(self, request, *args, **kwargs):
        student = self.get_object()
        user = student.user
        user.delete()          # Deletes the User, which cascades to Student
        return Response(status=status.HTTP_204_NO_CONTENT)

# ----------------------------
# MENTOR VIEWSET
# ----------------------------
class MentorViewSet(viewsets.ModelViewSet):
    queryset = Mentor.objects.all()
    serializer_class = MentorSerializer

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

    def destroy(self, request, *args, **kwargs):
        reviewer = self.get_object()
        user = reviewer.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

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