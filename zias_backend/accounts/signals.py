# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Student, Module, StudentWeekReview, Notification, ChatRoom, Mentor, Reviewer, Course, CourseStatus

# -------------------------------------------------------------------
# Signal 1: Auto‑create StudentWeekReview entries when a Student is created
# -------------------------------------------------------------------
@receiver(post_save, sender=Student)
def create_student_week_reviews(sender, instance, created, **kwargs):
    if created:
        if instance.course:
            try:
                course_obj = Course.objects.get(name=instance.course)
                modules = Module.objects.filter(course=course_obj)
            except Course.DoesNotExist:
                modules = Module.objects.all()
        else:
            modules = Module.objects.all()
        
        for module in modules:
            StudentWeekReview.objects.get_or_create(student=instance, module=module)


# -------------------------------------------------------------------
# Signal 2: Send real‑time WebSocket notification (unchanged)
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
        channel_layer = get_channel_layer()
        group_name = f'notifications_{instance.user.id}'
        unread_count = Notification.objects.filter(user=instance.user, is_read=False).count()
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
    # Student-Mentor room
    if instance.mentor:
        ChatRoom.objects.get_or_create(
            student=instance,
            mentor=instance.mentor,
            defaults={'room_type': 'student_mentor'}
        )
    
    # Student-Reviewer room (using batch relationship)
    if instance.student_batch:
        reviewers = Reviewer.objects.filter(batch=instance.student_batch)
        for reviewer in reviewers:
            ChatRoom.objects.get_or_create(
                student=instance,
                reviewer=reviewer,
                defaults={'room_type': 'student_reviewer'}
            )


# -------------------------------------------------------------------
# Signal 4: Auto‑create CourseStatus when a Student is saved
# -------------------------------------------------------------------
@receiver(post_save, sender=Student)
def create_course_status(sender, instance, created, **kwargs):
    # Only create if the student has a course name
    if instance.course:
        try:
            # Get the Course object by name (case‑insensitive)
            course_obj = Course.objects.get(name__iexact=instance.course)
        except Course.DoesNotExist:
            # If the course does not exist in the Course table, create it
            # (or skip – depending on your business logic)
            course_obj = Course.objects.create(name=instance.course)
        CourseStatus.objects.get_or_create(
            student=instance,
            course=course_obj,
            defaults={'current_week': 1}
        )


# -------------------------------------------------------------------
# Signal 5: Auto‑create mentor‑reviewer chat room
# -------------------------------------------------------------------
@receiver(post_save, sender=Student)
def create_mentor_reviewer_chat_room(sender, instance, **kwargs):
    if instance.mentor and instance.student_batch:
        reviewers = Reviewer.objects.filter(batch=instance.student_batch)
        for reviewer in reviewers:
            ChatRoom.objects.get_or_create(
                mentor=instance.mentor,
                reviewer=reviewer,
                defaults={'room_type': 'mentor_reviewer'}
            )