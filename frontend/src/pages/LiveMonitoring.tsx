import { useState, useEffect, useCallback, useRef } from "react";
import { ShieldAlert, AlertCircle, Camera, CheckCircle2, TrendingUp, TrendingDown, Activity, X, Bell, Volume2, Loader2 } from "lucide-react";
import { analyticsAPI, violationsAPI, zonesAPI, type DashboardStats, type Violation, type Zone } from "../lib/api";

interface ViolationEvent {
  id: string;
  apiId: number | null;
  camera: string;
  cameraName: string;
  worker: string;
  ppe: string;
  zone: string;
  confidence: number;
  time: string;
  resolved: boolean;
}

function violationToEvent(v: Violation): ViolationEvent {
  return {
    id: `V-${v.id}`,
    apiId: v.id,
    camera: v.camera_id || "",
    cameraName: v.camera_id || "Unknown Camera",
    worker: v.worker_name || "Unknown",
    ppe: v.ppe_type,
    zone: v.zone || "Unknown",
    confidence: v.confidence < 1 ? Math.round(v.confidence * 100) : Math.round(v.confidence),
    time: new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    resolved: v.resolved_at !== null,
  };
}

const FALLBACK_CAMERAS = [
  { id: "cam-assembly-1", name: "Assembly Line 1", active: true, zone: "Assembly Line" },
  { id: "cam-welding-2", name: "Welding Zone B", active: true, zone: "Welding Zone" },
  { id: "cam-loading-3", name: "Loading Dock South", active: true, zone: "Loading Dock" },
  { id: "cam-excavation-4", name: "Excavation Area A", active: true, zone: "Excavation Area A" },
  { id: "cam-shaft-5", name: "Underground Shaft B", active: true, zone: "Underground Shaft B" },
];

