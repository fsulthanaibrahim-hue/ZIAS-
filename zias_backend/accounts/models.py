from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# Custom User model
class User(AbstractUser):
    is_admin = models.BooleanField(default=False)
    is_student = models.BooleanField(default=False)
    is_mentor = models.BooleanField(default=False)
    is_reviewer = models.BooleanField(default=False)
    password_changed_at = models.DateTimeField(default=timezone.now, null=True, blank=True)

    def set_password(self, raw_password):
        super().set_password(raw_password)
        self.password_changed_at = timezone.now()

    def __str__(self):
        return self.username

# ----------------------------
# BATCH MODEL
# ----------------------------
class Batch(models.Model):
    name = models.CharField(max_length=100, unique=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

# ----------------------------
# STUDENT PROFILE
# ----------------------------
class Student(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='student_profile'
    )
    course = models.CharField(max_length=100)
    batch = models.CharField(max_length=50)
    student_batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    phone = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.user.username

# ----------------------------
# MENTOR PROFILE
# ----------------------------
class Mentor(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='mentor_profile'
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    expertise = models.CharField(max_length=100)

    def __str__(self):
        return self.user.username

# ----------------------------
# REVIEWER PROFILE
# ----------------------------
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
    content = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_common = models.BooleanField(default=True)   # True = common modules (weeks 1-8), False = custom templates

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.name} - {self.title}"

# ----------------------------
# STUDENT MODULE (Personalized modules for weeks 9+)
# ----------------------------
class StudentModule(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='custom_modules')
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['student', 'module']

    def __str__(self):
        return f"{self.student.user.username} - {self.module.course.name} - {self.module.title}"

# ----------------------------
# DAY MODEL
# ----------------------------
class Day(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='days')
    title = models.CharField(max_length=100)
    content = models.TextField(help_text="HTML content for the day")
    order = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.module.title} - {self.title}"

# ----------------------------
# TASK MODEL
# ----------------------------
class Task(models.Model):
    day = models.ForeignKey(Day, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

# ----------------------------
# PASSWORD RESET TOKEN MODEL
# ----------------------------
class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.user.username} - {self.token}"

# ----------------------------
# CONTACT MESSAGE MODEL
# ----------------------------
class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} - {self.subject}"
    