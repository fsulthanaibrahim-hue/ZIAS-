import secrets
import random
import string
import re
import json
import urllib.request
import urllib.error
import requests
from django.core.mail import send_mail
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import Group, User
from django.conf import settings
from accounts.models import User
from django.db import IntegrityError
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import serializers


from rest_framework import serializers

from .models import (
    User, Student, Mentor, Reviewer, Course, Module, Day, Task, Batch,
    StudentModule, ContactMessage, StudentWeekReview, WeekUpdate, ReviewFolder,
    ChatRoom, ChatMessage, CourseStatus, Notification, StudentDocument, MentorDocument,
    ReviewAssignment, WeeklySubmission, AttendanceRecord, Accounts, TaskCompletion,
)


def generate_random_password(length=10):
    """Generate a random password"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


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
# In serializers.py
class BatchSerializer(serializers.ModelSerializer):
    start_date = serializers.DateField(
        input_formats=['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%fZ'],
        format='%Y-%m-%d'
    )
    end_date = serializers.DateField(
        input_formats=['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%fZ'],
        format='%Y-%m-%d'
    )
    
    class Meta:
        model = Batch
        fields = '__all__'
    
    def to_internal_value(self, data):
        # Convert date strings to date objects without timezone
        if 'start_date' in data and data['start_date']:
            if isinstance(data['start_date'], str):
                data['start_date'] = data['start_date'].split('T')[0]
        if 'end_date' in data and data['end_date']:
            if isinstance(data['end_date'], str):
                data['end_date'] = data['end_date'].split('T')[0]
        return super().to_internal_value(data)


# ---------------------------
# ACCOUNTS SERIALIZER
# ---------------------------
def send_accounts_welcome_email(email, full_name, username, password):
    try:
        login_url = f"{settings.SITE_DOMAIN.rstrip('/')}/login"

        subject = "Welcome to ZIAS - Your Accounts Account"

        message = f"""Dear {full_name or username},

Welcome to ZIAS!

Your accounts account has been created successfully.

Your login details:

Username: {username}
Password: {password}
Email: {email}

Login URL: {login_url}

Please change your password after your first login.

Regards,
ZIAS Team
"""

        payload = {
            "sender": {
                "name": "ZIAS Team",
                "email": settings.DEFAULT_FROM_EMAIL
            },
            "to": [
                {
                    "email": email,
                    "name": full_name or username
                }
            ],
            "subject": subject,
            "textContent": message
        }

        request = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(request, timeout=60) as response:
            print(
                f"SUCCESS: Brevo accepted accounts email for {email}. "
                f"Status: {response.status}",
                flush=True
            )

    except urllib.error.HTTPError as e:
        print(
            f"BREVO API ERROR: {e.code} - {e.read().decode()}",
            flush=True
        )

    except Exception as e:
        print(
            f"ACCOUNTS EMAIL ERROR for {email}: {str(e)}",
            flush=True
        )


class AccountsSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(write_only=True, required=True)
    username = serializers.CharField(read_only=True)

    class Meta:
        model = Accounts
        fields = [
            'id',
            'full_name',
            'phone',
            'department',
            'email',
            'username'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['email'] = instance.user.email
        representation['username'] = instance.user.username
        representation['is_accounts'] = instance.user.is_accounts
        representation['role'] = instance.user.role
        representation['user_id'] = instance.user.id
        return representation

    def validate_phone(self, value):
        if value:
            cleaned = ''.join(filter(str.isdigit, value))

            if len(cleaned) != 10:
                raise serializers.ValidationError(
                    "Phone number must be exactly 10 digits"
                )

            return cleaned

        return value

    @transaction.atomic
    def create(self, validated_data):

        email = validated_data.pop('email').strip()
        full_name = validated_data.get('full_name', '').strip()

        if not full_name:
            raise serializers.ValidationError({
                'full_name': 'Full name is required.'
            })

        # Find an existing user
        user = User.objects.filter(email__iexact=email).first()

        random_password = generate_random_password()

        if user:
            has_profile = (
                Student.objects.filter(user=user).exists()
                or Mentor.objects.filter(user=user).exists()
                or Reviewer.objects.filter(user=user).exists()
                or Accounts.objects.filter(user=user).exists()
            )

            has_role = user.groups.filter(
                name__in=['Students', 'Mentors', 'Reviewers', 'Accounts']
            ).exists()

            if has_profile or has_role:
                raise serializers.ValidationError({
                    'email': 'This email is already assigned to another account.'
                })

            username = user.username
            user.set_password(random_password)

        else:
            username_base = email.split('@')[0]
            username = username_base
            counter = 1

            while User.objects.filter(username=username).exists():
                username = f"{username_base}{counter}"
                counter += 1

            name_parts = full_name.split()

            user = User.objects.create_user(
                username=username,
                email=email,
                password=random_password,
                first_name=name_parts[0] if name_parts else '',
                last_name=' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            )

        # Assign Accounts role
        accounts_group, _ = Group.objects.get_or_create(name='Accounts')
        user.groups.add(accounts_group)
        user.save()

        # Update name for reused users
        name_parts = full_name.split()
        user.first_name = name_parts[0] if name_parts else ''
        user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
        user.save()

        accounts = Accounts.objects.create(
            user=user,
            **validated_data
        )

        transaction.on_commit(
            lambda: send_accounts_welcome_email(
                email=email,
                full_name=full_name,
                username=username,
                password=random_password
            )
        )

        return accounts

    def update(self, instance, validated_data):

        instance.full_name = validated_data.get(
            'full_name', instance.full_name
        )
        instance.phone = validated_data.get(
            'phone', instance.phone
        )
        instance.department = validated_data.get(
            'department', instance.department
        )

        instance.save()

        if 'full_name' in validated_data:
            name_parts = instance.full_name.split() if instance.full_name else []
            instance.user.first_name = name_parts[0] if name_parts else ''
            instance.user.last_name = (
                ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            )
            instance.user.save()

        return instance


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
        fields = ['id', 'title', 'description', 'day', 'order']




class TaskCompletionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = TaskCompletion
        fields = ['id', 'student', 'task', 'task_title', 'completed', 'completed_at', 'updated_at']


# ----------------------------
# MODULE SERIALIZER
# ----------------------------
class ModuleSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    class Meta:
        model = Module
        fields = ['id', 'course', 'course_name', 'title', 'order', 'content', 'is_common', 'is_locked', 'unlock_date']



# ----------------------------
# STUDENT DOCUMENT SERIALIZER 
# ----------------------------
class StudentDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDocument
        fields = '__all__'




# ----------------------------- 
# STUDENT SERIALIZER 
# -----------------------------
def send_student_welcome_email(email, full_name, username, password):
    try:
        login_url = f"{settings.SITE_DOMAIN.rstrip('/')}/login"

        subject = "Welcome to ZIAS - Your Student Account"

        message = f"""Dear {full_name},

