import random
from datetime import datetime, timedelta

from django.db import connection
from django.db.models import Count, Avg, Q
from django.db.models.functions import TruncDate
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