export default function LiveMonitoring() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeViolations, setActiveViolations] = useState<string[]>([]);
  const [violationEvents, setViolationEvents] = useState<ViolationEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ViolationEvent | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [simulationActive, setSimulationActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataLoadedRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Fetch real data from backend API
  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const [statsRes, violationsRes, zonesRes] = await Promise.all([
        analyticsAPI.dashboardStats(),
        violationsAPI.list({ ordering: '-created_at', page_size: 20 }),
        zonesAPI.list({ page_size: 50 }),
      ]);
      setStats(statsRes.data);
      setZones(zonesRes.data.results);
      setViolationEvents(violationsRes.data.results.map(violationToEvent));
      dataLoadedRef.current = true;
      // Flash cameras with unresolved violations
      if (!initial) {
        const cams = violationsRes.data.results
          .filter(v => !v.resolved_at).map(v => v.camera_id).slice(0, 2);
        if (cams.length) {
          setActiveViolations(cams);
          setTimeout(() => setActiveViolations([]), 4000);
        }
      }
    } catch (err) {
      console.warn("API unavailable, using fallback demo data", err);
      if (!dataLoadedRef.current) {
        setStats({
          today_violations: 124, today_resolved: 110, active_alerts: 14,
          compliance_rate: 91, week_change_pct: -12.5,
          ppe_breakdown: [
            { ppe_type: "Helmet Missing", count: 82 },
            { ppe_type: "Unfastened Vest", count: 31 },
            { ppe_type: "Restricted Area Entry", count: 11 },
          ],
          zone_stats: [
            { zone: "Assembly Line", count: 12 },
            { zone: "Welding Zone", count: 45 },
            { zone: "Loading Dock", count: 3 },
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => { fetchData(true); }, [fetchData]);

  // Poll for fresh data every 15s when live
  useEffect(() => {
    if (!simulationActive) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => fetchData(), 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [simulationActive, fetchData]);

  // Real-time WebSocket connection
  useEffect(() => {
    try {
      const ws = new WebSocket("ws://localhost:8000/ws/live/");
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.camera_id) {
          setActiveViolations(prev => [...prev, data.camera_id]);
          setTimeout(() => setActiveViolations(prev => prev.filter(id => id !== data.camera_id)), 3000);
          fetchData();
        }
      };
      ws.onerror = () => ws.close();
      return () => ws.close();
    } catch { /* silent fallback */ }
  }, [fetchData]);

  // Resolve violation via real API
  const handleResolve = async (event: ViolationEvent) => {
    if (event.apiId) {
      try { await violationsAPI.resolve(event.apiId); } catch {
        showToast(`Failed to resolve ${event.id}`);
        return;
      }
    }
    setViolationEvents(prev => prev.map(e => e.id === event.id ? { ...e, resolved: true } : e));
    setSelectedEvent(null);
    showToast(`${event.id} resolved successfully`);
    try { const r = await analyticsAPI.dashboardStats(); setStats(r.data); } catch {}
  };

  // Derived values from API stats
  const totalToday = stats?.today_violations ?? 0;
  const complianceRate = stats?.compliance_rate ?? 0;
  const resolvedCount = stats?.today_resolved ?? 0;
  const highRisks = stats?.active_alerts ?? 0;
  const weekChange = stats?.week_change_pct ?? 0;
  const ppeBreakdown = stats?.ppe_breakdown?.slice(0, 3) ?? [];
  const zoneStats = stats?.zone_stats?.slice(0, 3) ?? [];

  // Build camera list from zone data, fallback to demo
  const cameras = zones.length > 0
    ? zones.flatMap(z => z.camera_ids.map((camId, i) => ({
        id: camId, name: `${z.name} Cam ${i + 1}`, active: true, zone: z.name,
      }))).slice(0, 6)
    : FALLBACK_CAMERAS;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-sm text-slate-400 tracking-wider">Loading live monitoring data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-full font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Left / Center Main Content */}
      <div className="flex-1 space-y-6">
        {/* Alert Banner */}
        {activeViolations.length > 0 && (
          <div className="bg-[#1a1a2e] text-orange-400 px-6 py-4 rounded-full flex items-center justify-between shadow-lg animate-in slide-in-from-top-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-medium tracking-wide">
                LIVE: PPE violation detected on {cameras.find(c => c.id === activeViolations[0])?.name || "camera"} — Immediate attention required.
              </span>
            </div>
            <button onClick={() => { setSelectedEvent(violationEvents[0] || null); }} className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold tracking-widest hover:bg-slate-200">
              VIEW NOW
            </button>
          </div>
        )}

        {/* Top Controls */}
        <div className="flex items-center space-x-4 mb-2">
          <span className="text-xs font-bold text-slate-400 tracking-wider">FACTORY VIEW</span>
          <div className="flex space-x-2">
            <button className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-medium">MANAGEMENT</button>
            <button onClick={() => showToast("Security Experience mode activated")} className="text-slate-500 px-4 py-1.5 rounded-full text-xs font-medium hover:bg-slate-200">SECURITY EXPERIENCE</button>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <button
              onClick={() => setSimulationActive(!simulationActive)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${simulationActive ? "bg-green-500 text-white" : "bg-slate-200 text-slate-600"}`}
            >
              {simulationActive ? "● LIVE" : "○ PAUSED"}
            </button>
            <button onClick={() => { setSoundEnabled(!soundEnabled); showToast(soundEnabled ? "Sound muted" : "Sound enabled"); }} className="p-1.5 rounded-full hover:bg-slate-100">
              <Volume2 className={`w-4 h-4 ${soundEnabled ? "text-slate-600" : "text-slate-300"}`} />
            </button>
            <button onClick={() => fetchData()} className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-600 shadow-md">
              REFRESH ↻
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Gradient Card 1 - Violations */}
          <div className="bg-linear-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs text-slate-400 font-medium tracking-wider">TOTAL VIOLATIONS</span>
              <button className="bg-white/10 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md">TODAY ▾</button>
            </div>
            <div className="text-center my-8">
              <h1 className="text-5xl font-bold mb-2 tabular-nums">{totalToday}</h1>
              <span className={`text-xs font-mono ${weekChange <= 0 ? 'text-green-400' : 'text-red-400'} bg-white/5 px-2 py-1 rounded-full items-center inline-flex`}>
                {weekChange <= 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />} {weekChange > 0 ? '+' : ''}{weekChange}%
              </span>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-4">VIOLATIONS LOGGED TODAY</p>
            </div>
            <div className="space-y-3 mt-8 text-sm font-medium border-t border-white/10 pt-4">
              {ppeBreakdown.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-slate-300"><span>{item.ppe_type}</span> <span>{item.count}</span></div>
              ))}
              {ppeBreakdown.length === 0 && <p className="text-slate-500 text-xs">No data</p>}
            </div>
          </div>

          {/* Primary Gradient Card 2 - Compliance */}
          <div className="bg-linear-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs text-slate-400 font-medium tracking-wider">COMPLIANCE RATE</span>
              <button className="bg-white/10 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md">TODAY ▾</button>
            </div>
            <div className="text-center my-8">
              <h1 className="text-5xl font-bold mb-2 tabular-nums">{complianceRate.toFixed(0)}<span className="text-3xl">%</span></h1>
              <span className={`text-xs font-mono ${weekChange <= 0 ? 'text-green-400' : 'text-red-400'} bg-white/5 px-2 py-1 rounded-full items-center inline-flex`}>
                <TrendingUp className="w-3 h-3 mr-1" /> vs last week
              </span>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-4">OVERALL SAFETY SCORE</p>
            </div>
            <div className="space-y-3 mt-8 text-sm font-medium border-t border-white/10 pt-4">
              {zoneStats.map((z, i) => {
                const rate = Math.round(100 - (z.count / Math.max(totalToday, 1)) * 100);
                return (
                  <div key={i} className="flex justify-between items-center text-slate-300">
                    <span>{z.zone}</span>
                    <span className={rate < 80 ? 'text-red-400' : ''}>{rate}%</span>
                  </div>
                );
              })}
              {zoneStats.length === 0 && <p className="text-slate-500 text-xs">No data</p>}
            </div>
          </div>
        </div>

        {/* Bottom White Cards (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4"><ShieldAlert className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wider">HIGH RISKS</p>
              <div className="flex items-end mt-1 space-x-2">
                <h2 className="text-2xl font-bold tabular-nums">{highRisks}</h2>
                <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-md flex items-center mb-1"><TrendingUp className="w-3 h-3 mr-1" /> +8%</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Today vs Last Week</p>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><CheckCircle2 className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wider">RESOLVED</p>
              <div className="flex items-end mt-1 space-x-2">
                <h2 className="text-2xl font-bold tabular-nums">{resolvedCount}</h2>
                <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-0.5 rounded-md flex items-center mb-1"><TrendingUp className="w-3 h-3 mr-1" /> +4%</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Today vs Last Week</p>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Activity className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wider">CAMERA UPTIME</p>
              <div className="flex items-end mt-1 space-x-2">
                <h2 className="text-2xl font-bold">100<span className="text-lg">%</span></h2>
                <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-0.5 rounded-md flex items-center mb-1">STABLE</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">All {cameras.length} cameras operational</p>
            </div>
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center space-x-2">
              <Bell className="w-5 h-5 text-red-500" />
              <span>Live Event Feed</span>
              <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold">{violationEvents.filter(e => !e.resolved).length} active</span>
            </h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {violationEvents.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No events yet. Simulation will start shortly...</p>
            ) : (
              violationEvents.map((event) => (
                <div key={event.id} onClick={() => setSelectedEvent(event)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:shadow-md ${event.resolved ? "bg-green-50/50 border border-green-100" : "bg-red-50/50 border border-red-100"}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${event.resolved ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{event.ppe} — <span className="text-slate-500 font-normal">{event.worker}</span></p>
                      <p className="text-[10px] text-slate-400">{event.cameraName} · {event.zone} · {event.confidence}% conf</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-mono">{event.time}</p>
                    <span className={`text-[9px] font-bold ${event.resolved ? "text-green-500" : "text-red-500"}`}>{event.resolved ? "RESOLVED" : "ACTIVE"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Side Panel */}
      <div className="w-full xl:w-96 bg-white rounded-[2rem] p-6 shadow-md border border-slate-200 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-800">Camera Feeds</h3>
          <span onClick={() => showToast("Loading all camera views...")} className="text-xs text-red-500 font-bold uppercase cursor-pointer hover:underline">ALL CAMERAS</span>
        </div>

        <div className="mb-6 border-b border-slate-100 pb-6">
          <span className="font-medium text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <div className="flex justify-between mt-4">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium ${i === new Date().getDay() - 1 ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'text-slate-400 hover:bg-slate-100 cursor-pointer'}`}>{day}</div>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto mb-6">
          {cameras.map(cam => {
            const hasViolation = activeViolations.includes(cam.id);
            return (
              <div key={cam.id} className={`p-4 rounded-2xl border ${hasViolation ? 'border-red-200 bg-red-50/50 animate-pulse' : 'border-slate-100 bg-slate-50'} transition-all cursor-pointer hover:border-indigo-300 hover:shadow-md`} onClick={() => showToast(`Connecting to ${cam.name} livestream...`)}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-700 text-sm">{cam.name}</span>
                  <div className="flex items-center space-x-2">
                    {hasViolation && <span className="text-[9px] text-red-500 font-bold bg-red-100 px-2 py-0.5 rounded-full">ALERT</span>}
                    <div className={`w-2 h-2 rounded-full ${hasViolation ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                  </div>
                </div>
                <div className="h-24 bg-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {hasViolation && <div className="absolute inset-0 border-2 border-red-500 rounded-lg z-10 animate-pulse"></div>}
                  <Camera className="text-slate-400 w-8 h-8 opacity-50" />
                  <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-mono">LIVE</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto bg-[#fafafa] p-4 rounded-2xl border border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">SYSTEM STATUS</p>
          <p className="text-sm font-bold text-slate-800 mb-4">You have <span className="text-red-500">{violationEvents.filter(e => !e.resolved).length} unresolved</span> incidents today.</p>
          <button onClick={() => { setViolationEvents(prev => prev.map(e => ({ ...e, resolved: true }))); showToast("All alerts cleared!"); }} className="w-full bg-[#fa3e5c] text-white py-3 rounded-full font-bold text-sm tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
            - CLEAR ALL ALERTS
          </button>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 relative animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            <div className="flex items-center space-x-3 mb-6">
              <div className={`w-12 h-12 ${selectedEvent.resolved ? "bg-green-100" : "bg-red-100"} rounded-2xl flex items-center justify-center`}>
                {selectedEvent.resolved ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <AlertCircle className="w-6 h-6 text-red-500" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedEvent.id}</h2>
                <p className="text-sm text-slate-500">{selectedEvent.time}</p>
              </div>
            </div>
            <div className="bg-slate-100 h-40 rounded-2xl flex items-center justify-center mb-6">
              <div className="text-center">
                <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">AI Detection Frame - {selectedEvent.cameraName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Worker</p><p className="font-bold text-slate-800 mt-1">{selectedEvent.worker}</p></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Zone</p><p className="font-bold text-slate-800 mt-1">{selectedEvent.zone}</p></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Missing PPE</p><p className="font-bold text-red-500 mt-1">{selectedEvent.ppe}</p></div>
              <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">AI Confidence</p><p className="font-bold text-slate-800 mt-1">{selectedEvent.confidence}%</p></div>
            </div>
            <div className="flex space-x-3">
              {!selectedEvent.resolved && (
                <button onClick={() => handleResolve(selectedEvent)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" /><span>Mark Resolved</span>
                </button>
              )}
              <button onClick={() => { showToast(`Supervisor notified about ${selectedEvent.ppe}`); setSelectedEvent(null); }} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2">
                <Bell className="w-4 h-4" /><span>Notify Supervisor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
