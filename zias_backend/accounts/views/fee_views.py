from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

from ..models import (
    FeePayment, Accounts, Student, FeeStructure, StudentFee,
    StudentFeePayment, InstallmentSchedule
)

from ..serializers import (
    FeePaymentSerializer, AccountsSerializer, FeeStructureSerializer,
    StudentFeeSerializer, StudentFeePaymentSerializer, InstallmentScheduleSerializer
)

from accounts.base import SafeAPIView


# ------------------------------
# Fee Payment ViewSet
# ------------------------------
class FeePaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FeePaymentSerializer

    def get_queryset(self):
        user = self.request.user

        if user.is_admin or user.is_accounts or user.is_mentor:
            qs = FeePayment.objects.all()

            student_id = self.request.query_params.get('student')
            if student_id:
                qs = qs.filter(student_id=student_id)

            return qs

        return FeePayment.objects.none()


# ------------------------------
# Accounts User Management
# ------------------------------
class AccountsViewSet(viewsets.ModelViewSet):
    serializer_class = AccountsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_admin:
            return Accounts.objects.all()

        return Accounts.objects.none()

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        user.delete()


# ------------------------------
# Accounts Dashboard
# ------------------------------
class AccountsDashboardView(SafeAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

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

        else:
            start_date = now.replace(day=1)
            next_month = start_date + timedelta(days=31)
            end_date = next_month.replace(day=1) - timedelta(days=1)

        payments = FeePayment.objects.filter(
            payment_date__gte=start_date,
            payment_date__lte=end_date
        )

        total_collected = payments.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
        total_pending = payments.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
        total_overdue = payments.filter(status='overdue').aggregate(total=Sum('amount'))['total'] or 0

        monthly_income = []

        for i in range(11, -1, -1):
            month_date = now - timedelta(days=30 * i)
            month_start = month_date.replace(day=1)
            next_month = month_start + timedelta(days=31)
            month_end = next_month.replace(day=1) - timedelta(days=1)

            month_total = FeePayment.objects.filter(
                payment_date__gte=month_start,
                payment_date__lte=month_end,
                status='paid'
            ).aggregate(total=Sum('amount'))['total'] or 0

            monthly_income.append({
                "month": month_start.strftime("%B %Y"),
                "total": float(month_total)
            })

        reviewer_wise = {}
        all_payments = FeePayment.objects.filter(status='paid').select_related('student')

        for p in all_payments:
            reviewer = getattr(p.student, "reviewer", None)
            name = reviewer.full_name if reviewer else "Unassigned"
            reviewer_wise[name] = reviewer_wise.get(name, 0) + float(p.amount)

        recent_payments = payments.order_by('-payment_date')[:10]

        return Response({
            "period": period,
            "total_collected": float(total_collected),
            "total_pending": float(total_pending),
            "total_overdue": float(total_overdue),
            "monthly_income": monthly_income,
            "reviewer_wise": reviewer_wise,
            "recent_payments": [
                {
                    "id": p.id,
                    "student_name": p.student.full_name or p.student.user.username,
                    "amount": float(p.amount),
                    "payment_date": p.payment_date,
                    "status": p.status
                } for p in recent_payments
            ]
        })


# ------------------------------
# Accounts Student List
# ------------------------------
class AccountsStudentListView(SafeAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if not (user.is_accounts or user.is_admin or user.is_mentor):
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        students = Student.objects.all().select_related('user', 'reviewer')

        data = []

        for s in students:
            payments = FeePayment.objects.filter(student=s)

            total_paid = payments.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
            total_pending = payments.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
            total_overdue = payments.filter(status='overdue').aggregate(total=Sum('amount'))['total'] or 0

            data.append({
                "id": s.id,
                "name": s.full_name or s.user.username,
                "email": s.user.email,
                "course": s.course,
                "batch": s.batch,
                "reviewer": s.reviewer.full_name if s.reviewer else "—",
                "total_paid": float(total_paid),
                "total_pending": float(total_pending),
                "total_overdue": float(total_overdue),
            })

        return Response(data)


# ------------------------------
# Accounts Profile
# ------------------------------
class AccountsProfileView(SafeAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.is_accounts:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        try:
            profile = user.accounts_profile
        except Accounts.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "username": user.username,
            "email": user.email,
            "full_name": profile.full_name,
            "phone": profile.phone,
            "department": profile.department,
        })


# ------------------------------
# Student Fee Summary
# ------------------------------
class StudentFeeSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.is_student:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        try:
            student = user.student_profile
        except Student.DoesNotExist:
            return Response({"detail": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

        payments = FeePayment.objects.filter(student=student)

        total_paid = payments.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
        total_pending = payments.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
        total_overdue = payments.filter(status='overdue').aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            "total_paid": float(total_paid),
            "total_pending": float(total_pending),
            "total_overdue": float(total_overdue),
        })


# ------------------------------
# Fee Structure
# ------------------------------
class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAdminUser]


# ------------------------------
# Student Fee
# ------------------------------
class StudentFeeViewSet(viewsets.ModelViewSet):
    queryset = StudentFee.objects.all()
    serializer_class = StudentFeeSerializer
    permission_classes = [permissions.IsAdminUser]


# ------------------------------
# Installment Schedule
# ------------------------------
class InstallmentScheduleViewSet(viewsets.ModelViewSet):
    queryset = InstallmentSchedule.objects.all()
    serializer_class = InstallmentScheduleSerializer
    permission_classes = [permissions.IsAdminUser]
