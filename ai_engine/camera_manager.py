import asyncio
import cv2
import threading
import logging
from .detector import get_pipeline
import traceback

logger = logging.getLogger(__name__)

class CameraManager:
    def __init__(self):
        self.active_streams = {}  # camera_id -> task
        self.camera_metadata = {} # camera_id -> {"zone_id": 1, "required_ppe": ["helmet"]}
        # Using a lock to handle thread-safe task cancellation (if needed)
        self.lock = threading.Lock()

    def start_camera(self, camera_id, stream_url, zone_id, required_ppe):
        """Start monitoring a camera stream."""
        with self.lock:
            if camera_id in self.active_streams:
                logger.info(f"Camera {camera_id} is already running.")
                return False
                
            self.camera_metadata[camera_id] = {
                "zone_id": zone_id,
                "required_ppe": required_ppe,
                "stream_url": stream_url
            }
            
            # Start loop in a background task
            # Using asyncio.create_task if we have an event loop running, 
            # otherwise handle threads directly since this might run in ASGI context
            loop = asyncio.get_event_loop()
            task = loop.create_task(self._process_stream(camera_id))
            self.active_streams[camera_id] = task
            return True

    def stop_camera(self, camera_id):
        """Stop monitoring a camera stream."""
        with self.lock:
            if camera_id in self.active_streams:
                self.active_streams[camera_id].cancel()
                del self.active_streams[camera_id]
                del self.camera_metadata[camera_id]
                return True
            return False

    def list_cameras(self):
        """List all active cameras and their metadata."""
        return self.camera_metadata.copy()

    async def _process_stream(self, camera_id):
        """Async loop to continuously fetch frames from RTSP stream."""
        retries = 0
        max_retries = 3
        
        while retries < max_retries:
            try:
                metadata = self.camera_metadata.get(camera_id)
                if not metadata:
                    break
                    
                url = metadata['stream_url']
                cap = cv2.VideoCapture(url)
                
                if not cap.isOpened():
                    logger.warning(f"Failed to open stream for {camera_id}. Retrying...")
                    retries += 1
                    await asyncio.sleep(5)
                    continue
                    
                retries = 0  # reset on successful open
                
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        logger.warning(f"Stream dropped for {camera_id}. Reconnecting...")
                        break
                        
                    # Process frame - runs inference synchronously (blocking)
                    # For a true high-throughput async app, run_in_executor would be better
                    pipeline = get_pipeline()
                    try:
                        # Required PPE rules
                        required_ppe = metadata['required_ppe'] 
                        annotated_frame = pipeline.process_frame(frame, camera_id, required_ppe)
                        
                        # Send this annotated_frame to WebSockets via Django Channels
                        from channels.layers import get_channel_layer
                        channel_layer = get_channel_layer()
                        
                        # encode frame to jpeg
                        _, buffer = cv2.imencode('.jpg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                        frame_bytes = buffer.tobytes()
                        
                        if channel_layer:
                            await channel_layer.group_send(
                                f"camera_{camera_id}",
                                {
                                    'type': 'send_frame',
                                    'frame': frame_bytes
                                }
                            )

                    except Exception as e:
                        logger.error(f"Error processing frame for {camera_id}: {e}")
                        traceback.print_exc()

                    # Slight yield so we don't block the loop entirelly
                    await asyncio.sleep(0.01)

                cap.release()

            except asyncio.CancelledError:
                logger.info(f"Task for camera {camera_id} was cancelled.")
                if 'cap' in locals() and cap.isOpened():
                    cap.release()
                break
            except Exception as e:
                logger.error(f"Camera manager loop error for {camera_id}: {e}")
                retries += 1
                await asyncio.sleep(5)

        if retries >= max_retries:
            logger.error(f"Camera {camera_id} stopped permanently after {max_retries} failures.")
            with self.lock:
                if camera_id in self.active_streams:
                    del self.active_streams[camera_id]

camera_manager = CameraManager()
