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
    # Router (CRUD for all models)
    path('', include(router.urls)),
]
