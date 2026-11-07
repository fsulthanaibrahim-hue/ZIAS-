import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_create_user():
    user = User.objects.create_user(
        username="testuser",
        email="test@gmail.com",
        password="test123"
    )

    assert user.email == "test@gmail.com"
    assert user.check_password("test123")


@pytest.mark.django_db
def test_email_case_insensitive_lookup():
    User.objects.create_user(
        username="testuser",
        email="test@gmail.com",
        password="test123"
    )

    user = User.objects.get(email__iexact='TEST@GMAIL.COM')

    assert user.email == 'test@gmail.com'





from rest_framework_simplejwt.tokens import RefreshToken


@pytest.mark.django_db
def test_logout_blacklists_token(client):
    user = User.objects.create_user(
        username="testuser2",
        email="logout@gmail.com",
        password="test123"
    )

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)

    response = client.post(
        '/api/logout/',
        {
            'refresh': str(refresh)
        },
        HTTP_AUTHORIZATION=f'Bearer {access_token}'
    )

    assert response.status_code == 200

    