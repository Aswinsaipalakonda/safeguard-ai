import { useState, useEffect } from "react";
import {
  BrainCircuit, Target, Zap, TrendingUp, Activity, Eye,
  AlertTriangle, BarChart3, Cpu
} from "lucide-react";
import {
  Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line
} from "recharts";

/* ── Demo Data ── */

const PER_CLASS = [
  { cls: "Helmet", ap: 96.1, fp: 1.2, fn: 2.7, samples: 4820 },
  { cls: "No Helmet", ap: 94.3, fp: 2.1, fn: 3.6, samples: 3210 },
  { cls: "Safety Vest", ap: 93.8, fp: 1.8, fn: 4.4, samples: 4650 },
  { cls: "No Vest", ap: 91.2, fp: 3.2, fn: 5.6, samples: 2890 },
  { cls: "Goggles", ap: 88.5, fp: 4.1, fn: 7.4, samples: 2100 },
  { cls: "Gloves", ap: 86.2, fp: 5.3, fn: 8.5, samples: 1850 },
  { cls: "Boots", ap: 89.1, fp: 3.8, fn: 7.1, samples: 2400 },
  { cls: "Person", ap: 97.4, fp: 0.8, fn: 1.8, samples: 8200 },
];

const CONFIDENCE_DIST = [
  { range: "50-60%", count: 12 },
  { range: "60-70%", count: 28 },
  { range: "70-80%", count: 85 },
  { range: "80-90%", count: 342 },
  { range: "90-95%", count: 580 },
  { range: "95-100%", count: 453 },
];

const RISK_HEATMAP = [
  { zone: "Excavation A", h6: 2, h7: 5, h8: 8, h9: 6, h10: 4, h11: 3, h12: 7, h13: 9, h14: 5, h15: 3, h16: 2, h17: 1 },
  { zone: "Conveyor Belt", h6: 1, h7: 3, h8: 5, h9: 7, h10: 6, h11: 4, h12: 3, h13: 5, h14: 8, h15: 6, h16: 3, h17: 2 },
  { zone: "Underground B", h6: 4, h7: 7, h8: 9, h9: 8, h10: 6, h11: 5, h12: 8, h13: 10, h14: 7, h15: 5, h16: 4, h17: 3 },
  { zone: "Blasting Zone", h6: 3, h7: 6, h8: 7, h9: 5, h10: 3, h11: 2, h12: 4, h13: 6, h14: 4, h15: 2, h16: 1, h17: 1 },
  { zone: "Processing", h6: 1, h7: 2, h8: 4, h9: 3, h10: 2, h11: 1, h12: 2, h13: 3, h14: 2, h15: 1, h16: 1, h17: 0 },
  { zone: "Loading Dock", h6: 2, h7: 4, h8: 6, h9: 5, h10: 3, h11: 2, h12: 3, h13: 5, h14: 3, h15: 2, h16: 1, h17: 1 },
];

const PREDICTION_CARDS = [
  { zone: "Underground B", predicted: 12, confidence: 87, risk: "critical", time: "Next 4 hours" },
  { zone: "Excavation A", predicted: 8, confidence: 82, risk: "high", time: "Next 4 hours" },
  { zone: "Conveyor Belt", predicted: 5, confidence: 78, risk: "medium", time: "Next 4 hours" },
];

const TRAINING_DATA = Array.from({ length: 50 }, (_, i) => ({
  epoch: i + 1,
  trainLoss: 2.5 * Math.exp(-0.06 * i) + 0.15 + Math.random() * 0.08,
  valLoss: 2.8 * Math.exp(-0.055 * i) + 0.2 + Math.random() * 0.12,
  mAP50: Math.min(96, 30 + 60 * (1 - Math.exp(-0.08 * i)) + Math.random() * 3),
}));

const CLASS_DIST = [
  { name: "Helmet", count: 4820, color: "#22c55e" },
  { name: "No Helmet", count: 3210, color: "#ef4444" },
  { name: "Vest", count: 4650, color: "#3b82f6" },
  { name: "No Vest", count: 2890, color: "#f97316" },
  { name: "Goggles", count: 2100, color: "#8b5cf6" },
  { name: "Gloves", count: 1850, color: "#06b6d4" },
  { name: "Boots", count: 2400, color: "#eab308" },
  { name: "Person", count: 8200, color: "#64748b" },
];

