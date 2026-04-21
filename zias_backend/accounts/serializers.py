import secrets
import string
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from django.db import IntegrityError
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import serializers
from .models import User, Student, Mentor, Reviewer, Course, Module, Day, Task, Batch, StudentModule, ContactMessage, StudentWeekReview, WeekUpdate

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
# STUDENT SERIALIZER
# ----------------------------
class StudentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
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
        user_data = validated_data.pop('user')
        random_password = generate_random_password()
        try:
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=random_password
            )
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

        # Send email using mail.html template
        expiry_days = settings.PASSWORD_EXPIRY_DAYS
        domain = getattr(settings, 'SITE_DOMAIN', 'YOUR_DOMAIN.com')
        context = {
            'username': user_data['username'],
            'password': random_password,
            'expiry_days': expiry_days,
            'domain': domain,
        }
        html_message = render_to_string('mail.html', context)
        plain_message = strip_tags(html_message)
        subject = '🎓 Welcome to ZIAS – Your Account Credentials'
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_data['email']],
            html_message=html_message,
            fail_silently=False,
        )
        return student

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            new_username = user_data.get('username', instance.user.username)
            new_email = user_data.get('email', instance.user.email)

            if (new_username.lower() != instance.user.username.lower() or 
                new_email.lower() != instance.user.email.lower()):
                try:
                    instance.user.username = new_username
                    instance.user.email = new_email
                    instance.user.save()
                except IntegrityError as e:
                    if 'username' in str(e):
                        raise serializers.ValidationError({"username": "A user with this username already exists."})
                    elif 'email' in str(e):
                        raise serializers.ValidationError({"email": "A user with this email already exists."})
                    else:
                        raise
        if 'batch' in validated_data and validated_data['batch'] != instance.batch:
            new_batch_name = validated_data['batch']
            if new_batch_name:
                try:
                    batch_obj = Batch.objects.get(name=new_batch_name)
                    instance.student_batch = batch_obj
                    instance.save(update_fields=['student_batch'])
                except Batch.DoesNotExist:
                    instance.student_batch = None
                    instance.save(update_fields=['student_batch'])
        return super().update(instance, validated_data)

# ----------------------------
# MENTOR SERIALIZER
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
            try:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=random_password
                )
                user.is_mentor = True
                user.password_changed_at = timezone.now()
                user.save()
                # Send simple email for mentor (no HTML needed)
                subject = 'Your ZIAS Account Credentials'
                message = f"""
Dear {username},

Your account has been created successfully.

Login credentials:
Username: {username}
Password: {random_password}

Please change your password after first login.

Best regards,
ZIAS Team
"""
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
            except IntegrityError:
                user = User.objects.get(username=username)
                if not user.is_mentor:
                    user.is_mentor = True
                    user.save()

        if Mentor.objects.filter(user=user).exists():
            raise serializers.ValidationError({"username": "This user already has a mentor profile."})

        return Mentor.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            new_username = user_data.get('username', instance.user.username)
            new_email = user_data.get('email', instance.user.email)
            if (new_username.lower() != instance.user.username.lower() or 
                new_email.lower() != instance.user.email.lower()):
                try:
                    instance.user.username = new_username
                    instance.user.email = new_email
                    instance.user.save()
                except IntegrityError as e:
                    if 'username' in str(e):
                        raise serializers.ValidationError({"username": "A user with this username already exists."})
                    elif 'email' in str(e):
                        raise serializers.ValidationError({"email": "A user with this email already exists."})
                    else:
                        raise
        return super().update(instance, validated_data)

# ----------------------------
# REVIEWER SERIALIZER
# ----------------------------
class ReviewerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = Reviewer
        fields = ['id', 'username', 'email', 'department', 'batch']

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
            try:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=random_password
                )
                user.is_reviewer = True
                user.password_changed_at = timezone.now()
                user.save()
                subject = 'Your ZIAS Account Credentials'
                message = f"""
Dear {username},

Your account has been created successfully.

Login credentials:
Username: {username}
Password: {random_password}

Please change your password within {settings.PASSWORD_EXPIRY_DAYS} days.

Best regards,
ZIAS Team
"""
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
            except IntegrityError:
                user = User.objects.get(username=username)
                if not user.is_reviewer:
                    user.is_reviewer = True
                    user.save()

        if Reviewer.objects.filter(user=user).exists():
            raise serializers.ValidationError({"username": "This user already has a reviewer profile."})

        return Reviewer.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            new_username = user_data.get('username', instance.user.username)
            new_email = user_data.get('email', instance.user.email)
            if (new_username.lower() != instance.user.username.lower() or 
                new_email.lower() != instance.user.email.lower()):
                try:
                    instance.user.username = new_username
                    instance.user.email = new_email
                    instance.user.save()
                except IntegrityError as e:
                    if 'username' in str(e):
                        raise serializers.ValidationError({"username": "A user with this username already exists."})
                    elif 'email' in str(e):
                        raise serializers.ValidationError({"email": "A user with this email already exists."})
                    else:
                        raise
        return super().update(instance, validated_data)

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