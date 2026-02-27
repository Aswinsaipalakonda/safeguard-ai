"""
Management command to seed the database with realistic demo data.
Run: python manage.py seed_demo_data
"""

import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Site, Zone, Worker, Violation, Alert, ComplianceReport


class Command(BaseCommand):
    help = "Seeds the database with realistic demo data for jury demonstrations"

    PPE_TYPES = ['helmet', 'vest', 'gloves', 'goggles', 'boots', 'harness']
    ZONES = [
        ("Excavation Area A", True, ["helmet", "vest", "boots", "harness"]),
        ("Conveyor Belt Section", True, ["helmet", "vest", "gloves"]),
        ("Processing Plant", False, ["helmet", "vest", "goggles"]),
        ("Storage Yard", False, ["helmet", "vest"]),
        ("Underground Shaft B", True, ["helmet", "vest", "boots", "harness", "goggles"]),
        ("Loading Dock", False, ["helmet", "vest", "boots"]),
        ("Control Room", False, ["vest"]),
        ("Blasting Zone C", True, ["helmet", "vest", "goggles", "gloves", "harness"]),
    ]
    WORKERS = [
        ("Rajesh Kumar", "EMP-001", "hi"),
        ("Suresh Reddy", "EMP-002", "te"),
        ("Anand Sharma", "EMP-003", "hi"),
        ("Mohammed Ismail", "EMP-004", "en"),
        ("Priya Nair", "EMP-005", "ta"),
        ("Vikram Singh", "EMP-006", "hi"),
        ("Karthik Bhat", "EMP-007", "kn"),
        ("Deepak Yadav", "EMP-008", "hi"),
        ("Arjun Patil", "EMP-009", "mr"),
        ("Lakshmi Devi", "EMP-010", "te"),
        ("Ravi Teja", "EMP-011", "te"),
        ("Ganesh Kulkarni", "EMP-012", "kn"),
        ("Anil Mehta", "EMP-013", "hi"),
        ("Sanjay Gupta", "EMP-014", "hi"),
        ("Pooja Kumari", "EMP-015", "hi"),
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--violations', type=int, default=150,
            help='Number of violations to generate (default: 150)',
        )
        parser.add_argument(
            '--days', type=int, default=30,
            help='Spread violations over this many days (default: 30)',
        )
        parser.add_argument(
            '--clear', action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        num_violations = options['violations']
        num_days = options['days']
        now = timezone.now()

        if options['clear']:
            self.stdout.write(self.style.WARNING("Clearing existing data..."))
            Alert.objects.all().delete()
            ComplianceReport.objects.all().delete()
            Violation.objects.all().delete()
            Worker.objects.all().delete()
            Zone.objects.all().delete()
            Site.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("  Cleared all data."))

        self.stdout.write(self.style.NOTICE("Seeding demo data..."))

        # ---- Sites ----
        site, _ = Site.objects.get_or_create(
            name="Singareni Coal Mine – Ramagundam",
            defaults={
                "location": "Ramagundam, Telangana, India",
                "timezone": "Asia/Kolkata",
            },
        )
        site2, _ = Site.objects.get_or_create(
            name="Jharia Coal Field – Unit 4",
            defaults={
                "location": "Dhanbad, Jharkhand, India",
                "timezone": "Asia/Kolkata",
            },
        )
        self.stdout.write(f"  Sites: {Site.objects.count()}")

        # ---- Zones ----
        zone_objects = []
        for zone_name, is_high_risk, required_ppe in self.ZONES:
            zone, _ = Zone.objects.get_or_create(
                name=zone_name,
                defaults={
                    "site": random.choice([site, site2]),
                    "required_ppe": required_ppe,
                    "camera_ids": [f"CAM-{random.randint(100,999)}"],
                    "is_high_risk": is_high_risk,
                },
            )
            zone_objects.append(zone)
        self.stdout.write(f"  Zones: {Zone.objects.count()}")

        # ---- Workers ----
        worker_objects = []
        for name, code, lang in self.WORKERS:
            worker, _ = Worker.objects.get_or_create(
                employee_code=code,
                defaults={
                    "name": name,
                    "language_preference": lang,
                    "compliance_rate": round(random.uniform(65, 99), 1),
                    "is_active": True,
                },
            )
            worker_objects.append(worker)
        self.stdout.write(f"  Workers: {Worker.objects.count()}")

        # ---- Violations ----
        violations_created = 0
        for _ in range(num_violations):
            zone = random.choice(zone_objects)
            worker = random.choice(worker_objects)
            ppe_type = random.choice(self.PPE_TYPES)
            created_at = now - timedelta(
                days=random.randint(0, num_days),
                hours=random.randint(6, 18),
                minutes=random.randint(0, 59),
            )
            resolved = random.random() < 0.65  # 65% resolved
            resolved_at = created_at + timedelta(minutes=random.randint(2, 120)) if resolved else None
            v = Violation.objects.create(
                worker=worker,
                ppe_type=ppe_type,
                zone=zone.name,
                camera_id=zone.camera_ids[0] if zone.camera_ids else "CAM-001",
                confidence=round(random.uniform(0.72, 0.99), 2),
                image_path=f"violations/{created_at.strftime('%Y%m%d')}/{ppe_type}_{worker.employee_code}.jpg",
                resolved_at=resolved_at,
            )
            # Force-set created_at (auto_now_add ignores passed value)
            Violation.objects.filter(pk=v.pk).update(created_at=created_at)
            violations_created += 1

            # Create alerts for ~70% of violations
            if random.random() < 0.7:
                level = random.choices([1, 2, 3, 4, 5, 6], weights=[30, 25, 20, 12, 8, 5])[0]
                channels = ['dashboard', 'push', 'wristband', 'call', 'lockout']
                a = Alert.objects.create(
                    violation=v,
                    level=level,
                    channel=channels[min(level - 1, len(channels) - 1)],
                    acknowledged_at=created_at + timedelta(minutes=random.randint(1, 30)) if resolved else None,
                )
                # Force-set sent_at (auto_now_add ignores passed value)
                Alert.objects.filter(pk=a.pk).update(sent_at=created_at)

        self.stdout.write(f"  Violations: {violations_created}")
        self.stdout.write(f"  Alerts: {Alert.objects.count()}")

        # ---- Compliance Reports ----
        for i in range(7):
            report_date = (now - timedelta(days=i * 7)).date()
            ComplianceReport.objects.get_or_create(
                site=random.choice([site, site2]),
                period_start=report_date - timedelta(days=6),
                period_end=report_date,
                defaults={
                    "report_path": f"reports/weekly_{report_date}.pdf",
                },
            )
        self.stdout.write(f"  Reports: {ComplianceReport.objects.count()}")

        self.stdout.write(self.style.SUCCESS(
            f"\nDemo data seeded successfully! "
            f"{violations_created} violations across {num_days} days."
        ))
