import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import User, Site, Zone, Worker, Violation, Alert, ComplianceReport, Attendance

def seed():
    print("Seeding database with demo data...")

    # Clear old demo data or all data to start fresh (optional, but requested to 'add some users', etc... let's just make sure there are enough)
    print("Creating sites & zones...")
    site, _ = Site.objects.get_or_create(name="Alpha Mining Factory", defaults={
        "location": "Sector 4, Industrial Area",
        "timezone": "Asia/Kolkata",
    })

    zones = [
        {"name": "Excavation Pit A", "risk": True, "ppe": ["helmet", "vest", "boots", "goggles", "gloves", "harness"]},
        {"name": "Conveyor Belt B", "risk": True, "ppe": ["helmet", "vest", "boots", "gloves"]},
        {"name": "Material Processing", "risk": False, "ppe": ["helmet", "vest", "boots", "goggles"]},
        {"name": "Loading Dock", "risk": False, "ppe": ["helmet", "vest", "boots"]},
        {"name": "Control Room", "risk": False, "ppe": []},
        {"name": "Underground Shaft", "risk": True, "ppe": ["helmet", "vest", "boots", "goggles", "gloves", "harness"]},
    ]

    for z_data in zones:
        Zone.objects.get_or_create(
            name=z_data["name"],
            site=site,
            defaults={
                "is_high_risk": z_data["risk"],
                "required_ppe": z_data["ppe"],
                "camera_ids": [f"CAM-{random.randint(100, 999)}", f"CAM-{random.randint(100, 999)}"],
            }
        )

    print("Creating workers...")
    names = [
        "Amit Singh", "Priya Nair", "Sanjay Kumar", "Ravi Verma", "Deepak Yadav",
        "Sneha Patel", "Arjun Reddy", "Neha Gupta", "Vikram Patil", "Anjali Joshi",
        "Rahul Desai", "Kavita Sharma", "Rohit Malhotra", "Pooja Kumari", "Sachin Tiwari",
        "Mohit Chauhan", "Swati Mishra", "Karan Johar", "Vishal Bhardwaj", "Sunita Wadhwa",
        "Rajesh Kumar", "Suresh Reddy", "Anand Verma", "Kamlesh Pandey", "Rachna Singh",
        "Dinesh Karthik", "Ramesh Powar", "Vinay Kumar", "Zaheer Khan", "Harbhajan Singh"
    ]
    
    workers = []
    for i, name in enumerate(names):
        code = f"EMP-{str(i+1).zfill(3)}"
        # Random initial compliance rate (mostly high, some low)
        comp_rate = random.choices([random.uniform(90, 100), random.uniform(70, 89), random.uniform(50, 69)], weights=[0.6, 0.3, 0.1])[0]
        w, created = Worker.objects.get_or_create(
            employee_code=code,
            defaults={
                "name": name,
                "language_preference": random.choice(["hi", "en", "te", "ta"]),
                "compliance_rate": comp_rate,
                "is_active": True
            }
        )
        if not created:
            w.compliance_rate = comp_rate
            w.save()
        workers.append(w)

    print("Generating past 30 days of data...")
    now = timezone.now()
    zone_names = [z["name"] for z in zones]
    ppe_types = ["helmet", "vest", "gloves", "goggles", "boots", "harness"]

    for i in range(30):
        day = now - timedelta(days=i)
        
        # 1. Attendances (about 25-30 workers per day)
        present_workers = random.sample(workers, random.randint(20, 28))
        for w in present_workers:
            # Check-in time between 6 AM and 8 AM
            check_in = day.replace(hour=random.randint(6, 8), minute=random.randint(0, 59), second=0, microsecond=0)
            
            # Avoid creating duplicates if we run this script multiple times
            if not Attendance.objects.filter(worker=w, check_in_time__date=day.date()).exists():
                Attendance.objects.create(
                    worker=w,
                    zone="Entry Checkpoint",
                    status=random.choices(["Present", "Late"], weights=[0.8, 0.2])[0]
                )
                Attendance.objects.filter(worker=w, check_in_time__date=day.date()).update(check_in_time=check_in)

        # 2. Daily Violations (avg 5-15 per day)
        num_violations = random.randint(5, 15)
        for _ in range(num_violations):
            # Violation created randomly during working hours (6 AM to 6 PM)
            v_time = day.replace(hour=random.randint(6, 17), minute=random.randint(0, 59))
            worker = random.choice(present_workers)
            zone = random.choice(zone_names)
            ppe = random.choice(ppe_types)
            conf = random.uniform(0.65, 0.99)
            
            # Is it resolved? 85% resolution rate
            resolved = random.random() < 0.85
            resolved_time = v_time + timedelta(minutes=random.randint(1, 120)) if resolved else None

            v = Violation.objects.create(
                worker=worker,
                ppe_type=ppe,
                zone=zone,
                camera_id=f"CAM-{random.randint(100, 999)}",
                confidence=conf,
                image_path=f"/media/violations/demo_{random.randint(1000, 9999)}.jpg",
            )
            # Have to update timestamps manually since auto_now_add overrides `create` sometimes
            v.created_at = v_time
            v.resolved_at = resolved_time
            v.save(update_fields=['created_at', 'resolved_at'])

            # Generate Alert for some violations
            if conf > 0.8:
                level = random.randint(1, 6)
                channel = random.choice(["dashboard", "push", "wristband", "call"])
                ack_time = v_time + timedelta(minutes=random.randint(1, 30)) if resolved else None
                a = Alert.objects.create(
                    violation=v,
                    level=level,
                    channel=channel,
                )
                a.sent_at = v_time + timedelta(seconds=random.randint(2, 10))
                a.acknowledged_at = ack_time
                a.save(update_fields=['sent_at', 'acknowledged_at'])

    print("Generating Reports...")
    ComplianceReport.objects.get_or_create(
        site=site,
        period_start=(now - timedelta(days=7)).date(),
        period_end=now.date(),
        defaults={"report_path": "/media/reports/weekly_demo.pdf"}
    )

    print("Adding today's live violations to make the dashboard pop!")
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Check if there are today's violations, if not add a bunch
    if Violation.objects.filter(created_at__gte=today).count() < 5:
        today_workers = Attendance.objects.filter(check_in_time__gte=today).values_list('worker', flat=True)
        tw = Worker.objects.filter(id__in=today_workers)
        if not tw.exists():
            tw = workers
        
        for _ in range(8):
            v_time = now - timedelta(minutes=random.randint(5, 300))
            worker = random.choice(tw)
            v = Violation.objects.create(
                worker=worker,
                ppe_type=random.choice(ppe_types),
                zone=random.choice(zone_names),
                camera_id=f"CAM-{random.randint(100, 999)}",
                confidence=random.uniform(0.7, 0.99),
                image_path=f"/media/violations/live_{random.randint(1000, 9999)}.jpg",
            )
            v.created_at = v_time
            v.save(update_fields=['created_at'])

            if random.random() < 0.5:
                a = Alert.objects.create(
                    violation=v,
                    level=random.randint(2, 5),
                    channel=random.choice(["dashboard", "push", "wristband"]),
                )
                a.sent_at = v_time + timedelta(seconds=5)
                a.save(update_fields=['sent_at'])

    print("Seeding complete! Admin and Analytics dashboards will now have robust data.")

if __name__ == '__main__':
    seed()
