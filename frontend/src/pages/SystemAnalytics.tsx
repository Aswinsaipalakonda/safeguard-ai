import { useState } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, ArrowUpRight,
  Calendar, Download, Target, Clock, Users
} from "lucide-react";
import {
  Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line
} from "recharts";

/* ── Data ── */
const MONTHLY_TREND = [
  { month: "Sep", violations: 320, resolved: 290, incidents: 12, compliance: 84 },
  { month: "Oct", violations: 280, resolved: 265, incidents: 8, compliance: 87 },
  { month: "Nov", violations: 245, resolved: 238, incidents: 6, compliance: 90 },
  { month: "Dec", violations: 210, resolved: 205, incidents: 5, compliance: 92 },
  { month: "Jan", violations: 195, resolved: 190, incidents: 4, compliance: 93 },
  { month: "Feb", violations: 156, resolved: 152, incidents: 3, compliance: 95 },
];

const SHIFT_DATA = [
  { shift: "Morning (6AM-2PM)", violations: 89, workers: 45, avg: 1.98, peak: "8:30 AM" },
  { shift: "Afternoon (2PM-10PM)", violations: 52, workers: 38, avg: 1.37, peak: "3:15 PM" },
  { shift: "Night (10PM-6AM)", violations: 15, workers: 22, avg: 0.68, peak: "11:45 PM" },
];

const WORKER_PERFORMANCE = [
  { name: "Rajesh K.", violations: 0, compliance: 100, streak: 45, trend: "up" },
  { name: "Priya N.", violations: 2, compliance: 94, streak: 12, trend: "up" },
  { name: "Suresh R.", violations: 5, compliance: 87, streak: 0, trend: "down" },
  { name: "Mohammed I.", violations: 1, compliance: 97, streak: 28, trend: "up" },
  { name: "Vikram S.", violations: 3, compliance: 91, streak: 8, trend: "up" },
  { name: "Karthik B.", violations: 8, compliance: 72, streak: 0, trend: "down" },
  { name: "Deepak Y.", violations: 0, compliance: 100, streak: 60, trend: "up" },
  { name: "Anand V.", violations: 1, compliance: 96, streak: 21, trend: "up" },
];

const DAILY_HEATMAP = Array.from({ length: 7 }, (_, dayIdx) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dayIdx],
  hours: Array.from({ length: 12 }, (_, h) => ({
    hour: h + 6,
    value: Math.floor(Math.random() * 15) + (dayIdx < 5 && h >= 2 && h <= 6 ? 10 : 0),
  })),
}));

const ZONE_RADAR = [
  { zone: "Assembly", current: 95, previous: 88 },
  { zone: "Welding", current: 76, previous: 72 },
  { zone: "Loading", current: 99, previous: 95 },
  { zone: "Excavation", current: 82, previous: 78 },
  { zone: "Shaft B", current: 71, previous: 68 },
  { zone: "Processing", current: 88, previous: 84 },
];

const RESPONSE_TIME = [
  { range: "< 1 min", count: 42, pct: 28 },
  { range: "1-5 min", count: 68, pct: 45 },
  { range: "5-15 min", count: 28, pct: 18 },
  { range: "15-30 min", count: 9, pct: 6 },
  { range: "> 30 min", count: 5, pct: 3 },
];

const RESPONSE_COLORS = ["#10b981", "#22c55e", "#f59e0b", "#f97316", "#ef4444"];

