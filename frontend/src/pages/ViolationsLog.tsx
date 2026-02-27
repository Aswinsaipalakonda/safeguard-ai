import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DownloadCloud, Filter, X, Eye, CheckCircle2, Clock, ChevronDown, Search } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import api from "../lib/api";
import useStore from "../store";

interface Violation {
  id: string;
  time: string;
  date: string;
  worker: string;
  zone: string;
  ppe: string;
  confidence: string;
  status: string;
  camera: string;
  severity: string;
  snapshot: string;
}

const DEMO_VIOLATIONS: Violation[] = [
  { id: "V-1042", time: "09:14 AM", date: "2025-01-15", worker: "Rajesh Kumar", zone: "Excavation Area A", ppe: "Helmet Missing", confidence: "96%", status: "Active", camera: "CAM-01", severity: "critical", snapshot: "" },
  { id: "V-1041", time: "09:08 AM", date: "2025-01-15", worker: "Suresh Reddy", zone: "Conveyor Belt Section", ppe: "Safety Vest", confidence: "93%", status: "Active", camera: "CAM-03", severity: "high", snapshot: "" },
  { id: "V-1040", time: "08:55 AM", date: "2025-01-15", worker: "Anand Sharma", zone: "Underground Shaft B", ppe: "Harness Unfastened", confidence: "91%", status: "Active", camera: "CAM-05", severity: "critical", snapshot: "" },
  { id: "V-1039", time: "08:42 AM", date: "2025-01-15", worker: "Mohammed Ismail", zone: "Blasting Zone C", ppe: "Respirator Missing", confidence: "89%", status: "Resolved", camera: "CAM-07", severity: "critical", snapshot: "" },
  { id: "V-1038", time: "08:31 AM", date: "2025-01-15", worker: "Priya Nair", zone: "Processing Plant", ppe: "Safety Goggles", confidence: "88%", status: "Active", camera: "CAM-02", severity: "medium", snapshot: "" },
  { id: "V-1037", time: "08:22 AM", date: "2025-01-15", worker: "Vikram Singh", zone: "Loading Dock", ppe: "Steel-Toe Boots", confidence: "94%", status: "Resolved", camera: "CAM-04", severity: "medium", snapshot: "" },
  { id: "V-1036", time: "08:10 AM", date: "2025-01-15", worker: "Karthik Bhat", zone: "Excavation Area A", ppe: "Helmet Missing", confidence: "97%", status: "Resolved", camera: "CAM-01", severity: "critical", snapshot: "" },
  { id: "V-1035", time: "07:58 AM", date: "2025-01-15", worker: "Deepak Yadav", zone: "Assembly Line 1", ppe: "Ear Protection", confidence: "85%", status: "Active", camera: "CAM-06", severity: "low", snapshot: "" },
  { id: "V-1034", time: "07:45 AM", date: "2025-01-15", worker: "Arjun Patel", zone: "Welding Zone B", ppe: "Welding Gloves", confidence: "92%", status: "Resolved", camera: "CAM-08", severity: "high", snapshot: "" },
  { id: "V-1033", time: "07:33 AM", date: "2025-01-15", worker: "Ravi Shankar", zone: "Control Room", ppe: "Safety Vest", confidence: "86%", status: "Resolved", camera: "CAM-09", severity: "low", snapshot: "" },
  { id: "V-1032", time: "07:20 AM", date: "2025-01-15", worker: "Sanjay Gupta", zone: "Storage Yard", ppe: "Hard Hat", confidence: "90%", status: "Active", camera: "CAM-10", severity: "medium", snapshot: "" },
  { id: "V-1031", time: "07:12 AM", date: "2025-01-14", worker: "Rajesh Kumar", zone: "Underground Shaft B", ppe: "Harness Unfastened", confidence: "95%", status: "Resolved", camera: "CAM-05", severity: "critical", snapshot: "" },
  { id: "V-1030", time: "06:58 AM", date: "2025-01-14", worker: "Mohan Das", zone: "Blasting Zone C", ppe: "Respirator Missing", confidence: "91%", status: "Resolved", camera: "CAM-07", severity: "critical", snapshot: "" },
  { id: "V-1029", time: "06:40 AM", date: "2025-01-14", worker: "Suresh Reddy", zone: "Conveyor Belt Section", ppe: "Safety Gloves", confidence: "87%", status: "Resolved", camera: "CAM-03", severity: "medium", snapshot: "" },
  { id: "V-1028", time: "06:25 AM", date: "2025-01-14", worker: "Prakash Joshi", zone: "Processing Plant", ppe: "Face Shield", confidence: "83%", status: "Active", camera: "CAM-02", severity: "high", snapshot: "" },
];

