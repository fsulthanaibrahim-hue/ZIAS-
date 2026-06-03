from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericRelation
from django.core.validators import RegexValidator, FileExtensionValidator


class User(AbstractUser):
    password_changed_at = models.DateTimeField(default=timezone.now, null=True, blank=True)
    last_dashboard_access = models.DateTimeField(default=timezone.now, null=True, blank=True)

    @property
    def role(self):
        """Get user role based on groups"""
        if self.is_superuser:
            return 'admin'
        groups_list = list(self.groups.values_list('name', flat=True))
        if 'Accounts' in groups_list:
            return 'accounts'
        if 'Reviewers' in groups_list:
            return 'reviewer'
        if 'Mentors' in groups_list:
            return 'mentor'
        if 'Students' in groups_list:
            return 'student'
        return 'user'

    @property
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser

    @property
    def is_student(self):
        return self.role == 'student'

    @property
    def is_mentor(self):
        return self.role == 'mentor'

    @property
    def is_reviewer(self):
        return self.role == 'reviewer'

    @property
    def is_accounts(self):
        return self.role == 'accounts'

    def __str__(self):
        return f"{self.username} ({self.role})"


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


class Document(models.Model):
    file = models.FileField(upload_to='student_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.file.name


class Student(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    full_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    course = models.CharField(max_length=255, blank=True, null=True)
    batch = models.CharField(max_length=100, blank=True, null=True)
    student_batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    mentor = models.ForeignKey('Mentor', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    phone = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True, choices=GENDER_CHOICES)
    fathers_name = models.CharField(max_length=255, blank=True, null=True)
    fathers_contact = models.CharField(max_length=20, blank=True, null=True)
    mothers_name = models.CharField(max_length=255, blank=True, null=True)
    mothers_contact = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    educational_qualification = models.CharField(max_length=255, blank=True, null=True)
    college_school = models.CharField(max_length=255, blank=True, null=True)
    parent_name = models.CharField(max_length=255, blank=True, null=True)
    parent_phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)
    reviewer = models.ForeignKey('Reviewer', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    documents = models.ManyToManyField(Document, blank=True, related_name='students')
    agreement_signed = models.BooleanField(default=False)
    escalation_flag = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.full_name or self.user.email or self.user.username

    def save(self, *args, **kwargs):
        if self.date_of_birth:
            today = timezone.now().date()
            age = today.year - self.date_of_birth.year
            if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
                age -= 1
            self.age = age
        super().save(*args, **kwargs)

    @property
    def email(self):
        return self.user.email if self.user else None


class Mentor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    expertise = models.CharField(max_length=255)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='mentors')
    full_name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name or self.user.get_full_name() or self.user.username


class Reviewer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='reviewer_profile')
    department = models.CharField(max_length=255, blank=True)
    qualification = models.CharField(max_length=255, blank=True)
    experience = models.IntegerField(null=True, blank=True)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True)
    course = models.CharField(max_length=255, blank=True, null=True)
    available_from = models.TimeField(null=True, blank=True, help_text="Start time (e.g. 09:00)")
    available_to = models.TimeField(null=True, blank=True, help_text="End time (e.g. 17:00)")
    available_days = models.JSONField(default=list, blank=True, help_text="List of weekdays (0=Monday, 6=Sunday)")
    full_name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name or self.user.username


class Accounts(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='accounts_profile')
    full_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name or self.user.username


class Course(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    order = models.IntegerField(null=True, blank=True, help_text="week_number")
    is_common = models.BooleanField(default=True)
    is_locked = models.BooleanField(default=True)
    unlock_date = models.DateField(null=True, blank=True)
    prerequisite = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='next_modules')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.name} - {self.title}"


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


class Day(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='days')
    title = models.CharField(max_length=255)
    content = models.TextField(help_text="HTML content for the day")
    order = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.module.title} - {self.title}"


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


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.user.username} - {self.token}"


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


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=500, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.message}"


