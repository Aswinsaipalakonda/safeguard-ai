# SafeGuard AI — Next Phase Implementation Plan

> **Project:** SafeGuard AI — AI-Powered PPE Compliance & Worker Safety Platform  
> **Target Event:** LNIT SUMMIT 2K26  
> **Document Purpose:** Phase-wise feature roadmap with ready-to-use implementation prompts  

---

## Current State Summary

### ✅ Already Built
- **Supervisor Dashboard:** Live Monitoring (auto-simulation), Violations Log, Violation Heatmap, Safety Leaderboard, Compliance Reports (3 chart types), Settings (5 tabs)
- **Worker Kiosk:** Face Scan Screen (camera + TTS), PPE Check Screen (card-based results)
- **Backend API:** Django REST (JWT auth, CRUD for Sites/Zones/Workers/Violations/Alerts/Reports), WebSocket consumers, Analytics endpoints, Notification engine (Email/SMS/WhatsApp via Twilio)
- **AI Engine:** YOLOv8 detection pipeline, camera manager (RTSP), Redis pub/sub violations, MinIO frame storage
- **Demo Mode:** All pages work without backend using rich fallback data

### ❌ Gaps to Address
- No real-time CV bounding box visualization on worker kiosk
- No worker attendance tracking
- No live camera feed rendering on supervisor dashboard
- AI engine uses mock PPE logic (COCO person detection, not real PPE model)
- No trained PPE detection model or dataset pipeline

---

## PHASE 1 — Computer Vision: Real PPE Detection Model

**Goal:** Replace mock detection with a real YOLOv8 model trained on PPE dataset that draws colored bounding boxes (green = compliant, red = violation).

### 1.1 — PPE Dataset Setup & Model Training

**Prompt:**
```
Set up the PPE detection model training pipeline for SafeGuard AI.

1. Create a new directory `ai_engine/training/` with the following:

2. Create `ai_engine/training/download_dataset.py`:
   - Use the Roboflow API to download the "Construction Safety" dataset
     (roboflow.com/universe/roboflow-universe-projects/construction-site-safety)
   - Alternative: Use the "PPE Detection" dataset from Roboflow
     (https://universe.roboflow.com/ppe-detection-yolov8/ppe-detection-cstep)  
   - Download in YOLOv8 format to `ai_engine/training/dataset/`
   - The dataset should have these classes: helmet, no_helmet, safety_vest, no_vest, 
     safety_goggles, gloves, boots, person, head, face
   - Create a `data.yaml` pointing to train/val/test splits

3. Create `ai_engine/training/train.py`:
   - Load YOLOv8s (small) as base model using ultralytics
   - Train on the PPE dataset for 50 epochs
   - Image size 640, batch 16
   - Save best weights to `ai_engine/models/ppe_best.pt`
   - Log training metrics (mAP50, mAP50-95, precision, recall)
   - Add early stopping patience=10

4. Create `ai_engine/training/evaluate.py`:
   - Load the trained model
   - Run inference on test split
   - Print per-class AP, confusion matrix
   - Save sample inference images to `ai_engine/training/results/`

5. Update `ai_engine/ppe_classes.yaml` to match the actual dataset class mapping.

Tech: Python, ultralytics>=8.0, roboflow SDK, PyTorch
```

### 1.2 — Upgrade Detection Pipeline with Real PPE Model

**Prompt:**
```
Upgrade `ai_engine/detector.py` to use the trained PPE detection model instead of mock COCO detection.

Current file: ai_engine/detector.py (uses yolov8n.pt COCO model with mock PPE logic)

Changes needed:

1. Load the custom trained model from `ai_engine/models/ppe_best.pt` instead of `yolov8n.pt`
   - Fallback to `yolov8n.pt` if custom model doesn't exist (for dev environments)

2. Rewrite `process_frame()`:
   - Run inference on the frame
   - For each detection, get class name and confidence
   - Map detections to PPE categories: 
     * "helmet" / "no_helmet" → head protection
     * "safety_vest" / "no_vest" → body protection
     * "safety_goggles" → eye protection
     * "gloves" → hand protection
     * "boots" → foot protection
     * "person" → worker bounding box
   
   - Draw bounding boxes on the frame:
     * GREEN box (#00FF00) + label for compliant items (helmet, safety_vest, goggles, etc.)
     * RED box (#FF0000) + label for violations (no_helmet, no_vest, etc.)
     * CYAN box (#00FFFF) for person detection
     * Each box should have: class label + confidence % text above it
     * Label format: "WORKER_XXX (COMPLIANT)" or "WORKER_XXX (NO_HELMET)"
   
   - Compare detected PPE against zone's required_ppe list
   - Return: annotated_frame, list of violations, list of compliant items, worker_count

3. Add a new method `process_kiosk_frame(frame)`:
   - Designed for close-up single-worker PPE check
   - Returns: dict of {ppe_item: {detected: bool, confidence: float, bbox: [x1,y1,x2,y2]}}
   - Should check: helmet, vest, goggles, gloves, boots

4. Keep the _emit_violation() method for Redis pub/sub but update it to include:
   - worker bounding box coordinates
   - all missing PPE items (not just one)
   - compliance_status: "compliant" or "non_compliant"

Tech: ultralytics, OpenCV, numpy
```

