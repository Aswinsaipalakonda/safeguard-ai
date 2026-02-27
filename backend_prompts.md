# Manufacturing-Domain Backend Prompts for SafeGuard AI

To score maximum points on the LNIT SUMMIT 2K26 rubric for **Technical Architecture, Scalability, and Integration**, the backend must be an enterprise-grade Django microservice architecture.

Here are the exact, tailored prompts you can use with Antigravity to build the backend logic and connect it to the React frontend. Run these prompts sequentially.

---

## 🛠️ PROMPT 1: Architecture, PostgreSQL, & Core Authentication

```text
Initialize the SafeGuard AI Backend using Django & PostgreSQL.

INFRASTRUCTURE GOALS:
1. Initialize a Django project inside the existing `backend/` folder that matches our `docker-compose.yml`.
2. Configure settings to connect to the dockerized `timescaledb` (PostgreSQL) container (`safeguard_db`).
3. Install and configure Django REST Framework (DRF), SimpleJWT, Django Channels, and django-cors-headers.

SECURITY & RBAC GOAL:
1. Create a custom `User` model with a `role` field. The roles must be specifically: `ADMIN`, `SUPERVISOR`, `WORKER`.
2. Implement standard JWT login endpoints (`/api/auth/token/`).
3. Create a Django management command (e.g. `python manage.py setup_default_roles`) that automatically populates the database with 3 default test users so the Jury can easily log in:
   - admin@safeguard.com : admin123 (Role: ADMIN)
   - supervisor@safeguard.com : admin123 (Role: SUPERVISOR)
   - worker@safeguard.com : admin123 (Role: WORKER)

Integrate this with the Frontend: Update `frontend/src/store.ts` and `Login.tsx` to actually hit the `POST /api/auth/token/` endpoint via Axos, removing the mock `setTimeout` login.
```

---

## 🗄️ PROMPT 2: Database Models & REST API Integration

```text
Build the core data models and REST endpoints for SafeGuard AI.

MODELS:
1. `CameraZone`: `name`, `is_active`, `description`.
2. `Worker`: `user` (OneToOne), `face_encoding_id`, `department`.
3. `PPEViolation`: `zone` (ForeignKey), `worker` (ForeignKey, null=True), `violation_type` (Helmet, Vest, etc.), `confidence_score`, `timestamp`, `is_resolved`, `image_path`.

REST APIs:
1. Build robust Read/Write APIs using DRF ViewSets for these models.
2. Build an analytics endpoint `/api/analytics/compliance/` that aggregates weekly safety tracking data (percentage of compliance vs incidents) for the DGMS reports.

INTEGRATION:
Connect these APIs to the React frontend.
1. Update `ViolationsLog.tsx` to fetch `GET /api/violations/` using Axios and render actual database objects.
2. Update `ComplianceReports.tsx` to fetch the real Recharts graph data from `/api/analytics/compliance/`.
```

---

## 📡 PROMPT 3: Real-Time Engine (Django Channels & WebSockets)

```text
Implement the Real-Time Streaming engine to solve the manual monitoring problem.

TECHNICAL ARCHITECTURE:
We need zero-latency alerting. HTTP polling takes too long.
1. Configure `asgi.py` to route WebSockets.
2. Create a generic `LiveMonitoringConsumer` at `ws/live/`.
3. Set up Redis backing for the Channels layer (using the docker `safeguard_redis` container).

SIMULATION ENGINE (For Hackathon Pitch):
1. Write a background daemon or Celery task that simulates the Computer Vision Engine. It should randomly generate `PPEViolation` instances and instantly push a JSON event down the WebSocket channels group.

INTEGRATION:
1. Integrate the WebSocket perfectly into `frontend/src/pages/LiveMonitoring.tsx`.
2. Ensure the UI dynamically reacts to new incoming WebSocket JSON payloads (e.g., the Active Violations counter goes up, and the specific Camera flashes RED).
```

---

## 👷‍♂️ PROMPT 4: Worker Kiosk Logic & API

```text
Build the endpoints required for the physical Worker Entrance Kiosk.

FEATURES:
1. `POST /api/kiosk/scan-face/`: Simulates biometric attendance.
2. `POST /api/kiosk/verify-ppe/`: Resolves a mock camera frame and returns a strict `{ "approved": false, "missing": ["helmet"] }` response.

INTEGRATION:
Connect `FaceScanScreen.tsx` and `PPECheckScreen.tsx` on the frontend to execute these exact Axios POST requests, replacing the `setTimeout` mock timers. Ensure the UI changes correctly based on the real API responses.
```
