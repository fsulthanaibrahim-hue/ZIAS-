import secrets
import random
import string
import re
from django.core.mail import send_mail
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import Group
from django.conf import settings
from accounts.models import User
from django.db import IntegrityError
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import serializers

from .models import (
    User, Student, Mentor, Reviewer, Course, Module, Day, Task, Batch,
    StudentModule, ContactMessage, StudentWeekReview, WeekUpdate, ReviewFolder,
    ChatRoom, ChatMessage, CourseStatus, Notification, StudentDocument, MentorDocument,
    ReviewAssignment, WeeklySubmission, AttendanceRecord, Accounts, FeePayment, FeeStructure,
    InstallmentSchedule, StudentFee, StudentFeePayment,
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
class BatchSerializer(serializers.ModelSerializer):
    student_count = serializers.IntegerField(source='students.count', read_only=True)
    class Meta:
        model = Batch
        fields = ['id', 'name', 'start_date', 'end_date', 'is_active', 'created_at', 'student_count']


# ---------------------------
# ACCOUNTS SERIALIZER
# ---------------------------
class AccountsSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=True)
    username = serializers.CharField(read_only=True)
    
    class Meta:
        model = Accounts
        fields = ['id', 'full_name', 'phone', 'department', 'email', 'username']

    def to_representation(self, instance):
        """Customize the response output"""
        representation = super().to_representation(instance)
        representation['email'] = instance.user.email
        representation['username'] = instance.user.username
        representation['is_accounts'] = instance.user.is_accounts
        representation['role'] = instance.user.role
        representation['user_id'] = instance.user.id
        return representation

    def _send_welcome_email(self, email, username, password, full_name):
        """Send welcome email with credentials"""
        try:
            domain = getattr(settings, 'SITE_DOMAIN', 'localhost:5173')
            expiry_days = getattr(settings, 'PASSWORD_EXPIRY_DAYS', 90)
            
            subject = '🎓 Welcome to ZIAS – Your Accounts Account Credentials'
            
            message = f"""
Dear {full_name or username},

Welcome to ZIAS!

Your accounts account has been created successfully.

Login Credentials:
━━━━━━━━━━━━━━━━━━━
Username: {username}
Password: {password}
Email: {email}
━━━━━━━━━━━━━━━━━━━

Please change your password within {expiry_days} days for security purposes.

Login URL: http://{domain}/login

Best regards,
ZIAS Team
"""
            
            send_mail(
                subject, 
                message, 
                settings.DEFAULT_FROM_EMAIL, 
                [email], 
                fail_silently=False
            )
            print(f"✅ Welcome email sent to accounts user: {email}")
            return True
        except Exception as e:
            print(f"❌ Email sending failed for accounts user {email}: {e}")
            return False

    def validate_phone(self, value):
        """Validate phone number - exactly 10 digits if provided"""
        if value:
            # Remove any non-digit characters
            cleaned = ''.join(filter(str.isdigit, value))
            if len(cleaned) != 10:
                raise serializers.ValidationError("Phone number must be exactly 10 digits")
            return cleaned
        return value

    def validate_email(self, value):
        """Validate email is not already used"""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value

    def create(self, validated_data):
        """Create accounts user with proper group assignment"""
        email = validated_data.pop('email')
        full_name = validated_data.get('full_name', '')
        phone = validated_data.get('phone', '')
        department = validated_data.get('department', '')
        
        # Generate username from email (before @ symbol)
        username_base = email.split('@')[0]
        username = username_base
        counter = 1
        
        # Ensure username is unique
        while User.objects.filter(username=username).exists():
            username = f"{username_base}{counter}"
            counter += 1
        
        # Generate random password
        random_password = generate_random_password()
        
        # Split full name into first and last name
        name_parts = full_name.strip().split() if full_name else []
        first_name = name_parts[0] if name_parts else ''
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=random_password,
            first_name=first_name,
            last_name=last_name
        )
        
        # IMPORTANT: Add user to Accounts group (this makes is_accounts = True)
        accounts_group, created = Group.objects.get_or_create(name='Accounts')
        user.groups.add(accounts_group)
        print(f"✅ Added {user.email} to Accounts group")
        
        # Create accounts profile
        accounts = Accounts.objects.create(
            user=user,
            full_name=full_name,
            phone=phone,
            department=department
        )
        
        # Send welcome email with credentials
        self._send_welcome_email(email, username, random_password, full_name)
        
        return accounts

    def update(self, instance, validated_data):
        """Update accounts profile"""
        # Update accounts profile fields
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.department = validated_data.get('department', instance.department)
        instance.save()
        
        # Update User's first_name/last_name if needed
        if 'full_name' in validated_data:
            full_name = validated_data['full_name']
            name_parts = full_name.split() if full_name else []
            instance.user.first_name = name_parts[0] if name_parts else ''
            instance.user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
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
# STUDENT DOCUMENT SERIALIZER 
# -----------------------------
class StudentDocumentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = StudentDocument
        fields = ['id', 'file', 'file_name', 'uploaded_at', 'url']

    def get_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url


