# SafeGuard AI - Antigravity Build Prompts

This document contains the 6-phase prompt strategy required to build the SafeGuard AI application. It has been adapted to reflect our recent switch to a **Django** backend (instead of FastAPI).

---

## 🏗️ PHASE 0 — Foundation & Setup (Status: Mostly Complete)

_Note: This phase has already been largely completed. The Django project is initialized, models are created, and `docker-compose.yml` is active._

**Prompt 0:**

```text
You are building SafeGuard AI — a Worker Safety PPE Violation Detector system.
Use the following tech stack EXACTLY:
  Backend: Python 3.11, Django, Django REST Framework
  Database: PostgreSQL 15 (via Docker), TimescaleDB extension for events
  Cache/Queue: Redis 7 for alert pub/sub and caching
  Storage: MinIO (S3-compatible) for video clips and report files
  Container: Docker + docker-compose for all services

Create this folder structure:
  safeguard-ai/
    backend/           - Django app
      config/          - settings, urls, wsgi, asgi
      api/             - DRF views, serializers, models
    ai_engine/         - vision and face detection
    alert_engine/      - alert and voice system
    frontend/          - React dashboard
    kiosk/             - Worker kiosk React app
    docker-compose.yml
    .env.example

Create ALL database models in Django for these tables:
  workers (id, name, employee_code, language_preference, face_embedding JSONField,
           compliance_rate FloatField, enrolled_at, is_active)
  violations (id, worker FK, ppe_type Choices, zone, camera_id, confidence FloatField,
              image_path, resolved_at, created_at)
  alerts (id, violation FK, level IntegerField 1-6, channel Choices, sent_at, acknowledged_at)
  compliance_reports (id, site FK, period_start, period_end, report_path, created_at)
  zones (id, name, required_ppe JSONField, camera_ids JSONField, is_high_risk BooleanField)
  sites (id, name, location, timezone, pa_system_ip, pa_system_port)

Create docker-compose.yml with: postgres (timescaledb), redis, minio, backend
Create .env.example with all required environment variables.
Create initial makemigrations and run migrate.
Create a health check endpoint GET /api/health/ that returns DB + Redis status.

STOP after this phase. Do not build any features yet.
DELIVERABLE: Running docker-compose up, /api/health/ returns 200 with DB connected.
```

---

## 👁️ PHASE 1 — AI Detection Engine (Status: Pending)

**Prompt 1:**

```text
Phase 0 is complete. Now build the AI detection engine for SafeGuard AI.

DETECTION SERVICE: ai_engine/detector.py
  Use ultralytics YOLOv8 (pip install ultralytics).
  Load model: yolov8m.pt as base, we will fine-tune later.
  For now, use COCO classes to detect: person(0), backpack-for vest approx.
  Create/Use a custom class mapping file: ai_engine/ppe_classes.yaml
    - 0: helmet
    - 1: no_helmet
    - 2: safety_vest
    - 3: no_vest
    - 4: safety_gloves
    - 5: no_gloves
    - 6: safety_goggles
    - 7: safety_boots
    - 8: body_harness

  Detection pipeline:
    1. Accept RTSP stream URL or local video file path
    2. Read frames at 30 FPS using OpenCV
    3. Run YOLOv8 inference on each frame (batch=1)
    4. For each detected person, check which PPE is present/missing
    5. If ANY required PPE for the zone is missing with confidence > 0.87:
       - Extract worker face ROI from frame
       - Emit violation event to Redis channel 'violations'
       - Save annotated frame to MinIO bucket 'violations'
    6. Return annotated frame with bounding boxes and labels

CAMERA MANAGER: ai_engine/camera_manager.py
  - Manage multiple RTSP streams concurrently using asyncio
  - Each camera runs in its own async task
  - Support up to 16 concurrent streams per node
  - Reconnect automatically on stream drop (max 3 retries, then alert)
  - Associate each camera_id with a zone from the zones table

API ENDPOINTS to add in backend/api/urls.py and views:
  POST /api/cameras/start/  - start monitoring a camera RTSP stream
  POST /api/cameras/stop/   - stop a camera stream
  GET  /api/cameras/        - list all active cameras and their status
  GET  /api/violations/     - paginated list of violations with filters
  GET  /api/violations/{id}/ - single violation with image URL
  WebSocket /ws/live/{camera_id}/ - stream annotated frames as JPEG (using Django Channels)

PERFORMANCE REQUIREMENTS:
  - Detection latency: < 200ms per frame (use GPU if available, CPU fallback)
  - Frame queue max size: 5 (drop oldest if full to maintain real-time)

STOP here. Test with a sample video file before Phase 2.
DELIVERABLE: POST /api/cameras/start/ with a test video, violations appear in DB.
```

