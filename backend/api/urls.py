from django.urls import path, include
from . import views

from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'sites', views.SiteViewSet)
router.register(r'zones', views.ZoneViewSet)
router.register(r'workers', views.WorkerViewSet)
router.register(r'violations', views.ViolationViewSet)
router.register(r'alerts', views.AlertViewSet)
router.register(r'reports', views.ComplianceReportViewSet)
router.register(r'users', views.UserViewSet)

urlpatterns = [
    # Authentication
    path('auth/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Health
    path('health/', views.health_check, name='health-check'),
    # Camera management
    path('cameras/start/', views.start_camera, name='start-camera'),
    path('cameras/stop/', views.stop_camera, name='stop-camera'),
    path('cameras/', views.list_cameras, name='list-cameras'),
    # Analytics
    path('analytics/compliance/', views.analytics_compliance, name='analytics-compliance'),
    # Kiosk
    path('kiosk/scan-face/', views.kiosk_scan_face, name='kiosk-scan-face'),
    path('kiosk/verify-ppe/', views.kiosk_verify_ppe, name='kiosk-verify-ppe'),
    # Worker notifications
    path('workers/<int:pk>/notify/', views.worker_notify, name='worker-notify'),
    # Report generation
    path('reports/generate/daily/', views.generate_daily_report, name='generate-daily-report'),
    path('reports/generate/dgms/', views.generate_dgms_report, name='generate-dgms-report'),
    path('reports/generate/esg/', views.generate_esg_report, name='generate-esg-report'),
    # Dashboard stats
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    # Violation Heatmap
    path('analytics/heatmap/', views.violation_heatmap, name='violation-heatmap'),
    # Worker Safety Leaderboard
    path('analytics/leaderboard/', views.worker_leaderboard, name='worker-leaderboard'),
    # Predictive Risk Analytics
    path('analytics/predictions/', views.predictive_risk, name='predictive-risk'),
    # Near-miss Tracking
    path('analytics/near-misses/', views.near_miss_analytics, name='near-miss-analytics'),
    # Emergency SOS
    path('emergency/sos/', views.emergency_sos, name='emergency-sos'),
    # Shift Handover
    path('shift/handover/', views.shift_handover, name='shift-handover'),
    # Violation Notification (email/SMS/WhatsApp)
    path('notifications/send/', views.send_violation_notification, name='send-notification'),
    # Admin Dashboard (comprehensive stats)
    path('admin/dashboard/', views.admin_dashboard, name='admin-dashboard'),
    # System Analytics
    path('analytics/system/', views.system_analytics, name='system-analytics'),
    # Audit Log (aggregated timeline)
    path('audit-log/', views.audit_log, name='audit-log'),
    # Router (CRUD for all models)
    path('', include(router.urls)),
]
