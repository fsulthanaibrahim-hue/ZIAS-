import secrets
import string
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from django.db import IntegrityError
from rest_framework import serializers
from .models import User, Student, Mentor, Reviewer, Course, Module, Day, Task, Batch, StudentModule, ContactMessage, StudentWeekReview

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

        expiry_days = settings.PASSWORD_EXPIRY_DAYS
        subject = '🎓 Welcome to ZIAS – Your Account Credentials'
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fc; margin: 0; padding: 0; }}
                .container {{ max-width: 550px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e0e7ef; }}
                .header {{ background: linear-gradient(135deg, #0f2b3d 0%, #1b4a6e 100%); padding: 30px 20px; text-align: center; color: white; }}
                .header h1 {{ margin: 0; font-size: 28px; letter-spacing: 1px; }}
                .header p {{ margin: 8px 0 0; font-size: 14px; opacity: 0.9; }}
                .content {{ padding: 30px 25px; background: #ffffff; }}
                .greeting {{ font-size: 18px; font-weight: 600; color: #1e4663; margin-bottom: 20px; }}
                .card {{ background: #f8fafc; border-left: 5px solid #2c7da0; padding: 18px 20px; border-radius: 12px; margin: 20px 0; }}
                .credentials {{ background: #eef2f7; padding: 15px; border-radius: 10px; font-family: monospace; font-size: 15px; margin: 10px 0; }}
                .button {{ display: inline-block; background: #2c7da0; color: white; text-decoration: none; padding: 12px 24px; border-radius: 30px; font-weight: 600; margin: 20px 0 10px; }}
                .footer {{ background: #eef2f7; text-align: center; padding: 20px; font-size: 12px; color: #5e7a93; border-top: 1px solid #dce5ec; }}
                .highlight {{ color: #2c7da0; font-weight: bold; }}
                .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 8px; font-size: 13px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>ZIAS Institute</h1><p>Your journey to becoming a hero developer starts here</p></div>
                <div class="content">
                    <div class="greeting">Dear {user_data['username']},</div>
                    <p>Welcome to <span class="highlight">Zaitoon Institute of Applied Skills</span>! Your student account has been created successfully.</p>
                    <div class="card">
                        <strong>🔐 Login Credentials</strong>
                        <div class="credentials">
                            📧 <strong>Username:</strong> {user_data['username']}<br>
                            🔑 <strong>Password:</strong> <span style="background:#e2e8f0; padding:2px 6px; border-radius:6px;">{random_password}</span>
                        </div>
                        <div class="warning">
                            ⚠️ <strong>Password expires in {expiry_days} days!</strong><br>
                            For security reasons, you must change your password within {expiry_days} days of your first login.
                            After that, the password will no longer work.
                        </div>
                        <p style="margin-top:12px; font-size:13px;">👉 Click the button below to access your dashboard:</p>
                        <a href="https://YOUR_DOMAIN.com/login" class="button">Go to Login Page</a>
                        <p style="margin-top:16px; font-size:12px;">(Replace YOUR_DOMAIN with your actual website address)</p>
                    </div>
                    <p><strong>⚠️ Important:</strong> Please log in and change your password immediately.</p>
                    <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
                    <p>Best regards,<br><strong>ZIAS Team</strong></p>
                </div>
                <div class="footer">
                    &copy; 2025 Zaitoon Institute of Applied Skills | Kannur, Payyanur, Aravanchal
                </div>
            </div>
        </body>
        </html>
        """
        plain_message = f"""
Dear {user_data['username']},

Your account has been created successfully.

Login credentials:
Username: {user_data['username']}
Password: {random_password}

IMPORTANT: Your password will expire in {expiry_days} days. Please log in and change your password within {expiry_days} days.

Click the link below to log in:
https://YOUR_DOMAIN.com/login

Best regards,
ZIAS Team
"""
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_data['email']],
            html_message=html_message,
            fail_silently=False,
        )

        student = Student.objects.create(user=user, **validated_data)
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
        fields = ['id', 'username', 'email', 'phone', 'expertise', 'batch']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        username = user_data['username']
        email = user_data['email']

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
            random_password = generate_random_password()
            user = User.objects.create_user(
                username=username,
                email=email,
                password=random_password
            )
            user.is_mentor = True
            user.password_changed_at = timezone.now()
            user.save()

            subject = 'Your ZIAS Account Credentials'
            message = f"""
Dear {username},

Your account has been created successfully.

Login credentials:
Username: {username}
Password: {random_password}

Please change your password after first login (recommended).

Best regards,
ZIAS Team
"""
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)

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
            random_password = generate_random_password()
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