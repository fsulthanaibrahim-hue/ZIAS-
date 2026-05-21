import secrets
import random
import string
import re
from django.core.mail import send_mail
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from django.db import IntegrityError
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import serializers
from .models import (
    User, Student, Mentor, Reviewer, Course, Module, Day, Task, Batch,
    StudentModule, ContactMessage, StudentWeekReview, WeekUpdate, ReviewFolder,
    ChatRoom, ChatMessage, CourseStatus, Notification, StudentDocument, MentorDocument,
    ReviewAssignment, WeeklySubmission, AttendanceRecord, Accounts, FeePayment, FeeStructure,
    InstallmentSchedule, StudentFee, StudentFeePayment, Review
)


def generate_random_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# ----------------------------
# USER SERIALIZER
# ----------------------------
class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.BooleanField(read_only=True)
    is_mentor = serializers.BooleanField(read_only=True)
    is_reviewer = serializers.BooleanField(read_only=True)
    is_student = serializers.BooleanField(read_only=True)
    is_accounts = serializers.BooleanField(read_only=True)
    full_name = serializers.SerializerMethodField()
    role = serializers.ChoiceField(choices=['admin', 'student', 'mentor', 'reviewer', 'accounts'], write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_admin', 'is_mentor', 'is_reviewer', 'is_student', 'is_accounts', 'full_name', 'role']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def create(self, validated_data):
        role = validated_data.pop('role', None)
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
        if role:
            user.is_admin = False
            user.is_student = False
            user.is_mentor = False
            user.is_reviewer = False
            user.is_accounts = False
            if role == 'admin':
                user.is_admin = True
            elif role == 'student':
                user.is_student = True
            elif role == 'mentor':
                user.is_mentor = True
            elif role == 'reviewer':
                user.is_reviewer = True
            elif role == 'accounts':
                user.is_accounts = True
            user.save()
        return user

    def update(self, instance, validated_data):
        validated_data.pop('role', None)
        validated_data.pop('password', None)
        return super().update(instance, validated_data)


# ----------------------------
# BATCH SERIALIZER
# ----------------------------
class BatchSerializer(serializers.ModelSerializer):
    student_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Batch
        fields = ['id', 'name', 'start_date', 'end_date', 'is_active', 'created_at', 'student_count']


# ---------------------------
# ACCOUNTS SERIALIZER
# ---------------------------
class AccountsSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Accounts
        fields = ['id', 'user', 'username', 'email', 'full_name', 'phone', 'department']


# ----------------------------
# COURSE SERIALIZER
# ----------------------------
class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'duration', 'created_at']


# ----------------------------
# DAY SERIALIZER
# ----------------------------
class DaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Day
        fields = ['id', 'module', 'title', 'content', 'order', 'is_completed']


# ----------------------------
# TASK SERIALIZER
# ----------------------------
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'day', 'title', 'description', 'order']


# ----------------------------
# MODULE SERIALIZER
# ----------------------------
class ModuleSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    class Meta:
        model = Module
        fields = ['id', 'course', 'course_name', 'title', 'order', 'content', 'is_common', 'is_locked', 'unlock_date']


# ----------------------------- 
# STUDENT DOCUMENT SERIALIZER (single definition)
# -----------------------------
class StudentDocumentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = StudentDocument
        fields = ['id', 'student', 'file', 'file_name', 'uploaded_at', 'url']
        read_only_fields = ['id', 'uploaded_at']

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