# ----------------------------
# STUDENT SERIALIZER - FIXED
# ----------------------------
class StudentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'full_name', 'email', 'course', 'batch', 'student_batch', 'mentor',
            'phone', 'date_of_birth', 'age', 'gender',
            'fathers_name', 'fathers_contact', 'mothers_name', 'mothers_contact',
            'address', 'educational_qualification', 'college_school',
            'parent_name', 'parent_phone', 'emergency_contact'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['username'] = instance.user.username
        ret['email'] = instance.user.email
        if instance.student_batch:
            ret['batch'] = instance.student_batch.name
        return ret

    def create(self, validated_data):
        email = validated_data.pop('email')
        full_name = validated_data.pop('full_name', '')
        phone = validated_data.pop('phone', '')
        
        # Generate username from email
        username = email.split('@')[0]
        counter = 1
        original = username
        while User.objects.filter(username=username).exists():
            username = f"{original}{counter}"
            counter += 1
        
        random_password = generate_random_password()
        
        # Create user using your custom User model
        user = User.objects.create_user(
            username=username,
            email=email,
            password=random_password
        )
        
        # Create student
        student = Student.objects.create(
            user=user,
            full_name=full_name,
            phone=phone,
            **validated_data
        )
        
        # Send welcome email
        try:
            domain = getattr(settings, 'SITE_DOMAIN', 'localhost:5173')
            subject = 'Welcome to ZIAS – Your Student Account'
            message = f"""
Dear {full_name},

Welcome to ZIAS!

Your student account has been created.

Username: {username}
Password: {random_password}
Email: {email}
Phone: {phone}

Login URL: http://{domain}/login

Please change your password after first login.
"""
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        except Exception as e:
            print(f"Email failed: {e}")
        
        return student

    def update(self, instance, validated_data):
        validated_data.pop('email', None)
        
        for field in ['full_name', 'phone', 'course', 'date_of_birth', 'age', 'gender',
                      'fathers_name', 'fathers_contact', 'mothers_name', 'mothers_contact',
                      'address', 'educational_qualification', 'college_school',
                      'parent_name', 'parent_phone', 'emergency_contact', 'mentor']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        
        batch_name = validated_data.get('batch')
        if batch_name:
            batch_obj = Batch.objects.filter(name__iexact=batch_name).first()
            if batch_obj:
                instance.student_batch = batch_obj
        
        instance.save()
        return instance



# ----------------------------
# MENTOR SERIALIZER
# ----------------------------
class MentorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mentor
        fields = ['id', 'full_name', 'email', 'expertise', 'phone', 'batch']

    def create(self, validated_data):
        # Remove full_name from validated_data first
        full_name = validated_data.pop('full_name', '')
        email = validated_data.pop('email', '')
        
        # Generate username from full_name
        username = full_name.lower().replace(' ', '_')
        counter = 1
        original = username
        while User.objects.filter(username=username).exists():
            username = f"{original}{counter}"
            counter += 1
        
        random_password = generate_random_password()
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email if email else f"{username}@example.com",
            password=random_password
        )
        
        # Create mentor - use the rest of validated_data
        mentor = Mentor.objects.create(
            user=user,
            full_name=full_name,
            email=email if email else None,
            **validated_data  # This contains expertise, phone, batch
        )
        
        # Send welcome email
        try:
            domain = getattr(settings, 'SITE_DOMAIN', 'localhost:5173')
            subject = 'Welcome to ZIAS – Your Mentor Account'
            message = f"""
Dear {full_name},

Welcome to ZIAS!

Your mentor account has been created.

Username: {username}
Password: {random_password}
Email: {email}

Login URL: http://{domain}/login

Please change your password after first login.
"""
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        except Exception as e:
            print(f"Email failed: {e}")
        
        return mentor