### 1.3 — Add Live Camera Feed with Bounding Boxes to Dashboard

**Prompt:**
```
Create a live camera feed view on the Supervisor Dashboard that shows real-time 
AI-annotated frames with PPE bounding boxes.

Backend changes (backend/api/consumers.py):
1. Create a `CameraStreamConsumer` WebSocket consumer:
   - Room group: "camera_{camera_id}"
   - Receives annotated JPEG frames from the AI engine
   - Sends base64-encoded frames to connected frontends
   - Also sends metadata: {worker_count, violations_count, fps, ai_accuracy}

2. Add to routing.py:
   - ws/camera/<camera_id>/ → CameraStreamConsumer

Frontend changes:
1. Create `frontend/src/components/CameraFeedView.tsx`:
   - Props: cameraId, cameraName, zone
   - Connects to ws://localhost:8000/ws/camera/{cameraId}/
   - Renders frames on a <canvas> element at ~15fps
   - Shows overlay HUD with:
     * Top-left: "CAM-{id} ● LIVE  ZONE {name}" in green monospace
     * Top-right: "AI ACCURACY: {accuracy}%"
     * Bottom-left: "COORD: {lat} / {lon}", "TEMP: {temp}°C", "MOTION: DETECTED"
     * Dark semi-transparent background (#0a0a0a95)
   - When no WebSocket: show a simulated placeholder with:
     * Dark warehouse background image
     * 2 animated mock bounding boxes (one green "WORKER_042 (COMPLIANT)", one red "WORKER_089 (NO_HELMET)")
     * Boxes should slowly drift/pulse to simulate live detection

2. Create `frontend/src/components/PPEBreakdownPanel.tsx`:
   - Side panel showing per-PPE compliance bars
   - Items: Hard Hat, Safety Vest, Gloves, Boots, Eye Protection
   - Each has a horizontal progress bar (green portion = compliant %, red = violation %)
   - Updates in real-time from WebSocket data

3. Update LiveMonitoring.tsx:
   - Add a "Camera View" mode toggle (grid view vs current card view)
   - In camera view mode: show 2x2 grid of CameraFeedView components
   - Each camera feed has the PPE breakdown panel on hover

Tech: React, TypeScript, WebSocket, Canvas API, TailwindCSS
```

---

## PHASE 2 — Worker Kiosk: CV-Powered PPE Verification with Visual Feedback

**Goal:** Transform the worker kiosk PPE check screen into a real-time camera view showing bounding boxes around each PPE item (green = present, red = missing), matching the reference screenshot.

### 2.1 — Kiosk PPE Check with Camera + Bounding Boxes