Welcome to ZIAS!

Your student account has been created successfully.

Your login details:

Username: {username}
Password: {password}
Email: {email}

Login URL: {login_url}

Please change your password after your first login.

Regards,
ZIAS Team
"""

        payload = {
            "sender": {
                "name": "ZIAS Team",
                "email": settings.DEFAULT_FROM_EMAIL
            },
            "to": [{"email": email, "name": full_name}],
            "subject": subject,
            "textContent": message
        }

        request = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(request, timeout=60) as response:
            print(
                f"SUCCESS: Brevo accepted student email for {email}. "
                f"Status: {response.status}",
                flush=True
            )

    except urllib.error.HTTPError as e:
        print(
            f"BREVO API ERROR: {e.code} - {e.read().decode()}",
            flush=True
        )

    except Exception as e:
        print(f"EMAIL ERROR for {email}: {str(e)}", flush=True)


class StudentSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(write_only=True, required=True)
    username = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Student
        fields = [
            'id',
            'username',
            'full_name',
            'email',
            'course',
            'batch',
            'student_batch',
            'phone',
            'date_of_birth',
            'age',
            'gender',
            'fathers_name',
            'fathers_contact',
            'mothers_name',
            'mothers_contact',
            'address',
            'educational_qualification',
            'college_school',
            'parent_name',
            'parent_phone',
            'emergency_contact',
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)

        ret['username'] = (
            instance.user.username if instance.user else ''
        )

        ret['email'] = (
            instance.user.email if instance.user else ''
        )

        ret['batch'] = (
            instance.student_batch.name
            if instance.student_batch
            else instance.batch or ''
        )

        return ret

    @transaction.atomic
    def create(self, validated_data):

        # Get student details
        email = validated_data.pop('email')
        full_name = validated_data.pop('full_name', '')
        phone = validated_data.pop('phone', '')
        requested_username = validated_data.pop('username', None)

        # Generate a unique username
        username = requested_username or email.split('@')[0]

        original_username = username
        counter = 1

        while User.objects.filter(username=username).exists():
            username = f"{original_username}{counter}"
            counter += 1

        # Generate random password
        random_password = generate_random_password()

        # Create user account
        user = User.objects.create_user(
            username=username,
            email=email,
            password=random_password
        )

        # Get batch information
        batch_obj = validated_data.pop('student_batch', None)

        # Remove display-only batch field
        validated_data.pop('batch', None)

        batch_name = batch_obj.name if batch_obj else None

        # Create student profile
        student = Student.objects.create(
            user=user,
            full_name=full_name,
            phone=phone,
            batch=batch_name,
            student_batch=batch_obj,
            **validated_data
        )

        # Send welcome email after database commit
        def send_email():

            print(
                f"DEBUG: Sending welcome email to {email}",
                flush=True
            )

            send_student_welcome_email(
                email=email,
                full_name=full_name,
                username=username,
                password=random_password
            )

        transaction.on_commit(send_email)

        return student

    def update(self, instance, validated_data):

        # Email and username cannot be changed while editing
        validated_data.pop('email', None)
        validated_data.pop('username', None)

        # Update batch information
        if 'student_batch' in validated_data:

            batch_obj = validated_data.pop('student_batch')

            instance.student_batch = batch_obj

            instance.batch = (
                batch_obj.name if batch_obj else None
            )

        # Ignore display-only batch field
        validated_data.pop('batch', None)

        # Update remaining student fields
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save()

        return instance
    

# ----------------------------
# MENTOR SERIALIZER
# ----------------------------
def send_mentor_welcome_email(email, full_name, username, password):
    try:
        login_url = f"{settings.SITE_DOMAIN.rstrip('/')}/login"

        subject = "Welcome to ZIAS - Your Mentor Account"

        message = f"""Dear {full_name},

