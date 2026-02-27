import { useState } from "react";
import {
  Clock, Search, ChevronDown, Camera, AlertTriangle, CheckCircle2,
  Shield, MapPin, Eye, ChevronRight
} from "lucide-react";

/* ── Demo timeline events ── */
const DEMO_EVENTS = [
  { id: 1, time: "02:42 PM", date: "Today", type: "violation", severity: "high", title: "Helmet Violation Detected", worker: "Vikram Singh", workerId: "EMP-089", zone: "Excavation Area A", camera: "CAM-4", confidence: 94.2, responseTime: 12, status: "pending", missing: ["Helmet"], description: "AI detected worker without helmet near active drilling zone. Escalation Level 2 triggered." },
  { id: 2, time: "02:38 PM", date: "Today", type: "resolved", severity: "medium", title: "Vest Violation Resolved", worker: "Rajesh Kumar", workerId: "EMP-042", zone: "Conveyor Belt Section", camera: "CAM-2", confidence: 91.8, responseTime: 8, status: "resolved", missing: ["Vest"], description: "Worker acknowledged violation and equipped safety vest within 8 minutes." },
  { id: 3, time: "02:15 PM", date: "Today", type: "violation", severity: "critical", title: "Multiple PPE Missing — CRITICAL", worker: "Karthik Bhat", workerId: "EMP-078", zone: "Underground Shaft B", camera: "CAM-10", confidence: 96.1, responseTime: null, status: "escalated", missing: ["Helmet", "Goggles"], description: "Worker entered restricted zone without helmet and eye protection. Auto-escalated to Level 4. PA warning broadcast." },
  { id: 4, time: "01:55 PM", date: "Today", type: "resolved", severity: "low", title: "Gloves Reminder Acknowledged", worker: "Deepak Yadav", workerId: "EMP-003", zone: "Processing Plant", camera: "CAM-6", confidence: 88.5, responseTime: 3, status: "resolved", missing: ["Gloves"], description: "Worker received push notification and equipped gloves within 3 minutes." },
  { id: 5, time: "01:42 PM", date: "Today", type: "alert", severity: "high", title: "Camera Offline Alert", worker: "System", workerId: "—", zone: "Underground Shaft B", camera: "CAM-10", confidence: null, responseTime: null, status: "active", missing: [], description: "Camera feed lost. Possible network issue or physical damage. Maintenance team dispatched." },
  { id: 6, time: "01:30 PM", date: "Today", type: "violation", severity: "medium", title: "Goggles Missing in Welding Zone", worker: "Amit Singh", workerId: "EMP-004", zone: "Blasting Zone C", camera: "CAM-7", confidence: 89.3, responseTime: 15, status: "resolved", missing: ["Goggles"], description: "Worker welding without eye protection detected. Supervisor notified via SMS." },
  { id: 7, time: "01:12 PM", date: "Today", type: "resolved", severity: "high", title: "Helmet Violation Cleared", worker: "Suresh Reddy", workerId: "EMP-002", zone: "Conveyor Belt Section", camera: "CAM-3", confidence: 95.4, responseTime: 6, status: "resolved", missing: ["Helmet"], description: "Quick resolution — worker retrieved helmet from locker room." },
  { id: 8, time: "12:45 PM", date: "Today", type: "system", severity: "info", title: "Shift Handover Complete", worker: "System", workerId: "—", zone: "All Zones", camera: "—", confidence: null, responseTime: null, status: "completed", missing: [], description: "Morning → Afternoon shift change completed. 3 pending violations carried over." },
  { id: 9, time: "12:30 PM", date: "Today", type: "violation", severity: "medium", title: "Boots Violation at Loading Dock", worker: "Naveen Reddy", workerId: "EMP-014", zone: "Loading Dock", camera: "CAM-12", confidence: 87.6, responseTime: 22, status: "resolved", missing: ["Boots"], description: "Worker wearing improper footwear in heavy equipment zone. Replaced with safety boots." },
  { id: 10, time: "12:15 PM", date: "Today", type: "alert", severity: "critical", title: "Emergency SOS Triggered", worker: "Lakshmi Devi", workerId: "EMP-008", zone: "Blasting Zone C", camera: "CAM-8", confidence: null, responseTime: 2, status: "resolved", missing: [], description: "Worker triggered SOS button. Emergency response team dispatched. False alarm — worker accidentally pressed button." },
  { id: 11, time: "11:58 AM", date: "Today", type: "violation", severity: "high", title: "No Helmet + No Vest", worker: "Sandeep Joshi", workerId: "EMP-011", zone: "Excavation Area A", camera: "CAM-4", confidence: 93.7, responseTime: 18, status: "resolved", missing: ["Helmet", "Vest"], description: "Multiple PPE violations detected. Worker was on break and entered zone without re-equipping." },
  { id: 12, time: "11:30 AM", date: "Today", type: "system", severity: "info", title: "AI Model Accuracy Report", worker: "System", workerId: "—", zone: "—", camera: "All", confidence: 94.2, responseTime: null, status: "completed", missing: [], description: "Hourly AI performance check: mAP50 94.2%, inference 23ms, 0 false positives in last hour." },
  { id: 13, time: "11:15 AM", date: "Today", type: "resolved", severity: "medium", title: "Vest Compliance Restored", worker: "Mohammed Ismail", workerId: "EMP-010", zone: "Conveyor Belt Section", camera: "CAM-3", confidence: 90.1, responseTime: 5, status: "resolved", missing: ["Vest"], description: "Worker equipped safety vest after PA system announcement." },
  { id: 14, time: "10:48 AM", date: "Today", type: "violation", severity: "low", title: "Gloves Advisory", worker: "Priya Nair", workerId: "EMP-005", zone: "Processing Plant", camera: "CAM-5", confidence: 85.2, responseTime: 7, status: "resolved", missing: ["Gloves"], description: "Advisory-level notification. Worker was in low-risk area of the zone." },
  { id: 15, time: "10:22 AM", date: "Today", type: "alert", severity: "medium", title: "Zone Compliance Drop", worker: "System", workerId: "—", zone: "Underground Shaft B", camera: "—", confidence: null, responseTime: null, status: "active", missing: [], description: "Zone compliance dropped below 80% threshold. 3 active violations in zone." },
];