---

## 👤 PHASE 2 — Worker Identity & Facial Recognition (Status: Pending)

**Prompt 2:**

```text
Phase 1 is complete and detecting violations. Now build the worker identity system.

FACIAL RECOGNITION ENGINE: ai_engine/face_recognition.py
  Use insightface library (pip install insightface onnxruntime)
  Model: buffalo_l (ArcFace ResNet100)
  Initialize: app = FaceAnalysis(name='buffalo_l')

  Functions to implement:
    enroll_face(worker_id, image_bytes) -> embedding (512-dim numpy array)
      - Detect face in image
      - Extract 512-dimensional ArcFace embedding
      - Normalize embedding (L2 norm)
      - Store as JSON in workers.face_embedding
      - Return success/failure with confidence

    identify_face(face_image_bytes, threshold=0.45) -> {worker_id, name, confidence}
      - Extract embedding from query face
      - Load all embeddings from workers table (cache in Redis with 5min TTL)
      - Compute cosine similarity against all enrolled workers
      - Return best match if similarity > threshold, else 'unknown'

  Integration with detection pipeline:
    When a violation is emitted to Redis 'violations' channel:
      1. Extract face ROI from the violation frame
      2. Run identify_face()
      3. Enrich the violation record with worker_id (or null if unknown)
      4. Update worker compliance_rate in workers table

WORKER PROFILE API (Django REST Framework): backend/api/views.py
  POST /api/workers/                     - create worker
  POST /api/workers/{id}/enroll-face/    - upload face photo for enrollment
  GET  /api/workers/                     - list workers with compliance stats
  GET  /api/workers/{id}/                - worker detail + violation history
  GET  /api/workers/{id}/safety-score/   - current week compliance percentage
  PUT  /api/workers/{id}/                - update worker details
  DELETE /api/workers/{id}/face/         - remove face embedding

PRIVACY RULES:
  - Never store actual face images — only embeddings
  - In privacy zones: skip face identification entirely

STOP here. Test face enrollment and recognition before Phase 3.
DELIVERABLE: Enroll 3 test faces, trigger violation, worker correctly identified.
```

---

## 🔊 PHASE 3 — Alert Engine & Voice System (Status: Pending)

**Prompt 3:**

```text
Phase 2 is complete. Now build the real-time alert engine and voice system.

ALERT ENGINE: alert_engine/alert_processor.py
  Subscribe to Redis channel 'violations'
  Implement 6-level escalation ladder:

  LEVEL 1 — Instant Visual + Voice (T+0ms)
    - Trigger: violation detected > 0.87 conf
    - Emit WebSocket event for flash overlay
    - Call VoiceAlertService.announce(...)
    - Store in Alerts table

  LEVEL 2 — Supervisor Push Notification (T+5 seconds)
    - Send FCM push to supervisor mobile app

  LEVEL 3 — Wristband Vibration (T+30 seconds)
    - Publish MQTT message to topics workers/{ worker_id }/wristband

  LEVEL 4 — Supervisor Auto-Call (T+90 seconds)
    - Use Twilio API to auto-call supervisor

  LEVEL 5 — Site Manager Dashboard Flag (T+3 minutes)
    - Set violation.is_escalated=True, emit WebSocket event

  LEVEL 6 — Access Lockout (T+3 minutes)
    - POST to zone.lockout_endpoint to trigger barrier

VOICE ALERT SERVICE: alert_engine/voice_service.py
  Use gTTS for TTS in multiple languages (Hindi, Telugu, Tamil, etc.)
  Templates: "Attention {name}. Please wear your helmet immediately."
  announce(zone_id, worker, missing_ppe_list):
    Generate MP3 -> Cache in Redis -> Play via PA system/speakers.

MQTT BROKER: alert_engine/mqtt_manager.py
  Use paho-mqtt to connect to Mosquitto

API ENDPOINTS: backend/api/views.py
  GET  /api/alerts/                - paginated alert history
  POST /api/alerts/{id}/acknowledge/ - supervisor acknowledges alert
  GET  /api/alerts/active/         - all unresolved violations
  POST /api/workers/{id}/notify/   - manually trigger voice notification

STOP here. Test the full escalation flow with a simulated violation.
DELIVERABLE: Violation triggers voice alert + push notification.
```

