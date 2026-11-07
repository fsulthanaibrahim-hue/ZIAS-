import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from accounts.models import User, Student


User = get_user_model()


@pytest.mark.django_db
def test_submit_review():
    user = User.objects.create_user(
        username="student",
        email="student@gmail.com",
        password="test123"
    )

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post('/api/reviews/', {
        "title": "Week 1 Review",
        "content": "Good progress"
    })

    assert response.status_code in [200, 201]