# ----------------------------
# REVIEWER SERIALIZER (SAME AS MENTOR)
# ----------------------------
class ReviewerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    
    class Meta:
        model = Reviewer
        fields = ['id', 'full_name', 'department', 'qualification', 'experience', 'batch', 'course', 'email']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['email'] = instance.user.email if instance.user else None
        return representation

    def _send_welcome_email(self, email, username, password, full_name):
        try:
            domain = getattr(settings, 'SITE_DOMAIN', 'localhost:5173')
            expiry_days = getattr(settings, 'PASSWORD_EXPIRY_DAYS', 90)
            subject = '🎓 Welcome to ZIAS – Your Reviewer Account'
            message = f"""
            Dear {full_name},
            
            Welcome to ZIAS!
            
            Your reviewer account has been created successfully.
            
            Login Credentials:
            Username: {username}
            Password: {password}
            Email: {email}
            
            Please change your password within {expiry_days} days for security purposes.
            
            Login URL: http://{domain}/login
            
            Best regards,
            ZIAS Team
            """
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
            print(f"✅ Welcome email sent to reviewer: {email}")
        except Exception as e:
            print(f"❌ Email sending failed for reviewer {email}: {e}")

    def create(self, validated_data):
        full_name = validated_data.get('full_name', '')
        email = validated_data.pop('email', None)
        
        if not full_name:
            raise serializers.ValidationError({"full_name": "Full name is required"})
        
        username = full_name.lower().replace(' ', '_')
        counter = 1
        original = username
        while User.objects.filter(username=username).exists():
            username = f"{original}{counter}"
            counter += 1
        
        user_email = email if email else f"{username}@example.com"
        random_password = generate_random_password()
        
        user = User.objects.create_user(username=username, email=user_email, password=random_password)
        user.role = 'reviewer'
        user.save()
        
        reviewer = Reviewer.objects.create(user=user, **validated_data)
        self._send_welcome_email(user_email, username, random_password, full_name)
        
        return reviewer

    def update(self, instance, validated_data):
        email = validated_data.pop('email', None)
        
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.department = validated_data.get('department', instance.department)
        instance.qualification = validated_data.get('qualification', instance.qualification)
        instance.experience = validated_data.get('experience', instance.experience)
        instance.batch = validated_data.get('batch', instance.batch)
        instance.course = validated_data.get('course', instance.course)
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



class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    student_full_name = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.EmailField(source='student.user.email', read_only=True)
    formatted_amount = serializers.SerializerMethodField()
    formatted_due_date = serializers.SerializerMethodField()
    formatted_payment_date = serializers.SerializerMethodField()

    class Meta:
        model = FeePayment
        fields = [
            'id', 'student', 'student_name', 'student_full_name', 'student_email',
            'amount', 'formatted_amount', 'due_date', 'formatted_due_date',
            'payment_date', 'formatted_payment_date', 'status', 'payment_method',
            'transaction_id', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_formatted_amount(self, obj):
        """Return formatted amount with Indian Rupee symbol"""
        return f"₹{obj.amount:,.2f}" if obj.amount else "₹0.00"

    def get_formatted_due_date(self, obj):
        """Return formatted due date"""
        if obj.due_date:
            return obj.due_date.strftime('%d %b %Y')
        return None

    def get_formatted_payment_date(self, obj):
        """Return formatted payment date"""
        if obj.payment_date:
            return obj.payment_date.strftime('%d %b %Y, %I:%M %p')
        return None

    def validate_amount(self, value):
        """Validate amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value

    def validate_status(self, value):
        """Validate status value"""
        allowed_status = ['pending', 'paid', 'overdue', 'cancelled']
        if value not in allowed_status:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(allowed_status)}")
        return value

    def validate(self, data):
        """Cross-field validation"""
        # If status is 'paid', ensure payment_date is set
        if data.get('status') == 'paid' and not data.get('payment_date'):
            data['payment_date'] = timezone.now()
        
        # If payment_date is set but status is not 'paid', warn but don't error
        if data.get('payment_date') and data.get('status') != 'paid':
            # Auto-set status to paid if payment_date exists
            data['status'] = 'paid'
        
        return data

    def create(self, validated_data):
        """Create a new fee payment with automatic payment date if paid"""
        # Auto-set payment date if status is paid
        if validated_data.get('status') == 'paid' and not validated_data.get('payment_date'):
            validated_data['payment_date'] = timezone.now()
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update fee payment with automatic payment date if status changes to paid"""
        # If status is changing to 'paid', set payment_date
        if validated_data.get('status') == 'paid' and instance.status != 'paid':
            validated_data['payment_date'] = timezone.now()
        
        # If status is changing from 'paid' to something else, clear payment_date
        if validated_data.get('status') != 'paid' and instance.status == 'paid':
            validated_data['payment_date'] = None
        
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Customize the output representation"""
        representation = super().to_representation(instance)
        
        # Add student details
        if instance.student:
            representation['student_details'] = {
                'id': instance.student.id,
                'name': instance.student.full_name or instance.student.user.username,
                'email': instance.student.user.email,
                'phone': instance.student.phone,
                'course': instance.student.course,
                'batch': instance.student.batch,
            }
        
        # Add status badge info for frontend
        status_colors = {
            'paid': 'green',
            'pending': 'yellow',
            'overdue': 'red',
            'cancelled': 'gray'
        }
        representation['status_color'] = status_colors.get(instance.status, 'gray')
        representation['status_label'] = instance.status.capitalize()
        
        return representation


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



from rest_framework import serializers
from .models import FeeStructure, InstallmentSchedule

class InstallmentScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstallmentSchedule
        fields = ['id', 'week_number', 'due_date', 'amount', 'status', 'paid_date']

from rest_framework import serializers
from .models import FeeStructure

class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = ['id', 'name', 'total_amount', 'discount_percentage', 'number_of_installments', 'is_active', 'created_at', 'updated_at']




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

        