# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Student, Module, StudentWeekReview

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