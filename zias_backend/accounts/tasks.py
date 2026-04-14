# students/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

@shared_task
def send_student_welcome_email(user_email, username, random_password):
    subject = '🎓 Welcome to ZIAS – Your Account Credentials'
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            /* same styles as before – include all CSS */
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fc; margin: 0; padding: 0; }}
            .container {{ max-width: 550px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e0e7ef; }}
            .header {{ background: linear-gradient(135deg, #0f2b3d 0%, #1b4a6e 100%); padding: 30px 20px; text-align: center; color: white; }}
            .header h1 {{ margin: 0; font-size: 28px; letter-spacing: 1px; }}
            .header p {{ margin: 8px 0 0; font-size: 14px; opacity: 0.9; }}
            .content {{ padding: 30px 25px; background: #ffffff; }}
            .greeting {{ font-size: 18px; font-weight: 600; color: #1e4663; margin-bottom: 20px; }}
            .card {{ background: #f8fafc; border-left: 5px solid #2c7da0; padding: 18px 20px; border-radius: 12px; margin: 20px 0; }}
            .credentials {{ background: #eef2f7; padding: 15px; border-radius: 10px; font-family: monospace; font-size: 15px; margin: 10px 0; }}
            .button {{ display: inline-block; background: #2c7da0; color: white; text-decoration: none; padding: 12px 24px; border-radius: 30px; font-weight: 600; margin: 20px 0 10px; }}
            .footer {{ background: #eef2f7; text-align: center; padding: 20px; font-size: 12px; color: #5e7a93; border-top: 1px solid #dce5ec; }}
            .highlight {{ color: #2c7da0; font-weight: bold; }}
            .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 8px; font-size: 13px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>ZIAS Institute</h1><p>Your journey to becoming a hero developer starts here</p></div>
            <div class="content">
                <div class="greeting">Dear {username},</div>
                <p>Welcome to <span class="highlight">Zaitoon Institute of Applied Skills</span>! Your student account has been created successfully.</p>
                <div class="card">
                    <strong>🔐 Login Credentials</strong>
                    <div class="credentials">
                        📧 <strong>Username:</strong> {username}<br>
                        🔑 <strong>Password:</strong> <span style="background:#e2e8f0; padding:2px 6px; border-radius:6px;">{random_password}</span>
                    </div>
                    <div class="warning">
                        ⚠️ <strong>Password expires in 3 days!</strong><br>
                        For security reasons, you must change your password within 3 days of your first login.
                        After that, the password will no longer work.
                    </div>
                    <p style="margin-top:12px; font-size:13px;">👉 Click the button below to access your dashboard:</p>
                    <a href="https://YOUR_DOMAIN.com/login" class="button">Go to Login Page</a>
                    <p style="margin-top:16px; font-size:12px;">(Replace YOUR_DOMAIN with your actual website address)</p>
                </div>
                <p><strong>⚠️ Important:</strong> Please log in and change your password immediately.</p>
                <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
                <p>Best regards,<br><strong>ZIAS Team</strong></p>
            </div>
            <div class="footer">
                &copy; 2025 Zaitoon Institute of Applied Skills | Kannur, Payyanur, Aravanchal
            </div>
        </div>
    </body>
    </html>
    """
    plain_message = f"""
Dear {username},

Your account has been created successfully.

Login credentials:
Username: {username}
Password: {random_password}

IMPORTANT: Your password will expire in 3 days. Please log in and change your password within 3 days.

Click the link below to log in:
https://YOUR_DOMAIN.com/login

Best regards,
ZIAS Team
"""
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user_email],
        html_message=html_message,
        fail_silently=False,
    )