# ----------------------------
# STUDENT SERIALIZER - FIXED VERSION
# ----------------------------
class StudentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=True)
    mentor_name = serializers.CharField(source='mentor.user.username', read_only=True)
    documents = StudentDocumentSerializer(many=True, read_only=True, source='student_documents')

    # Read‑only display fields
    batch_display = serializers.SerializerMethodField()
    course_display = serializers.SerializerMethodField()

    # Write fields: accept batch name (string) and course name (string)
    batch = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    course = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    mentor_id = serializers.PrimaryKeyRelatedField(
        source='mentor', queryset=Mentor.objects.all(), write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Student
        fields = [
            'id', 'username', 'email',
            'course', 'course_display',
            'batch', 'batch_display', 'student_batch',
            'mentor', 'mentor_id', 'mentor_name',
            'phone', 'date_of_birth', 'full_name', 'age', 'gender',
            'fathers_name', 'fathers_contact', 'mothers_name', 'mothers_contact',
            'address', 'educational_qualification', 'college_school',
            'parent_name', 'parent_phone', 'emergency_contact', 'documents'
        ]
        read_only_fields = ['student_batch', 'mentor']

    def get_batch_display(self, obj):
        return obj.student_batch.name if obj.student_batch else None

    def get_course_display(self, obj):
        return obj.course or None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        for f in ['course', 'batch', 'mentor_id']:
            ret.pop(f, None)
        ret['username'] = instance.user.username
        ret['email'] = instance.user.email
        ret['course'] = self.get_course_display(instance)
        ret['batch'] = self.get_batch_display(instance)
        return ret

    def validate_phone(self, value):
        if value and (not value.isdigit() or len(value) != 10):
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return value

    def validate_fathers_contact(self, value):
        if value and (not value.isdigit() or len(value) != 10):
            raise serializers.ValidationError("Father's contact must be exactly 10 digits.")
        return value

    def validate_mothers_contact(self, value):
        if value and (not value.isdigit() or len(value) != 10):
            raise serializers.ValidationError("Mother's contact must be exactly 10 digits.")
        return value

    def validate_parent_phone(self, value):
        if value and (not value.isdigit() or len(value) != 10):
            raise serializers.ValidationError("Parent phone must be exactly 10 digits.")
        return value

    def validate_emergency_contact(self, value):
        if value and (not value.isdigit() or len(value) != 10):
            raise serializers.ValidationError("Emergency contact must be exactly 10 digits.")
        return value

    # ========== CORRECTED validate_email METHOD ==========
    def validate_email(self, value):
        """Validate email is provided and unique"""
        if not value:
            raise serializers.ValidationError("Email is required.")
        
        # For UPDATE operations - exclude the current student
        if self.instance:
            # This is an edit - check if email exists for OTHER users
            if User.objects.filter(email=value).exclude(id=self.instance.user.id).exists():
                raise serializers.ValidationError("This email is already used by another student.")
        else:
            # For CREATE operations
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("A student with this email already exists. Please use a different email.")
        
        return value
    # ========== END OF CORRECTED METHOD ==========

    def _generate_username(self, full_name, email):
        base = full_name.lower().replace(' ', '').replace('-', '') if full_name else ''
        if not base and email:
            base = email.split('@')[0]
        if not base:
            base = 'student'
        username = base[:30]
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base[:27]}{counter}"
            counter += 1
        return username

    def _resolve_batch(self, batch_name):
        if not batch_name:
            return None
        batch = Batch.objects.filter(name__iexact=batch_name).first()
        if not batch:
            batch = Batch.objects.filter(name=batch_name).first()
        return batch

    def create(self, validated_data):
        # Extract user fields
        username = validated_data.pop('username', None)
        email = validated_data.pop('email', None)
        batch_name = validated_data.pop('batch', None)
        course_name = validated_data.pop('course', None)

        if not email:
            raise serializers.ValidationError({"email": "Email is required."})
        
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        if not username:
            username = self._generate_username(validated_data.get('full_name', ''), email)

        random_password = generate_random_password()

        batch_obj = self._resolve_batch(batch_name)

        with transaction.atomic():
            try:
                user = User.objects.create_user(username=username, email=email, password=random_password)
            except IntegrityError:
                username = self._generate_username(validated_data.get('full_name', '') + str(User.objects.count()), email)
                user = User.objects.create_user(username=username, email=email, password=random_password)

            if hasattr(user, 'role'):
                user.role = 'student'
            else:
                user.is_student = True
            user.password_changed_at = timezone.now()
            user.save()

            request = self.context.get('request')
            mentor = validated_data.pop('mentor', None)
            if not mentor and request and getattr(request.user, 'is_mentor', False):
                mentor = Mentor.objects.filter(user=request.user).first()
            if mentor:
                validated_data['mentor'] = mentor
                if not batch_obj and mentor.batch:
                    batch_obj = mentor.batch

            validated_data['course'] = course_name
            validated_data['student_batch'] = batch_obj
            student = Student.objects.create(user=user, **validated_data)

        return student

    def update(self, instance, validated_data):
        # Handle batch name (string)
        batch_name = validated_data.pop('batch', None)
        if batch_name is not None:
            if batch_name == "":
                instance.student_batch = None
            else:
                batch_obj = self._resolve_batch(batch_name)
                if batch_obj:
                    instance.student_batch = batch_obj
                else:
                    raise serializers.ValidationError({"batch": f"Batch '{batch_name}' not found."})

        # Handle course name (string)
        course_name = validated_data.pop('course', None)
        if course_name is not None:
            instance.course = course_name

        # Handle email update if needed
        email = validated_data.pop('email', None)
        if email and email != instance.user.email:
            if User.objects.filter(email=email).exclude(id=instance.user.id).exists():
                raise serializers.ValidationError({"email": "This email is already taken."})
            instance.user.email = email
            instance.user.save()

        # Handle username update if needed
        username = validated_data.pop('username', None)
        if username and username != instance.user.username:
            if User.objects.filter(username=username).exclude(id=instance.user.id).exists():
                raise serializers.ValidationError({"username": "This username is already taken."})
            instance.user.username = username
            instance.user.save()

        # Update simple fields
        for field in ['full_name', 'phone', 'date_of_birth', 'age', 'gender',
                      'fathers_name', 'fathers_contact', 'mothers_name', 'mothers_contact',
                      'address', 'educational_qualification', 'college_school',
                      'parent_name', 'parent_phone', 'emergency_contact', 'mentor']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        instance.save()
        return instance