**Prompt:**
```
Completely redesign the Worker Kiosk PPE Check screen (frontend/src/kiosk/PPECheckScreen.tsx)
to show a live camera feed with AI bounding box overlays.

The new design should match this layout:
┌─────────────────────────────────────┬──────────────────┐
│  CAM-1 ● LIVE  ZONE A              │  PPE BREAKDOWN   │
│  ┌─────────────┐  ┌────────────┐   │                  │
│  │ GREEN BOX   │  │  RED BOX   │   │  Hard Hat   82%  │
│  │ WORKER_042  │  │ WORKER_089 │   │  ████████░░      │
│  │ (COMPLIANT) │  │(NO_HELMET) │   │                  │
│  │             │  │            │   │  Safety     96%  │
│  │             │  │            │   │  Vest             │
│  │             │  │            │   │  ██████████░      │
│  └─────────────┘  └────────────┘   │  ...              │
│                                      │                  │
│  COORD: 42.12N / 12.04W            │  Eye        75%  │
│  TEMP: 24.5°C                       │  Protection      │
│  MOTION: DETECTED                   │  ████████░░░     │
└─────────────────────────────────────┴──────────────────┘

Implementation:

1. Use the device camera (navigator.mediaDevices.getUserMedia) to get live video
2. Display the video feed on a <canvas> with a dark overlay (#0a0a0a background)
3. Draw mock bounding boxes on the canvas:
   - For demo/fallback (no backend): Simulate 2 workers
     * Worker 1: Green bounding box, label "WORKER_042 (COMPLIANT)" 
     * Worker 2: Red bounding box, label "WORKER_089 (NO_HELMET)"
     * Red box should have a pulsing red glow effect
   - Bounding box style: 2px solid, corners slightly rounded
   - Label: monospace font, positioned above the box, with semi-transparent dark background
   
4. When backend IS available: POST frames to /api/kiosk/verify-ppe/ 
   and receive bounding box coordinates + class labels to draw

5. HUD Overlay (green monospace text on dark background):
   - Top bar: "CAM-1 ● LIVE  ZONE A" (left) + "AI ACCURACY: 98.4%" (right)
   - Bottom bar: "COORD: 42.12N / 12.04W" + "TEMP: 24.5°C" + "MOTION: DETECTED"

6. Right panel — PPE Breakdown:
   - List each PPE type with a horizontal bar chart
   - Bar = green fill for compliance %, remaining = red for violation %
   - Items: Hard Hat, Safety Vest, Gloves, Boots, Eye Protection
   - Percentages should animate on load
   - Update every 2 seconds with slight random fluctuation for demo

7. After 4 seconds of scanning:
   - If all required PPE detected → Green flash + "ALL CLEAR — PROCEED TO WORK"
   - If missing PPE → Red flash + list missing items + "FIX GEAR & RETRY" button
   - Play TTS voice announcement (existing speak() function)

8. Keep the existing bilingual support (English/Hindi)

Styling: Dark terminal/HUD theme (#0a0a0a background, green #00FF00 monospace text)
Tech: React, Canvas API, TypeScript, TailwindCSS, navigator.mediaDevices
```

### 2.2 — Backend: Frame-by-Frame PPE Analysis Endpoint

**Prompt:**
```
Upgrade the backend /api/kiosk/verify-ppe/ endpoint to accept camera frames
and return bounding box data for PPE detection.

Update backend/api/views.py — kiosk_verify_ppe function:

1. Accept POST with either:
   a) JSON body (current behavior for mock) OR
   b) multipart/form-data with a "frame" field containing a JPEG image

2. When a frame is received:
   - Decode the JPEG into a numpy array using OpenCV
   - Pass to DetectionPipeline.process_kiosk_frame(frame)
   - Return JSON response:
     {
       "status": "compliant" | "non_compliant",
       "worker_id": "WORKER_042",
       "detections": [
         {"class": "helmet", "confidence": 0.95, "bbox": [120, 50, 280, 180], "status": "present"},
         {"class": "no_vest", "confidence": 0.88, "bbox": [100, 180, 300, 450], "status": "missing"},
         {"class": "person", "confidence": 0.97, "bbox": [80, 30, 320, 500], "status": "detected"}
       ],
       "missing": ["vest"],
       "present": ["helmet", "goggles", "boots"],
       "ai_accuracy": 94.2,
       "timestamp": "2026-02-27T10:30:00Z"
     }

3. When no frame (JSON body only):
   - Keep current mock behavior for demo fallback
   - Return same response format but with simulated data

4. Add rate limiting: max 10 frames/second per kiosk session

Tech: Django REST Framework, OpenCV (cv2), numpy, ultralytics
```

---

## PHASE 3 — Automatic Attendance System

**Goal:** When a worker passes face scan + PPE check at the kiosk, automatically mark attendance and show it on the supervisor dashboard.

### 3.1 — Attendance Model & API

**Prompt:**
```
Add an automatic attendance tracking system to SafeGuard AI.

Backend changes:

1. Add new models to backend/api/models.py:

   class Attendance(models.Model):
       worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='attendance_records')
       site = models.ForeignKey(Site, on_delete=models.CASCADE)
       zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True)
       check_in = models.DateTimeField(auto_now_add=True)
       check_out = models.DateTimeField(null=True, blank=True)
       check_in_method = models.CharField(max_length=50, default='kiosk_face_scan')
       ppe_status = models.CharField(max_length=20, default='compliant')  # compliant / non_compliant
       face_confidence = models.FloatField(default=0.0)
       shift = models.CharField(max_length=20, default='DAY')  # DAY / NIGHT / GENERAL
       
       class Meta:
           ordering = ['-check_in']

   class Shift(models.Model):
       name = models.CharField(max_length=100)
       site = models.ForeignKey(Site, on_delete=models.CASCADE)
       start_time = models.TimeField()
       end_time = models.TimeField()
       days = models.JSONField(default=list)  # ["MON","TUE",...]

2. Add serializers for Attendance and Shift in serializers.py

3. Add API endpoints in urls.py:
   - GET  /api/attendance/today/       → Today's attendance list with worker names, check-in times, PPE status
   - GET  /api/attendance/stats/       → {total_workers, present_today, absent, late_arrivals, avg_check_in_time}
   - GET  /api/attendance/history/     → Filterable by date range, worker, zone
   - POST /api/attendance/check-in/    → Called by kiosk after successful PPE check
   - POST /api/attendance/check-out/   → Manual or automatic end-of-shift

4. Update the kiosk flow:
   - After face scan → identify worker
   - After PPE check passes → auto POST to /api/attendance/check-in/ with:
     {worker_id, site_id, zone_id, ppe_status, face_confidence, shift}
   - Return check-in confirmation to kiosk

5. Run makemigrations and migrate

Tech: Django, DRF, PostgreSQL
```

