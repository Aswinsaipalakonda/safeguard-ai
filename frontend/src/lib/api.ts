import axios from 'axios';
import useStore from '../store';

// ─── Axios Instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  timeout: 30000,
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = useStore.getState().token;
  if (token && !token.startsWith('demo-jwt')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → attempt token refresh, then retry; logout only if refresh fails
let isRefreshing = false;
let failedQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { token, refreshToken } = useStore.getState();

    // If we are using a demo token, don't auto-logout on API failure
    if (token && token.startsWith('demo-jwt')) {
      return Promise.reject(error);
    }

    // Skip refresh logic for auth endpoints themselves
    if (
      originalRequest?.url?.includes('auth/token') ||
      originalRequest?._retry
    ) {
      if (error.response?.status === 401 && !originalRequest?.url?.includes('auth/token/')) {
        useStore.getState().logout();
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // No refresh token available → logout
      if (!refreshToken) {
        useStore.getState().logout();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          'http://localhost:8000/api/auth/token/refresh/',
          { refresh: refreshToken }
        );
        const newToken = data.access;
        useStore.getState().setToken(newToken);
        // If rotated, save the new refresh token too
        if (data.refresh) {
          useStore.setState({ refreshToken: data.refresh });
        }
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

export interface Site {
  id: number;
  name: string;
  location: string;
  timezone: string;
  pa_system_ip: string | null;
  pa_system_port: number | null;
}

export interface Zone {
  id: number;
  name: string;
  site: number | null;
  required_ppe: string[];
  camera_ids: string[];
  is_high_risk: boolean;
}

export interface Worker {
  id: number;
  name: string;
  employee_code: string;
  language_preference: string;
  face_embedding: number[] | null;
  compliance_rate: number;
  enrolled_at: string;
  is_active: boolean;
  violation_count: number;
}

export interface Violation {
  id: number;
  worker: number | null;
  worker_name: string;
  ppe_type: string;
  zone: string;
  camera_id: string;
  confidence: number;
  image_path: string;
  resolved_at: string | null;
  created_at: string;
}

export interface Alert {
  id: number;
  violation: number;
  violation_detail?: Violation;
  level: number;
  channel: string;
  sent_at: string;
  acknowledged_at: string | null;
}

export interface ComplianceReport {
  id: number;
  site: number;
  site_name: string | null;
  period_start: string;
  period_end: string;
  report_path: string;
  created_at: string;
}

export interface Attendance {
  id: number;
  worker: number;
  worker_name: string;
  employee_code: string;
  check_in_time: string;
  zone: string;
  status: string;
}

export interface DashboardStats {
  today_violations: number;
  today_resolved: number;
  active_alerts: number;
  compliance_rate: number;
  week_change_pct: number;
  ppe_breakdown: { ppe_type: string; count: number }[];
  zone_stats: { zone: string; count: number }[];
}

export interface ComplianceDay {
  name: string;
  compliance: number;
  incidents: number;
  violations: number;
}

export interface HeatmapZone {
  zone: string;
  violations: number;
  unresolved: number;
  avg_confidence: number;
  intensity: number;
  severity: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  is_high_risk: boolean;
}

export interface HeatmapData {
  zones: HeatmapZone[];
  total_zones: number;
  period_days: number;
  max_violations: number;
  hourly_trend: { hour: string; count: number }[];
}

export interface LeaderboardEntry {
  rank: number;
  worker_id: number;
  name: string;
  employee_code: string;
  safety_score: number;
  stars: number;
  total_violations: number;
  resolved: number;
  badges: { name: string; icon: string; desc: string }[];
  streak_days: number;
  language: string;
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  period_days: number;
  total_workers: number;
}

export interface PredictiveRiskEntry {
  zone: string;
  predicted_violations_24h: number;
  risk_probability: number;
  risk_level: string;
  avg_daily_rate: number;
  historical_confidence: number;
  contributing_factors: string[];
}

export interface PredictiveRiskData {
  predictions: PredictiveRiskEntry[];
  peak_hours: number[];
  high_risk_days: string[];
  model: string;
  generated_at: string;
}

export interface NearMissData {
  period_days: number;
  near_miss_count: number;
  violation_count: number;
  near_miss_ratio: number;
  prevention_score: number;
  by_zone: { zone: string; near_misses: number }[];
  by_ppe_type: { ppe_type: string; count: number }[];
  daily_trend: { day: string; near_misses: number; violations: number }[];
  insight: string;
}

export interface ShiftHandoverData {
  shift_period: { start: string; end: string; hours: number };
  summary: {
    total_violations: number;
    resolved: number;
    unresolved: number;
    resolution_rate: number;
    total_alerts: number;
    unacknowledged_alerts: number;
  };
  top_zones: { zone: string; count: number }[];
  top_ppe_issues: { ppe_type: string; count: number }[];
  workers_involved: { worker__name: string; worker__employee_code: string; count: number }[];
  alert_breakdown: { level: number; channel: string; count: number }[];
  critical_events: { alert_id: number; level: number; channel: string; time: string; acknowledged: boolean }[];
  handover_notes: string;
}

export interface KioskFaceScanResult {
  worker_id: string;
  name: string;
  employee_code: string;
  stars: number;
  compliance: number;
  similarity: number;
}

export interface KioskEnrollResult {
  status: string;
  employee_code: string;
  name: string;
  embedding_dim: number;
}

export interface PPEDetection {
  class: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // normalised x1, y1, x2, y2  [0-1]
  is_violation: boolean;
}

export interface KioskPPEResult {
  approved: boolean;
  missing: string[];
  detections: PPEDetection[];
  image_width: number;
  image_height: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authAPI = {
  login: (username: string, password: string) =>
    api.post<{ access: string; refresh: string; role: string; email: string; username: string }>(
      'auth/token/', { username, password }
    ),
  refreshToken: (refresh: string) =>
    api.post<{ access: string }>('auth/token/refresh/', { refresh }),
};

// ─── Users (auth accounts) ───────────────────────────────────────────────────

export interface UserAccount {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  first_name?: string;
  last_name?: string;
}

export const usersAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<UserAccount>>('users/', { params }),
  get: (id: number) =>
    api.get<UserAccount>(`users/${id}/`),
  create: (data: Partial<UserAccount> & { password?: string }) =>
    api.post<UserAccount>('users/', data),
  update: (id: number, data: Partial<UserAccount>) =>
    api.patch<UserAccount>(`users/${id}/`, data),
  delete: (id: number) =>
    api.delete(`users/${id}/`),
};

// ─── Workers ─────────────────────────────────────────────────────────────────

export const workersAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Worker>>('workers/', { params }),
  get: (id: number) =>
    api.get<Worker>(`workers/${id}/`),
  create: (data: Partial<Worker>) =>
    api.post<Worker>('workers/', data),
  update: (id: number, data: Partial<Worker>) =>
    api.patch<Worker>(`workers/${id}/`, data),
  delete: (id: number) =>
    api.delete(`workers/${id}/`),
  safetyScore: (id: number) =>
    api.get(`workers/${id}/safety-score/`),
  enrollFace: (id: number, image?: string) =>
    api.post(`workers/${id}/enroll-face/`, image ? { image } : {}),
  removeFace: (id: number) =>
    api.delete(`workers/${id}/face/`),
};

// ─── Violations ──────────────────────────────────────────────────────────────

export const violationsAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Violation>>('violations/', { params }),
  get: (id: number) =>
    api.get<Violation>(`violations/${id}/`),
  create: (data: Partial<Violation>) =>
    api.post<Violation>('violations/', data),
  resolve: (id: number) =>
    api.patch<Violation>(`violations/${id}/`, { resolved_at: new Date().toISOString() }),
};

// ─── Zones ───────────────────────────────────────────────────────────────────

export const zonesAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Zone>>('zones/', { params }),
  get: (id: number) =>
    api.get<Zone>(`zones/${id}/`),
  create: (data: Partial<Zone>) =>
    api.post<Zone>('zones/', data),
  update: (id: number, data: Partial<Zone>) =>
    api.patch<Zone>(`zones/${id}/`, data),
  delete: (id: number) =>
    api.delete(`zones/${id}/`),
};

