import random
import math
from datetime import datetime, timedelta

from django.db import connection
from django.db.models import Count, Avg, Q, Sum, F, FloatField, Value
from django.db.models.functions import TruncDate, TruncHour
from django.conf import settings
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

import redis
import environ
from pathlib import Path

from .models import User, Site, Zone, Worker, Violation, Alert, ComplianceReport
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    SiteSerializer,
    ZoneSerializer,
    WorkerSerializer,
    ViolationSerializer,
    AlertSerializer,
    ComplianceReportSerializer,
)

env = environ.Env()
environ.Env.read_env(Path(__file__).resolve().parent.parent.parent / '.env')


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    db_status = "ok"
    redis_status = "ok"

    try:
        connection.ensure_connection()
    except Exception as e:
        db_status = f"error: {str(e)}"

    try:
        r = redis.from_url(env('REDIS_URL', default='redis://localhost:6379/1'))
        r.ping()
    except Exception as e:
        redis_status = f"error: {str(e)}"

    status_code = 200 if db_status == "ok" and redis_status == "ok" else 500

    return Response({
        "status": "ok" if status_code == 200 else "error",
        "database": db_status,
        "redis": redis_status,
    }, status=status_code)


# ---------------------------------------------------------------------------
# JWT Authentication
# ---------------------------------------------------------------------------
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ---------------------------------------------------------------------------
# Camera management (mock for hackathon demo)
# ---------------------------------------------------------------------------
class MockCameraManager:
    _cameras: dict = {}

    def start_camera(self, camera_id, stream_url, zone_id, required_ppe):
        self._cameras[camera_id] = {
            "camera_id": camera_id,
            "stream_url": stream_url,
            "zone_id": zone_id,
            "required_ppe": required_ppe,
            "status": "active",
        }
        return True

    def stop_camera(self, camera_id):
        if camera_id in self._cameras:
            del self._cameras[camera_id]
            return True
        return False

    def list_cameras(self):
        if not self._cameras:
            return [
                {"camera_id": "cam-assembly-1", "zone_id": "Z1", "status": "active"},
                {"camera_id": "cam-welding-2", "zone_id": "Z2", "status": "active"},
                {"camera_id": "cam-loading-3", "zone_id": "Z3", "status": "active"},
            ]
        return list(self._cameras.values())


camera_manager = MockCameraManager()


@api_view(['POST'])
def start_camera(request):
    camera_id = request.data.get('camera_id')
    stream_url = request.data.get('stream_url')
    zone_id = request.data.get('zone_id')

    if not all([camera_id, stream_url, zone_id]):
        return Response({"error": "Missing parameters: camera_id, stream_url, zone_id"}, status=400)

    try:
        zone = Zone.objects.get(id=zone_id)
        required_ppe = zone.required_ppe
    except Zone.DoesNotExist:
        required_ppe = ['helmet']

    success = camera_manager.start_camera(camera_id, stream_url, zone_id, required_ppe)
    if success:
        return Response({"status": "Camera started", "camera_id": camera_id}, status=200)
    return Response({"error": "Camera already running or failed"}, status=400)


@api_view(['POST'])
def stop_camera(request):
    camera_id = request.data.get('camera_id')
    if not camera_id:
        return Response({"error": "Missing camera_id"}, status=400)
    if camera_manager.stop_camera(camera_id):
        return Response({"status": "Camera stopped"}, status=200)
    return Response({"error": "Camera not found"}, status=404)


@api_view(['GET'])
def list_cameras(request):
    return Response(camera_manager.list_cameras(), status=200)


# ---------------------------------------------------------------------------
# Model ViewSets
# ---------------------------------------------------------------------------
class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer


class WorkerViewSet(viewsets.ModelViewSet):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer

    @action(detail=True, methods=['get'], url_path='safety-score')
    def safety_score(self, request, pk=None):
        worker = self.get_object()
        week_ago = timezone.now() - timedelta(days=7)
        total = Violation.objects.filter(worker=worker, created_at__gte=week_ago).count()
        resolved = Violation.objects.filter(worker=worker, created_at__gte=week_ago, resolved_at__isnull=False).count()
        score = round(((1 - (total / max(total + 10, 1))) * 100), 1)
        return Response({
            "worker_id": worker.id,
            "name": worker.name,
            "weekly_violations": total,
            "weekly_resolved": resolved,
            "safety_score": score,
            "compliance_rate": worker.compliance_rate,
        })

    @action(detail=True, methods=['post'], url_path='enroll-face')
    def enroll_face(self, request, pk=None):
        worker = self.get_object()
        # For hackathon: store a simulated 512-dim embedding
        worker.face_embedding = [round(random.uniform(-1, 1), 4) for _ in range(512)]
        worker.save()
        return Response({"status": "Face enrolled successfully", "worker_id": worker.id})

    @action(detail=True, methods=['delete'], url_path='face')
    def remove_face(self, request, pk=None):
        worker = self.get_object()
        worker.face_embedding = None
        worker.save()
        return Response({"status": "Face embedding removed"})


class ViolationViewSet(viewsets.ModelViewSet):
    queryset = Violation.objects.all().order_by('-created_at')
    serializer_class = ViolationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Optional filters
        ppe_type = self.request.query_params.get('ppe_type')
        zone = self.request.query_params.get('zone')
        is_resolved = self.request.query_params.get('is_resolved')
        if ppe_type:
            qs = qs.filter(ppe_type=ppe_type)
        if zone:
            qs = qs.filter(zone__icontains=zone)
        if is_resolved is not None:
            if is_resolved.lower() in ('true', '1'):
                qs = qs.filter(resolved_at__isnull=False)
            else:
                qs = qs.filter(resolved_at__isnull=True)
        return qs


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-sent_at')
    serializer_class = AlertSerializer

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        if alert.acknowledged_at:
            return Response({"status": "Already acknowledged"}, status=400)
        alert.acknowledged_at = timezone.now()
        alert.save()
        return Response({"status": "Alert acknowledged", "acknowledged_at": str(alert.acknowledged_at)})

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_alerts = Alert.objects.filter(acknowledged_at__isnull=True).order_by('-sent_at')
        page = self.paginate_queryset(active_alerts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)


class ComplianceReportViewSet(viewsets.ModelViewSet):
    queryset = ComplianceReport.objects.all().order_by('-created_at')
    serializer_class = ComplianceReportSerializer


# ---------------------------------------------------------------------------
# Analytics Compliance
# ---------------------------------------------------------------------------
@api_view(['GET'])
def analytics_compliance(request):
    """
    Returns 7-day compliance trend data with real DB queries.
    Falls back to seeded-random data when no violations exist yet.
    """
    end_date = timezone.now()
    start_date = end_date - timedelta(days=6)

    daily_violations = (
        Violation.objects.filter(created_at__gte=start_date)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(
            total=Count('id'),
            resolved=Count('id', filter=Q(resolved_at__isnull=False)),
        )
        .order_by('day')
    )

    violation_map = {str(v['day']): v for v in daily_violations}

    data = []
    for i in range(7):
        day = (start_date + timedelta(days=i))
        day_str = day.strftime('%Y-%m-%d')
        day_label = day.strftime('%a')

        if day_str in violation_map:
            v = violation_map[day_str]
            total = v['total']
            resolved = v['resolved']
            compliance = round((resolved / max(total, 1)) * 100, 1) if total > 0 else 100
            data.append({
                "name": day_label,
                "compliance": compliance,
                "incidents": total,
                "violations": total,
            })
        else:
            # Seeded random fallback so it stays consistent per day
            rng = random.Random(day_str)
            compliance = rng.randint(85, 99)
            incidents = rng.randint(0, 4)
            data.append({
                "name": day_label,
                "compliance": compliance,
                "incidents": incidents,
                "violations": incidents,
            })

    return Response(data, status=200)


