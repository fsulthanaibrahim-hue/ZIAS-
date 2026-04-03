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

# ----------------------------
# COURSE MANAGEMENT MODELS
# ----------------------------
class Course(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    duration = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='active')

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.user.username} -> {self.course.name}"

# ----------------------------
# MODULE MODEL (Week)
# ----------------------------
class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    content = models.TextField(help_text="HTML or Markdown content for the module")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.course.name} - {self.title}"

# ----------------------------
# DAY MODEL (Daily breakdown inside a Module)
# ----------------------------
class Day(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='days')
    title = models.CharField(max_length=100)   # e.g., "Day 1"
    content = models.TextField(help_text="HTML content for the day")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.module.title} - {self.title}"