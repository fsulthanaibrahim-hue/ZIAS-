from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime

from accounts.models import Student, AttendanceRecord, Mentor
from accounts.serializers import AttendanceRecordSerializer
from accounts.base import SafeAPIView


# ------------------------------
# CHECK IN
# ------------------------------
class CheckInView(SafeAPIView, generics.CreateAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user

        student = Student.objects.filter(user=user).first()

        if not student:
            student = Student.objects.create(
                user=user,
                course='',
                batch=''
            )

        serializer.save(student=student, check_in=timezone.now())


# ------------------------------
# CHECK OUT
# ------------------------------
class CheckOutView(SafeAPIView, generics.UpdateAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        student = Student.objects.filter(user=self.request.user).first()

        if not student:
            student = get_object_or_404(Student, user=self.request.user)

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
            status=status.HTTP_200_OK
        )


# ------------------------------
# ATTENDANCE HISTORY
# ------------------------------
class AttendanceHistoryView(SafeAPIView, generics.ListAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        student_id = self.request.query_params.get('student_id')
        date_str = self.request.query_params.get('date')

        # Student
        student = Student.objects.filter(user=user).first()
        if student:
            qs = AttendanceRecord.objects.filter(student=student)

        # Mentor
        elif getattr(user, "is_mentor", False):
            mentor = Mentor.objects.filter(user=user).first()

            if student_id:
                qs = AttendanceRecord.objects.filter(student_id=student_id)
            else:
                qs = AttendanceRecord.objects.all()

        # Admin / others
        else:
            qs = AttendanceRecord.objects.all()

        # Date filter
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                qs = qs.filter(check_in__date=target_date)
            except ValueError:
                pass

        return qs.order_by('-check_in')