# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Student, Module, StudentWeekReview, Notification

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
    if created:
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