# ----------------------------
# MENTOR SERIALIZER
# ----------------------------
class MentorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    full_name = serializers.CharField(required=True)

    class Meta:
        model = Mentor
        fields = ['id', 'email', 'phone', 'expertise', 'batch', 'full_name']

    def validate_email(self, value):
        """Validate email is provided and unique for create only"""
        if not value:
            return None
        
        # For CREATE operations only
        if not self.instance:
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError(f"Email '{value}' is already registered. Please use a different email.")
        
        return value

    def validate_phone(self, value):
        if value and (not value.isdigit() or len(value) != 10):
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return value

    def create(self, validated_data):
        email = validated_data.pop('email', None)
        full_name = validated_data.pop('full_name')
        phone = validated_data.pop('phone', '')
        expertise = validated_data.pop('expertise', '')
        batch = validated_data.pop('batch', None)
        
        if not email:
            raise serializers.ValidationError({"email": "Email is required."})
        
        # Generate username from email
        username = email.split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Generate random password
        random_password = generate_random_password()
        
        # Create User
        user = User.objects.create_user(
            username=username,
            email=email,
            password=random_password
        )
        user.is_mentor = True
        user.save()
        
        # Create Mentor
        mentor = Mentor.objects.create(
            user=user,
            full_name=full_name,
            phone=phone,
            expertise=expertise,
            batch=batch
        )
        
        # Send welcome email
        try:
            expiry_days = getattr(settings, 'PASSWORD_EXPIRY_DAYS', 30)
            domain = getattr(settings, 'SITE_DOMAIN', 'localhost:5173')
            context = {
                'username': username,
                'password': random_password,
                'expiry_days': expiry_days,
                'domain': domain
            }
            html_message = render_to_string('mail.html', context)
            plain_message = strip_tags(html_message)
            subject = '🎓 Welcome to ZIAS – Your Mentor Account Credentials'
            send_mail(subject, plain_message, settings.DEFAULT_FROM_EMAIL, [email], html_message=html_message, fail_silently=True)
        except Exception as e:
            print(f"Email sending failed: {e}")
        
        return mentor

    def update(self, instance, validated_data):
        # For update, ignore email completely
        validated_data.pop('email', None)
        
        # Update only these fields
        instance.phone = validated_data.get('phone', instance.phone)
        instance.expertise = validated_data.get('expertise', instance.expertise)
        instance.batch = validated_data.get('batch', instance.batch)
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.save()
        
        return instance
    

# ----------------------------
# REVIEWER SERIALIZER
# ----------------------------

def generate_random_password(length=10):
    """Generate a random password for new users."""
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

class ReviewerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', required=False, write_only=True)
    email = serializers.EmailField(source='user.email', required=True)

    class Meta:
        model = Reviewer
        fields = ['id', 'username', 'email', 'department', 'qualification', 'experience', 'batch',
                  'available_from', 'available_to', 'available_days', 'full_name']

    def create(self, validated_data):
        user_data = validated_data.pop('user', {})
        email = validated_data.pop('email', user_data.get('email'))
        username = validated_data.pop('username', user_data.get('username'))

        # 1. Find or create user by email
        user, user_created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username if username else email.split('@')[0],
                'is_reviewer': True
            }
        )

        # If user existed but not reviewer, update flag
        if not user_created and not user.is_reviewer:
            user.is_reviewer = True
            user.save()

        # 2. Create or update reviewer profile
        reviewer, reviewer_created = Reviewer.objects.get_or_create(
            user=user,
            defaults=validated_data
        )

        # If reviewer already existed, update its fields
        if not reviewer_created:
            for attr, value in validated_data.items():
                setattr(reviewer, attr, value)
            reviewer.save()

        # 3. If new user was created, generate password and send welcome email
        if user_created:
            random_password = generate_random_password()
            user.set_password(random_password)
            user.save()

            # Send welcome email
            expiry_days = getattr(settings, 'PASSWORD_EXPIRY_DAYS', 90)
            domain = getattr(settings, 'SITE_DOMAIN', 'localhost:5173')
            context = {
                'username': user.username,
                'password': random_password,
                'expiry_days': expiry_days,
                'domain': domain
            }
            try:
                html_message = render_to_string('mail.html', context)
                plain_message = strip_tags(html_message)
                subject = '🎓 Welcome to ZIAS – Your Reviewer Account Credentials'
                send_mail(
                    subject,
                    plain_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    html_message=html_message,
                    fail_silently=False
                )
            except Exception as e:
                print(f"Email sending failed for reviewer {email}: {e}")

        return reviewer

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        new_username = validated_data.pop('username', user_data.get('username'))
        new_email = validated_data.pop('email', user_data.get('email'))

        user = instance.user
        if new_username and new_username != user.username:
            if User.objects.filter(username=new_username).exists():
                raise serializers.ValidationError({"username": "Username already taken."})
            user.username = new_username
        if new_email and new_email != user.email:
            if User.objects.filter(email=new_email).exists():
                raise serializers.ValidationError({"email": "Email already in use by another account."})
            user.email = new_email
        if new_username or new_email:
            user.save()

        # Update reviewer fields
        instance.department = validated_data.get('department', instance.department)
        instance.qualification = validated_data.get('qualification', instance.qualification)
        instance.experience = validated_data.get('experience', instance.experience)
        instance.batch = validated_data.get('batch', instance.batch)
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.save()
        return instance
    


# ----------------------------
# STUDENT MODULE SERIALIZER
# ----------------------------
class StudentModuleSerializer(serializers.ModelSerializer):
    module_title = serializers.CharField(source='module.title', read_only=True)
    module_content = serializers.CharField(source='module.content', read_only=True)
    class Meta:
        model = StudentModule
        fields = ['id', 'student', 'module', 'module_title', 'module_content', 'order', 'is_completed', 'completed_at']


# ----------------------------
# CONTACT MESSAGE SERIALIZER
# ----------------------------
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'


# ----------------------------
# STUDENT WEEK REVIEW SERIALIZER
# ----------------------------
class StudentWeekReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    module_title = serializers.CharField(source='module.title', read_only=True)
    total_score = serializers.IntegerField(min_value=0, max_value=20, required=False, allow_null=True)

    class Meta:
        model = StudentWeekReview
        fields = '__all__'
        read_only_fields = ['id', 'student', 'module', 'updated_at']



class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'title', 'content']

# ----------------------------
# WEEK UPDATE SERIALIZER
# ----------------------------
class WeekUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeekUpdate
        fields = '__all__'
        read_only_fields = ['id', 'update_date']


# ----------------------------
# REVIEW FOLDER SERIALIZER
# ----------------------------
class ReviewFolderSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    review_status = serializers.ReadOnlyField()

    class Meta:
        model = ReviewFolder
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'student_name']

    def get_student_name(self, obj):
        student = obj.student
        if student.full_name:
            return student.full_name
        return student.user.username


# ========== CHAT SERIALIZERS ==========
class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ['id', 'sender', 'timestamp', 'is_read', 'read_at', 'action', 'suggested_time', 'responded_at']

    def get_sender_name(self, obj):
        user = obj.sender
        profile = None
        # Use the correct related_name: mentor_profile, reviewer_profile, student_profile
        if hasattr(user, 'mentor_profile'):
            profile = user.mentor_profile
        elif hasattr(user, 'reviewer_profile'):
            profile = user.reviewer_profile
        elif hasattr(user, 'student_profile'):
            profile = user.student_profile
        if profile and profile.full_name:
            return profile.full_name
        if user.get_full_name():
            return user.get_full_name()
        cleaned = re.sub(r'\d+$', '', user.username)
        return cleaned if cleaned else user.username


