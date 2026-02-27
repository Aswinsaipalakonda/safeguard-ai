import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create default roles and users for SafeGuard AI Jury testing'

    def handle(self, *args, **kwargs):
        # We define the default users we want
        default_users = [
            {'email': 'admin@safeguard.com', 'username': 'admin@safeguard.com', 'password': 'admin123', 'role': 'ADMIN'},
            {'email': 'supervisor@safeguard.com', 'username': 'supervisor@safeguard.com', 'password': 'admin123', 'role': 'SUPERVISOR'},
            {'email': 'worker@safeguard.com', 'username': 'worker@safeguard.com', 'password': 'admin123', 'role': 'WORKER'},
        ]

        for user_data in default_users:
            if not User.objects.filter(username=user_data['username']).exists() and not User.objects.filter(email=user_data['email']).exists():
                User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=user_data['password'],
                    role=user_data['role']
                )
                self.stdout.write(self.style.SUCCESS(f"Successfully created user: {user_data['email']} with role {user_data['role']}"))
            else:
                self.stdout.write(self.style.WARNING(f"User {user_data['email']} already exists. Skipping."))
