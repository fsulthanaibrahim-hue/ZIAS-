import pytest


@pytest.mark.django_db
def test_protected_route_requires_auth(client):
    response = client.get('/api/users/me/')

    assert response.status_code == 401