---

## 🖥️ PHASE 4 — React Dashboard + Worker Kiosk (Status: Pending)

**Prompt 4:**

```text
Phase 3 is complete. Now build the frontend: supervisor dashboard + worker kiosk.
These are TWO SEPARATE React apps.

TECH: React 18, Vite, TypeScript, TailwindCSS, shadcn/ui, Zustand, Recharts, Axios

===== APP 1: SUPERVISOR DASHBOARD (frontend/) =====
Route structure: /dashboard, /violations, /workers, /zones, /reports, /settings
LIVE MONITORING:
  Grid of camera feeds (JPEG stream via WebSocket)
  Violation flash overlay and ticker
  Stats cards & Zone heatmap
VIOLATION LOG:
  Filterable table with timestamps, images, and worker details. Modal for details.
WORKER PROFILE:
  Stats, Star count, violation charts, manual controls.

===== APP 2: WORKER KIOSK (kiosk/) =====
CRITICAL: Operable by completely illiterate workers. Zero text instructions.
KIOSK CHECK-IN FLOW:
  Screen 1: Face Scan (Camera activates, Voice prompt)
  Screen 2: Worker Recognized (Name, Stars display)
  Screen 3: PPE Status Check (6 grid icons Green/Red, Voice readout)
  Screen 4: Approved (Green) / Denied (Red)

STOP here. Test dashboard live feed + kiosk check-in flow end to end.
DELIVERABLE: Kiosk check-in works, violation appears on dashboard in <2 seconds.
```

---

## 📊 PHASE 5 — Compliance Reports & APIs (Status: Pending)

**Prompt 5:**

```text
Phase 4 is complete. Now build the reporting engine and external integrations.

REPORT GENERATION: backend/services/report_service.py
  Use ReportLab (PDF) and openpyxl (Excel).
  DAILY COMPLIANCE REPORT: Summary, PPE breakdown, Top offenders, Heatmap.
  DGMS INSPECTION REPORT: Forms A, B, C, D formatting.
  ESG QUARTERLY REPORT & INSURANCE PREMIUM REPORT.

REPORT API: backend/api/views.py
  GET  /api/reports/                  - list generated reports
  POST /api/reports/daily/            - trigger daily report
  POST /api/reports/dgms/             - generate DGMS format
  POST /api/reports/esg/              - generate ESG quarterly
  GET  /api/reports/{id}/download/    - download from MinIO

WHATSAPP INTEGRATION: backend/services/whatsapp_service.py
  - Twilio WhatsApp Business API for supervisor alerts with images.
  - Weekly worker safety score summary.

EXTERNAL INTEGRATIONS:
  - SAP PM Webhook receiver.
  - Twilio Voice (auto-call).
  - Email Reports (SMTP/SendGrid).

BACKGROUND JOBS (Celery / APScheduler with Django):
  - Midnight: generate daily report
  - 06:30: prep morning audio briefings
  - Friday 18:00: generate weekly leaderboard

STOP here. Do a full system end-to-end test.
DELIVERABLE: Full cycle — face detected, violation logged, voice alert, dashboard update, WhatsApp sent.
```
