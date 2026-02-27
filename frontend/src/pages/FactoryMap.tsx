import { useState, useEffect, useRef } from "react";
import {
  Camera, Users, AlertTriangle, Shield, Activity, Wifi,
  ChevronRight, MapPin, Zap, Eye
} from "lucide-react";
import { zonesAPI, analyticsAPI, type Zone as APIZone, type HeatmapZone } from "../lib/api";

/* ── Zone type for display ── */
interface MapZone {
  id: string; name: string; x: number; y: number; w: number; h: number;
  risk: string; workers: number; cameras: number; compliance: number;
  color: string; violations: number; depth: number;
}

/* ── Fallback zone definitions ── */
const FALLBACK_ZONES: MapZone[] = [
  { id: "excavation-a", name: "Excavation Area A", x: 60, y: 160, w: 200, h: 120, risk: "high", workers: 8, cameras: 3, compliance: 76, color: "#ef4444", violations: 3, depth: 18 },
  { id: "shaft-b", name: "Underground Shaft B", x: 300, y: 120, w: 180, h: 140, risk: "critical", workers: 5, cameras: 4, compliance: 62, color: "#dc2626", violations: 5, depth: 30 },
  { id: "conveyor", name: "Conveyor Belt Section", x: 520, y: 180, w: 220, h: 90, risk: "medium", workers: 6, cameras: 3, compliance: 88, color: "#f59e0b", violations: 1, depth: 12 },
  { id: "processing", name: "Processing Plant", x: 120, y: 340, w: 240, h: 130, risk: "low", workers: 10, cameras: 5, compliance: 96, color: "#22c55e", violations: 0, depth: 15 },
  { id: "blasting-c", name: "Blasting Zone C", x: 410, y: 320, w: 180, h: 110, risk: "high", workers: 4, cameras: 2, compliance: 71, color: "#ef4444", violations: 4, depth: 20 },
  { id: "loading", name: "Loading Dock", x: 640, y: 310, w: 170, h: 100, risk: "low", workers: 7, cameras: 2, compliance: 94, color: "#22c55e", violations: 0, depth: 10 },
];

/* ── Layout positions for mapping API zones → SVG coordinates ── */
const LAYOUT_POSITIONS = [
  { x: 60, y: 160, w: 200, h: 120, depth: 18 },
  { x: 300, y: 120, w: 180, h: 140, depth: 30 },
  { x: 520, y: 180, w: 220, h: 90, depth: 12 },
  { x: 120, y: 340, w: 240, h: 130, depth: 15 },
  { x: 410, y: 320, w: 180, h: 110, depth: 20 },
  { x: 640, y: 310, w: 170, h: 100, depth: 10 },
];

function mapApiZone(z: APIZone, heatmap: HeatmapZone | undefined, idx: number): MapZone {
  const pos = LAYOUT_POSITIONS[idx % LAYOUT_POSITIONS.length];
  const violations = heatmap?.violations ?? 0;
  const compliance = violations > 4 ? 62 : violations > 2 ? 76 : violations > 0 ? 88 : 96;
  const risk = z.is_high_risk ? (violations > 4 ? "critical" : "high") : violations > 1 ? "medium" : "low";
  const color = risk === "critical" ? "#dc2626" : risk === "high" ? "#ef4444" : risk === "medium" ? "#f59e0b" : "#22c55e";
  return {
    id: `zone-${z.id}`,
    name: z.name,
    ...pos,
    risk,
    workers: Math.max(3, Math.floor(Math.random() * 8) + 3),
    cameras: z.camera_ids.length,
    compliance,
    color,
    violations,
    depth: pos.depth,
  };
}

/* ── Worker dots positions per zone ── */
function generateWorkerDots(zone: MapZone) {
  return Array.from({ length: zone.workers }, (_, i) => ({
    id: `${zone.id}-w${i}`,
    x: zone.x + 20 + (i % 4) * 40 + Math.random() * 15,
    y: zone.y + 25 + Math.floor(i / 4) * 30 + Math.random() * 15,
    compliant: Math.random() > 0.15,
  }));
}