class StudentWeekReview(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='week_reviews')
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='student_reviews')

    reviewer_name = models.CharField(max_length=255, blank=True)
    advisor_name = models.CharField(max_length=255, blank=True)
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
    english_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Score out of 5")
    review_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Review score out of 20")
    extra_workouts_mark = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Extra workouts mark out of 5")
    progress_video = models.URLField(max_length=500, blank=True, null=True, help_text="Progress video link")
    progress_video_mark = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Progress video mark out of 5")
    star_rating = models.PositiveSmallIntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 6)])
    total_score = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Total score out of 35")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'module']

    def generate_english_review(self):
        if self.english_score is None:
            return ""
        score = self.english_score * 4
        if score >= 18:
            return "Excellent English skills. Very fluent and accurate."
        if score >= 15:
            return "Good English skills. Minor errors, but well communicated."
        if score >= 12:
            return "Average English. Needs improvement in grammar and vocabulary."
        if score >= 8:
            return "Below average English. Significant errors, requires practice."
        return "Poor English. Strongly needs basic English training."

    def save(self, *args, **kwargs):
        if self.english_score is not None:
            self.english_review = self.generate_english_review()

        extra = self.extra_workouts_mark or 0
        english = self.english_score or 0
        video = self.progress_video_mark or 0
        
        extra = max(0, min(5, extra))
        english = max(0, min(5, english))
        video = max(0, min(5, video))
        
        sum_marks = extra + english + video
        total = round((sum_marks * 35) / 15)
        self.total_score = max(0, min(35, total))

        t = self.total_score
        if t >= 30:
            self.star_rating = 5
        elif t >= 24:
            self.star_rating = 4
        elif t >= 17:
            self.star_rating = 3
        elif t >= 14:
            self.star_rating = 2
        else:
            self.star_rating = 1

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.user.username} - {self.module.title}"


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
    week_folder = models.CharField(max_length=255, blank=True, null=True)
    week = models.CharField(max_length=255, blank=True)
    review_date = models.DateField()
    work_documents = models.URLField(blank=True, null=True)
    industry_expert = models.CharField(max_length=255, blank=True, null=True)
    meeting_link = models.CharField(max_length=500, blank=True, null=True)
    review_sheet = models.URLField(blank=True, null=True)
    time_started = models.DateTimeField(blank=True, null=True)
    time_ended = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_done = models.BooleanField(default=False)
    reviewer_name = models.CharField(max_length=255, blank=True)
    next_review_date = models.DateField(null=True, blank=True)
    course = models.CharField(max_length=255, blank=True, null=True)
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


class ChatRoom(models.Model):
    ROOM_TYPES = (
        ('student_mentor', 'Student ↔ Mentor'),
        ('student_reviewer', 'Student ↔ Reviewer'),
        ('mentor_reviewer', 'Mentor ↔ Reviewer'),
    )
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='student_mentor')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True)
    mentor = models.ForeignKey(Mentor, on_delete=models.CASCADE, null=True, blank=True)
    reviewer = models.ForeignKey(Reviewer, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [
            ('student', 'mentor'),
            ('student', 'reviewer'),
            ('mentor', 'reviewer'),
        ]

    def save(self, *args, **kwargs):
        if self.room_type == 'student_mentor' and self.student and self.mentor:
            self.name = f"{self.student.user.username} ↔ {self.mentor.user.username}"
        elif self.room_type == 'student_reviewer' and self.student and self.reviewer:
            self.name = f"{self.student.user.username} ↔ {self.reviewer.user.username}"
        elif self.room_type == 'mentor_reviewer' and self.mentor and self.reviewer:
            self.name = f"{self.mentor.user.username} ↔ {self.reviewer.user.username}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=20, blank=True, default='')
    suggested_time = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    is_system = models.BooleanField(default=True)

    class Meta:
        ordering = ['timestamp']


class CourseStatus(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='course_statuses')
    course_name = models.CharField(max_length=255, null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    current_week = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ['student', 'course_name']
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.student.user.username} - {self.course_name} (week {self.current_week})"

    def advance_week(self):
        self.current_week += 1
        self.save(update_fields=['current_week'])

    def end_course(self):
        self.ended_at = timezone.now()
        self.save(update_fields=['ended_at'])


class StudentDocument(models.Model):
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='student_documents')
    file = models.FileField(upload_to='student_documents/')
    file_name = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.file_name:
            self.file_name = self.file.name
        super().save(*args, **kwargs)


class MentorDocument(models.Model):
    mentor = models.ForeignKey('Mentor', on_delete=models.CASCADE, related_name='mentor_documents')
    file = models.FileField(upload_to='mentor_documents/')
    file_name = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.file_name:
            self.file_name = self.file.name
        super().save(*args, **kwargs)


