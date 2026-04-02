from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# Custom User model
class User(AbstractUser):
    is_admin = models.BooleanField(default=False)
    is_student = models.BooleanField(default=False)
    is_mentor = models.BooleanField(default=False)
    is_reviewer = models.BooleanField(default=False)
    # Track when the password was last changed (for expiry)
    password_changed_at = models.DateTimeField(default=timezone.now, null=True, blank=True)

    def set_password(self, raw_password):
        """Override to update password_changed_at whenever password is set."""
        super().set_password(raw_password)
        self.password_changed_at = timezone.now()
        # Note: do not call save() here – the caller will save the user.

    def __str__(self):
        return self.username

# Student Profile
class Student(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='student_profile'
    )
    course = models.CharField(max_length=100)
    batch = models.CharField(max_length=50)
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return self.user.username

# Mentor Profile
class Mentor(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='mentor_profile'
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    expertise = models.CharField(max_length=100)

    def __str__(self):
        return self.user.username

# Reviewer Profile
class Reviewer(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='reviewer_profile'
    )
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.user.username