### 3.2 — Supervisor Dashboard: Attendance Page

**Prompt:**
```
Create a new "Attendance" page for the Supervisor Dashboard showing real-time 
worker attendance data.

1. Create frontend/src/pages/Attendance.tsx:

   Layout:
   ┌─────────────────────────────────────────────────────────────┐
   │  📋 Worker Attendance          Today: Feb 27, 2026   [PDF] │
   ├──────────┬──────────┬──────────┬──────────────────────────┤
   │ Present  │ Absent   │ Late     │ Avg Check-in             │
   │   47     │    3     │    5     │   8:12 AM                │
   └──────────┴──────────┴──────────┴──────────────────────────┘
   
   ┌─ Attendance Timeline (horizontal bar chart) ──────────────┐
   │  6AM  7AM  8AM  9AM  10AM  11AM  12PM                     │
   │  ░░░░░████████████████░░░░░░░░░░░ (check-in distribution) │
   └───────────────────────────────────────────────────────────┘
   
   ┌─ Worker List ─────────────────────────────────────────────┐
   │ Photo │ Name          │ Check-in │ PPE   │ Zone  │ Status│
   │  👤   │ Rajesh Kumar  │ 7:45 AM  │ ✅    │ Zone A│ Active│
   │  👤   │ Suresh Reddy  │ 8:02 AM  │ ✅    │ Zone B│ Active│
   │  👤   │ Anand Sharma  │  —       │  —    │  —    │Absent │
   │  👤   │ Priya Nair    │ 8:30 AM  │ ⚠️    │ Zone A│ Late  │
   └───────────────────────────────────────────────────────────┘

   Features:
   - 4 stat cards: Present, Absent, Late Arrivals, Avg Check-in Time
   - Attendance timeline using Recharts BarChart (hourly distribution)
   - Searchable, sortable worker attendance table
   - Status badges: Active (green), Late (amber), Absent (red)
   - PPE Status: ✅ Compliant, ⚠️ Violation at entry
   - Date picker to view historical attendance
   - Export attendance report as CSV
   - Auto-refresh every 30 seconds
   
   Demo fallback data: 15 workers with realistic Indian names, varied check-in times,
   3 absent, 5 late arrivals, mix of PPE statuses

2. Add nav link in DashboardLayout.tsx:
   - Icon: ClipboardList from lucide-react
   - Label: "Attendance"
   - Position: after "Leaderboard" in the nav

3. Add route in App.tsx:
   - /attendance → Attendance component

4. Style: Same design system as other pages (rounded-[2rem] cards, slate/indigo palette)

Tech: React, TypeScript, Recharts, TailwindCSS, lucide-react
```

### 3.3 — Kiosk Integration: Auto Check-in After PPE Pass

**Prompt:**
```
Update the Worker Kiosk flow to automatically record attendance after successful
face scan + PPE verification.

Changes to frontend/src/kiosk/PPECheckScreen.tsx:
1. When PPE check passes (approved === true):
   - Automatically POST to /api/attendance/check-in/ with worker data
   - Show a "CHECK-IN CONFIRMED" overlay with:
     * Worker name, Employee ID
     * Check-in time
     * Assigned zone
     * Shift: "Day Shift (6AM - 2PM)"
     * A countdown (3 seconds) before redirecting
   - If API fails, still proceed (attendance is a bonus, not a blocker)

2. When PPE check fails (approved === false):
   - Show "GEAR CHECK FAILED — ATTENDANCE NOT RECORDED"
   - Still allow retry

Changes to frontend/src/kiosk/FaceScanScreen.tsx:
1. After successful face scan, store identified worker info in Zustand:
   - worker_id, worker_name, employee_code, assigned_zone
2. Pass this data to PPECheckScreen via store

Changes to frontend/src/store.ts:
1. Add worker session state:
   - currentWorker: {id, name, code, zone} | null
   - setCurrentWorker action
   - clearCurrentWorker action

Tech: React, Zustand, TypeScript, Axios
```