export default function IncidentTimeline() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = DEMO_EVENTS.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.worker.toLowerCase().includes(search.toLowerCase()) || e.zone.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "ALL" || e.severity === severityFilter;
    const matchType = typeFilter === "ALL" || e.type === typeFilter;
    return matchSearch && matchSeverity && matchType;
  });

  const severityConfig: Record<string, { color: string; bg: string; dot: string; border: string }> = {
    critical: { color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500", border: "border-red-200" },
    high: { color: "text-orange-600", bg: "bg-orange-50", dot: "bg-orange-500", border: "border-orange-200" },
    medium: { color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500", border: "border-amber-200" },
    low: { color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500", border: "border-blue-200" },
    info: { color: "text-slate-500", bg: "bg-slate-50", dot: "bg-slate-400", border: "border-slate-200" },
  };

  const statusBadge = (status: string) => {
    if (status === "resolved") return "bg-emerald-100 text-emerald-700";
    if (status === "escalated") return "bg-red-100 text-red-700";
    if (status === "pending") return "bg-amber-100 text-amber-700";
    if (status === "active") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-600";
  };

  const typeIcon = (type: string) => {
    if (type === "violation") return <Shield className="w-4 h-4 text-red-500" />;
    if (type === "resolved") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (type === "alert") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const stats = {
    total: DEMO_EVENTS.length,
    critical: DEMO_EVENTS.filter(e => e.severity === "critical").length,
    pending: DEMO_EVENTS.filter(e => e.status === "pending" || e.status === "escalated").length,
    avgResponse: Math.round(DEMO_EVENTS.filter(e => e.responseTime).reduce((a, e) => a + (e.responseTime || 0), 0) / DEMO_EVENTS.filter(e => e.responseTime).length),
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Clock className="w-6 h-6 text-indigo-500" />Incident Timeline</h1>
          <p className="text-sm text-slate-500 mt-1">Chronological safety event feed — last 24 hours</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50", icon: <Clock className="w-5 h-5 text-indigo-500" /> },
          { label: "Critical", value: stats.critical, color: "text-red-600", bg: "bg-red-50", icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
          { label: "Pending Action", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50", icon: <Shield className="w-5 h-5 text-amber-500" /> },
          { label: "Avg Response", value: `${stats.avgResponse}m`, color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>{card.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${card.color} tabular-nums`}>{card.value}</p>
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events, workers, zones..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
        </div>
        <div className="relative">
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
            <option value="ALL">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
            <option value="ALL">All Types</option>
            <option value="violation">Violations</option>
            <option value="resolved">Resolved</option>
            <option value="alert">Alerts</option>
            <option value="system">System</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered.map(event => {
          const sev = severityConfig[event.severity] || severityConfig.info;
          const isExpanded = expandedId === event.id;

          return (
            <div
              key={event.id}
              className={`bg-white rounded-[2rem] border shadow-sm transition-all cursor-pointer hover:shadow-md ${isExpanded ? sev.border : "border-slate-100"}`}
              onClick={() => setExpandedId(isExpanded ? null : event.id)}
            >
              <div className="p-5 flex items-start gap-4">
                {/* Timeline dot */}
                <div className="flex flex-col items-center pt-1">
                  <div className={`w-3 h-3 rounded-full ${sev.dot} ring-4 ${sev.bg} shrink-0`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {typeIcon(event.type)}
                        <h3 className={`text-sm font-bold ${sev.color}`}>{event.title}</h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge(event.status)}`}>{event.status.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 flex-wrap">
                        <span className="font-bold text-slate-600">{event.worker}</span>
                        {event.workerId !== "—" && <span className="font-mono">{event.workerId}</span>}
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.zone}</span>
                        {event.camera !== "—" && <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{event.camera}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-600">{event.time}</p>
                      <p className="text-[10px] text-slate-300">{event.date}</p>
                      <ChevronRight className={`w-4 h-4 text-slate-300 mt-1 ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-2">
                      <p className="text-sm text-slate-600">{event.description}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {event.confidence !== null && (
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Confidence</p>
                            <p className="text-lg font-bold text-indigo-600">{event.confidence}%</p>
                          </div>
                        )}
                        {event.responseTime !== null && (
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Response Time</p>
                            <p className="text-lg font-bold text-emerald-600">{event.responseTime}min</p>
                          </div>
                        )}
                        {event.missing.length > 0 && (
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Missing PPE</p>
                            <p className="text-sm font-bold text-red-600">{event.missing.join(", ")}</p>
                          </div>
                        )}
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Severity</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>{event.severity.toUpperCase()}</span>
                        </div>
                      </div>
                      {(event.status === "pending" || event.status === "escalated") && (
                        <div className="flex gap-2 pt-2">
                          <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all" onClick={e => e.stopPropagation()}>Mark Resolved</button>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-500 transition-all" onClick={e => e.stopPropagation()}>Escalate</button>
                          <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Eye className="w-3 h-3" />View Worker
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100">
          <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No events match your filters</p>
        </div>
      )}
    </div>
  );
}
