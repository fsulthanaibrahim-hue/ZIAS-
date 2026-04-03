from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminUser(BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin

class IsAdminOrReadOnly(BasePermission):
    """
    Allows read-only access (GET, HEAD, OPTIONS) to any authenticated user.
    Write access (POST, PUT, PATCH, DELETE) is only allowed for admin users.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_admin