---

## PHASE 4 — Enhanced Supervisor Dashboard Features

**Goal:** Add high-impact analytics and monitoring features that demonstrate production-readiness.

### 4.1 — Real-Time Incident Timeline

**Prompt:**
```
Create a "Timeline" page showing a chronological incident timeline 
with rich media and interactions.

Create frontend/src/pages/IncidentTimeline.tsx:

Layout: Vertical timeline (like GitHub activity feed)

Each timeline entry:
┌──────────────────────────────────────────────┐
│ ● 10:42 AM — Helmet Violation                │
│   Rajesh Kumar · Excavation Area A            │
│   ┌────────────────┐                         │
│   │ [AI Frame]     │  Confidence: 94%        │
│   │ with bbox      │  Camera: CAM-4          │
│   └────────────────┘  Response: 12s          │
│   [Mark Resolved] [Escalate] [View Worker]   │
└──────────────────────────────────────────────┘

Features:
- Infinite scroll loading (20 events at a time)
- Filter by: severity (high/medium/low), zone, PPE type, date range
- Each entry shows: AI detection frame thumbnail, worker name, zone, 
  confidence score, response time, status
- Clickable to expand with full details
- Color-coded: red (critical), amber (medium), blue (low), green (resolved)
- Live: new entries animate in from top when simulation generates events
- Demo data: 25 pre-loaded timeline entries spanning last 24 hours

Add nav link: "Timeline" with Clock icon, positioned after Dashboard

Tech: React, TypeScript, TailwindCSS, Recharts (for response time sparklines)
```

### 4.2 — Worker Profile & Compliance History

**Prompt:**
```
Create a Worker Profile page showing individual worker safety analytics.

Create frontend/src/pages/WorkerProfile.tsx:

Layout:
┌─ Worker Header ──────────────────────────────────┐
│  [Avatar]  Rajesh Kumar                          │
│            Employee: EMP-042 · Zone A             │
│            Compliance Score: 94% ████████████░    │
│            Streak: 🔥 12 days violation-free      │
│            [Send Alert] [View History] [Flag]     │
└──────────────────────────────────────────────────┘

┌─ Compliance Trend (30-day line chart) ───────────┐
│  Shows daily compliance % with violation markers  │
└──────────────────────────────────────────────────┘

┌─ Violation History ──────────────────────────────┐
│  Date       │ Type    │ Zone   │ Resolved │ Time │
│  Feb 25     │ Helmet  │ Zone A │ ✅ Yes   │ 8min │
│  Feb 20     │ Vest    │ Zone B │ ✅ Yes   │ 3min │
└──────────────────────────────────────────────────┘

┌─ Attendance Record ──────────────────────────────┐
│  Calendar heatmap (GitHub-style contribution map)│
│  showing check-in patterns over last 3 months    │
└──────────────────────────────────────────────────┘

Features:
- Accessed from Leaderboard (click on worker) or search
- 30-day compliance trend chart (Recharts Area chart)
- Violation history table with severity badges
- GitHub-style attendance heatmap (green = on-time, amber = late, red = absent)
- Safety badges earned (streak achievements)
- "Send Warning" and "Send Appreciation" buttons
- Demo data for 10 workers with realistic histories

Route: /workers/:id → WorkerProfile

Tech: React, TypeScript, Recharts, TailwindCSS
```

### 4.3 — AI Analytics Dashboard (Jury-Impressor)

**Prompt:**
```
Create an "AI Insights" page showing the AI engine's performance metrics 
and predictive analytics — this is a major jury differentiator.

Create frontend/src/pages/AIInsights.tsx:

Section 1 — Model Performance:
- Real-time accuracy gauge (circular progress, like a speedometer)
- Per-class detection accuracy: table showing helmet 96%, vest 93%, goggles 88%, etc.
- Inference speed: "23ms/frame" with sparkline
- False positive / false negative rates
- Model confidence distribution histogram

Section 2 — Predictive Risk:
- "Risk Heatmap by Hour" — which zones are most dangerous at which times
  (matrix chart: zones × hours, color = risk level)
- "Predicted violations in next 4 hours" — ML prediction cards
- "Weather-correlated risk" — show how temperature/humidity affects violations

Section 3 — AI Training Stats:
- Training epoch chart (loss curve)
- mAP50, mAP50-95 gauges
- Dataset statistics: total images, class distribution bar chart
- Last trained: timestamp, model version

Demo data: All sections populated with realistic demo metrics.
Dark theme sections for the AI cards to make it look premium.

Add nav link: "AI Insights" with BrainCircuit icon

Tech: React, Recharts (AreaChart, RadarChart, BarChart), TailwindCSS
```

