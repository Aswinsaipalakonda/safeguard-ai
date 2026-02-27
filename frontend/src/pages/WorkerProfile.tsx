import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import {
  ArrowLeft, Shield, Award, Flame, AlertTriangle, CheckCircle2,
  Clock, MapPin, Star, TrendingUp, Calendar, Send, ThumbsUp, Camera
} from "lucide-react";
import { workersAPI, violationsAPI, type Worker as APIWorker, type Violation as APIViolation } from "../lib/api";

/* ── Fallback demo workers ── */
const WORKERS: Record<string, {
  name: string; id: string; dept: string; role: string; zone: string;
  joinDate: string; avatar: string; compliance: number; streak: number;
  totalViolations: number; resolvedViolations: number; avgResponse: number;
  shift: string; supervisor: string; phone: string;
}> = {
  "EMP-001": { name: "Rajesh Kumar", id: "EMP-001", dept: "Mining Operations", role: "Drill Operator", zone: "Underground Shaft B", joinDate: "2022-03-15", avatar: "RK", compliance: 96, streak: 24, totalViolations: 8, resolvedViolations: 7, avgResponse: 4, shift: "Morning", supervisor: "Anil Gupta", phone: "+91-98765-43210" },
  "EMP-002": { name: "Suresh Reddy", id: "EMP-002", dept: "Excavation", role: "Excavator Operator", zone: "Excavation Area A", joinDate: "2021-08-22", avatar: "SR", compliance: 92, streak: 18, totalViolations: 12, resolvedViolations: 11, avgResponse: 6, shift: "Morning", supervisor: "Anil Gupta", phone: "+91-98765-43211" },
  "EMP-003": { name: "Deepak Yadav", id: "EMP-003", dept: "Processing", role: "Plant Technician", zone: "Processing Plant", joinDate: "2023-01-10", avatar: "DY", compliance: 98, streak: 45, totalViolations: 3, resolvedViolations: 3, avgResponse: 2, shift: "Afternoon", supervisor: "Meera Sharma", phone: "+91-98765-43212" },
  "EMP-004": { name: "Amit Singh", id: "EMP-004", dept: "Blasting", role: "Blaster", zone: "Blasting Zone C", joinDate: "2020-11-05", avatar: "AS", compliance: 88, streak: 7, totalViolations: 18, resolvedViolations: 15, avgResponse: 11, shift: "Morning", supervisor: "Anil Gupta", phone: "+91-98765-43213" },
  "EMP-005": { name: "Priya Nair", id: "EMP-005", dept: "Processing", role: "Quality Inspector", zone: "Processing Plant", joinDate: "2023-06-20", avatar: "PN", compliance: 100, streak: 60, totalViolations: 0, resolvedViolations: 0, avgResponse: 0, shift: "Morning", supervisor: "Meera Sharma", phone: "+91-98765-43214" },
  "EMP-008": { name: "Lakshmi Devi", id: "EMP-008", dept: "Safety", role: "Safety Officer", zone: "All Zones", joinDate: "2019-04-01", avatar: "LD", compliance: 99, streak: 90, totalViolations: 1, resolvedViolations: 1, avgResponse: 1, shift: "Morning", supervisor: "Director", phone: "+91-98765-43215" },
  "EMP-010": { name: "Mohammed Ismail", id: "EMP-010", dept: "Conveyor Ops", role: "Belt Technician", zone: "Conveyor Belt Section", joinDate: "2022-09-12", avatar: "MI", compliance: 91, streak: 12, totalViolations: 14, resolvedViolations: 12, avgResponse: 8, shift: "Afternoon", supervisor: "Anil Gupta", phone: "+91-98765-43216" },
  "EMP-011": { name: "Sandeep Joshi", id: "EMP-011", dept: "Mining Operations", role: "Shaft Miner", zone: "Underground Shaft B", joinDate: "2021-02-28", avatar: "SJ", compliance: 85, streak: 3, totalViolations: 22, resolvedViolations: 18, avgResponse: 14, shift: "Morning", supervisor: "Anil Gupta", phone: "+91-98765-43217" },
  "EMP-014": { name: "Naveen Reddy", id: "EMP-014", dept: "Loading", role: "Forklift Driver", zone: "Loading Dock", joinDate: "2023-03-15", avatar: "NR", compliance: 94, streak: 21, totalViolations: 6, resolvedViolations: 6, avgResponse: 5, shift: "Morning", supervisor: "Meera Sharma", phone: "+91-98765-43218" },
  "EMP-089": { name: "Vikram Singh", id: "EMP-089", dept: "Excavation", role: "Heavy Equipment Op", zone: "Excavation Area A", joinDate: "2020-06-10", avatar: "VS", compliance: 79, streak: 1, totalViolations: 28, resolvedViolations: 20, avgResponse: 18, shift: "Morning", supervisor: "Anil Gupta", phone: "+91-98765-43219" },
};

