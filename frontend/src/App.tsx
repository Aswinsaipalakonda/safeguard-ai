import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout.tsx";
import LiveMonitoring from "./pages/LiveMonitoring";
import ViolationsLog from "./pages/ViolationsLog.tsx";
import ComplianceReports from "./pages/ComplianceReports.tsx";
import Settings from "./pages/Settings";
import ViolationHeatmap from "./pages/ViolationHeatmap";
import SafetyLeaderboard from "./pages/SafetyLeaderboard";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import SystemAnalytics from "./pages/SystemAnalytics";
import ZoneManagement from "./pages/ZoneManagement";
import AuditLog from "./pages/AuditLog";

// New Feature Pages
import Attendance from "./pages/Attendance";
import AIInsights from "./pages/AIInsights";
import IncidentTimeline from "./pages/IncidentTimeline";
import WorkerProfile from "./pages/WorkerProfile";
import FactoryMap from "./pages/FactoryMap";
import Gamification from "./pages/Gamification";

// Kiosk
import FaceScanScreen from "./kiosk/FaceScanScreen";
import PPECheckScreen from "./kiosk/PPECheckScreen.tsx";
import WorkerLogin from "./pages/WorkerLogin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Public Auth Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/worker-login" element={<WorkerLogin />} />

        {/* Admin & Supervisor Dashboard Routes (Protected) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="monitoring" element={<LiveMonitoring />} />
            <Route path="violations" element={<ViolationsLog />} />
            <Route path="heatmap" element={<ViolationHeatmap />} />
            <Route path="leaderboard" element={<SafetyLeaderboard />} />
            <Route path="reports" element={<ComplianceReports />} />
            <Route path="settings" element={<Settings />} />

            {/* New Feature Pages */}
            <Route path="attendance" element={<Attendance />} />
            <Route path="ai-insights" element={<AIInsights />} />
            <Route path="timeline" element={<IncidentTimeline />} />
            <Route path="workers/:id" element={<WorkerProfile />} />
            <Route path="factory-map" element={<FactoryMap />} />
            <Route path="gamification" element={<Gamification />} />

            {/* Admin-only pages */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/analytics" element={<SystemAnalytics />} />
            <Route path="admin/zones" element={<ZoneManagement />} />
            <Route path="admin/audit" element={<AuditLog />} />
          </Route>
        </Route>

        {/* Worker Kiosk Routes */}
        <Route element={<ProtectedRoute allowedRoles={['WORKER']} />}>
          <Route path="/kiosk" element={<FaceScanScreen />} />
          <Route path="/kiosk/ppe" element={<PPECheckScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
