import os
import threading
import json
import logging

from django.apps import AppConfig
from django.db import close_old_connections

logger = logging.getLogger(__name__)


def listen_to_redis_violations():
    """
    Background thread that subscribes to the Redis 'violations' channel
    and persists incoming violation events to the database.
    """
    import redis
    import environ
    from django.conf import settings

    env = environ.Env()
    env_path = settings.BASE_DIR.parent / '.env'
    if env_path.exists():
        environ.Env.read_env(str(env_path))

    try:
        r = redis.from_url(env('REDIS_URL', default='redis://localhost:6379/1'))
        r.ping()
    except Exception as e:
        logger.warning(f"Redis not available for violation listener: {e}")
        return

    pubsub = r.pubsub()
    pubsub.subscribe('violations')

    from api.models import Violation

    logger.info("Redis violation listener started.")

    for message in pubsub.listen():
        if message['type'] == 'message':
            try:
                data = json.loads(message['data'])
                close_old_connections()
                Violation.objects.create(
                    ppe_type=data.get('ppe_type', 'helmet'),
                    zone=data.get('zone', 'unknown'),
                    camera_id=data.get('camera_id', 'unknown'),
                    confidence=data.get('confidence', 0.0),
                    image_path=data.get('image_path', ''),
                )
            except Exception as e:
                logger.error(f"Error saving Violation from Redis: {e}")


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Only start in the main process (not during management commands like migrate)
        import sys
        if 'runserver' in sys.argv or 'daphne' in sys.argv[0] if sys.argv else False:
            thread = threading.Thread(target=listen_to_redis_violations, daemon=True)
            thread.start()
