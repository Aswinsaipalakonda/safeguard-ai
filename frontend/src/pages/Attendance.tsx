import { useState, useEffect } from "react";
import {
  Users, UserCheck, UserX, Clock, Download, Search, ChevronDown,
  CheckCircle2, AlertTriangle, CalendarDays, ArrowUpDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { workersAPI, type Worker } from "../lib/api";

/* ── Demo attendance data ── */
const DEMO_WORKERS = [
  { id: 1, name: "Rajesh Kumar", code: "EMP-001", dept: "Excavation", zone: "Zone A", checkIn: "06:45 AM", shift: "Day", ppeStatus: "compliant", status: "active", avatar: "RK", compliance: 97 },
  { id: 2, name: "Suresh Reddy", code: "EMP-002", dept: "Conveyor", zone: "Zone B", checkIn: "06:52 AM", shift: "Day", ppeStatus: "compliant", status: "active", avatar: "SR", compliance: 94 },
  { id: 3, name: "Deepak Yadav", code: "EMP-003", dept: "Processing", zone: "Zone C", checkIn: "07:02 AM", shift: "Day", ppeStatus: "compliant", status: "active", avatar: "DY", compliance: 91 },
  { id: 4, name: "Amit Singh", code: "EMP-004", dept: "Loading", zone: "Zone D", checkIn: "07:15 AM", shift: "Day", ppeStatus: "violation", status: "late", avatar: "AS", compliance: 82 },
  { id: 5, name: "Priya Nair", code: "EMP-005", dept: "Excavation", zone: "Zone A", checkIn: "07:30 AM", shift: "Day", ppeStatus: "compliant", status: "late", avatar: "PN", compliance: 96 },
  { id: 6, name: "Anand Verma", code: "EMP-006", dept: "Safety", zone: "Zone B", checkIn: "06:38 AM", shift: "Day", ppeStatus: "compliant", status: "active", avatar: "AV", compliance: 99 },
  { id: 7, name: "Vikram Patil", code: "EMP-007", dept: "Underground", zone: "Zone E", checkIn: "06:55 AM", shift: "Day", ppeStatus: "compliant", status: "active", avatar: "VP", compliance: 93 },
  { id: 8, name: "Lakshmi Devi", code: "EMP-008", dept: "Blasting", zone: "Zone F", checkIn: "07:22 AM", shift: "Day", ppeStatus: "violation", status: "late", avatar: "LD", compliance: 78 },
  { id: 9, name: "Karthik Bhat", code: "EMP-009", dept: "Excavation", zone: "Zone A", checkIn: "06:48 AM", shift: "Day", ppeStatus: "compliant", status: "active", avatar: "KB", compliance: 88 },
  { id: 10, name: "Mohammed Ismail", code: "EMP-010", dept: "Conveyor", zone: "Zone B", checkIn: "07:05 AM", shift: "Day", ppeStatus: "compliant", status: "active", avatar: "MI", compliance: 95 },
  { id: 11, name: "Sandeep Joshi", code: "EMP-011", dept: "Processing", zone: "Zone C", checkIn: "—", shift: "Day", ppeStatus: "—", status: "absent", avatar: "SJ", compliance: 76 },
  { id: 12, name: "Ravi Shankar", code: "EMP-012", dept: "Loading", zone: "Zone D", checkIn: "—", shift: "Day", ppeStatus: "—", status: "absent", avatar: "RS", compliance: 85 },
  { id: 13, name: "Arun Prasad", code: "EMP-013", dept: "Underground", zone: "Zone E", checkIn: "07:42 AM", shift: "Day", ppeStatus: "compliant", status: "late", avatar: "AP", compliance: 90 },
  { id: 14, name: "Naveen Reddy", code: "EMP-014", dept: "Blasting", zone: "Zone F", checkIn: "06:30 AM", shift: "Day", ppeStatus: "compliant", status: "active", avatar: "NR", compliance: 98 },
  { id: 15, name: "Ganesh Patel", code: "EMP-015", dept: "Safety", zone: "Zone A", checkIn: "—", shift: "Day", ppeStatus: "—", status: "absent", avatar: "GP", compliance: 92 },
];

const HOURLY_DATA = [
  { hour: "6 AM", count: 4 },
  { hour: "6:30", count: 8 },
  { hour: "7 AM", count: 18 },
  { hour: "7:30", count: 12 },
  { hour: "8 AM", count: 5 },
  { hour: "8:30", count: 2 },
  { hour: "9 AM", count: 1 },
  { hour: "9:30", count: 0 },
];

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] text-white text-xs rounded-xl px-4 py-2 shadow-xl border border-slate-700">
      <p className="font-bold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

