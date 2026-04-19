from rest_framework import permissions
from .models import Mentor

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin

class IsStudentOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        if request.user.is_student:
            return obj.user == request.user
        if request.user.is_mentor:
            try:
                mentor = Mentor.objects.get(user=request.user)
                if obj.mentor == mentor or obj.student_batch == mentor.batch:
                    return True
            except Mentor.DoesNotExist:
                pass
        return False

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.is_admin