---

## PHASE 5 — Advanced Worker Kiosk Features

**Goal:** Make the worker kiosk a complete self-service safety station.

### 5.1 — Worker Self-Registration Kiosk

**Prompt:**
```
Add a worker self-registration flow to the kiosk for new workers.

Create frontend/src/kiosk/WorkerRegistration.tsx:

Flow:
1. "NEW WORKER? TAP TO REGISTER" button on FaceScanScreen
2. Step 1: Enter name & employee code (large touch-friendly inputs)
3. Step 2: Select language preference (English, Hindi, Telugu, Tamil)
4. Step 3: Face enrollment — capture 3 photos from different angles
5. Step 4: Capture photo for ID card
6. Step 5: Confirmation screen with worker card preview

Backend: POST /api/workers/register/ (create Worker + face embeddings)

Style: Same dark kiosk theme, large touch targets (min 48px), 
       voice guidance in selected language, progress steps indicator

Tech: React, MediaDevices API, Canvas, TailwindCSS
```

### 5.2 — Safety Briefing Video Kiosk

**Prompt:**
```
Add a mandatory safety briefing screen to the kiosk flow.

Create frontend/src/kiosk/SafetyBriefing.tsx:

Position in flow: After Face Scan, Before PPE Check

Features:
- Play a short (30-60 second) safety reminder video or animation
- Content based on the worker's assigned zone hazards
- Available in English and Hindi (based on worker's language)
- Worker must watch at least 80% before "Continue" button activates
- Shows today's specific safety alerts (e.g., "High wind warning in Zone C")
- Quiz question at end: "What is required PPE for your zone?" (multiple choice)
  - Must answer correctly to proceed
  - Wrong answer → replay relevant section

Demo: Use a placeholder video/animation with safety icons and text overlays

Route: /kiosk/briefing (between /kiosk and /kiosk/ppe)

Tech: React, HTML5 Video, CSS animations, TailwindCSS
```

### 5.3 — Emergency SOS Button on Worker Kiosk

**Prompt:**
```
Add a persistent SOS emergency button to all kiosk screens.

Changes:
1. Add a floating red SOS button (bottom-right corner) on all kiosk screens
2. On tap: 
   - Full-screen red alert overlay
   - "EMERGENCY ALERT SENT" confirmation
   - Auto-call to supervisor (POST /api/emergency/sos/)
   - Play loud alarm sound
   - Auto-send GPS location
   - Show "Help is on the way" with countdown
   - "Cancel" option within 5 seconds
3. Backend: SOS triggers:
   - WebSocket alert to all supervisor dashboards
   - SMS to supervisor via Twilio
   - Log the emergency event

Style: Pulsing red circle, "SOS" text, always visible
```

---

## PHASE 6 — Infrastructure & Production Hardening

**Goal:** Make the system deployable and production-grade.

### 6.1 — Docker Compose: Full Stack

**Prompt:**
```
Update docker-compose.yml to run the complete SafeGuard AI stack locally.

Services:
1. frontend — Vite dev server (port 5173) or Nginx serving built assets
2. backend — Django with Daphne (ASGI, port 8000) 
3. ai-engine — Python worker that processes camera frames
4. postgres — PostgreSQL 15 (port 5432)
5. redis — Redis 7 (port 6379)
6. minio — MinIO object storage (port 9000, console 9001)

Add:
- Shared network between all services
- Health checks for each service
- Volume mounts for persistent data
- Environment variables file (.env.example)
- Backend auto-runs migrations on startup
- Backend seeds demo data (setup_default_roles, create demo workers/zones)
- Frontend env points to backend API

Tech: Docker, Docker Compose v3.8
```

### 6.2 — Seed Data Management Command

**Prompt:**
```
Create a comprehensive Django management command that seeds the database with 
realistic demo data for jury demonstrations.

Create backend/api/management/commands/seed_demo_data.py:

The command should create:
1. 1 Site: "Manufacturing Plant Alpha" in Industrial Zone, Sector 4
2. 6 Zones: Excavation Area A, Conveyor Belt Section, Underground Shaft B, 
   Blasting Zone C, Processing Plant, Loading Dock — each with required_ppe lists
3. 15 Workers with realistic Indian names, employee codes (EMP-001 to EMP-015), 
   varied compliance rates (75-99%)
4. 50 Violations spread across last 7 days:
   - Mix of all PPE types
   - Various zones and cameras
   - Some resolved, some pending
   - Realistic confidence scores (85-99%)
5. 20 Alerts at various levels (1-6)
6. 30 Attendance records for today with realistic check-in times
7. 5 Cameras with RTSP URLs

Usage: python manage.py seed_demo_data
Should be idempotent (skip if data exists, or use --force flag to recreate)

Tech: Django management command, Python faker or manual data
```