const RADAR_DATA = [
  { metric: "Precision", value: 94.2, baseline: 85 },
  { metric: "Recall", value: 91.8, baseline: 82 },
  { metric: "mAP50", value: 94.2, baseline: 80 },
  { metric: "mAP50-95", value: 72.1, baseline: 60 },
  { metric: "FPS", value: 85, baseline: 70 },
  { metric: "F1 Score", value: 93, baseline: 83 },
];

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] text-white text-xs rounded-xl px-4 py-2 shadow-xl border border-slate-700">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.stroke }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}</p>
      ))}
    </div>
  );
};

export default function AIInsights() {
  const [liveAccuracy, setLiveAccuracy] = useState(94.2);
  const [liveInference, setLiveInference] = useState(23);
  const [liveFPS, setLiveFPS] = useState(24);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveAccuracy(93 + Math.random() * 3);
      setLiveInference(20 + Math.random() * 8);
      setLiveFPS(22 + Math.random() * 6);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const hours = ["6AM", "7AM", "8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM"];

  const heatColor = (v: number) => {
    if (v >= 9) return "bg-red-500 text-white";
    if (v >= 7) return "bg-orange-400 text-white";
    if (v >= 5) return "bg-amber-300 text-amber-900";
    if (v >= 3) return "bg-emerald-200 text-emerald-800";
    if (v >= 1) return "bg-emerald-100 text-emerald-700";
    return "bg-slate-100 text-slate-400";
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BrainCircuit className="w-7 h-7 text-indigo-500" />AI Insights & Model Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">Real-time AI engine performance, predictive analytics & training metrics</p>
      </div>

      {/* ═══ SECTION 1: Live Model Performance ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Accuracy Gauge */}
        <div className="bg-gradient-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-8 translate-x-8" />
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300/80 mb-3">Live Accuracy</p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black tabular-nums">{liveAccuracy.toFixed(1)}</span>
            <span className="text-2xl font-bold text-indigo-300 mb-1">%</span>
          </div>
          <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-500" style={{ width: `${liveAccuracy}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-indigo-300/60">
            <span>Threshold: 85%</span>
            <span>Target: 95%</span>
          </div>
        </div>

        {/* Inference Speed */}
        <div className="bg-gradient-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-8 translate-x-8" />
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300/80 mb-3">Inference Speed</p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black tabular-nums">{liveInference.toFixed(0)}</span>
            <span className="text-2xl font-bold text-amber-300 mb-1">ms</span>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <p className="text-[10px] text-slate-400">FPS</p>
              <p className="text-xl font-bold text-amber-300">{liveFPS.toFixed(0)}</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400">GPU Util</p>
              <p className="text-xl font-bold text-cyan-300">67%</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400">VRAM</p>
              <p className="text-xl font-bold text-purple-300">4.2GB</p>
            </div>
          </div>
        </div>

        {/* Model Info */}
        <div className="bg-gradient-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-8 translate-x-8" />
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300/80 mb-3">Model Info</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Architecture</span><span className="font-bold">YOLOv8s</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Version</span><span className="font-bold text-emerald-400">v2.4</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Parameters</span><span className="font-bold">11.2M</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Input Size</span><span className="font-bold">640×640</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Last Trained</span><span className="font-bold text-amber-300">Feb 25, 2026</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Uptime</span><span className="font-bold text-emerald-400">99.8%</span></div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: Per-Class Detection Accuracy ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500" />Per-Class Average Precision</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Class</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">AP%</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">FP%</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">FN%</th>
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Samples</th>
                </tr>
              </thead>
              <tbody>
                {PER_CLASS.map(c => (
                  <tr key={c.cls} className="border-b border-slate-50">
                    <td className="py-2.5 font-bold text-slate-700">{c.cls}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.ap}%` }} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 tabular-nums">{c.ap}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-xs text-red-500 font-mono">{c.fp}%</td>
                    <td className="py-2.5 text-xs text-amber-500 font-mono">{c.fn}%</td>
                    <td className="py-2.5 text-xs text-slate-500 font-mono">{c.samples.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Radar */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500" />Model Performance Radar</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <Radar name="Current" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
              <Radar name="Baseline" dataKey="baseline" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ SECTION 3: Confidence Distribution ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500" />Confidence Score Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={CONFIDENCE_DIST} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <Bar dataKey="count" name="Detections" fill="url(#confGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dataset Class Distribution */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Eye className="w-4 h-4 text-indigo-500" />Dataset Class Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={CLASS_DIST} barSize={24} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="count" name="Samples" radius={[0, 8, 8, 0]}>
                {CLASS_DIST.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ SECTION 4: Predictive Risk Heatmap ═══ */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />Risk Prediction Heatmap — Violations by Zone & Hour</h3>
        <p className="text-xs text-slate-400 mb-4">ML-predicted violation probability based on historical patterns</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 font-bold text-slate-500 text-[10px] uppercase w-32">Zone</th>
                {hours.map(h => <th key={h} className="py-2 px-1 font-bold text-slate-400 text-center text-[10px]">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {RISK_HEATMAP.map(row => (
                <tr key={row.zone}>
                  <td className="py-1 px-2 font-bold text-slate-700 text-[11px] whitespace-nowrap">{row.zone}</td>
                  {hours.map((_, i) => {
                    const val = Object.values(row).slice(1)[i] as number;
                    return (
                      <td key={i} className="py-1 px-1">
                        <div className={`w-full h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${heatColor(val)} transition-colors`} title={`${row.zone} at ${hours[i]}: ${val} predicted violations`}>
                          {val}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400">
          <span>Low</span>
          <div className="flex gap-1">{["bg-slate-100", "bg-emerald-100", "bg-emerald-200", "bg-amber-300", "bg-orange-400", "bg-red-500"].map(c => <div key={c} className={`w-5 h-3 rounded ${c}`} />)}</div>
          <span>High</span>
        </div>
      </div>

      {/* ═══ SECTION 5: Predictive Analytics ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PREDICTION_CARDS.map(card => (
          <div key={card.zone} className={`rounded-[2rem] p-6 border ${card.risk === "critical" ? "bg-red-50 border-red-200" : card.risk === "high" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className={`w-4 h-4 ${card.risk === "critical" ? "text-red-500" : card.risk === "high" ? "text-amber-500" : "text-blue-500"}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.time}</span>
            </div>
            <h4 className="font-bold text-slate-800 text-lg">{card.zone}</h4>
            <p className="text-3xl font-black text-slate-800 mt-2">{card.predicted} <span className="text-sm font-bold text-slate-400">violations predicted</span></p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-slate-500">ML Confidence:</span>
              <div className="flex-1 h-2 bg-white/80 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${card.confidence}%` }} />
              </div>
              <span className="text-xs font-bold text-indigo-600">{card.confidence}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ SECTION 6: Training Metrics ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" />Training Loss Curve (50 Epochs)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={TRAINING_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="epoch" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="loss" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 3]} />
              <YAxis yAxisId="map" orientation="right" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<DarkTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <defs>
                <linearGradient id="trainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area yAxisId="loss" type="monotone" dataKey="trainLoss" name="Train Loss" stroke="#ef4444" fill="url(#trainGrad)" strokeWidth={2} />
              <Line yAxisId="loss" type="monotone" dataKey="valLoss" name="Val Loss" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              <Line yAxisId="map" type="monotone" dataKey="mAP50" name="mAP50" stroke="#22c55e" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Training Stats Summary */}
        <div className="bg-gradient-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white">
          <h3 className="text-sm font-bold text-indigo-300/80 mb-6 flex items-center gap-2"><Cpu className="w-4 h-4" />Training Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "mAP50", value: "94.2%", sub: "+2.1% from v2.3" },
              { label: "mAP50-95", value: "72.1%", sub: "+3.4% from v2.3" },
              { label: "Precision", value: "94.2%", sub: "Across all classes" },
              { label: "Recall", value: "91.8%", sub: "Threshold: 0.5" },
              { label: "Total Images", value: "32,120", sub: "Train/Val/Test" },
              { label: "Epochs", value: "50", sub: "Early stop: 42" },
              { label: "Batch Size", value: "16", sub: "640×640 input" },
              { label: "Train Time", value: "4h 22m", sub: "NVIDIA A100" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-[10px] text-indigo-300/60 uppercase tracking-wider font-bold">{stat.label}</p>
                <p className="text-xl font-black mt-1">{stat.value}</p>
                <p className="text-[10px] text-indigo-300/40 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