const PPE_TREND_TYPE = [
  { month: "Sep", helmet: 120, vest: 80, goggles: 45, gloves: 30, boots: 25, harness: 20 },
  { month: "Oct", helmet: 105, vest: 72, goggles: 38, gloves: 28, boots: 20, harness: 17 },
  { month: "Nov", helmet: 92, vest: 65, goggles: 32, gloves: 24, boots: 18, harness: 14 },
  { month: "Dec", helmet: 78, vest: 55, goggles: 28, gloves: 20, boots: 15, harness: 14 },
  { month: "Jan", helmet: 70, vest: 50, goggles: 25, gloves: 18, boots: 18, harness: 14 },
  { month: "Feb", helmet: 62, vest: 40, goggles: 18, gloves: 15, boots: 12, harness: 9 },
];

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function SystemAnalytics() {
  const [period, setPeriod] = useState<"6M" | "3M" | "1M">("6M");

  const kpis = [
    { label: "Total Violations (6M)", value: "1,406", change: "-18.2%", up: false, icon: <BarChart3 className="w-5 h-5 text-red-500" />, bg: "bg-red-50" },
    { label: "Avg Resolution Time", value: "4.2 min", change: "-32%", up: false, icon: <Clock className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
    { label: "Compliance Growth", value: "+11%", change: "84% → 95%", up: true, icon: <Target className="w-5 h-5 text-green-500" />, bg: "bg-green-50" },
    { label: "Active Workers", value: "142", change: "+8", up: true, icon: <Users className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Deep-dive safety data analysis & trends</p>
        </div>
        <div className="flex items-center gap-2">
          {(["6M", "3M", "1M"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${period === p ? "bg-[#18181b] text-white shadow-md" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>{p}</button>
          ))}
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-50"><Calendar className="w-3.5 h-3.5" />Custom</button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-50"><Download className="w-3.5 h-3.5" />Export</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center`}>{kpi.icon}</div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-0.5 ${kpi.up ? "bg-green-50 text-green-600" : "bg-emerald-50 text-emerald-600"}`}>
                {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{kpi.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 tabular-nums">{kpi.value}</h3>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* ── Monthly Trend (Composed) ── */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Monthly Safety Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">6-month violation trend with compliance overlay</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" />Violations</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Resolved</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-indigo-500" />Compliance %</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={MONTHLY_TREND}>
            <defs>
              <linearGradient id="saViol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="saResol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" domain={[70, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} />
            <Area yAxisId="left" type="monotone" dataKey="violations" stroke="#ef4444" fill="url(#saViol)" strokeWidth={2.5} name="Violations" />
            <Area yAxisId="left" type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#saResol)" strokeWidth={2.5} name="Resolved" />
            <Line yAxisId="right" type="monotone" dataKey="compliance" stroke="#6366f1" strokeWidth={3} dot={{ fill: "#6366f1", r: 4 }} name="Compliance %" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Row: PPE Type Trend + Response Time ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* PPE Type Trend */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">PPE Violation Trend by Type</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly breakdown per equipment category</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={PPE_TREND_TYPE} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="helmet" fill="#ef4444" radius={[4, 4, 0, 0]} name="Helmet" stackId="a" />
              <Bar dataKey="vest" fill="#f97316" radius={[0, 0, 0, 0]} name="Vest" stackId="a" />
              <Bar dataKey="goggles" fill="#eab308" radius={[0, 0, 0, 0]} name="Goggles" stackId="a" />
              <Bar dataKey="gloves" fill="#22c55e" radius={[0, 0, 0, 0]} name="Gloves" stackId="a" />
              <Bar dataKey="boots" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Boots" stackId="a" />
              <Bar dataKey="harness" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Harness" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Distribution */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Response Time</h3>
          <p className="text-xs text-slate-400 mb-4">Time to first action on violations</p>
          <ResponsiveContainer width="100%" height={200}>
            <RPieChart>
              <Pie data={RESPONSE_TIME} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" stroke="none">
                {RESPONSE_TIME.map((_, i) => <Cell key={i} fill={RESPONSE_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
            </RPieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {RESPONSE_TIME.map((item, i) => (
              <div key={item.range} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: RESPONSE_COLORS[i] }} />
                  <span className="text-slate-600 font-medium">{item.range}</span>
                </span>
                <span className="font-bold text-slate-800">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row: Zone Radar + Shift Analysis ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Zone Compliance Radar */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Zone Compliance Radar</h3>
              <p className="text-xs text-slate-400 mt-0.5">Current vs previous month</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />Current</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-400" />Previous</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={ZONE_RADAR}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="zone" tick={{ fontSize: 12, fill: "#64748b" }} />
              <PolarRadiusAxis angle={30} domain={[50, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Radar name="Current" dataKey="current" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Previous" dataKey="previous" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Tooltip content={<DarkTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Shift Analysis */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Shift-wise Analysis</h3>
              <p className="text-xs text-slate-400 mt-0.5">Violations distribution across shifts</p>
            </div>
            <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full font-bold">Morning shift highest</span>
          </div>
          <div className="space-y-4">
            {SHIFT_DATA.map((shift, i) => {
              const pct = (shift.violations / 156) * 100;
              const color = i === 0 ? "from-red-500 to-orange-400" : i === 1 ? "from-amber-500 to-yellow-400" : "from-green-500 to-emerald-400";
              const bgColor = i === 0 ? "bg-red-50" : i === 1 ? "bg-amber-50" : "bg-green-50";
              return (
                <div key={shift.shift} className={`${bgColor} rounded-2xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-800">{shift.shift}</h4>
                    <span className="text-lg font-bold text-slate-800 tabular-nums">{shift.violations}</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-slate-400">Workers</span><p className="font-bold text-slate-700">{shift.workers}</p></div>
                    <div><span className="text-slate-400">Avg/Worker</span><p className="font-bold text-slate-700">{shift.avg.toFixed(2)}</p></div>
                    <div><span className="text-slate-400">Peak Time</span><p className="font-bold text-slate-700">{shift.peak}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row: Violation Heatmap + Worker Performance ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Time Heatmap */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Violation Time Heatmap</h3>
              <p className="text-xs text-slate-400 mt-0.5">Intensity by day & hour</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Hour labels */}
              <div className="flex ml-12 mb-2">
                {Array.from({ length: 12 }, (_, h) => (
                  <div key={h} className="flex-1 text-center text-[9px] text-slate-400 font-mono">{h + 6}:00</div>
                ))}
              </div>
              {DAILY_HEATMAP.map(row => (
                <div key={row.day} className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-slate-500 font-bold w-10 text-right">{row.day}</span>
                  <div className="flex flex-1 gap-1">
                    {row.hours.map(cell => {
                      const intensity = Math.min(cell.value / 25, 1);
                      const bg = intensity === 0 ? "bg-slate-100" : intensity < 0.3 ? "bg-green-200" : intensity < 0.6 ? "bg-amber-300" : intensity < 0.8 ? "bg-orange-400" : "bg-red-500";
                      return (
                        <div key={cell.hour} className={`flex-1 h-8 rounded-md ${bg} transition-all hover:scale-110 cursor-pointer relative group`}>
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap shadow-lg z-10 pointer-events-none">
                            {row.day} {cell.hour}:00 — {cell.value} violations
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center justify-end mt-4 gap-2 text-[9px] text-slate-400">
                <span>Less</span>
                {["bg-slate-100", "bg-green-200", "bg-amber-300", "bg-orange-400", "bg-red-500"].map((c, i) => (
                  <div key={i} className={`w-4 h-4 rounded ${c}`} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Worker Performance Table */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Worker Performance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Individual compliance tracking</p>
            </div>
            <button className="text-xs text-indigo-500 font-bold hover:underline flex items-center gap-1">View All <ArrowUpRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-2">
            {WORKER_PERFORMANCE.map((w, i) => (
              <div key={w.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5 tabular-nums">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">{w.name.split(" ").map(n => n[0]).join("")}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{w.name}</p>
                    <p className="text-[10px] text-slate-400">{w.violations} violations · {w.streak} day streak</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${w.compliance >= 95 ? "bg-green-500" : w.compliance >= 85 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${w.compliance}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 tabular-nums w-10 text-right">{w.compliance}%</span>
                  {w.trend === "up" ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
