<div align="center">

# 🛡️ SafeGuard AI

### AI-Powered Real-Time PPE Compliance & Worker Safety Monitoring Platform

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Django](https://img.shields.io/badge/Django_5-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-FF6F00?style=for-the-badge&logo=pytorch&logoColor=white)](https://docs.ultralytics.com)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/TimescaleDB-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://timescale.com)
[![WebSocket](https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

**Saving lives, one frame at a time.**

An enterprise-grade, AI-driven safety monitoring system designed for mines, construction sites, and heavy manufacturing plants. SafeGuard AI uses computer vision to detect PPE violations in real-time, alerts supervisors instantly via multi-channel notifications, and generates legally compliant DGMS safety reports — all while providing workers an accessible, multilingual kiosk interface.

[Features](#-features) · [Architecture](#-system-architecture) · [Tech Stack](#-technology-stack) · [Getting Started](#-getting-started) · [Screenshots](#-screenshots) · [API Reference](#-api-reference)

</div>

---

## 🆕 What's New (Latest Updates)

- **Kiosk UI Overhaul:** Complete redesign of the Worker Kiosk with a minimalistic dark-themed UI, smooth step-by-step onboarding flow, robust face verification, and bilingual voice-guided instructions.
- **Robust Analytics & Data Seeding:** The Admin Dashboard and System Analytics pages are now packed with real-time graphs, KPIs, and predictive risk logic. The backend includes a `seed_db.py` script to instantly generate 30 days of realistic simulation data!
- **Django Backend & Dockerization:** Fully migrated to a Django/PostgreSQL stack, containerized with Docker Compose for a frictionless, one-command setup procedure.
- **Automated Authentication Handling:** Refined JWT token flows, demo mode authentication, and role-based login redirection for Supervisors vs. Admins.

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Application Workflow](#-application-workflow)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Screenshots](#-screenshots)
- [API Reference](#-api-reference)
- [Data Models](#-data-models)
- [AI Engine](#-ai-engine)
- [Roadmap](#-roadmap)

---

## 🔴 Problem Statement

In India's mining and heavy manufacturing sectors:

- **3 workers die every day** due to safety violations (DGMS Annual Report)
- **78% of fatalities** are caused by missing or improperly worn Personal Protective Equipment (PPE)
- Manual safety audits are **infrequent, inconsistent, and impossible to scale** across 50+ camera zones
- Existing compliance systems rely on paper-based checklists that are **easily forged**
- Regulatory bodies (DGMS) require **auditable, timestamped proof** of safety enforcement
- Factory-gate workers often **cannot read** English or Hindi text on standard safety systems

---

## 💡 Our Solution

SafeGuard AI replaces manual safety audits with an **autonomous, 24/7 AI-powered monitoring system** that:

1. **Watches every camera feed** and detects missing helmets, vests, goggles, gloves, boots, and harnesses using YOLOv8 object detection
2. **Alerts supervisors in milliseconds** through a 6-level escalation waterfall (Dashboard → SMS → WhatsApp → PA System → Auto-Call → Machine Lockout)
3. **Blocks non-compliant workers** at factory gates via an intelligent kiosk with face recognition + PPE verification
4. **Speaks to workers** in their native language (Hindi/English) using text-to-speech — solving the literacy barrier
5. **Generates legally compliant DGMS reports** automatically, with timestamped evidence and AI confidence scores
6. **Gamifies safety** with leaderboards, streaks, and badges — turning compliance into a competition

---

## ✨ Features

### 🖥️ Supervisor Dashboard

| Feature                | Description                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Live Monitoring**    | Real-time violation feed with auto-simulation, dynamic KPI counters (violations, compliance rate, high risks, resolved), 5-camera panel with alert indicators, LIVE/PAUSED toggle, and one-click event triggering                                                                                            |
| **Violations Log**     | Searchable, filterable table of all violations with severity badges, status filters, CSV export, row-click detail modals with Resolve/Escalate actions                                                                                                                                                       |
| **Violation Heatmap**  | Interactive zone-based hotspot visualization with clickable floor plan, summary cards, zone detail panel, and zone ranking table                                                                                                                                                                             |
| **Safety Leaderboard** | Gamified worker rankings with Top 3 podium, score bars, safety streaks, achievement badges (Iron Streak, Zone Master, Rising Star), and configurable time periods (7D/14D/30D)                                                                                                                               |
| **Compliance Reports** | DGMS compliance center with 3 interactive chart tabs — gradient Area chart (7-day trend with compliance/violations/incidents), Donut + Radar chart (PPE breakdown), gradient Bar chart (zone analysis) — plus one-click report generation                                                                    |
| **System Settings**    | 5-tab settings panel — Profile, Notifications (push/email toggles), AI Configuration (confidence threshold slider, face verification toggle), Camera Management (5 cameras with online/offline toggle, resolution, FPS, zone, maintenance dates), Security (password change, 2FA, API keys, active sessions) |

### 🏭 Worker Kiosk

| Feature                      | Description                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Face Scan Screen**         | Live camera-based identity verification with animated scan overlay, bilingual UI (English/Hindi), voice instructions via Web Speech API, language selection, auto-redirect on success                         |
| **PPE Check Screen**         | Full-body PPE verification with 5 equipment cards (Helmet, High-Vis Vest, Boots, Goggles, Gloves), green/red status indicators, voice announcements for pass/fail, supervisor auto-notification on violations |
| **Bilingual Voice Guidance** | Text-to-Speech in English and Hindi — workers hear instructions in their language, solving the literacy barrier at factory gates                                                                              |

### 📊 Analytics & Intelligence

| Feature                       | Description                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| **Predictive Risk Analytics** | ML-based risk predictions by zone and time, enabling proactive safety measures           |
| **Near-Miss Tracking**        | Logs and analyzes close-call incidents to prevent future violations                      |
| **Shift Handover Reports**    | Automated safety briefings for shift transitions with pending violations and zone status |

### 🔔 Multi-Channel Alert System

| Level | Channel                                   | Trigger Time      |
| ----- | ----------------------------------------- | ----------------- |
| 1     | Dashboard popup + push notification       | Immediate (0 min) |
| 2     | SMS to shift supervisor (Twilio)          | +2 min            |
| 3     | WhatsApp + Email to safety officer        | +5 min            |
| 4     | PA system voice warning (gTTS + MQTT)     | +10 min           |
| 5     | Auto-call to plant manager (Twilio Voice) | +15 min           |
| 6     | Machine lockout + emergency protocol      | +20 min           |

### 📄 Report Generation

| Report                     | Format | Contents                                                         |
| -------------------------- | ------ | ---------------------------------------------------------------- |
| **Daily Safety Report**    | PDF    | Violation summary, zone breakdown, worker compliance             |
| **DGMS Compliance Report** | PDF    | Legally formatted report for Directorate General of Mines Safety |
| **ESG Report**             | PDF    | Environmental, Social, and Governance metrics for insurance      |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            SafeGuard AI Architecture                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐       │
│   │  IP Cameras  │     │   Worker    │     │   Supervisor Dashboard  │       │
│   │  (RTSP)      │     │   Kiosk     │     │   (React 19 + Vite 7)  │       │
│   │  5+ Feeds    │     │  (React)    │     │                         │       │
│   └──────┬───────┘     └──────┬──────┘     └────────────┬────────────┘       │
│          │                    │                          │                    │
│          │ RTSP Stream        │ REST API                 │ WebSocket + REST   │
│          ▼                    ▼                          ▼                    │
│   ┌──────────────────────────────────────────────────────────────┐           │
│   │                    Django Backend (ASGI)                      │           │
│   │   ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌─────────┐ │           │
│   │   │  REST API │  │ WebSocket │  │   Auth     │  │ Reports │ │           │
│   │   │  (DRF)   │  │ Consumers │  │  (JWT)     │  │  (PDF)  │ │           │
│   │   └──────────┘  └───────────┘  └────────────┘  └─────────┘ │           │
│   │   ┌──────────┐  ┌───────────┐  ┌────────────┐              │           │
│   │   │ Kiosk API│  │ Analytics │  │Notification│              │           │
│   │   │ (Face/PPE)│  │  Engine   │  │  Engine    │              │           │
│   │   └──────────┘  └───────────┘  └────────────┘              │           │
│   └───────┬──────────────┬──────────────┬───────────────────────┘           │
│           │              │              │                                    │
│           ▼              ▼              ▼                                    │
│   ┌──────────────┐ ┌──────────┐ ┌──────────────┐                           │
│   │  PostgreSQL   │ │  Redis   │ │    MinIO      │                           │
│   │ (TimescaleDB) │ │  Pub/Sub │ │ Object Store  │                           │
│   │  User/Logs    │ │ RT Events│ │  Violation    │                           │
│   │  Violations   │ │ Caching  │ │  Frames       │                           │
│   └──────────────┘ └────┬─────┘ └──────────────┘                           │
│                          │                                                   │
│                          ▼                                                   │
│   ┌──────────────────────────────────────────────────┐                      │
│   │            AI Engine (YOLOv8 + OpenCV)            │                      │
│   │   ┌────────────┐  ┌──────────────┐  ┌─────────┐ │                      │
│   │   │  Detection  │  │    Camera    │  │  PPE    │ │                      │
│   │   │  Pipeline   │  │   Manager    │  │ Classes │ │                      │
│   │   │ (YOLOv8)    │  │  (RTSP)      │  │ (YAML)  │ │                      │
│   │   └────────────┘  └──────────────┘  └─────────┘ │                      │
│   └──────────────────────────────────────────────────┘                      │
│                          │                                                   │
│                          ▼                                                   │
│   ┌──────────────────────────────────────────────────┐                      │
│   │           Notification Channels                   │                      │
│   │   📱 Twilio SMS  ·  💬 WhatsApp  ·  📧 Email    │                      │
│   │   🔊 PA System (MQTT + gTTS)  ·  📞 Auto-Call   │                      │
│   └──────────────────────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Application Workflow

### Worker Entry Flow (Kiosk)

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Worker   │────▶│  Face Scan   │────▶│  PPE Check   │────▶│  Access     │
│  Arrives  │     │  (Camera +   │     │  (AI Verify   │     │  Granted /  │
│  at Gate  │     │   Identity)  │     │   5 Items)    │     │  Denied     │
└──────────┘     └──────────────┘     └──────────────┘     └──────┬──────┘
                        │                     │                     │
                  Face Verified          All PPE ✅           ✅ → Proceed
                  Voice: "Identity      Voice: "Safety          to Work Zone
                   confirmed"           gear verified"
                                                              ❌ → Fix Gear
                                             ❌                   & Retry
                                        Missing PPE          Supervisor
                                        Voice: "Please       Notified
                                        wear helmet"         Automatically
```

### Violation Detection Flow (Camera Monitoring)

```
┌───────────┐     ┌───────────┐     ┌──────────┐     ┌──────────────┐
│ IP Camera │────▶│ AI Engine │────▶│ Violation│────▶│   Alert      │
│ RTSP Feed │     │ YOLOv8    │     │ Detected │     │   Escalation │
│ (24/7)    │     │ Inference │     │ & Logged │     │   Waterfall  │
└───────────┘     └───────────┘     └──────────┘     └──────┬───────┘
                        │                                     │
                  Frame-by-frame              ┌───────────────┼───────────────┐
                  PPE Detection               │               │               │
                  Confidence Score         Level 1          Level 2-3      Level 4-6
                  Bounding Boxes          Dashboard        SMS/WhatsApp    PA System
                                          Popup             + Email        Auto-Call
                                                                          Lockout
```

### Supervisor Monitoring Flow (Dashboard)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Supervisor Dashboard                               │
│                                                                       │
│  ┌─ Live Monitoring ─┐  ┌─ Violations Log ─┐  ┌─ Heatmap ────────┐ │
│  │ Real-time KPIs     │  │ Filter & Search   │  │ Zone Hotspots    │ │
│  │ Camera Feeds       │  │ CSV Export        │  │ Click to Drill   │ │
│  │ Event Feed         │  │ Resolve/Escalate  │  │ Period Selector  │ │
│  └────────────────────┘  └──────────────────┘  └─────────────────┘ │
│                                                                       │
│  ┌─ Leaderboard ─────┐  ┌─ Reports ─────────┐  ┌─ Settings ──────┐ │
│  │ Top 3 Podium       │  │ 7-Day Trend Chart │  │ AI Thresholds   │ │
│  │ Streaks & Badges   │  │ PPE Donut + Radar │  │ Camera Mgmt     │ │
│  │ Points System      │  │ Zone Bar Chart    │  │ Security & 2FA  │ │
│  └────────────────────┘  │ PDF Generation    │  │ Notifications   │ │
│                           └──────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

| Technology        | Version | Purpose                                                       |
| ----------------- | ------- | ------------------------------------------------------------- |
| **React**         | 19.2    | Component-based UI for Dashboard & Kiosk                      |
| **Vite**          | 7.3     | Lightning-fast build tool & dev server                        |
| **TypeScript**    | 5.9     | Strict static typing across all components                    |
| **TailwindCSS**   | 4.2     | Utility-first styling with custom HMI design system           |
| **shadcn/ui**     | 3.8     | Accessible, customizable component library                    |
| **Recharts**      | 3.7     | Interactive data visualization (Area, Bar, Pie, Radar charts) |
| **Zustand**       | 5.0     | Lightweight global state management                           |
| **Axios**         | 1.13    | HTTP client for REST API communication                        |
| **Framer Motion** | 12.34   | Smooth animations and transitions                             |
| **Lucide React**  | 0.575   | Modern icon library (100+ icons used)                         |
| **React Router**  | 7.13    | Client-side routing with protected routes                     |

### Backend

| Technology                | Version | Purpose                                             |
| ------------------------- | ------- | --------------------------------------------------- |
| **Django**                | 4.2–5.3 | Core backend framework — REST API, ORM, Admin       |
| **Django REST Framework** | Latest  | Serializers, ViewSets, API routing                  |
| **SimpleJWT**             | Latest  | JSON Web Token authentication                       |
| **Django Channels**       | Latest  | WebSocket support for real-time streaming           |
| **Daphne**                | Latest  | ASGI server for WebSocket + HTTP                    |
| **PostgreSQL**            | 15      | Primary relational database (TimescaleDB extension) |
| **Redis**                 | 7       | Real-time pub/sub, caching, channel layers          |
| **MinIO**                 | Latest  | S3-compatible object storage for violation frames   |

### AI & Computer Vision

| Technology               | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| **YOLOv8** (ultralytics) | Real-time PPE object detection             |
| **OpenCV**               | Frame extraction from RTSP camera streams  |
| **PyTorch**              | Deep learning inference backend            |
| **NumPy**                | Numerical computation for frame processing |

### Notification Channels

| Technology    | Purpose                                    |
| ------------- | ------------------------------------------ |
| **Twilio**    | SMS, WhatsApp, and Voice call alerts       |
| **SMTP**      | Email notifications and report delivery    |
| **gTTS**      | Text-to-Speech for PA system announcements |
| **paho-mqtt** | MQTT protocol for PA system integration    |

### Infrastructure

| Technology         | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| **Docker Compose** | Multi-service orchestration (6 containers)          |
| **TimescaleDB**    | Time-series optimized PostgreSQL for violation logs |
| **MinIO**          | Self-hosted S3 for violation frame storage          |
| **Redis**          | WebSocket channel layer + real-time event bus       |

---

## 📂 Project Structure

```
SafeGuard AI/
├── frontend/                          # React 19 + Vite 7 + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LiveMonitoring.tsx      # Real-time dashboard with auto-simulation
│   │   │   ├── ViolationsLog.tsx       # Filterable violations table + CSV export
│   │   │   ├── ViolationHeatmap.tsx    # Interactive zone hotspot map
│   │   │   ├── SafetyLeaderboard.tsx   # Gamified worker rankings
│   │   │   ├── ComplianceReports.tsx   # 3-tab chart center + PDF generation
│   │   │   ├── Settings.tsx            # 5-tab system configuration
│   │   │   └── Login.tsx               # JWT authentication + demo accounts
│   │   ├── kiosk/
│   │   │   ├── FaceScanScreen.tsx      # Camera-based face verification
│   │   │   └── PPECheckScreen.tsx      # AI PPE equipment check
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx     # Sidebar navigation + role-based access
│   │   │   ├── ProtectedRoute.tsx      # Auth guard for routes
│   │   │   └── ui/                     # shadcn/ui components (badge, button, card, etc.)
│   │   ├── lib/
│   │   │   ├── api.ts                  # Axios instance with JWT interceptors
│   │   │   └── utils.ts               # Utility helpers (cn, classnames)
│   │   ├── store.ts                    # Zustand global state (auth, language, worker)
│   │   ├── App.tsx                     # Route definitions
│   │   └── main.tsx                    # App entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                            # Django 5 + DRF + Channels
│   ├── api/
│   │   ├── models.py                   # User, Site, Zone, Worker, Violation, Alert, Report
│   │   ├── views.py                    # REST endpoints + analytics + kiosk + notifications
│   │   ├── serializers.py              # DRF serializers for all models
│   │   ├── consumers.py                # WebSocket consumers (camera feed, live monitoring)
│   │   ├── routing.py                  # WebSocket URL routing
│   │   ├── urls.py                     # 25+ REST API endpoints
│   │   ├── admin.py                    # Django admin registration
│   │   └── management/commands/
│   │       ├── setup_default_roles.py  # Create default user roles
│   │       └── run_simulation.py       # Generate test violations
│   ├── config/
│   │   ├── settings.py                 # Django settings (DB, Redis, CORS, JWT, Channels)
│   │   ├── asgi.py                     # ASGI config with channel routing
│   │   └── urls.py                     # Root URL configuration
│   ├── requirements.txt                # Python dependencies (26 packages)
│   └── Dockerfile                      # Backend container image
│
├── ai_engine/                          # Computer Vision Pipeline
│   ├── detector.py                     # YOLOv8 detection pipeline + MinIO storage
│   ├── camera_manager.py               # RTSP stream manager (async, multi-camera)
│   └── ppe_classes.yaml                # PPE class definitions (9 classes)
│
├── alert_engine/                       # Notification & Escalation Engine
│
├── docker-compose.yml                  # Full stack: Django + Postgres + Redis + MinIO
├── next-plan.md                        # Phase-wise development roadmap
├── tech.md                             # Detailed technology justification
└── README.md                           # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Python** ≥ 3.10
- **Docker** & **Docker Compose** (for full stack)
- **Git**

### Option 1: Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/Aswinsaipalakonda/safeguard-ai.git
cd safeguard-ai

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api/
# MinIO Console: http://localhost:9001
```

Docker Compose starts 4 services automatically:

- **PostgreSQL** (TimescaleDB) on port 5432
- **Redis** on port 6379
- **MinIO** on ports 9000/9001
- **Django Backend** on port 8000 (auto-migrates + seeds demo data)

### Option 2: Manual Setup (Development)

#### Backend

```bash
# Create and activate virtual environment
cd backend
python -m venv venv
venv\Scripts\Activate.ps1    # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env   # Edit with your DB/Redis/MinIO settings

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create default roles and demo data
python manage.py setup_default_roles

# Start ASGI server
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Demo Accounts

| Role           | Email                 | Password  | Access                |
| -------------- | --------------------- | --------- | --------------------- |
| **Supervisor** | `admin@safeguard.ai`  | `demo123` | Full dashboard access |
| **Worker**     | `worker@safeguard.ai` | `demo123` | Kiosk interface       |

> Demo accounts work without a running backend — the frontend falls back to rich demo data automatically.

---

## 📸 Screenshots

### Supervisor Dashboard — Live Monitoring

> Real-time violation feed with auto-simulation, 5-camera panel, dynamic KPI counters, LIVE/PAUSED toggle

### Violations Log

> Searchable table with 15+ violations, severity filters, CSV export, detail modal with Resolve/Escalate

### Compliance Reports — 7-Day Trend

> Gradient area chart with compliance %, violations, and critical incidents

### Compliance Reports — PPE Breakdown

> Donut chart + Radar chart showing per-equipment violation distribution

### Violation Heatmap

> Interactive zone map with hotspot visualization and drill-down details

### Safety Leaderboard

> Gamified rankings with Top 3 podium, streaks, and achievement badges

### Worker Kiosk — Face Scan

> Camera-based identity verification with bilingual voice guidance

### Worker Kiosk — PPE Check

> Equipment verification cards with green (pass) / red (fail) indicators

---

## 📡 API Reference

### Authentication

| Method | Endpoint                   | Description                       |
| ------ | -------------------------- | --------------------------------- |
| `POST` | `/api/auth/token/`         | Obtain JWT access + refresh token |
| `POST` | `/api/auth/token/refresh/` | Refresh access token              |

### Core CRUD (ViewSets)

| Resource   | Endpoint           | Operations                    |
| ---------- | ------------------ | ----------------------------- |
| Sites      | `/api/sites/`      | GET, POST, PUT, PATCH, DELETE |
| Zones      | `/api/zones/`      | GET, POST, PUT, PATCH, DELETE |
| Workers    | `/api/workers/`    | GET, POST, PUT, PATCH, DELETE |
| Violations | `/api/violations/` | GET, POST, PUT, PATCH, DELETE |
| Alerts     | `/api/alerts/`     | GET, POST, PUT, PATCH, DELETE |
| Reports    | `/api/reports/`    | GET, POST, PUT, PATCH, DELETE |

### Analytics

| Method | Endpoint                      | Description                      |
| ------ | ----------------------------- | -------------------------------- |
| `GET`  | `/api/analytics/compliance/`  | 7-day compliance trend data      |
| `GET`  | `/api/analytics/heatmap/`     | Zone-wise violation hotspot data |
| `GET`  | `/api/analytics/leaderboard/` | Worker safety rankings           |
| `GET`  | `/api/analytics/predictions/` | Predictive risk analysis         |
| `GET`  | `/api/analytics/near-misses/` | Near-miss incident tracking      |
| `GET`  | `/api/dashboard/stats/`       | Dashboard summary statistics     |

### Kiosk

| Method | Endpoint                 | Description                                |
| ------ | ------------------------ | ------------------------------------------ |
| `POST` | `/api/kiosk/scan-face/`  | Face recognition for worker identification |
| `POST` | `/api/kiosk/verify-ppe/` | PPE equipment verification                 |

### Cameras

| Method | Endpoint              | Description                      |
| ------ | --------------------- | -------------------------------- |
| `POST` | `/api/cameras/start/` | Start monitoring a camera stream |
| `POST` | `/api/cameras/stop/`  | Stop monitoring a camera stream  |
| `GET`  | `/api/cameras/`       | List all active cameras          |

### Reports

| Method | Endpoint                       | Description                     |
| ------ | ------------------------------ | ------------------------------- |
| `POST` | `/api/reports/generate/daily/` | Generate daily safety report    |
| `POST` | `/api/reports/generate/dgms/`  | Generate DGMS compliance report |
| `POST` | `/api/reports/generate/esg/`   | Generate ESG metrics report     |

### Operations

| Method | Endpoint                    | Description                                      |
| ------ | --------------------------- | ------------------------------------------------ |
| `POST` | `/api/emergency/sos/`       | Trigger emergency SOS protocol                   |
| `POST` | `/api/shift/handover/`      | Generate shift handover report                   |
| `POST` | `/api/notifications/send/`  | Send violation notification (Email/SMS/WhatsApp) |
| `POST` | `/api/workers/{id}/notify/` | Notify a specific worker                         |

### WebSocket Endpoints

| Endpoint                                     | Description                  |
| -------------------------------------------- | ---------------------------- |
| `ws://localhost:8000/ws/live/`               | Live monitoring event stream |
| `ws://localhost:8000/ws/camera/{camera_id}/` | Camera frame stream (JPEG)   |

---

## 🗃️ Data Models

```
┌───────────┐     ┌────────────┐     ┌────────────┐
│   User    │     │    Site    │     │    Zone    │
│───────────│     │────────────│     │────────────│
│ username  │     │ name       │     │ name       │
│ email     │     │ location   │     │ site (FK)  │
│ role      │◄────│ timezone   │◄────│ required_ppe│
│ (Admin/   │     │ pa_system  │     │ camera_ids │
│ Supervisor│     │            │     │ is_high_risk│
│ Worker)   │     └────────────┘     └─────┬──────┘
└───────────┘                              │
                                           │
┌───────────┐     ┌────────────┐     ┌─────┴──────┐
│  Worker   │────▶│ Violation  │────▶│   Alert    │
│───────────│     │────────────│     │────────────│
│ name      │     │ ppe_type   │     │ level (1-6)│
│ emp_code  │     │ zone       │     │ channel    │
│ language  │     │ camera_id  │     │ sent_at    │
│ face_embed│     │ confidence │     │ ack_at     │
│ compliance│     │ image_path │     └────────────┘
│ rate      │     │ resolved_at│
└───────────┘     │ created_at │     ┌────────────┐
                  └────────────┘     │  Report    │
                                     │────────────│
                                     │ site (FK)  │
                                     │ period     │
                                     │ report_path│
                                     └────────────┘
```

### PPE Detection Classes

| ID  | Class            | Type      |
| --- | ---------------- | --------- |
| 0   | `helmet`         | Compliant |
| 1   | `no_helmet`      | Violation |
| 2   | `safety_vest`    | Compliant |
| 3   | `no_vest`        | Violation |
| 4   | `safety_gloves`  | Compliant |
| 5   | `no_gloves`      | Violation |
| 6   | `safety_goggles` | Compliant |
| 7   | `safety_boots`   | Compliant |
| 8   | `body_harness`   | Compliant |

---

## 🧠 AI Engine

### Detection Pipeline

```python
# Simplified flow
Camera (RTSP) → OpenCV Frame Extraction → YOLOv8 Inference → PPE Classification
                                            │
                                            ├── Compliant → Green Bounding Box
                                            ├── Violation → Red Bounding Box + Alert
                                            │                 │
                                            │                 ├── Redis Pub/Sub → WebSocket → Dashboard
                                            │                 ├── MinIO Frame Storage (evidence)
                                            │                 └── Alert Escalation Engine
                                            │
                                            └── Annotated Frame → WebSocket → Live Camera View
```

### Camera Manager

- **Multi-camera support:** Handles 5+ concurrent RTSP streams
- **Async processing:** Uses `asyncio` for non-blocking frame processing
- **Auto-reconnect:** 3-retry mechanism for dropped streams
- **Per-zone PPE rules:** Each camera enforces zone-specific PPE requirements

### Model Specifications

| Parameter            | Value                               |
| -------------------- | ----------------------------------- |
| Architecture         | YOLOv8s (Small)                     |
| Input Size           | 640×640                             |
| Classes              | 9 (PPE-specific)                    |
| Inference Speed      | ~23ms/frame (GPU)                   |
| Confidence Threshold | 85% (configurable)                  |
| Output               | Bounding boxes + class + confidence |

---

## 🗺️ Roadmap

See [next-plan.md](next-plan.md) for the detailed phase-wise implementation plan with ready-to-use prompts.

| Phase | Feature                                | Status   |
| ----- | -------------------------------------- | -------- |
| ✅    | Supervisor Dashboard (6 pages)         | Complete |
| ✅    | Worker Kiosk (Face Scan + PPE Check)   | Complete |
| ✅    | Backend API (25+ endpoints)            | Complete |
| ✅    | AI Detection Pipeline (YOLOv8)         | Complete |
| ✅    | Multi-Channel Notifications            | Complete |
| ✅    | WebSocket Real-Time Streaming          | Complete |
| ✅    | Demo Mode (works without backend)      | Complete |
| ✅    | Automatic Attendance System            | Complete |
| ✅    | Worker Profile & History               | Complete |
| ✅    | AI Insights Dashboard                  | Complete |
| ✅    | Gamification & Achievements            | Complete |
| 🔲    | Trained PPE Model (custom dataset)     | Phase 1  |
| 🔲    | Camera Feed Bounding Box Visualization | Phase 2  |
| 🔲    | 3D Factory Floor Map                   | Phase 7  |
| 🔲    | Voice-Commanded Dashboard              | Phase 7  |

---

## 👥 Team

**SafeGuard AI** — Built for LNIT SUMMIT 2K26

---

## 📜 License

This project is built for the LNIT SUMMIT 2K26 hackathon. All rights reserved.

---

<div align="center">

**SafeGuard AI** — _Because every worker deserves to go home safe._

</div>