/** Map an API worker to profile display format */
function apiWorkerToProfile(w: APIWorker) {
  const initials = w.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  return {
    name: w.name,
    id: w.employee_code,
    dept: "Operations",
    role: "Worker",
    zone: "Assigned Zone",
    joinDate: w.enrolled_at?.slice(0, 10) ?? "—",
    avatar: initials,
    compliance: Math.round(w.compliance_rate),
    streak: Math.max(1, Math.floor((100 - w.violation_count) / 3)),
    totalViolations: w.violation_count,
    resolvedViolations: Math.max(0, w.violation_count - 2),
    avgResponse: w.violation_count > 0 ? Math.floor(Math.random() * 12) + 2 : 0,
    shift: "Morning",
    supervisor: "Supervisor",
    phone: "—",
  };
}

/** Map API violations to table rows */
function apiViolationsToRows(violations: APIViolation[]) {
  return violations.map((v, i) => ({
    id: i + 1,
    date: v.created_at?.slice(0, 10) ?? "—",
    type: v.ppe_type.replace(/_/g, " ").replace(/^no /i, "No "),
    zone: v.zone,
    camera: v.camera_id,
    confidence: v.confidence < 1 ? Math.round(v.confidence * 100) : Math.round(v.confidence),
    responseTime: Math.floor(Math.random() * 18) + 2,
    status: v.resolved_at ? "Resolved" : "Pending",
  }));
}

/* ── 30-day compliance data ── */
function generateComplianceData(base: number) {
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    compliance: Math.max(50, Math.min(100, base + Math.floor((Math.random() - 0.4) * 15))),
  }));
}

/* ── Attendance heatmap (last 12 weeks) ── */
function generateAttendanceData() {
  const data: number[][] = [];
  for (let w = 0; w < 12; w++) {
    const week: number[] = [];
    for (let d = 0; d < 7; d++) {
      const r = Math.random();
      week.push(r < 0.75 ? 2 : r < 0.9 ? 1 : 0);
    }
    data.push(week);
  }
  return data;
}

/* ── Violation history ── */
function generateViolations(workerId: string) {
  const types = ["No Helmet", "No Vest", "No Goggles", "No Gloves", "No Boots"];
  const zones = ["Underground Shaft B", "Excavation Area A", "Conveyor Belt Section", "Blasting Zone C", "Processing Plant"];
  const worker = WORKERS[workerId];
  return Array.from({ length: worker?.totalViolations ?? 5 }, (_, i) => ({
    id: i + 1,
    date: `2025-06-${String(Math.max(1, 28 - i * 2)).padStart(2, "0")}`,
    type: types[i % types.length],
    zone: zones[i % zones.length],
    camera: `CAM-${(i % 12) + 1}`,
    confidence: 85 + Math.floor(Math.random() * 12),
    responseTime: Math.floor(Math.random() * 20) + 2,
    status: i < (worker?.resolvedViolations ?? 4) ? "Resolved" : "Pending",
  }));
}

/* ── Badges ── */
const ALL_BADGES = [
  { name: "Safety Rookie", icon: "🛡️", desc: "Completed first PPE check", requirement: 1 },
  { name: "Iron Streak", icon: "🔥", desc: "7-day clean streak", requirement: 7 },
  { name: "Zone Master", icon: "⭐", desc: "Top compliance in zone", requirement: 95 },
  { name: "Perfect Month", icon: "🏆", desc: "30 days zero violations", requirement: 30 },
  { name: "Quick Responder", icon: "⚡", desc: "Avg response under 5min", requirement: 5 },
  { name: "Veteran", icon: "🎖️", desc: "1+ year safe record", requirement: 365 },
];

const DarkTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg shadow-xl text-xs border border-slate-700">
      <p className="text-slate-400 text-[10px]">Day {label}</p>
      <p className="font-bold text-indigo-300">{payload[0].value}%</p>
    </div>
  );
};

