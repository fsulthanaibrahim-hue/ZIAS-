from django.db import IntegrityError
from rest_framework import serializers
from .models import User, Student, Mentor, Reviewer

# ----------------------------
# USER SERIALIZER (required for CurrentUserView)
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
        try:
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password='temporary123'
            )
        except IntegrityError:
            raise serializers.ValidationError(
                {"username": "A user with this username already exists."}
            )
        return Student.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            instance.user.username = user_data.get('username', instance.user.username)
            instance.user.email = user_data.get('email', instance.user.email)
            instance.user.save()
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
        try:
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password='temporary123'
            )
        except IntegrityError:
            raise serializers.ValidationError(
                {"username": "A user with this username already exists."}
            )
        return Mentor.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            instance.user.username = user_data.get('username', instance.user.username)
            instance.user.email = user_data.get('email', instance.user.email)
            instance.user.save()
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
        try:
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password='temporary123'
            )
        except IntegrityError:
            raise serializers.ValidationError(
                {"username": "A user with this username already exists."}
            )
        return Reviewer.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            instance.user.username = user_data.get('username', instance.user.username)
            instance.user.email = user_data.get('email', instance.user.email)
            instance.user.save()
        return super().update(instance, validated_data)