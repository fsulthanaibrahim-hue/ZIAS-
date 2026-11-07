from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = "Create or update the ZIAS admin user"

    def handle(self, *args, **kwargs):

        username = "Admin"
        email = "admin@zias.com"
        password = "Admin@12345"

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            }
        )

        if not created:
            user.email = email
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True

        user.set_password(password)
        user.save()

        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    "Admin user created successfully!"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    "Admin user updated successfully!"
                )
            )

        self.stdout.write(f"Username: {username}")
        self.stdout.write(f"Password: {password}")
        self.stdout.write(f"Email: {email}")