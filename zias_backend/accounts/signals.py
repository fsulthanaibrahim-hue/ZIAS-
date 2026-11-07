
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import (
    Student,
    Module,
    StudentWeekReview,
    Notification,
    ChatRoom,
    Mentor,
    Reviewer,
    Course,
    CourseStatus,
    ContactMessage,
)

User = get_user_model()


# -------------------------------------------------------------------
# Signal 1: Auto-create StudentWeekReview entries when a Student is created
# DISABLED - Student model has no 'course' field
# -------------------------------------------------------------------

# @receiver(post_save, sender=Student)
# def create_student_week_reviews(sender, instance, created, **kwargs):
#     if created:
#         if instance.course:
#             ...


# -------------------------------------------------------------------
# Signal 2: Send real-time WebSocket notification
# -------------------------------------------------------------------

try:
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    channels_available = True

except ImportError:
    channels_available = False


@receiver(post_save, sender=Notification)
def send_notification_via_channels(sender, instance, created, **kwargs):

    if created and channels_available:

        print(f"Sending WebSocket notification to user {instance.user.id}")

        try:
            channel_layer = get_channel_layer()

            group_name = f'notifications_{instance.user.id}'

            unread_count = Notification.objects.filter(
                user=instance.user,
                is_read=False
            ).count()

            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'send_notification',
                    'message': instance.message,
                    'unread_count': unread_count
                }
            )

        except Exception as e:
            print(f"WebSocket notification error: {e}")


# -------------------------------------------------------------------
# Signal 3: Auto-create student-mentor and student-reviewer chat rooms
# -------------------------------------------------------------------

@receiver(post_save, sender=Student)
def create_chat_rooms(sender, instance, created, **kwargs):

    if not instance.student_batch:
        return

    # Get all mentors assigned to the student's batch
    mentors = Mentor.objects.filter(
        batch=instance.student_batch
    )

    # Create student-mentor chat rooms
    for mentor in mentors:

        ChatRoom.objects.get_or_create(
            student=instance,
            mentor=mentor,
            defaults={
                'room_type': 'student_mentor'
            }
        )

    # Get all reviewers assigned to the student's batch
    reviewers = Reviewer.objects.filter(
        batch=instance.student_batch
    )

    # Create student-reviewer chat rooms
    for reviewer in reviewers:

        ChatRoom.objects.get_or_create(
            student=instance,
            reviewer=reviewer,
            defaults={
                'room_type': 'student_reviewer'
            }
        )


# -------------------------------------------------------------------
# Signal 4: Auto-create CourseStatus when a Student is saved
# DISABLED - Student model has no 'course' field
# -------------------------------------------------------------------

# @receiver(post_save, sender=Student)
# def create_course_status(sender, instance, created, **kwargs):
#     if instance.course:
#         ...


# -------------------------------------------------------------------
# Signal 5: Auto-create mentor-reviewer chat rooms
# -------------------------------------------------------------------

@receiver(post_save, sender=Student)
def create_mentor_reviewer_chat_room(sender, instance, created, **kwargs):

    if not instance.student_batch:
        return

    # Get mentors assigned to the student's batch
    mentors = Mentor.objects.filter(
        batch=instance.student_batch
    )

    # Get reviewers assigned to the student's batch
    reviewers = Reviewer.objects.filter(
        batch=instance.student_batch
    )

    # Create mentor-reviewer chat rooms
    for mentor in mentors:

        for reviewer in reviewers:

            ChatRoom.objects.get_or_create(
                mentor=mentor,
                reviewer=reviewer,
                defaults={
                    'room_type': 'mentor_reviewer'
                }
            )


# -------------------------------------------------------------------
# Signal 6: Create notifications when a contact message is received
# -------------------------------------------------------------------

@receiver(post_save, sender=ContactMessage)
def create_notification_on_contact(sender, instance, created, **kwargs):

    if created:

        try:
            admins = User.objects.filter(is_staff=True)

            name_or_email = instance.name or instance.email

            message_preview = (
                instance.message[:60]
                if instance.message
                else ""
            )

            for admin in admins:

                Notification.objects.create(
                    user=admin,
                    message=f"Contact from {name_or_email}: {message_preview}...",
                    link=f"/admin/contact-messages/{instance.id}/"
                )

        except Exception as e:
            print(f"Contact notification error: {e}")




