from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

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
    mentor = models.ForeignKey('Mentor', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    phone = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    full_name = models.CharField(max_length=150, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    gender = models.CharField(
        max_length=10, blank=True, null=True,
        choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')]
    )
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

# ----------------------------
# MENTOR PROFILE
# ----------------------------
class Mentor(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='mentor_profile'
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    expertise = models.CharField(max_length=100)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='mentors')

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
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewers')

    def __str__(self):
        return self.user.username

# ----------------------------
# COURSE MODEL
# ----------------------------
class Course(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    duration = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# ----------------------------
# MODULE MODEL
# ----------------------------
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

# ----------------------------
# STUDENT MODULE
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

# ----------------------------
# STUDENT WEEK REVIEW MODEL (for reviewer feedback)
# ----------------------------
class StudentWeekReview(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='week_reviews')
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='student_reviews')
    
    reviewer_name = models.CharField(max_length=100, blank=True)
    advisor_name = models.CharField(max_length=100, blank=True)
    review_date = models.DateField(null=True, blank=True)
    task_status = models.CharField(
        max_length=50, blank=True,
        choices=[
            ('Not Started', 'Not Started'),
            ('In Progress', 'In Progress'),
            ('Completed', 'Completed'),
            ('Needs Improvement', 'Needs Improvement'),
        ]
    )
    feedback = models.TextField(blank=True)
    extra_workouts = models.TextField(blank=True, help_text="YouTube video links or descriptions")
    english_review = models.TextField(blank=True)
    star_rating = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 6)])
    total_score = models.PositiveSmallIntegerField(null=True, blank=True)
    
    # NEW: role‑specific remark fields (each role can add their own notes)
    admin_remarks = models.TextField(blank=True)
    reviewer_remarks = models.TextField(blank=True)
    mentor_remarks = models.TextField(blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'module']
    
    def __str__(self):
        return f"{self.student.user.username} - {self.module.title}"


# ----------------------------
# SIGNAL: Auto-create StudentWeekReview entries when a Student is created
# ----------------------------
@receiver(post_save, sender=Student)
def create_student_week_reviews(sender, instance, created, **kwargs):
    """
    When a new Student is created, automatically create StudentWeekReview
    entries for all modules (or only those matching the student's course).
    """
    if created:
        # If student has a course, fetch modules for that course; otherwise all modules.
        if instance.course:
            # Since Student.course is a CharField, we need to filter Course by name.
            # We assume the course name exactly matches a Course object's name.
            modules = Module.objects.filter(course__name=instance.course)
        else:
            modules = Module.objects.all()
        
        for module in modules:
            StudentWeekReview.objects.get_or_create(student=instance, module=module)

            