export default function ViolationsLog() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const token = useStore((state) => state.token);
  const filterRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const response = await api.get("violations/");
        const data = response.data.violations || response.data;
        if (!data || data.length === 0) throw new Error("empty");
        const mappedData = data.map((v: any) => ({
          id: `V-${v.id}`,
          time: new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(v.created_at).toISOString().split("T")[0],
          worker: v.worker || "Unknown",
          zone: v.zone,
          ppe: v.ppe_type,
          confidence: `${(v.confidence * 100).toFixed(0)}%`,
          status: v.resolved_at ? "Resolved" : "Active",
          camera: v.camera || "CAM-01",
          severity: v.confidence > 0.9 ? "critical" : v.confidence > 0.85 ? "high" : "medium",
          snapshot: "",
        }));
        setViolations(mappedData);
      } catch {
        setViolations(DEMO_VIOLATIONS);
      }
    };
    fetchViolations();
  }, [token]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleResolve = (id: string) => {
    setViolations((prev) => prev.map((v) => v.id === id ? { ...v, status: "Resolved" } : v));
    setSelectedViolation(null);
    showToast(`${id} marked as Resolved`);
  };

  const handleExportCSV = () => {
    const header = "ID,Time,Date,Worker,Zone,PPE,Confidence,Status,Camera,Severity\n";
    const rows = filteredViolations.map((v) => `${v.id},${v.time},${v.date},${v.worker},${v.zone},${v.ppe},${v.confidence},${v.status},${v.camera},${v.severity}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `violations_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported successfully!");
  };

  const filteredViolations = violations.filter((v) => {
    const matchSearch = searchQuery === "" || v.worker.toLowerCase().includes(searchQuery.toLowerCase()) || v.zone.toLowerCase().includes(searchQuery.toLowerCase()) || v.ppe.toLowerCase().includes(searchQuery.toLowerCase()) || v.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || v.status.toLowerCase() === statusFilter;
    const matchSeverity = severityFilter === "all" || v.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  });

  const activeCount = violations.filter((v) => v.status === "Active").length;
  const resolvedCount = violations.filter((v) => v.status === "Resolved").length;

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "text-red-600 bg-red-100",
      high: "text-orange-600 bg-orange-100",
      medium: "text-yellow-600 bg-yellow-100",
      low: "text-green-600 bg-green-100",
    };
    return colors[severity] || "text-slate-500 bg-slate-100";
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-wide mb-1">Violations Registry</h1>
          <p className="text-slate-500 text-sm">Review and resolve safety incidents in real-time.</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">{activeCount} Active</span>
            <span className="text-xs font-bold text-green-500 bg-green-50 px-3 py-1 rounded-full">{resolvedCount} Resolved</span>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{violations.length} Total</span>
          </div>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <div className="relative" ref={filterRef}>
            <button onClick={() => setFilterOpen(!filterOpen)} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
              <Filter size={16} />
              <span>Filter</span>
              <ChevronDown size={14} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-50 space-y-4 animate-in slide-in-from-top-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Search</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Worker, zone, PPE..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Status</label>
                  <div className="flex space-x-2">
                    {["all", "active", "resolved"].map((s) => (
                      <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Severity</label>
                  <div className="flex flex-wrap gap-2">
                    {["all", "critical", "high", "medium", "low"].map((s) => (
                      <button key={s} onClick={() => setSeverityFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${severityFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setSearchQuery(""); setStatusFilter("all"); setSeverityFilter("all"); }} className="w-full text-center text-xs text-red-500 font-bold hover:underline pt-2">
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
          <button onClick={handleExportCSV} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-[#fa3e5c] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors">
            <DownloadCloud size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto p-4">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider rounded-tl-xl py-4">ID</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Time</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Worker</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Zone</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Missing PPE</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Severity</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider text-right py-4">Confidence</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider text-right rounded-tr-xl py-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredViolations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">No violations match your filters.</TableCell>
                </TableRow>
              ) : (
                filteredViolations.map((v) => (
                  <TableRow key={v.id} onClick={() => setSelectedViolation(v)} className="border-b border-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-colors">
                    <TableCell className="font-medium text-slate-800 py-4">{v.id}</TableCell>
                    <TableCell className="text-slate-500 py-4">
                      <div className="flex flex-col">
                        <span>{v.time}</span>
                        <span className="text-[10px] text-slate-400">{v.date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium py-4">{v.worker}</TableCell>
                    <TableCell className="text-slate-600 py-4">{v.zone}</TableCell>
                    <TableCell className="text-red-500 font-medium py-4">{v.ppe}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={`font-bold border-0 px-2.5 py-0.5 rounded-full text-[10px] uppercase ${getSeverityBadge(v.severity)}`}>
                        {v.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-500 py-4 font-mono">{v.confidence}</TableCell>
                    <TableCell className="text-right py-4">
                      <Badge variant="outline" className={`font-bold border-0 px-3 py-1 rounded-full ${
                          v.status === 'Active' ? 'text-red-600 bg-red-100' :
                          v.status === 'Resolved' ? 'text-green-600 bg-green-100' :
                          'text-slate-500 bg-slate-100'
                      }`}>
                        {v.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredViolations.length} of {violations.length} violations</span>
          <span className="font-medium">Click any row for details</span>
        </div>
      </div>

      {/* Violation Detail Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedViolation(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 relative animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedViolation(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedViolation.id}</h2>
                <p className="text-sm text-slate-500">{selectedViolation.date} at {selectedViolation.time}</p>
              </div>
            </div>

            <div className="bg-slate-100 h-44 rounded-2xl flex items-center justify-center mb-6">
              <div className="text-center">
                <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">AI Detection Snapshot</p>
                <p className="text-[10px] text-slate-300">Camera: {selectedViolation.camera}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Worker</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{selectedViolation.worker}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Zone</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{selectedViolation.zone}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Missing PPE</p>
                <p className="text-sm font-bold text-red-500 mt-1">{selectedViolation.ppe}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Confidence</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{selectedViolation.confidence}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Severity</p>
                <Badge variant="outline" className={`font-bold border-0 px-2.5 py-0.5 rounded-full text-[10px] uppercase mt-1 ${getSeverityBadge(selectedViolation.severity)}`}>
                  {selectedViolation.severity}
                </Badge>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Status</p>
                <Badge variant="outline" className={`font-bold border-0 px-2.5 py-0.5 rounded-full text-[10px] mt-1 ${selectedViolation.status === "Active" ? "text-red-600 bg-red-100" : "text-green-600 bg-green-100"}`}>
                  {selectedViolation.status}
                </Badge>
              </div>
            </div>

            <div className="flex space-x-3">
              {selectedViolation.status === "Active" && (
                <button onClick={() => handleResolve(selectedViolation.id)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Resolved</span>
                </button>
              )}
              <button onClick={() => { showToast(`Alert sent to ${selectedViolation.worker}'s supervisor`); setSelectedViolation(null); }} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Escalate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
