"""
Alert Processor — 6-Level Escalation Engine for SafeGuard AI

Subscribes to Redis 'violations' channel and triggers a multi-level
escalation ladder for each violation event.

LEVEL 1 — Instant Visual + Voice        (T+0s)
LEVEL 2 — Supervisor Push Notification  (T+5s)
LEVEL 3 — Wristband Vibration (MQTT)    (T+30s)
LEVEL 4 — Supervisor Auto-Call (Twilio)  (T+90s)
LEVEL 5 — Site Manager Dashboard Flag   (T+3min)
LEVEL 6 — Access Lockout                (T+3min)
"""

import json
import time
import logging
import threading
from datetime import datetime

import redis
import environ
from pathlib import Path
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)

# Load env
env = environ.Env()
_env_path = Path(__file__).resolve().parent.parent / '.env'
if _env_path.exists():
    environ.Env.read_env(str(_env_path))

REDIS_URL = env('REDIS_URL', default='redis://localhost:6379/1')

# Escalation timings in seconds
ESCALATION_TIMINGS = {
    1: 0,     # Instant
    2: 5,     # +5 seconds
    3: 30,    # +30 seconds
    4: 90,    # +90 seconds
    5: 180,   # +3 minutes
    6: 180,   # +3 minutes (simultaneous with L5)
}