Welcome to ZIAS!

Your mentor account has been created successfully.

Your login details:

Username: {username}
Password: {password}
Email: {email}

Login URL: {login_url}

Please change your password after your first login.

Regards,
ZIAS Team
"""

        payload = {
            "sender": {
                "name": "ZIAS Team",
                "email": settings.DEFAULT_FROM_EMAIL
            },
            "to": [
                {
                    "email": email,
                    "name": full_name
                }
            ],
            "subject": subject,
            "textContent": message
        }

        request = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(request, timeout=60) as response:
            print(
                f"SUCCESS: Brevo accepted mentor email for {email}. "
                f"Status: {response.status}",
                flush=True
            )

    except urllib.error.HTTPError as e:
        print(
            f"BREVO API ERROR: {e.code} - {e.read().decode()}",
            flush=True
        )

    except Exception as e:
        print(
            f"MENTOR EMAIL ERROR for {email}: {str(e)}",
            flush=True
        )


class MentorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Mentor
        fields = [
            'id',
            'full_name',
            'email',
            'expertise',
            'phone',
            'batch'
        ]

    @transaction.atomic
    def create(self, validated_data):

        full_name = validated_data.pop('full_name', '').strip()
        email = validated_data.pop('email', '').strip()

        if not full_name:
            raise serializers.ValidationError({
                'full_name': 'Full name is required.'
            })

        if not email:
            raise serializers.ValidationError({
                'email': 'Email address is required.'
            })

        if Mentor.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({
                'email': 'A mentor with this email already exists.'
            })

        # Check for an existing Django user
        user = User.objects.filter(email__iexact=email).first()

        random_password = generate_random_password()

        if user:
            # Reuse only an unassigned user account
            has_profile = (
                Student.objects.filter(user=user).exists()
                or Mentor.objects.filter(user=user).exists()
                or Reviewer.objects.filter(user=user).exists()
                or Accounts.objects.filter(user=user).exists()
            )

            has_role = user.groups.filter(
                name__in=['Students', 'Mentors', 'Reviewers', 'Accounts']
            ).exists()

            if has_profile or has_role:
                raise serializers.ValidationError({
                    'email': 'This email is already assigned to another account.'
                })

            username = user.username
            user.set_password(random_password)

        else:
            username = full_name.lower().replace(' ', '_')
            original_username = username
            counter = 1

            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=email,
                password=random_password
            )

        # Assign Mentor role
        group, _ = Group.objects.get_or_create(name='Mentors')
        user.groups.add(group)
        user.save()

        # Create mentor profile
        mentor = Mentor.objects.create(
            user=user,
            full_name=full_name,
            email=email,
            **validated_data
        )

        transaction.on_commit(
            lambda: send_mentor_welcome_email(
                email=email,
                full_name=full_name,
                username=username,
                password=random_password
            )
        )

        return mentor

    def update(self, instance, validated_data):

        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save()
        return instance




# ----------------------------
# REVIEWER SERIALIZER 
# ----------------------------
def send_reviewer_welcome_email(email, full_name, username, password):
    try:
        login_url = f"{settings.SITE_DOMAIN.rstrip('/')}/login"

        subject = "Welcome to ZIAS - Your Reviewer Account"

        message = f"""Dear {full_name},

