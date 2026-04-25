# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Student, Module, StudentWeekReview, Notification, ChatRoom, Mentor, Reviewer

# Optional: import channels only if available (avoid ImportError)
try:
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    channels_available = True
except ImportError:
    channels_available = False

# -------------------------------------------------------------------
# Signal 1: Auto‑create StudentWeekReview entries when a Student is created
# -------------------------------------------------------------------
@receiver(post_save, sender=Student)
def create_student_week_reviews(sender, instance, created, **kwargs):
    """
    When a new Student is created, automatically create StudentWeekReview
    entries for all modules (or only those matching the student's course).
    """
    if created:
        if instance.course:
            modules = Module.objects.filter(course__name=instance.course)
        else:
            modules = Module.objects.all()
        
        for module in modules:
            StudentWeekReview.objects.get_or_create(student=instance, module=module)


# -------------------------------------------------------------------
# Signal 2: Send real‑time WebSocket notification when a Notification is created
# -------------------------------------------------------------------
@receiver(post_save, sender=Notification)
def send_notification_via_channels(sender, instance, created, **kwargs):
    """Send real‑time update to the user's WebSocket group."""
    if created and channels_available:
        channel_layer = get_channel_layer()
        group_name = f'notifications_{instance.user.id}'
        
        # Get updated unread count for this user
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


# -------------------------------------------------------------------
# Signal 3: Auto‑create chat rooms when a Student is saved
# -------------------------------------------------------------------
@receiver(post_save, sender=Student)
def create_chat_rooms(sender, instance, created, **kwargs):
    """
    Automatically create a student‑mentor chat room when a student has a mentor.
    For student‑reviewer rooms, we create one based on the reviewer's batch
    (since Student does not have a direct reviewer FK).
    """
    # Student-Mentor room
    if instance.mentor:
        ChatRoom.objects.get_or_create(
            student=instance,
            mentor=instance.mentor,
            defaults={'room_type': 'student_mentor'}
        )
    
# Add this inside accounts/signals.py, after the existing create_chat_rooms function

@receiver(post_save, sender=Student)
def create_mentor_reviewer_chat_room(sender, instance, **kwargs):
    """
    When a student has both a mentor and a reviewer (via batch), create a direct
    chat room between that mentor and reviewer.
    """
    if instance.mentor and instance.student_batch:
        reviewers = Reviewer.objects.filter(batch=instance.student_batch)
        for reviewer in reviewers:
            ChatRoom.objects.get_or_create(
                mentor=instance.mentor,
                reviewer=reviewer,
                defaults={'room_type': 'mentor_reviewer'}
            )