/* ── Camera positions per zone ── */
function generateCameraPositions(zone: MapZone) {
  return Array.from({ length: zone.cameras }, (_, i) => ({
    id: `${zone.id}-cam${i}`,
    x: zone.x + 10 + i * (zone.w / zone.cameras),
    y: zone.y + 8,
  }));
}

export default function FactoryMap() {
  const [zones, setZones] = useState<MapZone[]>(FALLBACK_ZONES);
  const [selectedZone, setSelectedZone] = useState<MapZone | null>(null);
  const [tick, setTick] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch zones + heatmap from API
  useEffect(() => {
    (async () => {
      try {
        const [zRes, hRes] = await Promise.all([
          zonesAPI.list({ page_size: 50 }),
          analyticsAPI.heatmap(7),
        ]);
        const apiZones = zRes.data.results;
        const heatZones = hRes.data.zones;
        if (apiZones.length > 0) {
          setZones(apiZones.map((z, i) => {
            const hz = heatZones.find(h => h.zone === z.name);
            return mapApiZone(z, hz, i);
          }));
        }
      } catch {
        // keep fallback
      }
    })();
  }, []);

  // Animation tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const riskBadge = (risk: string) => {
    if (risk === "critical") return "bg-red-600 text-white";
    if (risk === "high") return "bg-red-100 text-red-700";
    if (risk === "medium") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const totalWorkers = zones.reduce((a, z) => a + z.workers, 0);
  const totalCameras = zones.reduce((a, z) => a + z.cameras, 0);
  const avgCompliance = zones.length > 0 ? Math.round(zones.reduce((a, z) => a + z.compliance, 0) / zones.length) : 0;
  const totalViolations = zones.reduce((a, z) => a + z.violations, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-6 h-6 text-indigo-500" />Factory Map</h1>
          <p className="text-sm text-slate-500 mt-1">Live 2.5D isometric view — real-time zone monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">Live Feed</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Workers", value: totalWorkers, icon: <Users className="w-4 h-4 text-indigo-500" />, color: "text-indigo-600" },
          { label: "Cameras Online", value: totalCameras, icon: <Camera className="w-4 h-4 text-emerald-500" />, color: "text-emerald-600" },
          { label: "Avg Compliance", value: `${avgCompliance}%`, icon: <Shield className="w-4 h-4 text-blue-500" />, color: "text-blue-600" },
          { label: "Active Violations", value: totalViolations, icon: <AlertTriangle className="w-4 h-4 text-red-500" />, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center">{s.icon}</div>
            <div>
              <p className={`text-xl font-bold ${s.color} tabular-nums`}>{s.value}</p>
              <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Map */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-4 shadow-lg border border-slate-700 overflow-hidden relative">
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          
          {/* Scan line animation */}
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent animate-pulse" style={{ top: `${(tick * 30) % 500}px` }} />

          <svg ref={svgRef} viewBox="0 0 870 480" className="w-full h-auto relative z-10">
            {/* Legend */}
            <text x="10" y="20" fill="#64748b" fontSize="10" fontFamily="monospace" fontWeight="bold">SAFEGUARD AI — FACILITY MAP v2.4</text>
            <text x="10" y="35" fill="#475569" fontSize="9" fontFamily="monospace">LIVE • {new Date().toLocaleTimeString()}</text>

            {/* Zones */}
            {zones.map(zone => {
              const isSelected = selectedZone?.id === zone.id;
              const d = zone.depth;
              const workers = generateWorkerDots(zone);
              const cameras = generateCameraPositions(zone);
              // ISO offset
              const ox = d * 0.5;
              const oy = d * 0.3;

              return (
                <g key={zone.id} className="cursor-pointer" onClick={() => setSelectedZone(isSelected ? null : zone)}>
                  {/* 3D side (right) */}
                  <polygon
                    points={`${zone.x + zone.w},${zone.y} ${zone.x + zone.w + ox},${zone.y - oy} ${zone.x + zone.w + ox},${zone.y + zone.h - oy} ${zone.x + zone.w},${zone.y + zone.h}`}
                    fill={zone.color} opacity="0.2" stroke={zone.color} strokeWidth={isSelected ? 2 : 0.5} strokeOpacity={0.5}
                  />
                  {/* 3D top */}
                  <polygon
                    points={`${zone.x},${zone.y} ${zone.x + ox},${zone.y - oy} ${zone.x + zone.w + ox},${zone.y - oy} ${zone.x + zone.w},${zone.y}`}
                    fill={zone.color} opacity="0.15" stroke={zone.color} strokeWidth={isSelected ? 2 : 0.5} strokeOpacity={0.5}
                  />
                  {/* Main face */}
                  <rect
                    x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx={8}
                    fill={zone.color} fillOpacity={isSelected ? 0.25 : 0.1}
                    stroke={zone.color} strokeWidth={isSelected ? 2.5 : 1} strokeOpacity={isSelected ? 0.9 : 0.4}
                    className="transition-all"
                  />
                  {/* Zone label */}
                  <text x={zone.x + 12} y={zone.y + zone.h - 10} fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">{zone.name}</text>
                  {/* Compliance badge */}
                  <rect x={zone.x + zone.w - 44} y={zone.y + 6} width={36} height={18} rx={9} fill={zone.compliance >= 90 ? "#22c55e" : zone.compliance >= 80 ? "#f59e0b" : "#ef4444"} opacity={0.9} />
                  <text x={zone.x + zone.w - 26} y={zone.y + 19} fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{zone.compliance}%</text>

                  {/* Worker dots */}
                  {workers.map(w => (
                    <circle key={w.id} cx={w.x + Math.sin(tick + w.x) * 3} cy={w.y + Math.cos(tick + w.y) * 2} r={4} fill={w.compliant ? "#22c55e" : "#ef4444"} opacity={0.8}>
                      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite" />
                    </circle>
                  ))}

                  {/* Camera icons */}
                  {cameras.map(c => (
                    <g key={c.id}>
                      <rect x={c.x - 6} y={c.y - 6} width={12} height={12} rx={3} fill="#6366f1" opacity={0.8} />
                      <text x={c.x} y={c.y + 3} fill="white" fontSize="7" textAnchor="middle" fontFamily="monospace">📷</text>
                      {/* Scan cone */}
                      <polygon points={`${c.x},${c.y + 6} ${c.x - 15},${c.y + 35} ${c.x + 15},${c.y + 35}`} fill="#6366f1" opacity={0.06} />
                    </g>
                  ))}

                  {/* Violation pulse markers */}
                  {zone.violations > 0 && (
                    <g>
                      <circle cx={zone.x + 18} cy={zone.y + 18} r={8} fill="#ef4444" opacity={0.3}>
                        <animate attributeName="r" values="8;14;8" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={zone.x + 18} cy={zone.y + 18} r={6} fill="#ef4444" opacity={0.7} />
                      <text x={zone.x + 18} y={zone.y + 22} fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">{zone.violations}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Connecting paths between zones */}
            <path d="M260,220 Q280,200 300,195" stroke="#475569" strokeWidth={1} strokeDasharray="5 3" fill="none" opacity={0.3} />
            <path d="M480,190 L520,190" stroke="#475569" strokeWidth={1} strokeDasharray="5 3" fill="none" opacity={0.3} />
            <path d="M240,340 Q320,310 410,340" stroke="#475569" strokeWidth={1} strokeDasharray="5 3" fill="none" opacity={0.3} />
            <path d="M590,370 L640,360" stroke="#475569" strokeWidth={1} strokeDasharray="5 3" fill="none" opacity={0.3} />
            <path d="M350,260 Q380,300 420,320" stroke="#475569" strokeWidth={1} strokeDasharray="5 3" fill="none" opacity={0.3} />

            {/* Legend box */}
            <rect x="720" y="10" width="140" height="90" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="735" y="28" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="monospace">LEGEND</text>
            <circle cx="735" cy="42" r="4" fill="#22c55e" opacity={0.8} /><text x="745" y="45" fill="#94a3b8" fontSize="8">Compliant Worker</text>
            <circle cx="735" cy="58" r="4" fill="#ef4444" opacity={0.8} /><text x="745" y="61" fill="#94a3b8" fontSize="8">Non-Compliant</text>
            <rect x="731" y="69" width="8" height="8" rx="2" fill="#6366f1" opacity={0.8} /><text x="745" y="77" fill="#94a3b8" fontSize="8">AI Camera</text>
            <circle cx="735" cy="88" r="5" fill="#ef4444" opacity={0.4} /><text x="745" y="92" fill="#94a3b8" fontSize="8">Active Violation</text>
          </svg>
        </div>

        {/* Zone Detail Panel */}
        <div className="space-y-4">
          {selectedZone ? (
            <>
              <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-700">{selectedZone.name}</h2>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${riskBadge(selectedZone.risk)}`}>{selectedZone.risk.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Workers", value: selectedZone.workers, icon: <Users className="w-3.5 h-3.5 text-indigo-500" /> },
                    { label: "Cameras", value: selectedZone.cameras, icon: <Camera className="w-3.5 h-3.5 text-emerald-500" /> },
                    { label: "Compliance", value: `${selectedZone.compliance}%`, icon: <Shield className="w-3.5 h-3.5 text-blue-500" /> },
                    { label: "Violations", value: selectedZone.violations, icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5">{s.icon}<span className="text-[9px] text-slate-400 uppercase font-bold">{s.label}</span></div>
                      <p className="text-lg font-bold text-slate-700 mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
                {/* Compliance bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold">Zone Compliance</span>
                    <span className="font-bold">{selectedZone.compliance}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${selectedZone.compliance}%`, background: selectedZone.compliance >= 90 ? "#22c55e" : selectedZone.compliance >= 80 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                </div>
              </div>

              {/* Active alerts */}
              {selectedZone.violations > 0 && (
                <div className="bg-red-50 rounded-[2rem] p-5 border border-red-100">
                  <h3 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-3"><Zap className="w-4 h-4" />Active Alerts</h3>
                  {Array.from({ length: selectedZone.violations }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-red-100 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-800">{["No Helmet", "No Vest", "No Goggles", "No Boots", "No Gloves"][i % 5]} Detected</p>
                        <p className="text-[10px] text-red-400">{Math.floor(Math.random() * 15) + 1}min ago • CAM-{i + 1}</p>
                      </div>
                      <button className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg hover:bg-red-200 transition-all">View</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Zone actions */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#18181b] text-white rounded-xl text-xs font-bold hover:bg-[#27272a] transition-all"><Eye className="w-3.5 h-3.5" />Live Feed</button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all"><Activity className="w-3.5 h-3.5" />Analytics</button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
                <h2 className="text-sm font-bold text-slate-700 mb-3">All Zones</h2>
                <div className="space-y-2">
                  {zones.map(z => (
                    <div
                      key={z.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-slate-200"
                      onClick={() => setSelectedZone(z)}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: z.color, opacity: 0.7 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{z.name}</p>
                        <p className="text-[10px] text-slate-400">{z.workers} workers • {z.cameras} cameras</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold tabular-nums ${z.compliance >= 90 ? "text-emerald-600" : z.compliance >= 80 ? "text-amber-600" : "text-red-600"}`}>{z.compliance}%</p>
                        {z.violations > 0 && <p className="text-[9px] text-red-400 font-bold">{z.violations} alerts</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Network status */}
              <div className="bg-gradient-to-r from-[#1a1443] to-[#2c1555] rounded-[2rem] p-5 text-white">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Wifi className="w-4 h-4 text-emerald-400" />Network Status</h3>
                <div className="space-y-2">
                  {[
                    { label: "AI Server", status: "Online", latency: "12ms" },
                    { label: "Camera Feed", status: "Online", latency: "45ms" },
                    { label: "Alert Engine", status: "Online", latency: "8ms" },
                    { label: "Database", status: "Online", latency: "3ms" },
                  ].map(n => (
                    <div key={n.label} className="flex items-center justify-between text-xs">
                      <span className="text-indigo-200/70">{n.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-100/50 font-mono text-[10px]">{n.latency}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
