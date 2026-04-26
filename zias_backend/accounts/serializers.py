import secrets
import string
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from django.db import IntegrityError
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import serializers
from .models import (
    User, Student, Mentor, Reviewer, Course, Module, Day, Task, Batch,
    StudentModule, ContactMessage, StudentWeekReview, WeekUpdate, ReviewFolder,
    ChatRoom, ChatMessage, CourseStatus  
)


def generate_random_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# ----------------------------
# USER SERIALIZER
# ----------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_admin', 'is_student', 'is_mentor', 'is_reviewer']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def update(self, instance, validated_data):
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

# ----------------------------
# STUDENT SERIALIZER (fixed: accepts flat username/email, no nested 'user')
# ----------------------------
class StudentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False)   # flat, used for CREATE
    email = serializers.EmailField(write_only=True, required=False)     # flat
    mentor_name = serializers.CharField(source='mentor.username', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'username', 'email', 'course', 'batch', 'student_batch', 'mentor', 'mentor_name',
            'phone', 'date_of_birth', 'full_name', 'age', 'gender',
            'fathers_name', 'fathers_contact', 'mothers_name', 'mothers_contact',
            'address', 'educational_qualification', 'college_school',
            'parent_name', 'parent_phone', 'emergency_contact'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Remove the write-only fields from output
        ret.pop('username', None)
        ret.pop('email', None)
        # Add user fields as read-only
        ret['username'] = instance.user.username
        ret['email'] = instance.user.email
        if instance.student_batch:
            ret['batch'] = instance.student_batch.name
        return ret

    def validate_phone(self, value):
        if value:
            if not value.isdigit():
                raise serializers.ValidationError("Phone number must contain only digits.")
            if len(value) != 10:
                raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return value

    def create(self, validated_data):
        # Extract flat username/email
        username = validated_data.pop('username', None)
        email = validated_data.pop('email', None)
        if not username or not email:
            raise serializers.ValidationError({"detail": "Username and email are required for new students."})

        random_password = generate_random_password()
        try:
            user = User.objects.create_user(username=username, email=email, password=random_password)
        except IntegrityError:
            raise serializers.ValidationError({"username": "A user with this username already exists."})
        user.is_student = True
        user.password_changed_at = timezone.now()
        user.save()

        request = self.context.get('request')
        if request and request.user.is_mentor:
            try:
                mentor = Mentor.objects.get(user=request.user)
                validated_data['mentor'] = mentor
                validated_data['student_batch'] = mentor.batch
            except Mentor.DoesNotExist:
                pass

        student = Student.objects.create(user=user, **validated_data)

        if student.batch and not student.student_batch:
            try:
                batch_obj = Batch.objects.get(name=student.batch)
                student.student_batch = batch_obj
                student.save(update_fields=['student_batch'])
            except Batch.DoesNotExist:
                pass

        # Send welcome email
        expiry_days = settings.PASSWORD_EXPIRY_DAYS
        domain = getattr(settings, 'SITE_DOMAIN', 'YOUR_DOMAIN.com')
        context = {'username': username, 'password': random_password, 'expiry_days': expiry_days, 'domain': domain}
        html_message = render_to_string('mail.html', context)
        plain_message = strip_tags(html_message)
        subject = '🎓 Welcome to ZIAS – Your Account Credentials'
        send_mail(subject, plain_message, settings.DEFAULT_FROM_EMAIL, [email], html_message=html_message, fail_silently=False)

        return student

    def update(self, instance, validated_data):
        # Update student fields
        instance.course = validated_data.get('course', instance.course)
        instance.batch = validated_data.get('batch', instance.batch)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.age = validated_data.get('age', instance.age)
        instance.gender = validated_data.get('gender', instance.gender)
        instance.fathers_name = validated_data.get('fathers_name', instance.fathers_name)
        instance.fathers_contact = validated_data.get('fathers_contact', instance.fathers_contact)
        instance.mothers_name = validated_data.get('mothers_name', instance.mothers_name)
        instance.mothers_contact = validated_data.get('mothers_contact', instance.mothers_contact)
        instance.address = validated_data.get('address', instance.address)
        instance.educational_qualification = validated_data.get('educational_qualification', instance.educational_qualification)
        instance.college_school = validated_data.get('college_school', instance.college_school)
        instance.parent_name = validated_data.get('parent_name', instance.parent_name)
        instance.parent_phone = validated_data.get('parent_phone', instance.parent_phone)
        instance.emergency_contact = validated_data.get('emergency_contact', instance.emergency_contact)
        instance.mentor = validated_data.get('mentor', instance.mentor)
        instance.save()

        # Update user if username/email provided
        username = validated_data.get('username')
        email = validated_data.get('email')
        if username or email:
            if username and username.lower() != instance.user.username.lower():
                instance.user.username = username
            if email and email.lower() != instance.user.email.lower():
                instance.user.email = email
            instance.user.save()
        return instance

# ----------------------------
# MENTOR SERIALIZER (explicit update)
# ----------------------------
class MentorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
    class Meta:
        model = Mentor
        fields = ['id', 'username', 'email', 'phone', 'expertise', 'batch']
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        username = user_data['username']
        email = user_data['email']
        random_password = generate_random_password()
        try:
            user = User.objects.get(username=username)
            if user.email != email:
                user.email = email
            if not user.is_mentor:
                user.is_mentor = True
            if not user.password_changed_at:
                user.password_changed_at = timezone.now()
            user.save()
        except User.DoesNotExist:
            user = User.objects.create_user(username=username, email=email, password=random_password)
            user.is_mentor = True
            user.password_changed_at = timezone.now()
            user.save()

        if Mentor.objects.filter(user=user).exists():
            raise serializers.ValidationError({"username": "This user already has a mentor profile."})
        
        # ---------- Send email ----------
        expiry_days = settings.PASSWORD_EXPIRY_DAYS
        domain = getattr(settings, 'SITE_DOMAIN', 'localhost:5173')
        context = {
            'username': username,
            'password': random_password,
            'expiry_days': expiry_days,
            'domain': domain
        }
        try:
            html_message = render_to_string('mail.html', context)
            plain_message = strip_tags(html_message)
            subject = '🎓 Welcome to ZIAS – Your Mentor Account Credentials'
            send_mail(subject, plain_message, settings.DEFAULT_FROM_EMAIL, [email], html_message=html_message, fail_silently=False)
        except Exception as e:
            print(f"Email sending failed: {e}")

        return Mentor.objects.create(user=user, **validated_data)
    def update(self, instance, validated_data):
        # Explicitly update all mentor fields
        instance.phone = validated_data.get('phone', instance.phone)
        instance.expertise = validated_data.get('expertise', instance.expertise)
        instance.batch = validated_data.get('batch', instance.batch)
        instance.save()
        user_data = validated_data.pop('user', None)
        if user_data:
            new_username = user_data.get('username', instance.user.username)
            new_email = user_data.get('email', instance.user.email)
            if (new_username.lower() != instance.user.username.lower() or new_email.lower() != instance.user.email.lower()):
                instance.user.username = new_username
                instance.user.email = new_email
                instance.user.save()
        return instance

# ----------------------------
# REVIEWER SERIALIZER (explicit update)
# ----------------------------
class ReviewerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = Reviewer
        fields = ['id', 'username', 'email', 'department', 'qualification', 'experience', 'batch',
                  'available_from', 'available_to', 'available_days']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        username = user_data['username']
        email = user_data['email']
        random_password = generate_random_password()

        try:
            user = User.objects.get(username=username)
            if user.email != email:
                user.email = email
            if not user.is_reviewer:
                user.is_reviewer = True
            if not user.password_changed_at:
                user.password_changed_at = timezone.now()
            user.save()
        except User.DoesNotExist:
            user = User.objects.create_user(username=username, email=email, password=random_password)
            user.is_reviewer = True
            user.password_changed_at = timezone.now()
            user.save()

            # Send welcome email
            expiry_days = settings.PASSWORD_EXPIRY_DAYS
            domain = getattr(settings, 'SITE_DOMAIN', 'localhost:5173')
            context = {
                'username': username,
                'password': random_password,
                'expiry_days': expiry_days,
                'domain': domain
            }
            try:
                html_message = render_to_string('mail.html', context)
                plain_message = strip_tags(html_message)
                subject = '🎓 Welcome to ZIAS – Your Reviewer Account Credentials'
                send_mail(subject, plain_message, settings.DEFAULT_FROM_EMAIL, [email],
                          html_message=html_message, fail_silently=False)
            except Exception as e:
                print(f"Email sending failed for reviewer: {e}")

        if Reviewer.objects.filter(user=user).exists():
            raise serializers.ValidationError({"username": "This user already has a reviewer profile."})

        reviewer = Reviewer.objects.create(user=user, **validated_data)
        return reviewer

    def update(self, instance, validated_data):
        instance.department = validated_data.get('department', instance.department)
        instance.qualification = validated_data.get('qualification', instance.qualification)
        instance.experience = validated_data.get('experience', instance.experience)
        instance.batch = validated_data.get('batch', instance.batch)
        instance.save()

        user_data = validated_data.pop('user', None)
        if user_data:
            new_username = user_data.get('username', instance.user.username)
            new_email = user_data.get('email', instance.user.email)
            if new_username.lower() != instance.user.username.lower() or new_email.lower() != instance.user.email.lower():
                instance.user.username = new_username
                instance.user.email = new_email
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
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    review_status = serializers.ReadOnlyField()

    class Meta:
        model = ReviewFolder
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'student_name']

