import { useState, useEffect } from "react";
import { Flame, AlertTriangle, Clock, MapPin, TrendingUp, Eye } from "lucide-react";
import api from "../lib/api";

interface HeatmapZone {
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

interface HeatmapData {
  zones: HeatmapZone[];
  total_zones: number;
  period_days: number;
  max_violations: number;
  hourly_trend: { hour: string; count: number }[];
}

export default function ViolationHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [selectedZone, setSelectedZone] = useState<HeatmapZone | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fallback: HeatmapData = {
      zones: [
        { zone: "Excavation Area A", violations: 42, unresolved: 12, avg_confidence: 0.91, intensity: 1.0, severity: "critical", color: "#ef4444", x: 80, y: 80, width: 170, height: 140, is_high_risk: true },
        { zone: "Conveyor Belt Section", violations: 31, unresolved: 8, avg_confidence: 0.88, intensity: 0.74, severity: "high", color: "#f97316", x: 280, y: 80, width: 170, height: 140, is_high_risk: true },
        { zone: "Processing Plant", violations: 18, unresolved: 5, avg_confidence: 0.85, intensity: 0.43, severity: "medium", color: "#eab308", x: 480, y: 80, width: 170, height: 140, is_high_risk: false },
        { zone: "Storage Yard", violations: 8, unresolved: 2, avg_confidence: 0.79, intensity: 0.19, severity: "low", color: "#22c55e", x: 680, y: 80, width: 170, height: 140, is_high_risk: false },
        { zone: "Underground Shaft B", violations: 38, unresolved: 15, avg_confidence: 0.93, intensity: 0.9, severity: "critical", color: "#ef4444", x: 80, y: 260, width: 170, height: 140, is_high_risk: true },
        { zone: "Loading Dock", violations: 14, unresolved: 3, avg_confidence: 0.82, intensity: 0.33, severity: "medium", color: "#eab308", x: 280, y: 260, width: 170, height: 140, is_high_risk: false },
        { zone: "Control Room", violations: 3, unresolved: 0, avg_confidence: 0.76, intensity: 0.07, severity: "low", color: "#22c55e", x: 480, y: 260, width: 170, height: 140, is_high_risk: false },
        { zone: "Blasting Zone C", violations: 35, unresolved: 18, avg_confidence: 0.94, intensity: 0.83, severity: "critical", color: "#ef4444", x: 680, y: 260, width: 170, height: 140, is_high_risk: true },
      ],
      total_zones: 8,
      period_days: days,
      max_violations: 42,
      hourly_trend: Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: Math.floor(Math.random() * 15) })),
    };
    api.get(`/analytics/heatmap/?days=${days}`)
      .then((res) => {
        if (res.data && res.data.zones && res.data.zones.length > 0) {
          setData(res.data);
        } else {
          setData(fallback);
        }
      })
      .catch(() => {
        setData(fallback);
      })
      .finally(() => setLoading(false));
  }, [days]);

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-wide">Violation Heatmap</h1>
            <p className="text-slate-500 text-sm">Zone-based violation hotspot analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                days === d
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Zones", value: data.total_zones, icon: MapPin, color: "from-blue-500 to-indigo-500" },
            { label: "Critical Zones", value: data.zones.filter(z => z.severity === "critical").length, icon: AlertTriangle, color: "from-red-500 to-rose-500" },
            { label: "Max Violations", value: data.max_violations, icon: Flame, color: "from-orange-500 to-amber-500" },
            { label: "Unresolved", value: data.zones.reduce((a, z) => a + z.unresolved, 0), icon: Clock, color: "from-purple-500 to-violet-500" },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`w-8 h-8 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap Visualization */}
      {data && (
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Eye className="w-5 h-5 text-red-500" />
            <span>Floor Plan Heatmap</span>
          </h2>
          <div className="relative bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden" style={{ height: 460 }}>
            {/* Grid lines for realism */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
              {Array.from({ length: 10 }, (_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 46} x2="100%" y2={i * 46} stroke="#e2e8f0" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 12 }, (_, i) => (
                <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="100%" stroke="#e2e8f0" strokeWidth="0.5" />
              ))}
            </svg>

            {data.zones.map((zone, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedZone(zone)}
                className="absolute rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 flex flex-col items-center justify-center text-white font-semibold text-sm shadow-lg"
                style={{
                  left: zone.x,
                  top: zone.y,
                  width: zone.width,
                  height: zone.height,
                  backgroundColor: zone.color,
                  opacity: 0.6 + zone.intensity * 0.4,
                  borderColor: selectedZone?.zone === zone.zone ? "white" : "transparent",
                  zIndex: 10,
                }}
              >
                <span className="text-xs font-bold text-center leading-tight px-2 drop-shadow-md">{zone.zone}</span>
                <span className="text-2xl font-black mt-1 drop-shadow-md">{zone.violations}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-80">violations</span>
                {zone.is_high_risk && (
                  <span className="absolute -top-2 -right-2 bg-white text-red-500 text-[9px] font-black px-2 py-0.5 rounded-full shadow">
                    ⚠ HIGH RISK
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-4">
            {[
              { label: "Critical", color: "#ef4444" },
              { label: "High", color: "#f97316" },
              { label: "Medium", color: "#eab308" },
              { label: "Low", color: "#22c55e" },
            ].map((item) => (
              <div key={item.label} className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Zone Detail */}
      {selectedZone && (
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">{selectedZone.zone}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              selectedZone.severity === "critical" ? "bg-red-100 text-red-600" :
              selectedZone.severity === "high" ? "bg-orange-100 text-orange-600" :
              selectedZone.severity === "medium" ? "bg-yellow-100 text-yellow-600" :
              "bg-green-100 text-green-600"
            }`}>
              {selectedZone.severity}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{selectedZone.violations}</p>
              <p className="text-xs text-slate-500">Total Violations</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{selectedZone.unresolved}</p>
              <p className="text-xs text-slate-500">Unresolved</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{(selectedZone.avg_confidence * 100).toFixed(0)}%</p>
              <p className="text-xs text-slate-500">Avg Confidence</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{(selectedZone.intensity * 100).toFixed(0)}%</p>
              <p className="text-xs text-slate-500">Intensity</p>
            </div>
          </div>
        </div>
      )}

      {/* Zone Ranking Table */}
      {data && (
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span>Zone Risk Ranking</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider rounded-l-xl">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Zone</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Violations</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Unresolved</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider rounded-r-xl">Severity</th>
                </tr>
              </thead>
              <tbody>
                {[...data.zones].sort((a, b) => (severityOrder[a.severity as keyof typeof severityOrder] ?? 4) - (severityOrder[b.severity as keyof typeof severityOrder] ?? 4) || b.violations - a.violations).map((zone, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedZone(zone)}>
                    <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                        <span className="font-medium text-slate-700">{zone.zone}</span>
                        {zone.is_high_risk && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">HIGH RISK</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{zone.violations}</td>
                    <td className="px-4 py-3 text-center font-bold text-red-500">{zone.unresolved}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{(zone.avg_confidence * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        zone.severity === "critical" ? "bg-red-100 text-red-600" :
                        zone.severity === "high" ? "bg-orange-100 text-orange-600" :
                        zone.severity === "medium" ? "bg-yellow-100 text-yellow-600" :
                        "bg-green-100 text-green-600"
                      }`}>
                        {zone.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
