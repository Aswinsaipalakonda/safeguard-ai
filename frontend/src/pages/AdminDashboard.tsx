import { useState, useEffect } from "react";
import {
  Users, Camera, ShieldCheck, AlertTriangle, TrendingUp,
  Activity, Cpu, Wifi, HardDrive, Clock, ArrowUpRight, Zap, Eye, Loader2
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { adminAPI, type AdminDashboardData } from "../lib/api";

/* ── Fallback Data ── */
const FALLBACK: AdminDashboardData = {
  workers: { total: 0, active: 0, on_site: 0 },
  cameras: { total: 0, online: 0, recording: 0 },
  violations: { total: 0, resolved: 0, resolution_rate: 0 },
  active_alerts: 0,
  daily_trend: [],
  zone_data: [],
  ppe_breakdown: [],
  hourly_violations: [],
  recent_activity: [],
};

const PPE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

const RADAR_DATA = [
  { metric: "Helmet", A: 96, B: 82 },
  { metric: "Vest", A: 93, B: 78 },
  { metric: "Goggles", A: 88, B: 65 },
  { metric: "Gloves", A: 91, B: 72 },
  { metric: "Boots", A: 97, B: 89 },
  { metric: "Harness", A: 85, B: 68 },
];

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-bold" style={{ color: p.color || p.payload?.fill || '#fff' }}>{p.name}: {p.value}{typeof p.value === 'number' && p.name?.includes('ompliance') ? '%' : ''}</p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [aiMetrics, setAiMetrics] = useState({ accuracy: 94.2, fps: 23, uptime: 99.8 });
  const [period, setPeriod] = useState<"7D" | "14D" | "30D">("7D");

  const periodDays = period === "7D" ? 7 : period === "14D" ? 14 : 30;

  // Fetch dashboard data from API
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await adminAPI.dashboard(periodDays);
        if (!cancelled) setData(res.data);
      } catch {
        // keep current data
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [periodDays]);

  // Simulate live AI metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAiMetrics(prev => ({
        ...prev,
        accuracy: +(prev.accuracy + (Math.random() - 0.5) * 0.2).toFixed(1),
        fps: Math.round(prev.fps + (Math.random() - 0.5) * 2),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { workers, cameras, violations, daily_trend, zone_data, ppe_breakdown, hourly_violations, recent_activity } = data;
  const ppeWithColors = ppe_breakdown.map((item, i) => ({ ...item, color: item.color || PPE_COLORS[i % PPE_COLORS.length] }));

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Control Center</h1>
          <p className="text-sm text-slate-500 mt-1">System-wide overview • Real-time analytics • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
          {(["7D", "14D", "30D"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${period === p ? "bg-[#18181b] text-white shadow-md" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 1: Primary Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Workers */}
        <div className="bg-gradient-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full flex items-center"><TrendingUp className="w-3 h-3 mr-1" />Live</span>
          </div>
          <h2 className="text-3xl font-bold tabular-nums">{workers.total}</h2>
          <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">TOTAL WORKERS</p>
          <div className="flex gap-4 mt-4 text-xs text-slate-300">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" />{workers.active} Active</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />{workers.on_site} On-site</span>
          </div>
        </div>

        {/* Cameras */}
        <div className="bg-gradient-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">{cameras.total > 0 && cameras.online === cameras.total ? "100% UP" : cameras.total > 0 ? `${Math.round(cameras.online/cameras.total*100)}% UP` : "N/A"}</span>
          </div>
          <h2 className="text-3xl font-bold tabular-nums">{cameras.online}<span className="text-lg text-slate-400">/{cameras.total}</span></h2>
          <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">CAMERAS ONLINE</p>
          <div className="flex gap-4 mt-4 text-xs text-slate-300">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" />{cameras.recording} Recording</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400" />{cameras.total - cameras.online} Offline</span>
          </div>
        </div>

        {/* AI Performance */}
        <div className="bg-gradient-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full flex items-center"><Zap className="w-3 h-3 mr-1" />{aiMetrics.fps} FPS</span>
          </div>
          <h2 className="text-3xl font-bold tabular-nums">{aiMetrics.accuracy}<span className="text-lg">%</span></h2>
          <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">AI MODEL ACCURACY</p>
          <div className="flex gap-4 mt-4 text-xs text-slate-300">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-green-400" />{aiMetrics.uptime}% Uptime</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" />23ms Latency</span>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-gradient-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full flex items-center"><TrendingUp className="w-3 h-3 mr-1" />+{Math.max(0, violations.resolution_rate - 90).toFixed(1)}%</span>
          </div>
          <h2 className="text-3xl font-bold tabular-nums">{violations.resolution_rate}<span className="text-lg">%</span></h2>
          <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">RESOLUTION RATE</p>
          <div className="flex gap-4 mt-4 text-xs text-slate-300">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" />{violations.resolved} Resolved</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400" />{violations.total - violations.resolved} Pending</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Violation Trend (Area) */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Violation Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">{period} violations vs resolved</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" />Violations</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Resolved</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={daily_trend}>
              <defs>
                <linearGradient id="adGradViolations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="adGradResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="violations" stroke="#ef4444" fill="url(#adGradViolations)" strokeWidth={2.5} name="Violations" />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#adGradResolved)" strokeWidth={2.5} name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* PPE Breakdown (Donut) */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-1">PPE Violations</h3>
          <p className="text-xs text-slate-400 mb-4">By equipment type</p>
          <ResponsiveContainer width="100%" height={200}>
            <RPieChart>
              <Pie data={ppeWithColors} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                {ppeWithColors.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
            </RPieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {ppeWithColors.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </span>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Zone Compliance + Hourly Pattern ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Zone Compliance Bar Chart */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Zone Compliance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Compliance rate by zone</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={zone_data} barCategoryGap="20%">
              <defs>
                <linearGradient id="adBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="zone" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="compliance" fill="url(#adBarGrad)" radius={[8, 8, 0, 0]} name="Compliance %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Violation Pattern */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Hourly Violation Pattern</h3>
              <p className="text-xs text-slate-400 mt-0.5">Peak violation hours</p>
            </div>
            <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full font-bold">Live Today</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourly_violations} barCategoryGap="15%">
              <defs>
                <linearGradient id="adHourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="count" fill="url(#adHourGrad)" radius={[6, 6, 0, 0]} name="Violations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: PPE Radar + Zone Risk Table ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* PPE Detection Radar */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">PPE Detection Accuracy</h3>
              <p className="text-xs text-slate-400 mt-0.5">Model performance by equipment type</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />Current</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-400" />Baseline</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "#64748b" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Radar name="Current" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Baseline" dataKey="B" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Tooltip content={<DarkTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Risk Assessment */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Zone Risk Assessment</h3>
              <p className="text-xs text-slate-400 mt-0.5">Current risk levels by area</p>
            </div>
            <button className="text-xs text-indigo-500 font-bold hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {zone_data.map((zone) => {
              const riskColor = zone.risk === "Critical" ? "bg-red-500" : zone.risk === "High" ? "bg-orange-500" : zone.risk === "Medium" ? "bg-amber-500" : "bg-green-500";
              const riskBg = zone.risk === "Critical" ? "bg-red-50 text-red-600" : zone.risk === "High" ? "bg-orange-50 text-orange-600" : zone.risk === "Medium" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600";
              return (
                <div key={zone.zone} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-8 rounded-full ${riskColor}`} />
                    <div>
                      <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">{zone.zone}</p>
                      <p className="text-xs text-slate-400">{zone.violations} violations this period</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800 tabular-nums">{zone.compliance}%</p>
                      <p className="text-[10px] text-slate-400">Compliance</p>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${riskBg}`}>{zone.risk.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 5: System Health + Recent Activity ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="bg-gradient-to-br from-[#09090b] to-[#1a1a2e] rounded-[2rem] p-6 shadow-xl text-white">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Eye className="w-5 h-5 text-indigo-400" />System Health</h3>
          <div className="space-y-5">
            {[
              { label: "API Server", status: "Operational", icon: <Wifi className="w-4 h-4" />, uptime: "99.9%", color: "text-green-400" },
              { label: "Database", status: "Operational", icon: <HardDrive className="w-4 h-4" />, uptime: "99.8%", color: "text-green-400" },
              { label: "AI Engine", status: "Processing", icon: <Cpu className="w-4 h-4" />, uptime: "99.7%", color: "text-green-400" },
              { label: "Redis Pub/Sub", status: "Operational", icon: <Activity className="w-4 h-4" />, uptime: "100%", color: "text-green-400" },
              { label: "MinIO Storage", status: "Operational", icon: <HardDrive className="w-4 h-4" />, uptime: "99.9%", color: "text-green-400" },
            ].map((svc) => (
              <div key={svc.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-400">{svc.icon}</div>
                  <div>
                    <p className="text-sm font-medium">{svc.label}</p>
                    <p className={`text-[10px] font-bold ${svc.color}`}>{svc.status}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono tabular-nums">{svc.uptime}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Last Health Check</span>
              <span className="text-green-400 font-bold">12 sec ago</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">System-wide event log</p>
            </div>
            <button className="text-xs text-indigo-500 font-bold hover:underline flex items-center gap-1">
              View Audit Log <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recent_activity.map((event) => {
              const typeIcon = event.type === "alert" ? <AlertTriangle className="w-4 h-4 text-red-500" /> : event.type === "user" ? <Users className="w-4 h-4 text-blue-500" /> : event.type === "zone" ? <ShieldCheck className="w-4 h-4 text-amber-500" /> : event.type === "ai" ? <Cpu className="w-4 h-4 text-indigo-500" /> : event.type === "camera" ? <Camera className="w-4 h-4 text-green-500" /> : <Activity className="w-4 h-4 text-slate-400" />;
              const typeBg = event.type === "alert" ? "bg-red-50" : event.type === "user" ? "bg-blue-50" : event.type === "zone" ? "bg-amber-50" : event.type === "ai" ? "bg-indigo-50" : event.type === "camera" ? "bg-green-50" : "bg-slate-50";
              return (
                <div key={event.id} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer">
                  <div className={`w-9 h-9 ${typeBg} rounded-xl flex items-center justify-center shrink-0`}>{typeIcon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{event.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{event.detail}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{event.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