# ========== CHAT SERIALIZERS ==========
class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'sender', 'sender_name', 'content', 'is_read', 'timestamp', 'read_at']
        read_only_fields = ['sender', 'sender_name', 'timestamp', 'is_read', 'read_at']

class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_user_name = serializers.SerializerMethodField()
    other_user_id = serializers.SerializerMethodField()
    other_user_type = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'room_type', 'last_message', 'unread_count', 
                  'other_user_name', 'other_user_id', 'other_user_type', 'created_at']

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat(),
                'sender_id': msg.sender_id,
            }
        return None

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

    def get_other_user_name(self, obj):
        user = self.context['request'].user
        if user.is_student:
            if obj.mentor:
                return obj.mentor.user.username
            if obj.reviewer:
                return obj.reviewer.user.username
        elif user.is_mentor:
            if obj.student:
                return obj.student.user.username
            if obj.reviewer:
                return obj.reviewer.user.username
        elif user.is_reviewer:
            if obj.student:
                return obj.student.user.username
            if obj.mentor:
                return obj.mentor.user.username
        return "Unknown"

    def get_other_user_id(self, obj):
        user = self.context['request'].user
        if user.is_student:
            if obj.mentor:
                return obj.mentor.id
            if obj.reviewer:
                return obj.reviewer.id
        elif user.is_mentor:
            if obj.student:
                return obj.student.id
            if obj.reviewer:
                return obj.reviewer.id
        elif user.is_reviewer:
            if obj.student:
                return obj.student.id
            if obj.mentor:
                return obj.mentor.id
        return None

    def get_other_user_type(self, obj):
        user = self.context['request'].user
        if user.is_student:
            if obj.mentor:
                return 'mentor'
            if obj.reviewer:
                return 'reviewer'
        elif user.is_mentor:
            if obj.student:
                return 'student'
            if obj.reviewer:
                return 'reviewer'
        elif user.is_reviewer:
            if obj.student:
                return 'student'
            if obj.mentor:
                return 'mentor'
        return ''

class CourseStatusSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = CourseStatus
        fields = ['id', 'student', 'student_name', 'course', 'course_name',
                  'started_at', 'ended_at', 'current_week']
        