class AlertProcessor:
    """
    Subscribes to Redis 'violations' channel and runs the 6-level
    escalation ladder for each violation.
    """

    def __init__(self):
        self.redis_client = redis.from_url(REDIS_URL)
        self._running = False

    def start(self):
        """Start listening for violation events on Redis pub/sub."""
        self._running = True
        pubsub = self.redis_client.pubsub()
        pubsub.subscribe('violations')
        logger.info("AlertProcessor started — listening on Redis 'violations' channel.")

        for message in pubsub.listen():
            if not self._running:
                break
            if message['type'] == 'message':
                try:
                    data = json.loads(message['data'])
                    self._handle_violation(data)
                except Exception as e:
                    logger.error(f"AlertProcessor error: {e}")

    def stop(self):
        self._running = False

    def _handle_violation(self, violation_data: dict):
        """
        Process a single violation through the escalation ladder.
        Each level runs in its own thread with the appropriate delay.
        """
        camera_id = violation_data.get('camera_id', 'unknown')
        ppe_type = violation_data.get('ppe_type', 'unknown')
        confidence = violation_data.get('confidence', 0.0)
        zone = violation_data.get('zone', 'unknown')
        worker_name = violation_data.get('worker', 'Unknown')
        image_path = violation_data.get('image_path', '')

        logger.info(
            f"Processing violation: {ppe_type} at {zone} (camera: {camera_id}, conf: {confidence})"
        )

        # Only escalate if confidence > 0.87
        if confidence < 0.87:
            logger.info(f"Skipping escalation — confidence {confidence} < 0.87 threshold")
            return

        violation_context = {
            'camera_id': camera_id,
            'ppe_type': ppe_type,
            'confidence': confidence,
            'zone': zone,
            'worker': worker_name,
            'image_path': image_path,
            'timestamp': time.time(),
        }

        # Save Level 1 alert to DB immediately
        self._save_alert_to_db(violation_context, level=1, channel='dashboard')

        # Level 1: Instant — WebSocket + Voice
        self._level_1_instant(violation_context)

        # Spawn delayed escalation threads for levels 2-6
        for level in range(2, 7):
            delay = ESCALATION_TIMINGS[level]
            t = threading.Thread(
                target=self._delayed_escalation,
                args=(violation_context, level, delay),
                daemon=True,
            )
            t.start()

    def _level_1_instant(self, ctx: dict):
        """LEVEL 1: Instant visual alert via WebSocket + voice announcement."""
        # Push to WebSocket via Django Channels
        try:
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            if channel_layer:
                alert_payload = {
                    'type': 'alert',
                    'level': 1,
                    'camera_id': ctx['camera_id'],
                    'zone': ctx['zone'],
                    'ppe_type': ctx['ppe_type'],
                    'confidence': ctx['confidence'],
                    'worker': ctx['worker'],
                    'timestamp': ctx['timestamp'],
                    'message': f"ALERT: {ctx['ppe_type'].upper()} missing in {ctx['zone']}",
                }
                async_to_sync(channel_layer.group_send)(
                    "live_monitoring",
                    {"type": "send_violation", "data": alert_payload},
                )
                logger.info(f"L1: WebSocket alert sent for {ctx['ppe_type']} at {ctx['zone']}")
        except Exception as e:
            logger.error(f"L1 WebSocket error: {e}")

        # Voice alert
        try:
            from alert_engine.voice_service import VoiceAlertService
            voice = VoiceAlertService()
            voice.announce(
                zone_name=ctx['zone'],
                worker_name=ctx['worker'],
                missing_ppe=[ctx['ppe_type']],
            )
        except Exception as e:
            logger.warning(f"L1 Voice alert error: {e}")

    def _delayed_escalation(self, ctx: dict, level: int, delay: float):
        """Run a single escalation level after the specified delay."""
        time.sleep(delay)

        # Check if violation was resolved in the meantime
        if self._is_resolved(ctx):
            logger.info(f"L{level}: Skipping — violation already resolved")
            return

        if level == 2:
            self._level_2_push(ctx)
        elif level == 3:
            self._level_3_wristband(ctx)
        elif level == 4:
            self._level_4_auto_call(ctx)
        elif level == 5:
            self._level_5_dashboard_flag(ctx)
        elif level == 6:
            self._level_6_lockout(ctx)

    def _level_2_push(self, ctx: dict):
        """LEVEL 2: Supervisor push notification (simulated)."""
        self._save_alert_to_db(ctx, level=2, channel='push')
        logger.info(
            f"L2: Push notification sent to supervisor — "
            f"{ctx['ppe_type']} missing at {ctx['zone']}"
        )
        # In production: Use FCM (firebase_admin) to push to mobile
        # firebase_admin.messaging.send(message)

    def _level_3_wristband(self, ctx: dict):
        """LEVEL 3: Wristband vibration via MQTT."""
        self._save_alert_to_db(ctx, level=3, channel='wristband')
        try:
            from alert_engine.mqtt_manager import MQTTManager
            mqtt = MQTTManager()
            mqtt.publish(
                topic=f"workers/{ctx['worker']}/wristband",
                payload=json.dumps({
                    'action': 'vibrate',
                    'ppe_type': ctx['ppe_type'],
                    'zone': ctx['zone'],
                }),
            )
            logger.info(f"L3: MQTT wristband vibration sent for {ctx['worker']}")
        except Exception as e:
            logger.warning(f"L3 MQTT error (expected in dev): {e}")

    def _level_4_auto_call(self, ctx: dict):
        """LEVEL 4: Supervisor auto-call (Twilio, simulated)."""
        self._save_alert_to_db(ctx, level=4, channel='call')
        logger.info(
            f"L4: Auto-call triggered to supervisor for {ctx['ppe_type']} at {ctx['zone']}"
        )
        # In production:
        # from twilio.rest import Client
        # client = Client(account_sid, auth_token)
        # client.calls.create(to=supervisor_phone, from_=twilio_number, url=twiml_url)

    def _level_5_dashboard_flag(self, ctx: dict):
        """LEVEL 5: Flag violation as escalated on dashboard."""
        self._save_alert_to_db(ctx, level=5, channel='dashboard')
        try:
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "live_monitoring",
                    {
                        "type": "send_violation",
                        "data": {
                            'type': 'escalation',
                            'level': 5,
                            'camera_id': ctx['camera_id'],
                            'zone': ctx['zone'],
                            'ppe_type': ctx['ppe_type'],
                            'message': f"ESCALATED: Unresolved {ctx['ppe_type']} violation in {ctx['zone']}",
                        },
                    },
                )
            logger.info(f"L5: Dashboard escalation flag sent for {ctx['zone']}")
        except Exception as e:
            logger.error(f"L5 Dashboard flag error: {e}")

    def _level_6_lockout(self, ctx: dict):
        """LEVEL 6: Access lockout (simulated barrier trigger)."""
        self._save_alert_to_db(ctx, level=6, channel='lockout')
        logger.info(
            f"L6: ACCESS LOCKOUT triggered for zone {ctx['zone']} — "
            f"barrier lock command sent"
        )
        # In production: POST to zone.lockout_endpoint

    def _save_alert_to_db(self, ctx: dict, level: int, channel: str):
        """Persist alert record to the Django database."""
        try:
            import django
            import os
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
            try:
                django.setup()
            except RuntimeError:
                pass  # Already configured

            from django.db import close_old_connections
            close_old_connections()

            from api.models import Alert, Violation

            # Find the most recent matching violation
            violation = (
                Violation.objects.filter(
                    camera_id=ctx['camera_id'],
                    ppe_type=ctx['ppe_type'],
                )
                .order_by('-created_at')
                .first()
            )

            if violation:
                Alert.objects.create(
                    violation=violation,
                    level=level,
                    channel=channel,
                )
                logger.info(f"Alert L{level} saved to DB for violation #{violation.id}")
        except Exception as e:
            logger.error(f"Failed to save alert to DB: {e}")

    def _is_resolved(self, ctx: dict) -> bool:
        """Check if the violation has been resolved since it was detected."""
        try:
            import django
            import os
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
            try:
                django.setup()
            except RuntimeError:
                pass

            from django.db import close_old_connections
            close_old_connections()

            from api.models import Violation

            violation = (
                Violation.objects.filter(
                    camera_id=ctx['camera_id'],
                    ppe_type=ctx['ppe_type'],
                )
                .order_by('-created_at')
                .first()
            )
            return violation is not None and violation.resolved_at is not None
        except Exception:
            return False


def run_alert_processor():
    """Entry point — start the alert processor."""
    processor = AlertProcessor()
    processor.start()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run_alert_processor()
