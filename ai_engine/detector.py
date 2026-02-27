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

# ---------------------------------------------------------------------------
# Singleton PPE model loader (avoids reloading the 52 MB model on every request)
# ---------------------------------------------------------------------------
_ppe_model = None
_ppe_model_path = os.path.join(os.path.dirname(__file__), 'models', 'yolov8m-ppe.pt')


def _get_ppe_model():
    global _ppe_model
    if _ppe_model is None:
        from ultralytics import YOLO
        _ppe_model = YOLO(_ppe_model_path)
    return _ppe_model


# Label mapping:  model class name  →  (ui_label, is_violation)
_LABEL_MAP = {
    'helmet':     ('Helmet',      False),
    'no_helmet':  ('No Helmet',   True),
    'goggles':    ('Goggles',     False),
    'no_goggles': ('No Goggles',  True),
    'glove':      ('Gloves',      False),
    'no_glove':   ('No Gloves',   True),
    'mask':       ('Mask',        False),
    'no_mask':    ('No Mask',     True),
    'shoes':      ('Boots',       False),
    'no_shoes':   ('No Boots',    True),
}

# Which positive→negative pairs exist for "missing" logic
_VIOLATION_PAIRS = {
    'helmet':  'no_helmet',
    'goggles': 'no_goggles',
    'glove':   'no_glove',
    'shoes':   'no_shoes',
    'mask':    'no_mask',
}


def verify_single_image_ppe(image_base64: str) -> dict:
    """Verifies PPE on a single image encoded as base64 using the YOLOv8m-ppe model.
    Returns approval status, missing items and **bounding-box detections** with
    normalised [0-1] coordinates so the frontend can draw overlays."""
    import base64 as _b64
    import cv2
    import numpy as np

    model = _get_ppe_model()

    # ── Decode image ──────────────────────────────────────────────────────
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    img_bytes = _b64.b64decode(image_base64)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img is None:
        return {"approved": False, "missing": ["Invalid Image"], "detections": [],
                "image_width": 0, "image_height": 0}

    img_h, img_w = img.shape[:2]

    # ── Run inference ─────────────────────────────────────────────────────
    results = model(img, verbose=False, conf=0.35)

    detections = []
    found_classes = set()    # positive class names seen
    violation_classes = set()  # negative class names seen
    CONF_THRESHOLD = 0.35

    for box in results[0].boxes:
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        raw_name = model.names[cls_id]

        if conf < CONF_THRESHOLD:
            continue

        # Bounding box in pixel coords → normalise to [0, 1]
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        bbox_norm = [
            round(x1 / img_w, 4),
            round(y1 / img_h, 4),
            round(x2 / img_w, 4),
            round(y2 / img_h, 4),
        ]

        ui_label, is_violation = _LABEL_MAP.get(raw_name, (raw_name, False))

        detections.append({
            "class": raw_name,
            "label": ui_label,
            "confidence": round(conf, 3),
            "bbox": bbox_norm,
            "is_violation": is_violation,
        })

        if is_violation:
            violation_classes.add(raw_name)
        else:
            found_classes.add(raw_name)

    # ── Determine missing items ───────────────────────────────────────────
    ui_missing = []
    for pos, neg in _VIOLATION_PAIRS.items():
        if neg in violation_classes and pos not in found_classes:
            human = _LABEL_MAP[pos][0].lower()
            ui_missing.append(human)

    approved = len(ui_missing) == 0

    return {
        "approved": approved,
        "missing": ui_missing,
        "detections": detections,
        "image_width": img_w,
        "image_height": img_h,
    }
