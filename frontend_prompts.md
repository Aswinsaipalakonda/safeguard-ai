# Manufacturing-Domain Frontend Prompts for SafeGuard AI

To score maximum points on the LNIT SUMMIT 2K26 rubric, the frontend must clearly demonstrate **Business Understanding**, **Domain Relevance**, **Innovation**, and **Technical Architecture**.

Here are the exact, tailored prompts you can use with Antigravity to build the frontend. Hand these prompts to the AI sequentially.

---

## 🎨 PROMPT 1: Architecture & Theme Setup [COMPLETED]

```text
We are building the frontend for "SafeGuard AI", an industrial PPE violation detection system. The frontend consists of two React 18 apps using Vite, TypeScript, TailwindCSS, and shadcn/ui.

DOMAIN RELEVANCE & THEME INSTRUCTIONS:
This UI is for the **Manufacturing / Heavy Industry** domain. It must look like modern industrial HMI (Human-Machine Interface) software used in control rooms.
- Color Palette: Industrial Dark Mode (Slate-900 backgrounds).
- Primary accents: Neon Safety Yellow and Alert High-Vis Orange/Red.
- Typography: Use a technical, monospace or highly legible sans-serif font (like Inter or Roboto Mono for metrics).
- Layout: Dense, widget-based dashboard style. No wasted whitespace. High contrast.

1. Initialize the Vite+React workspace.
2. Set up TailwindCSS with the custom industrial color palette:
   - `industrial-bg`: #0f172a
   - `industrial-panel`: #1e293b
   - `safety-yellow`: #eab308
   - `alert-red`: #ef4444
   - `success-green`: #22c55e
3. Install Zustand for state management and Axios for API calls.
4. Set up a WebSocket client utility that connects to `ws://localhost:8000/ws/live/` with auto-reconnect logic (demonstrates SCALABILITY).
5. Build the base layout shell `DashboardLayout.tsx` featuring a collapsible side-nav with rigorous routing.
```

---

## 💻 PROMPT 2: Supervisor Dashboard - Live Monitoring [COMPLETED]

```text
Build the Supervisor Live Monitoring Dashboard for SafeGuard AI.

FEATURES:
1. **Camera Feed Grid**: A 4x4 responsive grid of camera feeds (`CameraCard.tsx`).
   - Connect to the WebSocket utility to receive live JPEG frames.
   - If a violation occurs, trigger a high-visibility pulsing red border on the specific camera card.
2. **Alert Event Ticker**: A scrollingmarquee at the top showing real-time text alerts (e.g., "⚠️ ALARM: Helmet Missing - Zone B - Conf: 94%").
3. **KPI Stats Bar**:
   - Total Violations Today.
   - Active Risk Level (Color coded).
   - Compliance Rate (Circular Progress indicator).
4. **Zone Heathmap Widget**: A mock UI component showing a factory floor map where zones light up Red/Green based on the active violation counts.

Ensure everything is fully responsive. The UI must look intimidatingly professional and industrial.
```

---

## 👷‍♂️ PROMPT 3: Worker Kiosk - Pictogram UI [COMPLETED]

```text
Build the stand-alone Worker Kiosk App for SafeGuard AI.

BUSINESS PROBLEM:
Many factory workers are illiterate. Standard text-heavy UIs fail.

INNOVATION INSTRUCTION:
The UI must be **Pictogram-First**. Zero reading required. Everything must be communicated via giant icons, color codes, and audio cues.

SCREENS & COMPONENT FLOW:
1. `FaceScanScreen.tsx`: Dark background, large pulsing face outline. An audio button that plays a "Look at the camera" sound. Connects to `POST /api/workers/{id}/enroll-face/`.
2. `PPECheckScreen.tsx`: A 2x3 grid of giant icons (Helmet, Vest, Gloves, Goggles, Boots, Harness).
   - Use Framer Motion to animate the icons popping in.
   - If missing, the icon turns bright RED with an 'X' over it.
   - If compliant, it turns bright GREEN with a Checkmark.
3. `ApprovalScreen.tsx`: Full-screen green background with a massive thumbs-up and text "SAFE TO ENTER".

Make touch targets incredibly large (min 64px) so workers can tap them while wearing bulky safety gloves.
```

---

## 🔒 PROMPT 4: Compliance Engine & Security [COMPLETED]

```text
Build the Reports and Security layers for the SafeGuard AI Dashboard.

1. **Strict RBAC (Role Based Access Control) UI**: [COMPLETED]
   - Create a mock login page that emphasizes identity verification.
   - Wrap the dashboard routes in an AuthProvider that checks for a valid JWT token (demonstrates Security Awareness).
2. **Violations Log Table (`DataGrid`)**: [COMPLETED]
   - Filterable, sortable list of all violations.
   - Columns: Time, Worker, Zone, Missing PPE, Confidence, Status.
   - A "Resolve" button for supervisors to clear alerts.
3. **Compliance Report Generator UI**: [COMPLETED]
   - A panel specifically for exporting "DGMS (Directorate General of Mines Safety) Format" reports and "ESG Quarterly Reports".
   - Include a "Generate PDF" button that hits `POST /api/reports/dgms/`.
   - Show a Recharts line-graph displaying 30-day compliance trends used for Insurance Risk scoring.
```

---

## 📝 Tips for the Pitch / Jury Presentation

To score the full 10 points for **Presentation & Documentation**:

- Emphasize that the **Worker Kiosk UI** solves a real structural business problem in India (illiteracy in heavy manual labor) without relying on text interfaces. This hits "Business Understanding" heavily.
- Point out the **TimescaleDB + WebSocket** architecture handles massive constant streams of video data cleanly, proving **Scalability** and **Technical Design**.
- Highlight the **DGMS Reporting** feature to prove you researched the exact legal safety compliance standards for the manufacturing/mining sector (**Domain Relevance** and **Compliance Awareness**).
