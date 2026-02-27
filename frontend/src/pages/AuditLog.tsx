import { useState, useEffect } from "react";import React from "react";import {
  ScrollText, Search, Download, ChevronDown, User,
  Shield, Settings, AlertTriangle, Camera, Database, Cpu, CheckCircle2,
  XCircle, Info, ArrowUpRight, RefreshCw, Loader2
} from "lucide-react";
import { adminAPI, type AuditLogEvent } from "../lib/api";

type LogType = AuditLogEvent;

export default function AuditLog() {
  const [logs, setLogs] = useState<LogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<LogType | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (categoryFilter !== "ALL") params.category = categoryFilter;
      if (severityFilter !== "ALL") params.severity = severityFilter;
      const res = await adminAPI.auditLog(params as any);
      setLogs(res.data.events || []);
    } catch {
      // keep current
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [categoryFilter, severityFilter]);

  const filtered = logs.filter(log => {
    const matchSearch = log.action.toLowerCase().includes(search.toLowerCase()) || log.detail.toLowerCase().includes(search.toLowerCase()) || log.user.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleExport = () => {
    const csv = ["Timestamp,User,Role,Action,Category,Detail,IP,Severity", ...logs.map(l => `${l.timestamp},${l.user},${l.role},"${l.action}",${l.category},"${l.detail}",${l.ip},${l.severity}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit_log_export.csv"; a.click();
    showToast("Audit log exported to CSV");
  };

  const categoryIcon = (cat: string) => {
    const icons: Record<string, React.ReactNode> = {
      user: <User className="w-4 h-4 text-blue-500" />,
      alert: <AlertTriangle className="w-4 h-4 text-red-500" />,
      violation: <Shield className="w-4 h-4 text-orange-500" />,
      system: <Cpu className="w-4 h-4 text-indigo-500" />,
      zone: <Database className="w-4 h-4 text-amber-500" />,
      camera: <Camera className="w-4 h-4 text-green-500" />,
      report: <ScrollText className="w-4 h-4 text-purple-500" />,
      settings: <Settings className="w-4 h-4 text-slate-500" />,
      kiosk: <User className="w-4 h-4 text-cyan-500" />,
    };
    return icons[cat] || <Info className="w-4 h-4 text-slate-400" />;
  };

  const categoryBg = (cat: string) => {
    const bgs: Record<string, string> = {
      user: "bg-blue-50", alert: "bg-red-50", violation: "bg-orange-50",
      system: "bg-indigo-50", zone: "bg-amber-50", camera: "bg-green-50",
      report: "bg-purple-50", settings: "bg-slate-50", kiosk: "bg-cyan-50",
    };
    return bgs[cat] || "bg-slate-50";
  };

  const severityBadge = (sev: string) => {
    if (sev === "critical") return "bg-red-500 text-white";
    if (sev === "high") return "bg-red-100 text-red-700";
    if (sev === "medium") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-600";
  };

  const counts = {
    total: logs.length,
    critical: logs.filter(l => l.severity === "critical").length,
    high: logs.filter(l => l.severity === "high").length,
    system: logs.filter(l => l.role === "SYSTEM").length,
    human: logs.filter(l => l.role !== "SYSTEM").length,
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" /><span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">Complete system activity trail — all events are immutable</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
          <button onClick={() => { fetchLogs(); showToast("Audit log refreshed"); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#18181b] text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md">
            <Download className="w-3.5 h-3.5" />Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Events", value: counts.total, icon: <ScrollText className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-50" },
          { label: "Critical", value: counts.critical, icon: <XCircle className="w-5 h-5 text-red-500" />, bg: "bg-red-50" },
          { label: "High Priority", value: counts.high, icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, bg: "bg-orange-50" },
          { label: "System Events", value: counts.system, icon: <Cpu className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
          { label: "User Actions", value: counts.human, icon: <User className="w-5 h-5 text-green-500" />, bg: "bg-green-50" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>{card.icon}</div>
            <div>
              <p className="text-xl font-bold text-slate-800 tabular-nums">{card.value}</p>
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions, details, users..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all" />
        </div>
        <div className="relative">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
            <option value="ALL">All Categories</option>
            <option value="user">User Management</option>
            <option value="alert">Alerts</option>
            <option value="violation">Violations</option>
            <option value="system">System</option>
            <option value="zone">Zones</option>
            <option value="camera">Cameras</option>
            <option value="report">Reports</option>
            <option value="kiosk">Kiosk</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
            <option value="ALL">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="info">Info</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
        <div className="space-y-1">
          {filtered.map((log, idx) => (
            <div key={log.id} className="flex gap-4 cursor-pointer hover:bg-slate-50 rounded-2xl p-4 transition-all group" onClick={() => setSelectedLog(log)}>
              {/* Timeline Dot */}
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${categoryBg(log.category)} shrink-0`}>
                  {categoryIcon(log.category)}
                </div>
                {idx < filtered.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{log.action}</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${severityBadge(log.severity)}`}>{log.severity.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{log.detail}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.user}</span>
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{log.role}</span>
                      {log.ip !== "—" && <span className="font-mono">{log.ip}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-mono">{log.timestamp.split(" ")[1]}</p>
                    <p className="text-[9px] text-slate-300 mt-0.5">{log.timestamp.split(" ")[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <ScrollText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No events match your filters</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedLog(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
              <ArrowUpRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${categoryBg(selectedLog.category)}`}>
                {categoryIcon(selectedLog.category)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedLog.action}</h2>
                <p className="text-xs text-slate-400 font-mono">{selectedLog.timestamp}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-700 leading-relaxed">{selectedLog.detail}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Performed By</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{selectedLog.user}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Role</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{selectedLog.role}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Category</p>
                <p className="text-sm font-bold text-slate-800 mt-1 capitalize">{selectedLog.category}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">IP Address</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{selectedLog.ip}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Severity</p>
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${severityBadge(selectedLog.severity)}`}>{selectedLog.severity.toUpperCase()}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Event ID</p>
                <p className="text-sm font-bold text-slate-800 mt-1 font-mono">EVT-{String(selectedLog.id).padStart(5, '0')}</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center">This event is immutable and stored in the audit trail</p>
          </div>
        </div>
      )}
    </div>
  );
}
