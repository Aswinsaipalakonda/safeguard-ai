import json
from channels.generic.websocket import AsyncWebsocketConsumer

class LiveCameraConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.camera_id = self.scope['url_route']['kwargs']['camera_id']
        self.group_name = f"camera_{self.camera_id}"
        
        # Join room group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        pass # Client doesn't need to send us anything
        
    async def send_frame(self, event):
        """Send a frame down the WebSocket (called from channel layer)"""
        frame_bytes = event['frame']
        await self.send(bytes_data=frame_bytes)

class LiveMonitoringConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "live_monitoring"
        
        # Join room group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        pass
        
    async def send_violation(self, event):
        """Send a violation event down the WebSocket"""
        violation_data = event['data']
        await self.send(text_data=json.dumps(violation_data))
