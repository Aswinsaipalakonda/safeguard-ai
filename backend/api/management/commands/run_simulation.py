import time
import random
import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from api.models import Violation, Zone, Worker


class Command(BaseCommand):
    help = 'Runs the Computer Vision Engine simulation'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting simulation engine..."))
        channel_layer = get_channel_layer()

        cameras = [
            {"id": "cam-assembly-1", "zone": "Assembly Line 1"},
            {"id": "cam-welding-2", "zone": "Welding Zone B"},
            {"id": "cam-loading-3", "zone": "Loading Dock South"},
        ]

        ppes = ["helmet", "vest", "gloves", "goggles", "boots", "harness"]

        while True:
            time.sleep(random.randint(4, 10))
            camera = random.choice(cameras)
            ppe = random.choice(ppes)
            confidence = round(random.uniform(0.85, 0.99), 2)

            # Persist violation to database
            worker = None
            workers = Worker.objects.filter(is_active=True)
            if workers.exists() and random.random() > 0.3:
                worker = random.choice(list(workers))

            try:
                violation = Violation.objects.create(
                    worker=worker,
                    ppe_type=ppe,
                    zone=camera["zone"],
                    camera_id=camera["id"],
                    confidence=confidence,
                    image_path=f"/violations/{camera['id']}_{int(time.time())}.jpg",
                )
                self.stdout.write(f"Saved violation #{violation.id}: {ppe} at {camera['zone']}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error saving violation: {e}"))

            violation_data = {
                "type": "violation",
                "camera_id": camera["id"],
                "zone": camera["zone"],
                "ppe_type": ppe,
                "confidence": confidence,
                "worker": worker.name if worker else "Unknown",
                "timestamp": time.time(),
            }

            self.stdout.write(f"Generated violation: {violation_data}")

            try:
                async_to_sync(channel_layer.group_send)(
                    "live_monitoring",
                    {
                        "type": "send_violation",
                        "data": violation_data,
                    },
                )
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Channel layer send failed (Redis down?): {e}"))
