import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Student, AttendanceRecord

User = get_user_model()


@pytest.mark.django_db
def test_checkin():

    user = User.objects.create_user(
        username="student",
        email="student@gmail.com",
        password="test123"
    )

    refresh = RefreshToken.for_user(user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    response = client.post('/api/attendance/check-in/')

    assert response.status_code in [200, 201]


@pytest.mark.django_db
def test_checkout():

    user = User.objects.create_user(
        username="student2",
        email="student2@gmail.com",
        password="test123"
    )

    student = Student.objects.create(user=user)

    AttendanceRecord.objects.create(
        student=student,
        check_in=timezone.now()
    )

    refresh = RefreshToken.for_user(user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    response = client.patch('/api/attendance/check-out/')

    assert response.status_code in [200, 201]