---

## PHASE 7 — Jury-Winning Differentiators

These features are designed to create "wow moments" during the demo.

### 7.1 — Voice-Commanded Dashboard

**Prompt:**
```
Add voice command support to the Supervisor Dashboard.

Create frontend/src/hooks/useVoiceCommand.ts:

Supported commands:
- "Show violations" → navigate to /violations
- "Show camera [1-5]" → expand that camera feed
- "Alert zone [name]" → trigger zone alert
- "Show worker [name]" → navigate to worker profile
- "Clear all alerts" → clear alert panel
- "Generate report" → trigger PDF download
- "Show heatmap" → navigate to heatmap
- "Emergency" → trigger emergency SOS
- "Dashboard" → go home

Implementation:
- Use Web Speech API (SpeechRecognition)
- Always-listening when microphone icon is active
- Show a floating command bar with transcription
- Highlight matched command before executing
- Voice feedback: "Navigating to violations log"
- Add microphone toggle to DashboardLayout.tsx top bar

Tech: Web Speech API, React hooks, TypeScript
```

### 7.2 — Multi-Language PA System Announcements

**Prompt:**
```
Add a feature where the supervisor can broadcast safety announcements
to factory PA system speakers in multiple languages.

Create frontend/src/components/PASystemBroadcast.tsx:

Features:
- Modal triggered from Dashboard top bar (megaphone icon)
- Pre-written announcement templates:
  * "All workers in [Zone], please put on your helmets immediately"
  * "Emergency evacuation in progress. Move to assembly point"  
  * "Shift change in 15 minutes. Complete safety lockout procedures"
  * Custom text input
- Language selector: English, Hindi, Telugu, Tamil
- Target: All zones, or specific zones (multi-select)
- "Preview" button: plays TTS locally using Web Speech API
- "Broadcast" button: sends to backend which:
  1. Converts text to speech using gTTS
  2. Publishes audio to PA system via MQTT
  3. Logs the announcement

Backend: POST /api/pa-system/broadcast/
  - text, language, target_zones
  - Uses gTTS to generate MP3
  - Publishes to MQTT topic "pa/{zone_id}/announce"

Tech: React, gTTS, MQTT (paho-mqtt), Web Speech API
```

### 7.3 — Digital Twin: 3D Factory Floor Map

**Prompt:**
```
Create an interactive 3D-style factory floor map showing real-time 
worker positions and safety status.

Create frontend/src/pages/FactoryMap.tsx:

This is a 2.5D isometric map (CSS/SVG based, not WebGL — keep it simple):

Features:
- Isometric grid showing factory zones as colored blocks
- Each zone shows:
  * Zone name
  * Worker count (animated dots)
  * Compliance color: green (>90%), amber (75-90%), red (<75%)
  * Active violation markers (pulsing red dots)
- Click on zone → expand zone detail panel (same as heatmap zone detail)
- Worker dots move between zones periodically (simulate movement)
- Camera positions marked with camera icons
- Animated "scan lines" effect to show AI coverage area
- Legend: zone status colors, camera coverage, worker indicators

Demo simulation:
- Workers periodically move between zones
- Random violations appear and resolve
- Zone compliance fluctuates

Add nav link: "Factory Map" with Map icon, positioned after Heatmap

This is the #1 jury demo page. Make it visually stunning.

Tech: React, SVG, CSS transforms (perspective, rotateX), TailwindCSS
```

### 7.4 — Gamification: Safety Achievements & Rewards

**Prompt:**
```
Add a gamification system that awards workers badges and points 
for safety compliance.

Backend — new models:
1. Achievement model:
   - name, description, icon, points, condition_type, condition_value
   - Pre-seed achievements:
     * "Safety Rookie" — Complete first shift with no violations (50 pts)
     * "Iron Streak" — 7 consecutive days compliant (200 pts)
     * "Zone Master" — Highest compliance in a zone for a week (300 pts)
     * "Perfect Month" — 30 days violation-free (1000 pts)
     * "Guardian Angel" — Report a near-miss incident (150 pts)
     * "Quick Responder" — Resolve violation within 5 minutes (100 pts)
     * "PPE Champion" — 99%+ compliance for 14 days (500 pts)

2. WorkerAchievement model:
   - worker, achievement, earned_at

Frontend:
1. Show badges on SafetyLeaderboard (already has badge support)
2. Create achievement popup when earned (confetti animation)
3. Worker Profile shows badges gallery
4. Dashboard sidebar shows "Today's Achievements" feed

Kiosk:
- After PPE check pass, show earned achievements with celebratory animation
- "You've maintained 🔥 12-day streak! +50 points"

Tech: Django models, React, CSS animations (confetti library)
```

