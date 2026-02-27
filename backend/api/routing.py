from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/live/(?P<camera_id>\w+)/$', consumers.LiveCameraConsumer.as_asgi()),
    re_path(r'ws/live/$', consumers.LiveMonitoringConsumer.as_asgi()),
]
