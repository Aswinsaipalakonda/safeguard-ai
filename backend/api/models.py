from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class RoleChoice(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        SUPERVISOR = 'SUPERVISOR', 'Supervisor'
        WORKER = 'WORKER', 'Worker'

    role = models.CharField(max_length=50, choices=RoleChoice.choices, default=RoleChoice.WORKER)

class Site(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    timezone = models.CharField(max_length=50)
    pa_system_ip = models.GenericIPAddressField(null=True, blank=True)
    pa_system_port = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name

class Zone(models.Model):
    name = models.CharField(max_length=255)
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='zones', null=True)
    required_ppe = models.JSONField(default=list)  # e.g. ["helmet", "vest"]
    camera_ids = models.JSONField(default=list)
    is_high_risk = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Worker(models.Model):
    name = models.CharField(max_length=255)
    employee_code = models.CharField(max_length=100, unique=True)
    language_preference = models.CharField(max_length=50, default='hi')
    face_embedding = models.JSONField(null=True, blank=True)
    compliance_rate = models.FloatField(default=0.0)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Violation(models.Model):
    class PPEType(models.TextChoices):
        HELMET = 'helmet', 'Helmet'
        VEST = 'vest', 'Vest'
        GLOVES = 'gloves', 'Gloves'
        GOGGLES = 'goggles', 'Goggles'
        BOOTS = 'boots', 'Boots'
        HARNESS = 'harness', 'Harness'

    worker = models.ForeignKey(Worker, on_delete=models.SET_NULL, null=True, blank=True, related_name='violations')
    ppe_type = models.CharField(max_length=50, choices=PPEType.choices)
    zone = models.CharField(max_length=255)
    camera_id = models.CharField(max_length=100)
    confidence = models.FloatField()
    image_path = models.CharField(max_length=500)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ppe_type} Violation in {self.zone}"

class Alert(models.Model):
    class ChannelChoice(models.TextChoices):
        DASHBOARD = 'dashboard', 'Dashboard'
        PUSH = 'push', 'Push Notification'
        WRISTBAND = 'wristband', 'Wristband'
        CALL = 'call', 'Auto Call'
        LOCKOUT = 'lockout', 'Access Lockout'

    violation = models.ForeignKey(Violation, on_delete=models.CASCADE, related_name='alerts')
    level = models.IntegerField()  # 1 to 6
    channel = models.CharField(max_length=50, choices=ChannelChoice.choices)
    sent_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Level {self.level} Alert for Violation {self.violation.id}"

class ComplianceReport(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='reports')
    period_start = models.DateField()
    period_end = models.DateField()
    report_path = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report for {self.site.name} ({self.period_start} to {self.period_end})"
