import cv2
import numpy as np
from ultralytics import YOLO
import redis
import json
import base64
import time
from pathlib import Path
import os
from minio import Minio
import uuid

# Configuration
YOLO_MODEL = 'yolov8n.pt'  # Using nano for faster dev iteration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/1')

class DetectionPipeline:
    def __init__(self):
        self.model = YOLO(YOLO_MODEL)
        self.redis_client = redis.from_url(REDIS_URL)
        
        # Load custom classes (we simulate it for now with COCO mappings as per prompt)
        # Assuming person is class 0 in COCO
        
        # Minio client
        minio_endpoint = os.environ.get('MINIO_ENDPOINT', 'minio:9000')
        minio_user = os.environ.get('MINIO_ROOT_USER', 'admin')
        minio_password = os.environ.get('MINIO_ROOT_PASSWORD', 'password123')
        self.minio_client = Minio(
            minio_endpoint,
            access_key=minio_user,
            secret_key=minio_password,
            secure=False
        )
        
        # Ensure bucket exists
        self.bucket_name = 'violations'
        try:
            if not self.minio_client.bucket_exists(self.bucket_name):
                self.minio_client.make_bucket(self.bucket_name)
        except Exception as e:
            print(f"MinIO initialization error: {e}")

    def process_frame(self, frame, camera_id, required_ppe_for_zone):
        """
        Process a single frame. Return the annotated frame.
        """
        results = self.model(frame, verbose=False)
        annotated_frame = results[0].plot()
        
        # Mocking PPE detection logic based on COCO classes for developer demonstration.
        # In a real model trained on PPE dataset, class IDs would map to PPE types directly.
        # Here we just detect people and simulate a violation.
        for result in results[0].boxes:
            conf = float(result.conf[0])
            cls_id = int(result.cls[0])
            
            # 0 is person in COCO
            if cls_id == 0 and conf > 0.8:  
                # Simulated checking against required PPE.
                # In actual implementation: check if detected PPE classes overlap with person bounding box.
                
                # We will trigger a mock violation if "helmet" is required just to test pipeline
                missing_ppe = []
                for req in required_ppe_for_zone:
                    # simplistic mock: assume they always miss helmet if required
                    # This should be replaced with real class detection overlapping person boinding box
                    if req in ['helmet', 'vest']:
                        missing_ppe.append(req)
                
                if missing_ppe:
                    self._emit_violation(frame, camera_id, conf, missing_ppe[0])
                    break # emit one per frame max for simplicity

        return annotated_frame

    def _emit_violation(self, frame, camera_id, confidence, ppe_type):
        """
        Save the frame to MinIO and emit event to Redis
        """
        # Save frame to MinIO
        img_id = str(uuid.uuid4())
        img_name = f"{img_id}.jpg"
        temp_path = f"/tmp/{img_name}"
        cv2.imwrite(temp_path, frame)
        
        try:
            self.minio_client.fput_object(
                self.bucket_name,
                img_name,
                temp_path,
                content_type="image/jpeg"
            )
            image_url = f"http://{os.environ.get('MINIO_ENDPOINT', 'localhost:9000')}/{self.bucket_name}/{img_name}"
        except Exception as e:
            print(f"MinIO upload error: {e}")
            image_url = ""
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

        # Emit to Redis
        event = {
            "camera_id": camera_id,
            "ppe_type": ppe_type,
            "confidence": confidence,
            "image_path": image_url,
            "timestamp": time.time()
        }
        self.redis_client.publish('violations', json.dumps(event))

# Singleton instance
pipeline = None
def get_pipeline():
    global pipeline
    if pipeline is None:
        pipeline = DetectionPipeline()
    return pipeline