// ─── Sites ───────────────────────────────────────────────────────────────────

export const sitesAPI = {
  list: () => api.get<PaginatedResponse<Site>>('sites/'),
  get: (id: number) => api.get<Site>(`sites/${id}/`),
  create: (data: Partial<Site>) => api.post<Site>('sites/', data),
  update: (id: number, data: Partial<Site>) => api.patch<Site>(`sites/${id}/`, data),
};

// ─── Alerts ──────────────────────────────────────────────────────────────────

export const alertsAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Alert>>('alerts/', { params }),
  active: () =>
    api.get<PaginatedResponse<Alert>>('alerts/active/'),
  acknowledge: (id: number) =>
    api.post(`alerts/${id}/acknowledge/`),
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export const analyticsAPI = {
  dashboardStats: () =>
    api.get<DashboardStats>('dashboard/stats/'),
  compliance: () =>
    api.get<ComplianceDay[]>('analytics/compliance/'),
  heatmap: (days?: number) =>
    api.get<HeatmapData>('analytics/heatmap/', { params: days ? { days } : {} }),
  leaderboard: (params?: { days?: number; limit?: number }) =>
    api.get<LeaderboardData>('analytics/leaderboard/', { params }),
  predictiveRisk: () =>
    api.get<PredictiveRiskData>('analytics/predictions/'),
  nearMiss: (days?: number) =>
    api.get<NearMissData>('analytics/near-misses/', { params: days ? { days } : {} }),
};

