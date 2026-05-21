# accounts/utils.py

import random
import string
from django.core.mail import send_mail
from django.conf import settings

def generate_random_password(length=12):
    """Generate a random password"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(random.choice(characters) for _ in range(length))
    return password

def send_password_email(user_email, password, user_type="student"):
    """Send password to user via email"""
    try:
        subject = f"Welcome to ZIAS - Your {user_type.capitalize()} Account"
        message = f"""
        Hello,

        Your account has been created successfully.

        Login Credentials:
        Email: {user_email}
        Password: {password}

        Please change your password after logging in for security purposes.

        Best regards,
        ZIAS Team
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email to {user_email}: {e}")
        return False