function mapWorker(w: Worker, idx: number) {
  const zones = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E", "Zone F"];
  const depts = ["Excavation", "Conveyor", "Processing", "Loading", "Safety", "Underground", "Blasting"];
  const initials = w.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const h = 6 + Math.floor(idx * 7 / 15);
  const m = (30 + idx * 7) % 60;
  const isLate = h >= 7 && m >= 15;
  return {
    id: w.id, name: w.name, code: w.employee_code,
    dept: depts[idx % depts.length], zone: zones[idx % zones.length],
    checkIn: w.is_active ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} AM` : "\u2014",
    shift: "Day", ppeStatus: w.is_active ? (w.compliance_rate >= 85 ? "compliant" : "violation") : "\u2014",
    status: !w.is_active ? "absent" : isLate ? "late" : "active",
    avatar: initials, compliance: Math.round(w.compliance_rate),
  };
}

export default function Attendance() {
  const [workers, setWorkers] = useState(DEMO_WORKERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"name" | "checkIn" | "compliance">("checkIn");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentDate] = useState(new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await workersAPI.list({ page_size: 50 });
        if (res.data.results?.length) {
          setWorkers(res.data.results.map((w, i) => mapWorker(w, i)));
        }
      } catch { /* keep demo data */ }
    };
    fetchWorkers();
  }, []);

  const present = workers.filter(w => w.status !== "absent").length;
  const absent = workers.filter(w => w.status === "absent").length;
  const late = workers.filter(w => w.status === "late").length;

  const filtered = workers
    .filter(w => {
      const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || w.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      if (sortField === "checkIn") cmp = a.checkIn.localeCompare(b.checkIn);
      if (sortField === "compliance") cmp = a.compliance - b.compliance;
      return sortAsc ? cmp : -cmp;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const handleExport = () => {
    const csv = ["Name,Code,Zone,Check-in,PPE,Status,Compliance", ...workers.map(w => `${w.name},${w.code},${w.zone},${w.checkIn},${w.ppeStatus},${w.status},${w.compliance}%`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "attendance_report.csv"; a.click();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Worker Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">{currentDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <CalendarDays className="w-3.5 h-3.5" />Date Picker
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#18181b] text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md">
            <Download className="w-3.5 h-3.5" />Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Present Today", value: present, icon: <UserCheck className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Absent", value: absent, icon: <UserX className="w-5 h-5 text-red-500" />, bg: "bg-red-50", color: "text-red-600" },
          { label: "Late Arrivals", value: late, icon: <Clock className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Avg Check-in", value: "7:02 AM", icon: <Users className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-50", color: "text-indigo-600" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>{card.icon}</div>
            </div>
            <p className={`text-3xl font-bold ${card.color} tabular-nums`}>{card.value}</p>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Check-in Timeline Chart */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Check-in Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={HOURLY_DATA} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} />
            <defs>
              <linearGradient id="attBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            <Bar dataKey="count" name="Workers" fill="url(#attBarGrad)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or employee code..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
            <option value="ALL">All Status</option>
            <option value="active">Active</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Worker Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Worker</th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer" onClick={() => handleSort("checkIn")}>
                  <span className="flex items-center gap-1">Check-in <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Zone</th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">PPE</th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer" onClick={() => handleSort("compliance")}>
                  <span className="flex items-center gap-1">Compliance <ArrowUpDown className="w-3 h-3" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(worker => (
                <tr key={worker.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{worker.avatar}</div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{worker.name}</p>
                        <p className="text-[10px] text-slate-400">{worker.code} · {worker.dept}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`font-mono text-sm ${worker.checkIn === "—" ? "text-slate-300" : "text-slate-700 font-bold"}`}>
                      {worker.checkIn}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{worker.zone}</td>
                  <td className="px-4 py-4">
                    {worker.ppeStatus === "compliant" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : worker.ppeStatus === "violation" ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      worker.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      worker.status === "late" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {worker.status === "active" ? "Active" : worker.status === "late" ? "Late" : "Absent"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${worker.compliance}%`, background: worker.compliance >= 90 ? "#22c55e" : worker.compliance >= 80 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 tabular-nums">{worker.compliance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">No workers match your filters</div>
        )}
      </div>
    </div>
  );
}
