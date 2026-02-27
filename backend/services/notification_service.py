"""
Notification service for SafeGuard AI.
Sends automated alerts via Email (SMTP), SMS (Twilio), and WhatsApp (Twilio).
Each channel degrades gracefully if credentials are not configured.
"""

import logging
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Twilio (optional)
# ---------------------------------------------------------------------------
_twilio_available = False
try:
    from twilio.rest import Client as TwilioClient
    _twilio_available = True
except ImportError:
    logger.info("twilio not installed — SMS/WhatsApp disabled. pip install twilio")


def _get_env():
    """Lazy load env to avoid Django AppRegistryNotReady."""
    import environ
    env = environ.Env()
    environ.Env.read_env(Path(__file__).resolve().parent.parent.parent / '.env')
    return env


class NotificationService:
    """Multi-channel notification dispatcher."""

    def __init__(self):
        self.env = _get_env()

    # ------------------------------------------------------------------
    # EMAIL via SMTP
    # ------------------------------------------------------------------
    def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        image_bytes: bytes | None = None,
        image_name: str = "violation.jpg",
    ) -> dict:
        """Send an HTML email with optional embedded image."""
        smtp_host = self.env("SMTP_HOST", default="smtp.gmail.com")
        smtp_port = int(self.env("SMTP_PORT", default="587"))
        smtp_user = self.env("SMTP_USER", default="")
        smtp_pass = self.env("SMTP_PASSWORD", default="")

        if not smtp_user:
            logger.warning("SMTP_USER not configured — email skipped")
            return {"channel": "email", "status": "skipped", "reason": "SMTP not configured"}

        try:
            msg = MIMEMultipart("related")
            msg["From"] = smtp_user
            msg["To"] = to_email
            msg["Subject"] = subject

            msg.attach(MIMEText(body_html, "html"))

            if image_bytes:
                img = MIMEImage(image_bytes)
                img.add_header("Content-ID", "<violation_image>")
                img.add_header("Content-Disposition", "inline", filename=image_name)
                msg.attach(img)

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, to_email, msg.as_string())

            logger.info(f"Email sent to {to_email}: {subject}")
            return {"channel": "email", "status": "sent", "to": to_email}

        except Exception as e:
            logger.error(f"Email failed: {e}")
            return {"channel": "email", "status": "error", "error": str(e)}

    # ------------------------------------------------------------------
    # SMS via Twilio
    # ------------------------------------------------------------------
    def send_sms(self, to_phone: str, message: str) -> dict:
        """Send an SMS via Twilio."""
        if not _twilio_available:
            return {"channel": "sms", "status": "skipped", "reason": "twilio not installed"}

        account_sid = self.env("TWILIO_ACCOUNT_SID", default="")
        auth_token = self.env("TWILIO_AUTH_TOKEN", default="")
        from_phone = self.env("TWILIO_FROM_PHONE", default="")

        if not account_sid:
            return {"channel": "sms", "status": "skipped", "reason": "Twilio not configured"}

        try:
            client = TwilioClient(account_sid, auth_token)
            msg = client.messages.create(
                body=message,
                from_=from_phone,
                to=to_phone,
            )
            logger.info(f"SMS sent to {to_phone}: SID={msg.sid}")
            return {"channel": "sms", "status": "sent", "sid": msg.sid, "to": to_phone}

        except Exception as e:
            logger.error(f"SMS failed: {e}")
            return {"channel": "sms", "status": "error", "error": str(e)}

    # ------------------------------------------------------------------
    # WhatsApp via Twilio
    # ------------------------------------------------------------------
    def send_whatsapp(self, to_phone: str, message: str, media_url: str | None = None) -> dict:
        """Send a WhatsApp message via Twilio sandbox or approved template."""
        if not _twilio_available:
            return {"channel": "whatsapp", "status": "skipped", "reason": "twilio not installed"}

        account_sid = self.env("TWILIO_ACCOUNT_SID", default="")
        auth_token = self.env("TWILIO_AUTH_TOKEN", default="")
        from_whatsapp = self.env("TWILIO_WHATSAPP_FROM", default="whatsapp:+14155238886")

        if not account_sid:
            return {"channel": "whatsapp", "status": "skipped", "reason": "Twilio not configured"}

        try:
            client = TwilioClient(account_sid, auth_token)
            kwargs = {
                "body": message,
                "from_": from_whatsapp,
                "to": f"whatsapp:{to_phone}" if not to_phone.startswith("whatsapp:") else to_phone,
            }
            if media_url:
                kwargs["media_url"] = [media_url]

            msg = client.messages.create(**kwargs)
            logger.info(f"WhatsApp sent to {to_phone}: SID={msg.sid}")
            return {"channel": "whatsapp", "status": "sent", "sid": msg.sid, "to": to_phone}

        except Exception as e:
            logger.error(f"WhatsApp failed: {e}")
            return {"channel": "whatsapp", "status": "error", "error": str(e)}

    # ------------------------------------------------------------------
    # Unified Violation Alert — sends all channels at once
    # ------------------------------------------------------------------
    def send_violation_alert(
        self,
        violation_data: dict,
        supervisor_email: str = "",
        supervisor_phone: str = "",
        image_bytes: bytes | None = None,
    ) -> dict:
        """
        Dispatch violation alert across ALL configured channels.
        violation_data keys: worker_name, ppe_type, zone, confidence, camera_id, timestamp
        """
        worker = violation_data.get("worker_name", "Unknown Worker")
        ppe = violation_data.get("ppe_type", "PPE").upper()
        zone = violation_data.get("zone", "Unknown Zone")
        confidence = violation_data.get("confidence", 0)
        timestamp = violation_data.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

        # ---- Build messages ----
        text_msg = (
            f"🚨 SafeGuard AI — PPE VIOLATION DETECTED\n\n"
            f"👷 Worker: {worker}\n"
            f"⚠️ Missing: {ppe}\n"
            f"📍 Zone: {zone}\n"
            f"📊 Confidence: {confidence}%\n"
            f"🕐 Time: {timestamp}\n\n"
            f"Acknowledge this alert in the SafeGuard dashboard."
        )

        html_email = f"""
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto;
                    border: 2px solid #e74c3c; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white;
                        padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px;">🚨 PPE VIOLATION DETECTED</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 13px;">SafeGuard AI — Automated Safety Monitoring</p>
            </div>
            <div style="padding: 24px; background: #fafafa;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 10px; font-weight: bold; color: #555;">👷 Worker</td>
                        <td style="padding: 10px;">{worker}</td></tr>
                    <tr style="background: #f0f0f0;">
                        <td style="padding: 10px; font-weight: bold; color: #555;">⚠️ Missing PPE</td>
                        <td style="padding: 10px; color: #e74c3c; font-weight: bold;">{ppe}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; color: #555;">📍 Zone</td>
                        <td style="padding: 10px;">{zone}</td></tr>
                    <tr style="background: #f0f0f0;">
                        <td style="padding: 10px; font-weight: bold; color: #555;">📊 Confidence</td>
                        <td style="padding: 10px;">{confidence}%</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; color: #555;">🕐 Time</td>
                        <td style="padding: 10px;">{timestamp}</td></tr>
                </table>
                {"<br><img src='cid:violation_image' style='width:100%;border-radius:8px;'>" if image_bytes else ""}
            </div>
            <div style="background: #2c3e50; color: white; padding: 16px; text-align: center; font-size: 12px;">
                <a href='http://localhost:5173/violations' style='color: #3498db; text-decoration: none; font-weight: bold;'>
                    Open SafeGuard Dashboard →
                </a>
            </div>
        </div>
        """

        results = {}

        # Email
        if supervisor_email:
            results["email"] = self.send_email(
                to_email=supervisor_email,
                subject=f"🚨 PPE Violation — {ppe} missing in {zone}",
                body_html=html_email,
                image_bytes=image_bytes,
            )

        # SMS
        if supervisor_phone:
            results["sms"] = self.send_sms(
                to_phone=supervisor_phone,
                message=text_msg,
            )

        # WhatsApp
        if supervisor_phone:
            results["whatsapp"] = self.send_whatsapp(
                to_phone=supervisor_phone,
                message=text_msg,
            )

        if not results:
            results["status"] = "no_channels_configured"

        return results
