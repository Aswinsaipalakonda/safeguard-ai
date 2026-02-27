import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout.tsx";
import LiveMonitoring from "./pages/LiveMonitoring";
import ViolationsLog from "./pages/ViolationsLog.tsx";
import ComplianceReports from "./pages/ComplianceReports.tsx";
import Settings from "./pages/Settings";
import ViolationHeatmap from "./pages/ViolationHeatmap";
import SafetyLeaderboard from "./pages/SafetyLeaderboard";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

// Kiosk
import FaceScanScreen from "./kiosk/FaceScanScreen";
import PPECheckScreen from "./kiosk/PPECheckScreen.tsx";
import WorkerLogin from "./pages/WorkerLogin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/worker-login" element={<WorkerLogin />} />

        {/* Supervisor & Admin Dashboard Routes (Protected) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']} />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/monitoring" replace />} />
            <Route path="monitoring" element={<LiveMonitoring />} />
            <Route path="violations" element={<ViolationsLog />} />
            <Route path="heatmap" element={<ViolationHeatmap />} />
            <Route path="leaderboard" element={<SafetyLeaderboard />} />
            <Route path="reports" element={<ComplianceReports />} />
            <Route path="settings" element={<Settings />} />
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
