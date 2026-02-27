"""
Voice Alert Service for SafeGuard AI

Uses gTTS (Google Text-to-Speech) to generate multilingual voice alerts.
Caches generated audio in Redis to avoid re-generation of identical messages.
"""

import io
import hashlib
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Language templates for voice alerts
ALERT_TEMPLATES = {
    'en': "Attention {name}. Please wear your {ppe} immediately. Zone {zone}.",
    'hi': "ध्यान दें {name}। कृपया तुरंत अपना {ppe} पहनें। ज़ोन {zone}।",
    'te': "దయచేసి {name}. వెంటనే మీ {ppe} ధరించండి. జోన్ {zone}.",
    'ta': "கவனம் {name}. உடனடியாக உங்கள் {ppe} அணியுங்கள். மண்டலம் {zone}.",
    'kn': "ಗಮನ {name}. ದಯವಿಟ್ಟು ತಕ್ಷಣ {ppe} ಧರಿಸಿ. ವಲಯ {zone}.",
    'mr': "लक्ष द्या {name}. कृपया लगेच तुमचा {ppe} घाला. झोन {zone}.",
}

PPE_NAMES = {
    'en': {
        'helmet': 'helmet', 'vest': 'safety vest', 'gloves': 'gloves',
        'goggles': 'safety goggles', 'boots': 'safety boots', 'harness': 'body harness',
    },
    'hi': {
        'helmet': 'हेलमेट', 'vest': 'सेफ्टी जैकेट', 'gloves': 'दस्ताने',
        'goggles': 'सुरक्षा चश्मे', 'boots': 'सुरक्षा जूते', 'harness': 'बॉडी हार्नेस',
    },
}


class VoiceAlertService:
    """Generates and caches TTS voice alerts for PPE violations."""

    def __init__(self):
        self._redis = None
        try:
            import redis as _redis
            import environ
            from pathlib import Path

            env = environ.Env()
            env_path = Path(__file__).resolve().parent.parent / '.env'
            if env_path.exists():
                environ.Env.read_env(str(env_path))
            self._redis = _redis.from_url(
                env('REDIS_URL', default='redis://localhost:6379/1')
            )
            self._redis.ping()
        except Exception:
            self._redis = None

    def announce(
        self,
        zone_name: str,
        worker_name: str = "Worker",
        missing_ppe: Optional[List[str]] = None,
        language: str = 'en',
    ) -> Optional[bytes]:
        """
        Generate a voice announcement for a PPE violation.

        Returns the MP3 bytes or None if TTS is not available.
        """
        if not missing_ppe:
            return None

        ppe_list = ', '.join(missing_ppe)
        template = ALERT_TEMPLATES.get(language, ALERT_TEMPLATES['en'])
        message = template.format(name=worker_name, ppe=ppe_list, zone=zone_name)

        # Check Redis cache first
        cache_key = f"voice_alert:{hashlib.md5(message.encode()).hexdigest()}"
        if self._redis:
            try:
                cached = self._redis.get(cache_key)
                if cached:
                    logger.info(f"Voice alert cache hit: {message[:50]}...")
                    return cached
            except Exception:
                pass

        # Generate TTS
        try:
            from gtts import gTTS

            tts = gTTS(text=message, lang=language if language != 'en' else 'en')
            buffer = io.BytesIO()
            tts.write_to_fp(buffer)
            audio_bytes = buffer.getvalue()

            # Cache in Redis for 10 minutes
            if self._redis:
                try:
                    self._redis.setex(cache_key, 600, audio_bytes)
                except Exception:
                    pass

            logger.info(f"Voice alert generated: {message[:50]}...")
            return audio_bytes

        except ImportError:
            logger.warning("gTTS not installed — voice alerts disabled. pip install gTTS")
            return None
        except Exception as e:
            logger.error(f"TTS generation error: {e}")
            return None

    def get_ppe_name(self, ppe_type: str, language: str = 'en') -> str:
        """Get localized PPE name."""
        lang_names = PPE_NAMES.get(language, PPE_NAMES['en'])
        return lang_names.get(ppe_type, ppe_type)