export default function WorkerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fallbackWorker = WORKERS[id || "EMP-001"] || WORKERS["EMP-001"];
  
  const [worker, setWorker] = useState(fallbackWorker);
  const [apiViolations, setApiViolations] = useState<ReturnType<typeof apiViolationsToRows>>([]);

  // Fetch worker + violations from API
  useEffect(() => {
    (async () => {
      try {
        const wRes = await workersAPI.list({ page_size: 50 });
        const apiWorker = wRes.data.results.find(w => w.employee_code === id);
        if (apiWorker) {
          setWorker(apiWorkerToProfile(apiWorker));
          // fetch this worker's violations
          try {
            const vRes = await violationsAPI.list({ worker: apiWorker.id, ordering: '-created_at', page_size: 50 });
            setApiViolations(apiViolationsToRows(vRes.data.results));
          } catch { /* keep generated violations */ }
        }
      } catch {
        // keep fallback
      }
    })();
  }, [id]);

  const complianceData = useMemo(() => generateComplianceData(worker.compliance), [worker.id]);
  const attendanceData = useMemo(() => generateAttendanceData(), [worker.id]);
  const violations = apiViolations.length > 0 ? apiViolations : useMemo(() => generateViolations(worker.id), [worker.id]);

  const [violationPage, setViolationPage] = useState(0);
  const perPage = 5;
  const pagedViolations = violations.slice(violationPage * perPage, (violationPage + 1) * perPage);
  const totalPages = Math.ceil(violations.length / perPage);

  const earnedBadges = ALL_BADGES.filter(b => {
    if (b.requirement <= 7) return worker.streak >= b.requirement;
    if (b.requirement === 95) return worker.compliance >= 95;
    if (b.requirement === 30) return worker.streak >= 30;
    if (b.requirement === 5) return worker.avgResponse > 0 && worker.avgResponse <= 5;
    if (b.requirement === 365) return true;
    return true;
  });

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const attendanceColors = ["bg-red-400", "bg-amber-400", "bg-emerald-400"];

  /* ── Compliance by PPE item (fake) ── */
  const ppeBreakdown = [
    { item: "Hard Hat", pct: Math.min(100, worker.compliance + 2) },
    { item: "Safety Vest", pct: Math.min(100, worker.compliance - 1) },
    { item: "Gloves", pct: Math.min(100, worker.compliance + 4) },
    { item: "Boots", pct: Math.min(100, worker.compliance + 1) },
    { item: "Eye Protection", pct: Math.min(100, worker.compliance - 3) },
  ];
  const barColors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8"];

  return (
    <div className="space-y-6 font-sans">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-all font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Worker Header */}
      <div className="bg-gradient-to-r from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-3xl font-black text-indigo-300 ring-4 ring-white/10">
            {worker.avatar}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{worker.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-indigo-200/70 text-xs flex-wrap">
              <span className="font-mono">{worker.id}</span>
              <span>•</span>
              <span>{worker.role}</span>
              <span>•</span>
              <span>{worker.dept}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{worker.zone}</span>
            </div>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div className="bg-white/10 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-indigo-300">Shift:</span> {worker.shift}
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-indigo-300">Supervisor:</span> {worker.supervisor}
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-indigo-300">Joined:</span> {worker.joinDate}
              </div>
            </div>
          </div>

          {/* Score circle */}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center ${worker.compliance >= 95 ? "bg-emerald-500/20" : worker.compliance >= 85 ? "bg-amber-500/20" : "bg-red-500/20"}`}>
              <p className={`text-3xl font-black ${worker.compliance >= 95 ? "text-emerald-400" : worker.compliance >= 85 ? "text-amber-400" : "text-red-400"}`}>{worker.compliance}%</p>
              <p className="text-[9px] text-white/40 uppercase font-bold">Compliance</p>
            </div>
            <div className="flex items-center gap-1 text-orange-300 text-xs font-bold mt-1">
              <Flame className="w-3.5 h-3.5" />{worker.streak}-day streak
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Violations", value: worker.totalViolations, icon: <AlertTriangle className="w-4 h-4 text-red-500" />, color: "text-red-600" },
          { label: "Resolved", value: worker.resolvedViolations, icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, color: "text-emerald-600" },
          { label: "Avg Response", value: `${worker.avgResponse}m`, icon: <Clock className="w-4 h-4 text-blue-500" />, color: "text-blue-600" },
          { label: "Current Streak", value: `${worker.streak}d`, icon: <Flame className="w-4 h-4 text-orange-500" />, color: "text-orange-600" },
          { label: "Badges Earned", value: earnedBadges.length, icon: <Award className="w-4 h-4 text-amber-500" />, color: "text-amber-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center">{stat.icon}</div>
            <div>
              <p className={`text-xl font-bold ${stat.color} tabular-nums`}>{stat.value}</p>
              <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Trend */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" />30-Day Compliance Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={complianceData}>
              <defs>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="compliance" stroke="#6366f1" fill="url(#compGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* PPE Compliance Breakdown */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4"><Shield className="w-4 h-4 text-indigo-500" />PPE Compliance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ppeBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis dataKey="item" type="category" width={90} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={16}>
                {ppeBreakdown.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance heatmap + Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Heatmap */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4"><Calendar className="w-4 h-4 text-indigo-500" />Attendance Heatmap <span className="text-[10px] text-slate-400 font-normal">(last 12 weeks)</span></h2>
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-[3px] pt-5">
              {dayLabels.map(d => <div key={d} className="h-[18px] flex items-center text-[9px] text-slate-400 font-bold">{d}</div>)}
            </div>
            <div className="flex gap-[3px] overflow-x-auto">
              {attendanceData.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  <div className="text-[8px] text-slate-300 text-center font-bold">W{wi + 1}</div>
                  {week.map((d, di) => (
                    <div key={di} className={`w-[18px] h-[18px] rounded-[4px] ${attendanceColors[d]} opacity-80 hover:opacity-100 transition-all cursor-pointer`} title={`Week ${wi + 1}, ${dayLabels[di]}: ${d === 2 ? "Present" : d === 1 ? "Late" : "Absent"}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400" />Present</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" />Late</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" />Absent</span>
          </div>
        </div>

        {/* Safety Badges */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4"><Star className="w-4 h-4 text-amber-500" />Safety Badges</h2>
          <div className="grid grid-cols-2 gap-3">
            {ALL_BADGES.map(badge => {
              const earned = earnedBadges.includes(badge);
              return (
                <div key={badge.name} className={`rounded-xl p-3 border transition-all ${earned ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100 opacity-40"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <p className={`text-xs font-bold ${earned ? "text-slate-700" : "text-slate-400"}`}>{badge.name}</p>
                      <p className="text-[9px] text-slate-400">{badge.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Violation History Table */}
      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" />Violation History</h2>
          <span className="text-[10px] text-slate-400 font-bold">{violations.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 font-bold">#</th>
                <th className="pb-3 font-bold">Date</th>
                <th className="pb-3 font-bold">Type</th>
                <th className="pb-3 font-bold">Zone</th>
                <th className="pb-3 font-bold">Camera</th>
                <th className="pb-3 font-bold">Confidence</th>
                <th className="pb-3 font-bold">Response</th>
                <th className="pb-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedViolations.map(v => (
                <tr key={v.id} className="text-xs text-slate-600 border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                  <td className="py-3 font-mono text-slate-400">{v.id}</td>
                  <td className="py-3 font-medium">{v.date}</td>
                  <td className="py-3"><span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{v.type}</span></td>
                  <td className="py-3 flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-300" />{v.zone}</td>
                  <td className="py-3"><Camera className="w-3 h-3 text-slate-300 inline mr-1" />{v.camera}</td>
                  <td className="py-3 tabular-nums font-bold text-indigo-600">{v.confidence}%</td>
                  <td className="py-3 tabular-nums">{v.responseTime}min</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.status === "Resolved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{v.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => setViolationPage(Math.max(0, violationPage - 1))} disabled={violationPage === 0} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-slate-200 transition-all">Prev</button>
            <span className="text-xs text-slate-400">{violationPage + 1} / {totalPages}</span>
            <button onClick={() => setViolationPage(Math.min(totalPages - 1, violationPage + 1))} disabled={violationPage >= totalPages - 1} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-slate-200 transition-all">Next</button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-400 transition-all shadow-sm"><Send className="w-4 h-4" />Send Warning</button>
        <button className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all shadow-sm"><ThumbsUp className="w-4 h-4" />Send Appreciation</button>
      </div>
    </div>
  );
}
