import secrets
import string
from django.core.mail import send_mail
from django.conf import settings
from django.db import IntegrityError
from rest_framework import serializers
from .models import User, Student, Mentor, Reviewer

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
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def update(self, instance, validated_data):
        validated_data.pop('password', None)
        return super().update(instance, validated_data)

# ----------------------------
# STUDENT SERIALIZER
# ----------------------------
class StudentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = Student
        fields = ['id', 'username', 'email', 'course', 'batch', 'phone']

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
            raise serializers.ValidationError(
                {"username": "A user with this username already exists."}
            )

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

        return Student.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            new_username = user_data.get('username', instance.user.username)
            new_email = user_data.get('email', instance.user.email)

            # Compare ignoring case to avoid unnecessary saves
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
# MENTOR SERIALIZER (same pattern)
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
            raise serializers.ValidationError(
                {"username": "A user with this username already exists."}
            )

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
# REVIEWER SERIALIZER (same pattern)
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
            raise serializers.ValidationError(
                {"username": "A user with this username already exists."}
            )

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