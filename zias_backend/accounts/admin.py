from django.contrib import admin, messages
from django.urls import path
from django.utils import timezone
from django.shortcuts import render, redirect

from .models import (
    User, Student, Mentor, Reviewer,
    ContactMessage, CourseStatus,
    ReviewFolder, Accounts
)

from .utils import generate_random_password, send_password_email


# ==============================
# Reset Password Action
# ==============================
def reset_password_and_email(modeladmin, request, queryset):
    for user in queryset:
        new_password = generate_random_password()
        user.set_password(new_password)
        user.password_changed_at = timezone.now()
        user.save()

        # Send email to user
        send_password_email(user.email, new_password, user.role)

    messages.success(request, "Password reset and email sent successfully.")


reset_password_and_email.short_description = "Reset password and email user"


# ==============================
# USER ADMIN (UPDATED)
# ==============================
class UserAdmin(admin.ModelAdmin):

    list_display = [
        'id',
        'username',
        'email',
        'is_staff',
        'is_active',
        'password_changed_at'
    ]

    list_filter = [
        'is_staff',
        'is_active'
    ]

    search_fields = [
        'username',
        'email',
        'role'
    ]

    actions = [reset_password_and_email]

    # Custom admin page URL
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'create-accounts-user/',
                self.admin_site.admin_view(self.create_accounts_user),
                name='create-accounts-user'
            ),
        ]
        return custom_urls + urls

    # Create Accounts User
    def create_accounts_user(self, request):
        if request.method == 'POST':
            username = request.POST.get('username')
            email = request.POST.get('email')
            full_name = request.POST.get('full_name', '')

            if not username or not email:
                messages.error(request, "Username and email are required.")
                return redirect('..')

            if User.objects.filter(username=username).exists():
                messages.error(request, "Username already exists.")
                return redirect('..')

            password = generate_random_password()

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role='accounts',
                first_name=full_name.split()[0] if full_name else '',
                last_name=' '.join(full_name.split()[1:]) if full_name else '',
            )

            Accounts.objects.get_or_create(
                user=user,
                defaults={'full_name': full_name}
            )

            send_password_email(email, password, 'accounts')

            messages.success(
                request,
                f"Accounts user {username} created successfully and password emailed."
            )

            return redirect('..')

        return render(request, 'admin/create_accounts_user.html', {})


admin.site.register(User, UserAdmin)


# ==============================
# STUDENT ADMIN
# ==============================
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'get_username',
        'full_name',
        'get_email',
        'course',
        'student_batch',
        'phone'
    ]

    search_fields = [
        'user__username',
        'full_name',
        'email',
        'course',
        'student_batch__name'
    ]
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_username(self, obj):
        return obj.user.username if obj.user else '-'
    get_username.short_description = 'Username'
    
    def get_email(self, obj):
        return obj.user.email if obj.user else '-'
    get_email.short_description = 'Email'


# ==============================
# MENTOR ADMIN
# ==============================
@admin.register(Mentor)
class MentorAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'get_username',
        'full_name', 
        'get_email', 
        'phone', 
        'expertise',
        'batch'
    ]
    
    search_fields = [
        'user__username', 
        'full_name', 
        'email', 
        'expertise'
    ]
    
    def get_username(self, obj):
        return obj.user.username if obj.user else '-'
    get_username.short_description = 'Username'
    
    def get_email(self, obj):
        return obj.user.email if obj.user else '-'
    get_email.short_description = 'Email'


# ==============================
# REVIEWER ADMIN
# ==============================
@admin.register(Reviewer)
class ReviewerAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'get_username',
        'full_name', 
        'get_email', 
        'department'
    ]
    
    search_fields = [
        'user__username', 
        'full_name', 
        'email', 
        'department'
    ]
    
    def get_username(self, obj):
        return obj.user.username if obj.user else '-'
    get_username.short_description = 'Username'
    
    def get_email(self, obj):
        return obj.user.email if obj.user else '-'
    get_email.short_description = 'Email'


# ==============================
# CONTACT MESSAGES
# ==============================
@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'created_at', 'is_read']
    list_filter = ['is_read', 'created_at']
    search_fields = ['name', 'email', 'subject', 'message']

    actions = ['mark_as_read']

    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)

    mark_as_read.short_description = "Mark selected messages as read"


# ==============================
# COURSE STATUS
# ==============================
@admin.register(CourseStatus)
class CourseStatusAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'course_name', 'started_at', 'ended_at', 'current_week']
    list_filter = ['course_name', 'started_at', 'ended_at']
    search_fields = ['student__user__username', 'course_name']


# ==============================
# REVIEW FOLDER
# ==============================
@admin.register(ReviewFolder)
class ReviewFolderAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'week_folder', 'is_done', 'created_at']
    list_filter = ['is_done', 'created_at']
    search_fields = ['student__full_name', 'student__user__username', 'week_folder']
    raw_id_fields = ['student', 'created_by', 'updated_by']


# ==============================
# ACCOUNTS ADMIN
# ==============================
@admin.register(Accounts)
class AccountsAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'full_name', 'phone', 'department']
    search_fields = ['user__username', 'full_name']