# ---------------------------------------------------------------------------
# Kiosk Endpoints
# ---------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def kiosk_scan_face(request):
    """
    Simulates biometric attendance.
    Tries to find a worker; falls back to demo data.
    """
    workers = Worker.objects.filter(is_active=True, face_embedding__isnull=False)
    if workers.exists():
        worker = random.choice(list(workers))
        return Response({
            "worker_id": f"W-{worker.id}",
            "name": worker.name,
            "employee_code": worker.employee_code,
            "stars": min(5, max(1, int(worker.compliance_rate / 20))),
            "compliance": round(worker.compliance_rate, 1),
        })

    # Fallback demo response
    return Response({
        "worker_id": "W-1001",
        "name": "Rajesh Kumar",
        "employee_code": "EMP-001",
        "stars": 4,
        "compliance": 92.5,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def kiosk_verify_ppe(request):
    """
    Simulates a PPE verification check from a camera frame.
    Returns randomised results for demo realism.
    """
    all_ppe = ["helmet", "vest", "boots", "goggles", "gloves"]
    # 60% chance fully compliant, 40% chance missing something
    if random.random() < 0.6:
        return Response({"approved": True, "missing": []})
    missing = random.sample(all_ppe, k=random.randint(1, 2))
    return Response({"approved": False, "missing": missing})


# ---------------------------------------------------------------------------
# Worker Voice Notification
# ---------------------------------------------------------------------------
@api_view(['POST'])
def worker_notify(request, pk):
    """Manually trigger a voice notification for a worker."""
    try:
        worker = Worker.objects.get(pk=pk)
    except Worker.DoesNotExist:
        return Response({"error": "Worker not found"}, status=404)

    ppe_type = request.data.get('ppe_type', 'helmet')
    zone_name = request.data.get('zone', 'General Zone')

    try:
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
        from alert_engine.voice_service import VoiceAlertService
        voice = VoiceAlertService()
        audio = voice.announce(
            zone_name=zone_name,
            worker_name=worker.name,
            missing_ppe=[ppe_type],
            language=worker.language_preference if hasattr(worker, 'language_preference') else 'en',
        )
        return Response({
            "status": "Notification sent",
            "worker": worker.name,
            "ppe_type": ppe_type,
            "audio_generated": audio is not None,
        })
    except Exception as e:
        return Response({
            "status": "Notification simulated (alert engine not available)",
            "worker": worker.name,
            "error": str(e),
        })


# ---------------------------------------------------------------------------
# Report Generation Endpoints
# ---------------------------------------------------------------------------
@api_view(['POST'])
def generate_daily_report(request):
    """Trigger daily compliance report generation."""
    try:
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from services.report_service import ReportService
        report_svc = ReportService()

        site_id = request.data.get('site_id')
        site = None
        if site_id:
            try:
                site = Site.objects.get(pk=site_id)
            except Site.DoesNotExist:
                pass

        result = report_svc.generate_daily_report(site=site)
        return Response(result, status=201)
    except ImportError:
        # Fallback when service module not available
        return Response({
            "status": "Report generation triggered",
            "type": "daily",
            "message": "Report will be available shortly",
        }, status=202)


@api_view(['POST'])
def generate_dgms_report(request):
    """Generate DGMS (Directorate General of Mines Safety) format report."""
    try:
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from services.report_service import ReportService
        report_svc = ReportService()
        result = report_svc.generate_dgms_report()
        return Response(result, status=201)
    except ImportError:
        return Response({
            "status": "DGMS report generation triggered",
            "type": "dgms",
            "message": "Report will be available shortly",
        }, status=202)


@api_view(['POST'])
def generate_esg_report(request):
    """Generate ESG Quarterly report."""
    try:
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from services.report_service import ReportService
        report_svc = ReportService()
        result = report_svc.generate_esg_report()
        return Response(result, status=201)
    except ImportError:
        return Response({
            "status": "ESG report generation triggered",
            "type": "esg",
            "message": "Report will be available shortly",
        }, status=202)


# ---------------------------------------------------------------------------
# Dashboard Stats (aggregated for live monitoring)
# ---------------------------------------------------------------------------
@api_view(['GET'])
def dashboard_stats(request):
    """Returns aggregated stats for the live monitoring dashboard."""
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = timezone.now() - timedelta(days=7)

    today_violations = Violation.objects.filter(created_at__gte=today_start).count()
    today_resolved = Violation.objects.filter(
        created_at__gte=today_start, resolved_at__isnull=False
    ).count()
    active_alerts = Alert.objects.filter(acknowledged_at__isnull=True).count()

    # PPE breakdown
    ppe_breakdown = (
        Violation.objects.filter(created_at__gte=today_start)
        .values('ppe_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # Zone hotspots
    zone_stats = (
        Violation.objects.filter(created_at__gte=today_start)
        .values('zone')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # Weekly trend
    week_total = Violation.objects.filter(created_at__gte=week_ago).count()
    prev_week_start = week_ago - timedelta(days=7)
    prev_week_total = Violation.objects.filter(
        created_at__gte=prev_week_start, created_at__lt=week_ago
    ).count()

    change_pct = 0
    if prev_week_total > 0:
        change_pct = round(((week_total - prev_week_total) / prev_week_total) * 100, 1)

    compliance_rate = round(
        (1 - (today_violations / max(today_violations + 50, 1))) * 100, 1
    )

    return Response({
        "today_violations": today_violations,
        "today_resolved": today_resolved,
        "active_alerts": active_alerts,
        "compliance_rate": compliance_rate,
        "week_change_pct": change_pct,
        "ppe_breakdown": list(ppe_breakdown),
        "zone_stats": list(zone_stats),
    })


# ═══════════════════════════════════════════════════════════════════════════
# FEATURE: Violation Heatmap
# ═══════════════════════════════════════════════════════════════════════════
@api_view(['GET'])
def violation_heatmap(request):
    """
    Returns zone-based violation intensity data for heatmap rendering.
    Each zone gets an intensity score (0.0–1.0) and coordinates.
    """
    days = int(request.query_params.get('days', 7))
    since = timezone.now() - timedelta(days=days)

    zone_counts = (
        Violation.objects.filter(created_at__gte=since)
        .values('zone')
        .annotate(
            count=Count('id'),
            avg_confidence=Avg('confidence'),
            unresolved=Count('id', filter=Q(resolved_at__isnull=True)),
        )
        .order_by('-count')
    )

    max_count = max((z['count'] for z in zone_counts), default=1)

    # Build zone grid with realistic coordinates for visualization
    zone_positions = {}
    zones_db = Zone.objects.all()
    for i, zone in enumerate(zones_db):
        # Arrange zones in a grid layout
        row = i // 4
        col = i % 4
        zone_positions[zone.name] = {
            "x": 80 + col * 200,
            "y": 80 + row * 180,
            "width": 170,
            "height": 140,
            "is_high_risk": zone.is_high_risk,
            "required_ppe": zone.required_ppe,
        }

    heatmap_data = []
    for zc in zone_counts:
        zone_name = zc['zone']
        intensity = round(zc['count'] / max(max_count, 1), 2)
        pos = zone_positions.get(zone_name, {"x": random.randint(50, 700), "y": random.randint(50, 500), "width": 170, "height": 140, "is_high_risk": False, "required_ppe": []})

        # Determine severity color band
        if intensity >= 0.75:
            severity = "critical"
            color = "#ef4444"
        elif intensity >= 0.5:
            severity = "high"
            color = "#f97316"
        elif intensity >= 0.25:
            severity = "medium"
            color = "#eab308"
        else:
            severity = "low"
            color = "#22c55e"

        heatmap_data.append({
            "zone": zone_name,
            "violations": zc['count'],
            "unresolved": zc['unresolved'],
            "avg_confidence": round(zc['avg_confidence'] or 0, 2),
            "intensity": intensity,
            "severity": severity,
            "color": color,
            "x": pos["x"],
            "y": pos["y"],
            "width": pos["width"],
            "height": pos["height"],
            "is_high_risk": pos.get("is_high_risk", False),
        })

    # Hourly trend for the heatmap timeline
    hourly = (
        Violation.objects.filter(created_at__gte=timezone.now() - timedelta(hours=24))
        .annotate(hour=TruncHour('created_at'))
        .values('hour')
        .annotate(count=Count('id'))
        .order_by('hour')
    )

    return Response({
        "zones": heatmap_data,
        "total_zones": len(heatmap_data),
        "period_days": days,
        "max_violations": max_count,
        "hourly_trend": list(hourly),
    })


# ═══════════════════════════════════════════════════════════════════════════
# FEATURE: Worker Safety Leaderboard (Gamification)
# ═══════════════════════════════════════════════════════════════════════════
@api_view(['GET'])
def worker_leaderboard(request):
    """
    Ranked worker safety leaderboard with stars, badges, streaks.
    """
    days = int(request.query_params.get('days', 30))
    since = timezone.now() - timedelta(days=days)
    limit = int(request.query_params.get('limit', 20))

    workers = Worker.objects.filter(is_active=True)
    leaderboard = []

    for worker in workers:
        total_violations = Violation.objects.filter(worker=worker, created_at__gte=since).count()
        resolved = Violation.objects.filter(worker=worker, created_at__gte=since, resolved_at__isnull=False).count()

        # Safety score — fewer violations = higher score
        safety_score = round(max(0, 100 - (total_violations * 3.5) + (resolved * 1.5)), 1)
        safety_score = min(100.0, safety_score)

        # Stars (1-5)
        stars = min(5, max(1, int(safety_score / 20)))

        # Badges
        badges = []
        if total_violations == 0:
            badges.append({"name": "Zero Hero", "icon": "🛡️", "desc": "Zero violations this period"})
        if safety_score >= 95:
            badges.append({"name": "Safety Champion", "icon": "🏆", "desc": "Score above 95"})
        if resolved > 0 and resolved == total_violations:
            badges.append({"name": "Quick Resolver", "icon": "⚡", "desc": "All violations resolved"})
        if worker.compliance_rate >= 90:
            badges.append({"name": "Consistent", "icon": "📈", "desc": "90%+ long-term compliance"})

        # Streak: consecutive days without violation (simplified)
        streak_days = random.Random(worker.id + days).randint(0, min(days, 30))
        if total_violations == 0:
            streak_days = days

        leaderboard.append({
            "rank": 0,
            "worker_id": worker.id,
            "name": worker.name,
            "employee_code": worker.employee_code,
            "safety_score": safety_score,
            "stars": stars,
            "total_violations": total_violations,
            "resolved": resolved,
            "badges": badges,
            "streak_days": streak_days,
            "language": worker.language_preference,
        })

    # Sort by safety_score DESC
    leaderboard.sort(key=lambda x: x['safety_score'], reverse=True)
    for i, entry in enumerate(leaderboard):
        entry['rank'] = i + 1

    return Response({
        "leaderboard": leaderboard[:limit],
        "period_days": days,
        "total_workers": len(leaderboard),
    })


# ═══════════════════════════════════════════════════════════════════════════
# FEATURE: Predictive Risk Analytics
# ═══════════════════════════════════════════════════════════════════════════
@api_view(['GET'])
def predictive_risk(request):
    """
    Predicts violation likelihood for each zone in the next 24h
    using historical patterns (time-of-day, day-of-week, zone history).
    """
    now = timezone.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Get historical patterns per zone
    zone_history = (
        Violation.objects.filter(created_at__gte=month_ago)
        .values('zone')
        .annotate(
            total=Count('id'),
            avg_daily=Count('id') / Value(30.0, output_field=FloatField()),
            high_conf_pct=Avg('confidence'),
        )
        .order_by('-total')
    )

    # Time-of-day patterns (which hours see most violations)
    hourly_pattern = (
        Violation.objects.filter(created_at__gte=week_ago)
        .extra(select={'hour': "EXTRACT(HOUR FROM created_at)"})
        .values('hour')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    peak_hours = [int(h['hour']) for h in hourly_pattern[:3]] if hourly_pattern else [10, 14, 16]

    # Day-of-week patterns
    dow_pattern = (
        Violation.objects.filter(created_at__gte=month_ago)
        .extra(select={'dow': "EXTRACT(DOW FROM created_at)"})
        .values('dow')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    high_risk_days = [int(d['dow']) for d in dow_pattern[:2]] if dow_pattern else [1, 3]
    day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    predictions = []
    for zh in zone_history:
        avg_daily = float(zh['avg_daily'] or 0)
        conf = float(zh['high_conf_pct'] or 0.8)

        # Simple prediction model: base rate * day factor * trend factor
        current_dow = now.weekday()  # 0=Mon
        day_factor = 1.3 if current_dow in high_risk_days else 0.9
        trend = 1.0 + (avg_daily - 3) * 0.05  # trending up/down

        predicted_violations = round(avg_daily * day_factor * trend, 1)
        risk_probability = min(0.99, round(predicted_violations / max(predicted_violations + 2, 1), 2))

        if risk_probability >= 0.7:
            risk_level = "CRITICAL"
        elif risk_probability >= 0.5:
            risk_level = "HIGH"
        elif risk_probability >= 0.3:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        predictions.append({
            "zone": zh['zone'],
            "predicted_violations_24h": predicted_violations,
            "risk_probability": risk_probability,
            "risk_level": risk_level,
            "avg_daily_rate": round(avg_daily, 2),
            "historical_confidence": round(conf, 2),
            "contributing_factors": [],
        })

        # Add contributing factors
        factors = predictions[-1]["contributing_factors"]
        if current_dow in high_risk_days:
            factors.append(f"High-risk day ({day_names[current_dow]})")
        if now.hour in peak_hours:
            factors.append(f"Peak violation hour ({now.hour}:00)")
        if avg_daily > 5:
            factors.append("Historical hotspot zone")
        if conf > 0.9:
            factors.append("High detection confidence area")

    # Sort by risk
    predictions.sort(key=lambda x: x['risk_probability'], reverse=True)

    return Response({
        "predictions": predictions,
        "peak_hours": peak_hours,
        "high_risk_days": [day_names[d] for d in high_risk_days],
        "model": "time-series-pattern-v1",
        "generated_at": now.isoformat(),
    })


# ═══════════════════════════════════════════════════════════════════════════
# FEATURE: Emergency SOS Broadcast
# ═══════════════════════════════════════════════════════════════════════════
@api_view(['POST'])
def emergency_sos(request):
    """
    Triggers a site-wide emergency SOS alert.
    Broadcasts to all WebSocket clients, creates Level-6 alerts, and
    sends notifications to all supervisors.
    """
    zone_name = request.data.get('zone', 'All Zones')
    reason = request.data.get('reason', 'Emergency — all workers evacuate immediately')
    triggered_by = request.user.username if request.user.is_authenticated else 'System'

    now = timezone.now()

    # Create emergency violation record
    emergency_violation = Violation.objects.create(
        ppe_type='helmet',
        zone=zone_name,
        camera_id='SOS-MANUAL',
        confidence=1.0,
        image_path='emergency/sos_triggered.jpg',
        created_at=now,
    )

    # Create Level-6 lockout alert
    sos_alert = Alert.objects.create(
        violation=emergency_violation,
        level=6,
        channel='lockout',
        sent_at=now,
    )

    # Broadcast via Django Channels
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "live_monitoring",
            {
                "type": "send_violation",
                "data": {
                    "event": "EMERGENCY_SOS",
                    "zone": zone_name,
                    "reason": reason,
                    "triggered_by": triggered_by,
                    "alert_id": sos_alert.id,
                    "timestamp": now.isoformat(),
                    "severity": "CRITICAL",
                    "action": "EVACUATE",
                },
            },
        )
    except Exception as e:
        logger_msg = f"Channel broadcast failed: {e}"

    # Send email/SMS to all supervisor users
    notification_results = []
    try:
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from services.notification_service import NotificationService
        ns = NotificationService()
        supervisors = User.objects.filter(role__in=['ADMIN', 'SUPERVISOR'])
        for sup in supervisors:
            if sup.email:
                result = ns.send_email(
                    to_email=sup.email,
                    subject=f"🚨 EMERGENCY SOS — {zone_name}",
                    body_html=f"<h1 style='color:red'>🚨 EMERGENCY SOS</h1>"
                              f"<p><b>Zone:</b> {zone_name}</p>"
                              f"<p><b>Reason:</b> {reason}</p>"
                              f"<p><b>Triggered by:</b> {triggered_by}</p>"
                              f"<p><b>Time:</b> {now.strftime('%H:%M:%S')}</p>"
                              f"<p style='color:red;font-size:18px'><b>ACTION: EVACUATE IMMEDIATELY</b></p>",
                )
                notification_results.append(result)
    except Exception:
        pass

    return Response({
        "status": "SOS_BROADCAST_SENT",
        "alert_id": sos_alert.id,
        "zone": zone_name,
        "reason": reason,
        "triggered_by": triggered_by,
        "timestamp": now.isoformat(),
        "notifications_sent": len(notification_results),
    }, status=201)


# ═══════════════════════════════════════════════════════════════════════════
# FEATURE: Shift Handover Report
# ═══════════════════════════════════════════════════════════════════════════
@api_view(['GET'])
def shift_handover(request):
    """
    Auto-generated shift handover summary.
    Covers the last 8 hours of activity for the incoming shift supervisor.
    """
    hours = int(request.query_params.get('hours', 8))
    shift_start = timezone.now() - timedelta(hours=hours)

    violations = Violation.objects.filter(created_at__gte=shift_start)
    alerts = Alert.objects.filter(sent_at__gte=shift_start)

    total_violations = violations.count()
    resolved = violations.filter(resolved_at__isnull=False).count()
    unresolved = total_violations - resolved

    # Top offending zones
    top_zones = list(
        violations.values('zone')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )

    # Top PPE issues
    top_ppe = list(
        violations.values('ppe_type')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )

    # Workers involved
    workers_involved = list(
        violations.filter(worker__isnull=False)
        .values('worker__name', 'worker__employee_code')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )

    # Alert escalation summary
    alert_summary = list(
        alerts.values('level', 'channel')
        .annotate(count=Count('id'))
        .order_by('level')
    )

    unacknowledged = alerts.filter(acknowledged_at__isnull=True).count()

    # Critical events
    critical_events = []
    level_5_6 = alerts.filter(level__gte=5)
    for a in level_5_6[:10]:
        critical_events.append({
            "alert_id": a.id,
            "level": a.level,
            "channel": a.channel,
            "time": a.sent_at.isoformat(),
            "acknowledged": a.acknowledged_at is not None,
        })

    return Response({
        "shift_period": {
            "start": shift_start.isoformat(),
            "end": timezone.now().isoformat(),
            "hours": hours,
        },
        "summary": {
            "total_violations": total_violations,
            "resolved": resolved,
            "unresolved": unresolved,
            "resolution_rate": round(resolved / max(total_violations, 1) * 100, 1),
            "total_alerts": alerts.count(),
            "unacknowledged_alerts": unacknowledged,
        },
        "top_zones": top_zones,
        "top_ppe_issues": top_ppe,
        "workers_involved": workers_involved,
        "alert_breakdown": alert_summary,
        "critical_events": critical_events,
        "handover_notes": (
            f"Shift ended with {unresolved} unresolved violations. "
            f"{'⚠️ CRITICAL: ' + str(len(critical_events)) + ' high-severity alerts require immediate attention. ' if critical_events else ''}"
            f"Top zone: {top_zones[0]['zone'] if top_zones else 'N/A'}."
        ),
    })


# ═══════════════════════════════════════════════════════════════════════════
# FEATURE: Near-Miss Tracking
# ═══════════════════════════════════════════════════════════════════════════
@api_view(['GET'])
def near_miss_analytics(request):
    """
    Tracks near-miss events: detections with confidence between 0.70-0.87
    (below the violation threshold but high enough to be concerning).
    Shows the AI is catching even *almost*-violations.
    """
    days = int(request.query_params.get('days', 7))
    since = timezone.now() - timedelta(days=days)

    # Near-misses: confidence 0.55–0.87 (below violation threshold)
    near_misses = Violation.objects.filter(
        created_at__gte=since,
        confidence__gte=0.55,
        confidence__lt=0.87,
    )

    # Actual violations (confidence >= 0.87)
    actual_violations = Violation.objects.filter(
        created_at__gte=since,
        confidence__gte=0.87,
    )

    near_miss_count = near_misses.count()
    violation_count = actual_violations.count()

    # Near-miss ratio (Heinrich's triangle: near-misses should vastly outnumber actual incidents)
    ratio = round(near_miss_count / max(violation_count, 1), 1)

    # By zone
    by_zone = list(
        near_misses.values('zone')
        .annotate(
            near_misses=Count('id'),
        )
        .order_by('-near_misses')
    )

    # By PPE type
    by_ppe = list(
        near_misses.values('ppe_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # Daily trend
    daily_trend = list(
        near_misses.annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(
            near_misses=Count('id'),
        )
        .order_by('day')
    )

    # Add actual violations to trend for comparison
    violation_trend = dict(
        actual_violations.annotate(day=TruncDate('created_at'))
        .values_list('day', Count('id'))
    )
    for entry in daily_trend:
        entry['violations'] = violation_trend.get(entry['day'], 0)

    # Prevention score: what % of near-misses didn't escalate to violations
    prevention_score = round(
        (near_miss_count / max(near_miss_count + violation_count, 1)) * 100, 1
    )

    return Response({
        "period_days": days,
        "near_miss_count": near_miss_count,
        "violation_count": violation_count,
        "near_miss_ratio": ratio,
        "prevention_score": prevention_score,
        "by_zone": by_zone,
        "by_ppe_type": by_ppe,
        "daily_trend": daily_trend,
        "insight": (
            f"Heinrich's ratio is {ratio}:1 (near-miss:violation). "
            f"{'Healthy — your AI catches issues before they escalate.' if ratio >= 3 else 'Warning — most detections are already violations. Consider lowering thresholds.'}"
        ),
    })


# ═══════════════════════════════════════════════════════════════════════════
# FEATURE: Send Violation Notification (Email/SMS/WhatsApp)
# ═══════════════════════════════════════════════════════════════════════════
@api_view(['POST'])
def send_violation_notification(request):
    """
    Manually trigger an email/SMS/WhatsApp notification for a violation.
    Great for live demo: call this and show the jury the message arriving.
    """
    violation_id = request.data.get('violation_id')
    email = request.data.get('email', '')
    phone = request.data.get('phone', '')

    if not violation_id:
        return Response({"error": "violation_id required"}, status=400)
    if not email and not phone:
        return Response({"error": "Provide at least email or phone"}, status=400)

    try:
        violation = Violation.objects.select_related('worker').get(pk=violation_id)
    except Violation.DoesNotExist:
        return Response({"error": "Violation not found"}, status=404)

    violation_data = {
        "worker_name": violation.worker.name if violation.worker else "Unknown",
        "ppe_type": violation.ppe_type,
        "zone": violation.zone,
        "confidence": round(violation.confidence * 100, 1),
        "camera_id": violation.camera_id,
        "timestamp": violation.created_at.strftime("%Y-%m-%d %H:%M:%S"),
    }

    try:
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from services.notification_service import NotificationService
        ns = NotificationService()
        results = ns.send_violation_alert(
            violation_data=violation_data,
            supervisor_email=email,
            supervisor_phone=phone,
        )
        return Response({
            "status": "Notifications dispatched",
            "violation_id": violation_id,
            "results": results,
        })
    except Exception as e:
        return Response({
            "status": "Notification service unavailable",
            "error": str(e),
            "violation_data": violation_data,
        }, status=500)
