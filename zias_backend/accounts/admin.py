from django.contrib import admin
from django.contrib import messages
from django.utils import timezone
from .models import User, Student, Mentor, Reviewer
from .utils import generate_random_password, send_password_email  # we'll create utils.py

# Admin action to reset password and email the user
def reset_password_and_email(modeladmin, request, queryset):
    for user in queryset:
        new_password = generate_random_password()
        user.set_password(new_password)
        user.password_changed_at = timezone.now()
        user.save()
        send_password_email(user, new_password)
        messages.success(request, f"Password reset for {user.username} and email sent.")
reset_password_and_email.short_description = "Reset password and email user"

class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'email', 'is_admin', 'is_student', 'is_mentor', 'is_reviewer', 'password_changed_at']
    list_filter = ['is_admin', 'is_student', 'is_mentor', 'is_reviewer']
    search_fields = ['username', 'email']
    actions = [reset_password_and_email]

admin.site.register(User, UserAdmin)

# Optional: Register Student, Mentor, Reviewer with simple displays
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'course', 'batch', 'phone']
    search_fields = ['user__username', 'course', 'batch']

@admin.register(Mentor)
class MentorAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'phone', 'expertise']
    search_fields = ['user__username', 'expertise']

@admin.register(Reviewer)
class ReviewerAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'department']
    search_fields = ['user__username', 'department']