import secrets
import string
from django.core.mail import send_mail
from django.conf import settings

def generate_random_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def send_password_email(user, password):
    subject = 'Your ZIAS Account Password Reset'
    message = f"Dear {user.username},\n\nYour password has been reset.\n\nLogin credentials:\nUsername: {user.username}\nPassword: {password}\n\nPlease change your password after logging in.\n\nBest regards,\nZIAS Team"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)