### 7.5 — Smart Alerts: Escalation Waterfall

**Prompt:**
```
Implement a 6-level alert escalation system that automatically escalates
unresolved violations through increasingly urgent notification channels.

The escalation levels (configured per zone):
- Level 1 (0 min): Dashboard popup + push notification to supervisor
- Level 2 (2 min): SMS to shift supervisor via Twilio
- Level 3 (5 min): WhatsApp message to safety officer + email 
- Level 4 (10 min): PA system voice warning in zone (gTTS + MQTT)
- Level 5 (15 min): Auto-call to plant manager via Twilio Voice
- Level 6 (20 min): Machine lockout signal + emergency protocol

Frontend — Create frontend/src/components/EscalationTimeline.tsx:
- Vertical stepper showing current escalation level for each active violation
- Green checkmark = completed, Yellow pulse = current, Gray = pending
- Countdown timer to next level
- "Acknowledge" button to stop escalation
- Shown in violation detail modal

Backend:
- Use Celery beat (or Django background tasks) to check escalation timers
- Each unresolved violation moves up levels based on time since creation
- POST /api/violations/{id}/acknowledge/ to stop escalation

Demo: When a violation is triggered, show the escalation timer counting 
down in real-time on the dashboard.

Tech: Django, Celery, Twilio, gTTS, MQTT, WebSocket, React
```

---

## Implementation Priority Order

| Priority | Phase | Feature | Jury Impact | Effort |
|----------|-------|---------|-------------|--------|
| 🔴 P0 | 2.1 | Kiosk PPE Camera + Bounding Boxes | ★★★★★ | Medium |
| 🔴 P0 | 1.1 | PPE Dataset + Model Training | ★★★★★ | High |
| 🔴 P0 | 3.2 | Attendance Dashboard Page | ★★★★☆ | Medium |
| 🟡 P1 | 1.3 | Live Camera Feed on Dashboard | ★★★★★ | Medium |
| 🟡 P1 | 3.1 | Attendance Backend + Auto Check-in | ★★★★☆ | Medium |
| 🟡 P1 | 7.3 | 3D Factory Map | ★★★★★ | High |
| 🟡 P1 | 4.3 | AI Insights Page | ★★★★★ | Medium |
| 🟢 P2 | 4.1 | Incident Timeline | ★★★☆☆ | Medium |
| 🟢 P2 | 4.2 | Worker Profile Page | ★★★☆☆ | Medium |
| 🟢 P2 | 7.1 | Voice Commands | ★★★★☆ | Low |
| 🟢 P2 | 7.4 | Gamification & Badges | ★★★★☆ | Medium |
| 🔵 P3 | 7.5 | Escalation Waterfall | ★★★★☆ | High |
| 🔵 P3 | 7.2 | PA System Broadcast | ★★★☆☆ | Medium |
| 🔵 P3 | 5.1 | Worker Registration Kiosk | ★★★☆☆ | Medium |
| 🔵 P3 | 5.2 | Safety Briefing Video | ★★☆☆☆ | Low |
| 🔵 P3 | 5.3 | Kiosk SOS Button | ★★★☆☆ | Low |
| 🔵 P3 | 6.1 | Docker Compose Full Stack | ★★☆☆☆ | Medium |
| 🔵 P3 | 6.2 | Seed Demo Data Command | ★★☆☆☆ | Low |

---

## Quick Start: Demo Day Sprint

If you only have **24 hours before the demo**, implement in this order:

1. **Phase 2.1** — Kiosk camera + bounding boxes (THE visual centerpiece)
2. **Phase 3.2** — Attendance page with demo data (shows end-to-end flow)
3. **Phase 4.3** — AI Insights page (shows technical depth)
4. **Phase 7.1** — Voice commands (quick "wow" moment, low effort)
5. **Phase 7.3** — 3D Factory Map (jury-winning visual)

---

## Tech Stack Additions (if implementing all phases)

| Tool | Purpose | Install |
|------|---------|---------|
| Roboflow SDK | PPE dataset download | `pip install roboflow` |
| Celery + Redis | Background escalation tasks | `pip install celery[redis]` |
| paho-mqtt | PA system integration | `pip install paho-mqtt` |
| Web Speech API | Voice commands (browser native) | Built-in |
| Canvas API | Bounding box rendering | Built-in |
| gTTS | Text-to-Speech for PA | Already installed |
| Twilio | SMS/WhatsApp/Voice calls | Already installed |

---

*Document generated for SafeGuard AI — LNIT SUMMIT 2K26*
