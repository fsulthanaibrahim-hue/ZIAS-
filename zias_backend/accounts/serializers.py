import secrets
import string
from django.core.mail import send_mail
from django.conf import settings
from django.db import IntegrityError
from rest_framework import serializers
from .models import User, Student, Mentor, Reviewer, Course, Enrollment, Module, Day, Task, Batch, StudentModule, ContactMessage

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
    student_count = serializers.IntegerField(source='enrollments.count', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'duration', 'created_at', 'student_count']

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
        fields = ['id', 'course', 'course_name', 'title', 'order', 'content', 'is_common']

# ----------------------------
# ENROLLMENT SERIALIZER
# ----------------------------
class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'course', 'student_name', 'course_name', 'enrolled_at', 'status']

# ----------------------------
# STUDENT SERIALIZER
# ----------------------------
class StudentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
    courses = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ['id', 'username', 'email', 'course', 'batch', 'phone', 'date_of_birth', 'courses']

    def get_courses(self, obj):
        return [{'id': e.course.id, 'name': e.course.name} for e in obj.enrollments.all()]

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
        user.save()

        subject = 'Your ZIAS Account Credentials'
        message = f"""
Dear {user_data['username']},

Your account has been created successfully.

Login credentials:
Username: {user_data['username']}
Password: {random_password}

Please change your password after first login (recommended).

Best regards,
ZIAS Team
"""
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user_data['email']], fail_silently=False)

        student = Student.objects.create(user=user, **validated_data)

        course_name = validated_data.get('course')
        if course_name:
            course, created = Course.objects.get_or_create(name=course_name)
            Enrollment.objects.get_or_create(student=student, course=course)

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
        return super().update(instance, validated_data)

# ----------------------------
# MENTOR SERIALIZER
# ----------------------------
class MentorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = Mentor
        fields = ['id', 'username', 'email', 'phone', 'expertise']

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

        user.is_mentor = True
        user.save()

        subject = 'Your ZIAS Account Credentials'
        message = f"""
Dear {user_data['username']},

Your account has been created successfully.

Login credentials:
Username: {user_data['username']}
Password: {random_password}

Please change your password after first login (recommended).

Best regards,
ZIAS Team
"""
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user_data['email']], fail_silently=False)

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
        fields = ['id', 'username', 'email', 'department']

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

        user.is_reviewer = True
        user.save()

        subject = 'Your ZIAS Account Credentials'
        message = f"""
Dear {user_data['username']},

Your account has been created successfully.

Login credentials:
Username: {user_data['username']}
Password: {random_password}

Please change your password after first login (recommended).

Best regards,
ZIAS Team
"""
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user_data['email']], fail_silently=False)

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
# CONTACT MESSAGE SERIALIZER
# ----------------------------
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'

# ----------------------------
# STUDENT MODULE SERIALIZER
# ----------------------------
class StudentModuleSerializer(serializers.ModelSerializer):
    module_title = serializers.CharField(source='module.title', read_only=True)
    module_content = serializers.CharField(source='module.content', read_only=True)
    
    class Meta:
        model = StudentModule
        fields = ['id', 'student', 'module', 'module_title', 'module_content', 'order', 'is_completed', 'completed_at']