// ─── Kiosk ───────────────────────────────────────────────────────────────────

export const kioskAPI = {
  /** Authenticate worker by employee_code + passcode (PIN) — returns real JWT */
  login: (employee_code: string, passcode: string) =>
    api.post<{ access: string; refresh: string; role: string; employee_code: string; name: string }>(
      'kiosk/auth/', { employee_code, passcode }
    ),
  /** Enroll a worker's face — stores embedding in DB */
  enrollFace: (employee_code: string, image: string) =>
    api.post<KioskEnrollResult>('kiosk/enroll-face/', { employee_code, image }),
  /** Verify face against enrolled embeddings — returns matched worker (strict 1:1) */
  scanFace: (image: string, employee_code?: string) =>
    api.post<KioskFaceScanResult>('kiosk/scan-face/', { image, employee_code }),
  verifyPPE: (image: string, workerId?: number) =>
    api.post<KioskPPEResult>('kiosk/verify-ppe/', { image, worker_id: workerId }),
  /** Record attendance + optional violations after PPE check */
  checkin: (data: {
    employee_code: string;
    approved: boolean;
    missing: string[];
    detections: PPEDetection[];
    zone?: string;
  }) => api.post<{
    status: string;
    attendance_id: number;
    worker: string;
    employee_code: string;
    approved: boolean;
    violations: { id: number; ppe_type: string }[];
    compliance_rate: number;
  }>('kiosk/checkin/', data),
};

// ─── Camera ──────────────────────────────────────────────────────────────────

export const cameraAPI = {
  list: () => api.get('cameras/'),
  start: (cameraId: string, streamUrl: string, zoneId: string) =>
    api.post('cameras/start/', { camera_id: cameraId, stream_url: streamUrl, zone_id: zoneId }),
  stop: (cameraId: string) =>
    api.post('cameras/stop/', { camera_id: cameraId }),
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export const reportsAPI = {
  list: () => api.get<PaginatedResponse<ComplianceReport>>('reports/'),
  generateDaily: (siteId?: number) =>
    api.post('reports/generate/daily/', { site_id: siteId }),
  generateDGMS: () =>
    api.post('reports/generate/dgms/'),
  generateESG: () =>
    api.post('reports/generate/esg/'),
};

// ─── Shift & Emergency ──────────────────────────────────────────────────────

export const operationsAPI = {
  shiftHandover: (hours?: number) =>
    api.get<ShiftHandoverData>('shift/handover/', { params: hours ? { hours } : {} }),
  emergencySOS: (zone: string, reason: string) =>
    api.post('emergency/sos/', { zone, reason }),
  sendNotification: (data: { violation_id: number; email?: string; phone?: string }) =>
    api.post('notifications/send/', data),
  notifyWorker: (workerId: number, ppeType: string, zone: string) =>
    api.post(`workers/${workerId}/notify/`, { ppe_type: ppeType, zone }),
};

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export interface AdminDashboardData {
  workers: { total: number; active: number; on_site: number };
  cameras: { total: number; online: number; recording: number };
  violations: { total: number; resolved: number; resolution_rate: number };
  active_alerts: number;
  daily_trend: { day: string; date: string; violations: number; resolved: number; compliance: number }[];
  zone_data: { zone: string; compliance: number; violations: number; risk: string }[];
  ppe_breakdown: { name: string; value: number; color: string }[];
  hourly_violations: { hour: string; count: number }[];
  recent_activity: { id: number; action: string; detail: string; time: string; type: string }[];
}

export interface SystemAnalyticsData {
  monthly_trend: { month: string; violations: number; resolved: number; incidents: number; compliance: number }[];
  shift_data: { shift: string; violations: number; workers: number; avg: number; peak: string }[];
  worker_performance: { name: string; violations: number; compliance: number; streak: number; trend: string }[];
  zone_radar: { zone: string; current: number; previous: number }[];
  ppe_trend: Record<string, number | string>[];
  response_time: { range: string; count: number; pct: number }[];
}

export interface AuditLogEvent {
  id: number;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  category: string;
  detail: string;
  ip: string;
  severity: string;
}

export const adminAPI = {
  dashboard: (period?: number) =>
    api.get<AdminDashboardData>('admin/dashboard/', { params: period ? { period } : {} }),
  systemAnalytics: (months?: number) =>
    api.get<SystemAnalyticsData>('analytics/system/', { params: months ? { months } : {} }),
  auditLog: (params?: { limit?: number; category?: string; severity?: string }) =>
    api.get<{ events: AuditLogEvent[]; total: number }>('audit-log/', { params }),
};