Welcome to ZIAS!

Your reviewer account has been created successfully.

Your login details:

Username: {username}
Password: {password}
Email: {email}

Login URL: {login_url}

Please change your password after your first login.

Regards,
ZIAS Team
"""

        payload = {
            "sender": {
                "name": "ZIAS Team",
                "email": settings.DEFAULT_FROM_EMAIL
            },
            "to": [
                {
                    "email": email,
                    "name": full_name
                }
            ],
            "subject": subject,
            "textContent": message
        }

        request = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(request, timeout=60) as response:
            print(
                f"SUCCESS: Brevo accepted reviewer email for {email}. "
                f"Status: {response.status}",
                flush=True
            )

    except urllib.error.HTTPError as e:
        print(
            f"BREVO API ERROR: {e.code} - {e.read().decode()}",
            flush=True
        )

    except Exception as e:
        print(
            f"REVIEWER EMAIL ERROR for {email}: {str(e)}",
            flush=True
        )



class ReviewerSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(write_only=True)

    class Meta:
        model = Reviewer
        fields = [
            'id',
            'full_name',
            'department',
            'qualification',
            'experience',
            'batch',
            'course',
            'email'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['email'] = (
            instance.user.email if instance.user else None
        )
        return representation

    @transaction.atomic
    def create(self, validated_data):

        full_name = validated_data.pop('full_name', '').strip()
        email = validated_data.pop('email', '').strip()

        if not full_name:
            raise serializers.ValidationError({
                "full_name": "Full name is required."
            })

        if not email:
            raise serializers.ValidationError({
                "email": "Email address is required."
            })

        # Check whether a Reviewer profile already exists
        if Reviewer.objects.filter(user__email__iexact=email).exists():
            raise serializers.ValidationError({
                "email": "A reviewer with this email already exists."
            })

        # Find an existing user
        user = User.objects.filter(email__iexact=email).first()

        random_password = generate_random_password()

        if user:
            has_profile = (
                Student.objects.filter(user=user).exists()
                or Mentor.objects.filter(user=user).exists()
                or Reviewer.objects.filter(user=user).exists()
                or Accounts.objects.filter(user=user).exists()
            )

            has_role = user.groups.filter(
                name__in=['Students', 'Mentors', 'Reviewers', 'Accounts']
            ).exists()

            if has_profile or has_role:
                raise serializers.ValidationError({
                    "email": "This email is already assigned to another account."
                })

            username = user.username
            user.set_password(random_password)

        else:
            username = full_name.lower().replace(' ', '_')
            original_username = username
            counter = 1

            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=email,
                password=random_password
            )

        # Assign Reviewer role
        group, _ = Group.objects.get_or_create(name='Reviewers')
        user.groups.add(group)
        user.save()

        # Create Reviewer profile
        reviewer = Reviewer.objects.create(
            user=user,
            full_name=full_name,
            **validated_data
        )

        transaction.on_commit(
            lambda: send_reviewer_welcome_email(
                email=email,
                full_name=full_name,
                username=username,
                password=random_password
            )
        )

        return reviewer

    def update(self, instance, validated_data):

        email = validated_data.pop('email', None)

        instance.full_name = validated_data.get(
            'full_name', instance.full_name
        )
        instance.department = validated_data.get(
            'department', instance.department
        )
        instance.qualification = validated_data.get(
            'qualification', instance.qualification
        )
        instance.experience = validated_data.get(
            'experience', instance.experience
        )
        instance.batch = validated_data.get(
            'batch', instance.batch
        )
        instance.course = validated_data.get(
            'course', instance.course
        )

        instance.save()

        if email and instance.user:
            instance.user.email = email
            instance.user.save()

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




class ReviewAssignmentSerializer(serializers.ModelSerializer):
    review_date = serializers.DateField(source='review_folder.review_date', read_only=True)
    meeting_link = serializers.URLField(source='review_folder.meeting_link', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    mentor_name = serializers.CharField(source='mentor.full_name', read_only=True)
    
    class Meta:
        model = ReviewAssignment
        fields = '__all__'  



import secrets
import string


def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + "!@#$"
    return ''.join(
        secrets.choice(characters)
        for _ in range(length)
    )
