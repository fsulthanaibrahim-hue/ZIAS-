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
    last_dashboard_access = models.DateTimeField(default=timezone.now, null=True, blank=True)

    def set_password(self, raw_password):
        super().set_password(raw_password)
        self.password_changed_at = timezone.now()
        self.save()

    @property
    def user_type(self):
        if self.is_admin:
            return 'admin'
        if self.is_student:
            return 'student'
        if self.is_mentor:
            return 'mentor'
        if self.is_reviewer:
            return 'reviewer'
        return 'unknown'

    def __str__(self):
        return self.username

# Batch Model
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

# Student Profile
class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    course = models.CharField(max_length=100)
    batch = models.CharField(max_length=50)
    student_batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    mentor = models.ForeignKey('Mentor', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    phone = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    full_name = models.CharField(max_length=150, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True, choices=[('Male','Male'),('Female','Female'),('Other','Other')])
    fathers_name = models.CharField(max_length=150, blank=True, null=True)
    fathers_contact = models.CharField(max_length=15, blank=True, null=True)
    mothers_name = models.CharField(max_length=150, blank=True, null=True)
    mothers_contact = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    educational_qualification = models.CharField(max_length=200, blank=True, null=True)
    college_school = models.CharField(max_length=200, blank=True, null=True)
    parent_name = models.CharField(max_length=100, blank=True, null=True)
    parent_phone = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return self.user.username

# Mentor Profile
class Mentor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    expertise = models.CharField(max_length=100)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='mentors')

    def __str__(self):
        return self.user.username

# Reviewer Profile
class Reviewer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='reviewer_profile')
    department = models.CharField(max_length=100)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewers')
    qualification = models.CharField(max_length=200, blank=True)
    experience = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.user.username

# Course Model
class Course(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    duration = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# Module Model
class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_common = models.BooleanField(default=True)
    is_locked = models.BooleanField(default=True)
    unlock_date = models.DateField(null=True, blank=True)
    prerequisite = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='next_modules')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.name} - {self.title}"

# Student Module
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

# Day Model
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

# Task Model
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

# Password Reset Token
class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.user.username} - {self.token}"

# Contact Message
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

# Notification Model
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.message}"


# Student Week Review Model
class StudentWeekReview(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='week_reviews')
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='student_reviews')
    reviewer_name = models.CharField(max_length=100, blank=True)
    advisor_name = models.CharField(max_length=100, blank=True)
    review_date = models.DateField(null=True, blank=True)
    task_status = models.CharField(max_length=50, blank=True, choices=[
        ('Task Completed', 'Task Completed'),
        ('Task Need Improvement', 'Task Need Improvement'),
        ('Task Critical', 'Task Critical'),
        ('Task Not Completed', 'Task Not Completed'),
    ])
    feedback = models.TextField(blank=True)
    extra_workouts = models.CharField(max_length=30, blank=True, choices=[
        ('Completed', 'Completed'),
        ('Need Improvement', 'Need Improvement'),
        ('Not Completed', 'Not Completed'),
    ])
    english_review = models.TextField(blank=True)
    english_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Score out of 20")
    star_rating = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(i,i) for i in range(1,6)])
    total_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Total score out of 20")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'module']

    def generate_english_review(self):
        if self.english_score is None:
            return ""
        s = self.english_score
        if s >= 18:
            return "Excellent English skills. Very fluent and accurate."
        if s >= 15:
            return "Good English skills. Minor errors, but well communicated."
        if s >= 12:
            return "Average English. Needs improvement in grammar and vocabulary."
        if s >= 8:
            return "Below average English. Significant errors, requires practice."
        return "Poor English. Strongly needs basic English training."

    def save(self, *args, **kwargs):
        if self.english_score is not None:
            self.english_review = self.generate_english_review()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.user.username} - {self.module.title}"

# Week Update Model
class WeekUpdate(models.Model):
    week_review = models.ForeignKey(StudentWeekReview, on_delete=models.CASCADE, related_name='updates')
    update_date = models.DateField(auto_now_add=True)
    update_text = models.TextField(blank=True)
    extra_score = models.PositiveSmallIntegerField(null=True, blank=True)
    created_by = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"Update for {self.week_review}"



class ReviewFolder(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='review_folders')
    week_folder = models.CharField(max_length=100, blank=True, null=True)   # 👈 new
    week = models.CharField(max_length=100, blank=True)                     # 👈 allow blank
    review_date = models.DateField()
    work_documents = models.URLField(blank=True, null=True)
    industry_expert = models.CharField(max_length=200, blank=True, null=True)
    meeting_link = models.CharField(max_length=500, blank=True, null=True)
    review_sheet = models.URLField(blank=True, null=True)
    time_started = models.DateTimeField(blank=True, null=True)
    time_ended = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_done = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_review_folders')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_review_folders')

    class Meta:
        ordering = ['-review_date', 'week_folder', 'student__user__username']

    def __str__(self):
        return f"{self.week_folder or 'No folder'} – {self.student.user.username}"

    @property
    def review_status(self):
        required = [self.work_documents, self.industry_expert, self.meeting_link, self.review_sheet]
        if any(not f for f in required):
            return "Pending"
        return "Done"
    
