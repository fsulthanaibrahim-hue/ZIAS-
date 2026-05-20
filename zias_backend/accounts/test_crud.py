import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.mark.django_db
def test_get_students_list():

    user = User.objects.create_user(
        username="admin",
        email="admin@gmail.com",
        password="test123",
        is_admin=True
    )

    refresh = RefreshToken.for_user(user)

    client = APIClient()

    client.credentials(
        HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
    )

    response = client.get('/api/students/')

    assert response.status_code == 200


@pytest.mark.django_db
def test_create_student():

    user = User.objects.create_user(
        username="admin2",
        email="admin2@gmail.com",
        password="test123",
        is_admin=True
    )

    refresh = RefreshToken.for_user(user)

    client = APIClient()

    client.credentials(
        HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
    )

    data = {
        "full_name": "Test Student",
        "email": "student@gmail.com",
    }

    response = client.post('/api/students/', data)

    assert response.status_code in [200, 201]