class ChatRoomSerializer(serializers.ModelSerializer):
    other_user_name = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    def get_other_user_name(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        other = None
        if obj.reviewer and obj.reviewer.user != user:
            other = obj.reviewer
        elif obj.mentor and obj.mentor.user != user:
            other = obj.mentor
        elif obj.student and obj.student.user != user:
            other = obj.student
        if other:
            full_name = getattr(other, 'full_name', None)
            if full_name and full_name.strip():
                return full_name
            user_obj = other.user
            if user_obj.get_full_name():
                return user_obj.get_full_name()
            cleaned = re.sub(r'\d+$', '', user_obj.username)
            return cleaned if cleaned else user_obj.username
        return "Unknown"

    def get_last_message(self, obj):
        last = obj.messages.order_by('timestamp').last()
        if last:
            return {
                "content": last.content,
                "timestamp": last.timestamp,
                "sender_id": last.sender.id if last.sender else None
            }
        return None

    class Meta:
        model = ChatRoom
        fields = '__all__'


class CourseStatusSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = CourseStatus
        fields = ['id', 'student', 'student_name', 'course', 'course_name',
                  'started_at', 'ended_at', 'current_week']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'created_at', 'is_read', 'link']


class MentorDocumentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = MentorDocument
        fields = ['id', 'file', 'file_name', 'uploaded_at', 'url']

    def get_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


class ReviewAssignmentSerializer(serializers.ModelSerializer):
    mentor_full_name = serializers.SerializerMethodField()
    reviewer_full_name = serializers.SerializerMethodField()
    student_full_name = serializers.SerializerMethodField()

    class Meta:
        model = ReviewAssignment
        fields = [
            'id', 'mentor', 'mentor_full_name', 'reviewer', 'reviewer_full_name',
            'student', 'student_full_name', 'review_sheet', 'work_documents', 'week',
            'course', 'status', 'comments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_mentor_full_name(self, obj):
        if obj.mentor and obj.mentor.user:
            return obj.mentor.full_name or obj.mentor.user.get_full_name() or obj.mentor.user.username
        return "Unknown Mentor"

    def get_reviewer_full_name(self, obj):
        if obj.reviewer and obj.reviewer.user:
            return obj.reviewer.full_name or obj.reviewer.user.get_full_name() or obj.reviewer.user.username
        return "Unknown Reviewer"

    def get_student_full_name(self, obj):
        if obj.student and obj.student.user:
            return obj.student.full_name or obj.student.user.get_full_name() or obj.student.user.username
        return "Unknown Student"


class WeeklySubmissionSerializer(serializers.ModelSerializer):
    submission_type_display = serializers.CharField(source='get_submission_type_display', read_only=True)
    week_title = serializers.CharField(source='week.title', read_only=True)

    class Meta:
        model = WeeklySubmission
        fields = '__all__'
        read_only_fields = ['student', 'submitted_at', 'reviewed_at']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    net_work_hours = serializers.ReadOnlyField()
    class Meta:
        model = AttendanceRecord
        fields = '__all__'
        read_only_fields = ['student', 'check_in', 'created_at', 'net_work_hours']


class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)

    class Meta:
        model = FeePayment
        fields = '__all__'


class StudentFeeSummarySerializer(serializers.Serializer):
    total_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_pending = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_overdue = serializers.DecimalField(max_digits=10, decimal_places=2)
    due_date = serializers.DateField(allow_null=True)
    required_action = serializers.CharField()
    payment_received = serializers.BooleanField()
    agreement_signed = serializers.BooleanField()
    escalation_flag = serializers.BooleanField()
    week_back_fee_status = serializers.CharField()



class FeeStructureSerializer(serializers.ModelSerializer):
    installments = serializers.SerializerMethodField()

    class Meta:
        model = FeeStructure
        fields = '__all__'

    def get_installments(self, obj):
        return InstallmentScheduleSerializer(obj.installments.all(), many=True).data

class InstallmentScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstallmentSchedule
        fields = '__all__'

class StudentFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    course_name = serializers.CharField(source='student.course', read_only=True)
    pending_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = StudentFee
        fields = '__all__'

class StudentFeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student_fee.student.full_name', read_only=True)

    class Meta:
        model = StudentFeePayment
        fields = '__all__'
