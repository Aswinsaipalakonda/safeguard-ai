"""
MQTT Manager for SafeGuard AI

Handles MQTT publish/subscribe for wristband vibration alerts
and other IoT device communication.

Uses paho-mqtt to connect to a Mosquitto broker.
"""

import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class MQTTManager:
    """
    Lightweight MQTT client wrapper for publishing alerts to
    wristband devices and other IoT endpoints.
    """

    def __init__(
        self,
        broker_host: str = 'localhost',
        broker_port: int = 1883,
        client_id: str = 'safeguard-alert-engine',
    ):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.client_id = client_id
        self._client = None
        self._connected = False

    def _ensure_connection(self) -> bool:
        """Lazily connect to the MQTT broker."""
        if self._connected and self._client:
            return True

        try:
            import paho.mqtt.client as mqtt

            self._client = mqtt.Client(client_id=self.client_id)
            self._client.on_connect = self._on_connect
            self._client.on_disconnect = self._on_disconnect
            self._client.connect(self.broker_host, self.broker_port, keepalive=60)
            self._client.loop_start()
            self._connected = True
            logger.info(f"MQTT connected to {self.broker_host}:{self.broker_port}")
            return True
        except ImportError:
            logger.warning("paho-mqtt not installed — MQTT disabled. pip install paho-mqtt")
            return False
        except Exception as e:
            logger.warning(f"MQTT connection failed (expected in dev): {e}")
            return False

    def publish(self, topic: str, payload: str, qos: int = 1) -> bool:
        """
        Publish a message to an MQTT topic.

        Args:
            topic: MQTT topic string (e.g., 'workers/W-1234/wristband')
            payload: JSON string payload
            qos: Quality of Service level (0, 1, or 2)

        Returns:
            True if published successfully, False otherwise
        """
        if not self._ensure_connection():
            logger.info(f"MQTT publish simulated — topic: {topic}, payload: {payload[:80]}")
            return False

        try:
            result = self._client.publish(topic, payload, qos=qos)
            if result.rc == 0:
                logger.info(f"MQTT published to {topic}")
                return True
            else:
                logger.error(f"MQTT publish failed: rc={result.rc}")
                return False
        except Exception as e:
            logger.error(f"MQTT publish error: {e}")
            return False

    def subscribe(self, topic: str, callback=None):
        """Subscribe to an MQTT topic with an optional callback."""
        if not self._ensure_connection():
            return

        try:
            if callback:
                self._client.message_callback_add(topic, callback)
            self._client.subscribe(topic)
            logger.info(f"MQTT subscribed to {topic}")
        except Exception as e:
            logger.error(f"MQTT subscribe error: {e}")

    def disconnect(self):
        """Cleanly disconnect from the broker."""
        if self._client and self._connected:
            try:
                self._client.loop_stop()
                self._client.disconnect()
                self._connected = False
                logger.info("MQTT disconnected")
            except Exception:
                pass

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("MQTT broker connection established")
        else:
            logger.warning(f"MQTT connect returned code {rc}")

    def _on_disconnect(self, client, userdata, rc):
        self._connected = False
        if rc != 0:
            logger.warning(f"MQTT unexpected disconnect (rc={rc})")