class ReviewAssignment(models.Model):
    STATUS_CHOICES = (
        ('assigned', 'Assigned'),
        ('pending approval', 'Pending Approval'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )

    mentor = models.ForeignKey('Mentor', on_delete=models.CASCADE, related_name='assigned_reviews')
    reviewer = models.ForeignKey('Reviewer', on_delete=models.CASCADE, related_name='assigned_reviews')
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='review_assignments')
    review_sheet = models.URLField(max_length=500, blank=True, null=True)
    work_documents = models.URLField(max_length=500, blank=True, null=True)
    week = models.CharField(max_length=10, blank=True, null=True)
    course = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending approval')
    comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reviewer.user.username} – {self.student.user.username} ({self.status})"


class WeeklySubmission(models.Model):
    SUBMISSION_TYPES = [
        ('github', 'GitHub Repository'),
        ('typing', 'Typing Club Progress'),
        ('tech_seminar', 'Tech Seminar Video'),
        ('progress_video', 'Weekly Progress Video'),
    ]

    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='submissions')
    week = models.ForeignKey('Module', on_delete=models.CASCADE, related_name='submissions')
    submission_type = models.CharField(max_length=20, choices=SUBMISSION_TYPES)
    link = models.URLField(max_length=500, blank=True, null=True)
    notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    reviewed = models.BooleanField(default=False)
    marks = models.PositiveSmallIntegerField(null=True, blank=True, help_text="0-5")
    mentor_feedback = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['student', 'week', 'submission_type']
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.user.username} - Week {self.week.id} - {self.get_submission_type_display()}"


class AttendanceRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    check_in = models.DateTimeField()
    check_out = models.DateTimeField(null=True, blank=True)
    break_minutes = models.PositiveIntegerField(default=0, help_text="Total break time in minutes")
    check_out_reason = models.TextField(blank=True, help_text="Reason for checking out (if early or unusual)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-check_in']

    @property
    def net_work_seconds(self):
        if not self.check_out:
            return 0
        total_seconds = (self.check_out - self.check_in).total_seconds()
        break_seconds = self.break_minutes * 60
        return max(0, total_seconds - break_seconds)

    @property
    def net_work_hours(self):
        return round(self.net_work_seconds / 3600, 2)

    def __str__(self):
        return f"{self.student.user.username} - {self.check_in.strftime('%Y-%m-%d %H:%M')}"


class FeePayment(models.Model):
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('online', 'Online Transfer'),
        ('cheque', 'Cheque'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='fee_payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.user.username} - ₹{self.amount} - {self.status}"
    


class FeeStructure(models.Model):
    name = models.CharField(max_length=255)
    batch = models.ForeignKey('Batch', on_delete=models.SET_NULL, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    number_of_installments = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return self.name


class InstallmentSchedule(models.Model):
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name='installments')
    installment_number = models.PositiveIntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['installment_number']

    def __str__(self):
        return f"{self.fee_structure.name} - Installment {self.installment_number}"


class StudentFee(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_fees')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def pending_amount(self):
        return self.total_amount - self.paid_amount

    def __str__(self):
        return f"{self.student.full_name or self.student.user.username} - {self.fee_structure.name}"


class StudentFeePayment(models.Model):
    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=50, choices=[
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('online', 'Online'),
    ], default='cash')
    transaction_id = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.student_fee.paid_amount = self.student_fee.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        self.student_fee.save()

    def __str__(self):
        return f"Payment of {self.amount} for {self.student_fee}"




# ========== POST-SAVE SIGNAL: AUTO-CREATE PROFILES ==========
# from django.db.models.signals import post_save
# from django.dispatch import receiver

# @receiver(post_save, sender=User)
# def create_user_profile(sender, instance, created, **kwargs):
#     if created:
#         if instance.is_student:
#             Student.objects.get_or_create(user=instance, defaults={'email': instance.email, 'full_name': instance.get_full_name() or instance.username})
#         elif instance.is_mentor:
#             Mentor.objects.get_or_create(user=instance, defaults={'expertise': 'General'})
#         elif instance.is_reviewer:
#             Reviewer.objects.get_or_create(user=instance)
#         elif instance.is_accounts:
#             Accounts.objects.get_or_create(user=instance)
