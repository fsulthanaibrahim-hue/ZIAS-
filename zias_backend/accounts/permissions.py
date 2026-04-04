from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminUser(BasePermission):
    """Allows access only to admin users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin

class IsAdminOrReadOnly(BasePermission):
    """Read-only for authenticated users, write only for admin."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_admin

class IsStudentOwner(BasePermission):
    """Admin full access, students can read and update own profile only."""
    def has_permission(self, request, view):
        if view.action == 'create':
            return request.user and request.user.is_admin
        return True

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_admin:
            return True
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_student and obj.user == request.user