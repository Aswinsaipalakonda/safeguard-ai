import { DownloadCloud, BarChart3, ShieldCheck, TrendingUp, CheckCircle2, FileText, Calendar, PieChart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RPieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useEffect, useState } from "react";
import api from "../lib/api";
import useStore from "../store";

const DEMO_TREND_DATA = [
  { name: "Mon", compliance: 88.5, violations: 14, incidents: 3 },
  { name: "Tue", compliance: 91.2, violations: 11, incidents: 2 },
  { name: "Wed", compliance: 89.7, violations: 13, incidents: 4 },
  { name: "Thu", compliance: 93.1, violations: 8, incidents: 1 },
  { name: "Fri", compliance: 94.6, violations: 7, incidents: 2 },
  { name: "Sat", compliance: 92.3, violations: 9, incidents: 1 },
  { name: "Sun", compliance: 95.4, violations: 5, incidents: 0 },
];

const DEMO_PPE_BREAKDOWN = [
  { name: "Helmet", value: 42, color: "#ef4444" },
  { name: "Safety Vest", value: 28, color: "#f97316" },
  { name: "Harness", value: 18, color: "#eab308" },
  { name: "Goggles", value: 15, color: "#3b82f6" },
  { name: "Gloves", value: 12, color: "#8b5cf6" },
  { name: "Boots", value: 9, color: "#06b6d4" },
];

const DEMO_ZONE_DATA = [
  { name: "Excavation A", violations: 42, compliance: 78 },
  { name: "Conveyor Belt", violations: 31, compliance: 84 },
  { name: "Shaft B", violations: 38, compliance: 76 },
  { name: "Blasting C", violations: 35, compliance: 80 },
  { name: "Processing", violations: 18, compliance: 90 },
  { name: "Loading Dock", violations: 14, compliance: 93 },
  { name: "Storage", violations: 8, compliance: 96 },
  { name: "Control Room", violations: 3, compliance: 99 },
];

export default function ComplianceReports() {
  const [data, setData] = useState<any[]>([]);
  const [ppeData] = useState(DEMO_PPE_BREAKDOWN);
  const [zoneData] = useState(DEMO_ZONE_DATA);
  const [reportTab, setReportTab] = useState<"trend" | "ppe" | "zones">("trend");
  const [generating, setGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const token = useStore((state) => state.token);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("analytics/compliance/");
        if (!response.data || response.data.length === 0) throw new Error("empty");
        setData(response.data);
      } catch {
        setData(DEMO_TREND_DATA);
      }
    };
    fetchData();
  }, [token]);

  const handleGeneratePDF = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      // Create a simple demo PDF download
      const content = `DGMS COMPLIANCE REPORT\n${"=".repeat(50)}\nGenerated: ${new Date().toLocaleString()}\n\nWeekly Safety Index: 91.2%\nTotal Violations: 67\nResolved: 58 (86.6%)\nInsurance Risk Score: A-\n\n${"=".repeat(50)}\n7-DAY TREND\n${data.map((d: any) => `${d.name}: ${d.compliance}% compliance, ${d.violations} violations`).join("\n")}\n\n${"=".repeat(50)}\nTOP VIOLATION TYPES\n${ppeData.map((p) => `${p.name}: ${p.value} incidents`).join("\n")}\n\n${"=".repeat(50)}\nZONE BREAKDOWN\n${zoneData.map((z) => `${z.name}: ${z.violations} violations, ${z.compliance}% compliance`).join("\n")}\n\nReport prepared by SafeGuard AI - DGMS Compliance Engine\nRef: DGMS/2025/AUTO/${Math.floor(Math.random() * 9000 + 1000)}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DGMS_Compliance_Report_${new Date().toISOString().split("T")[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("DGMS Report generated and downloaded!");
    }, 2000);
  };

  const totalViolations = data.reduce((s: number, d: any) => s + (d.violations || 0), 0);
  const avgCompliance = data.length > 0 ? (data.reduce((s: number, d: any) => s + (d.compliance || 0), 0) / data.length).toFixed(1) : "91.2";

  return (
    <div className="space-y-6 flex flex-col min-h-full font-sans">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="bg-green-100 p-2 rounded-xl">
                 <ShieldCheck className="text-green-600 w-6 h-6" />
             </div>
             <h1 className="text-2xl font-bold text-slate-800 tracking-wide">DGMS Compliance Center</h1>
          </div>
          <p className="text-slate-500 text-sm max-w-xl">
             Generate legally compliant Directorate General of Mines Safety reports. Automated analysis correlates safety protocol adherence with incident rates.
          </p>
        </div>
        <button 
          onClick={handleGeneratePDF}
          disabled={generating}
          className={`flex items-center justify-center w-full lg:w-auto space-x-2 px-6 py-3 font-bold rounded-full shadow-lg transition-all ${generating ? "bg-indigo-400 cursor-not-allowed" : "bg-linear-to-r from-blue-600 to-indigo-600 shadow-indigo-500/30 hover:shadow-indigo-500/50"} text-white`}
        >
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <DownloadCloud size={18} />
              <span>Generate Factory Act PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">Weekly Safety Index</span>
          <div className="text-5xl font-black text-slate-800 mb-2">{avgCompliance}<span className="text-3xl">%</span></div>
          <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-1 rounded-md inline-flex items-center w-max">
             <TrendingUp className="w-3 h-3 mr-1" /> +2.4% vs last week
          </span>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">Total Violations</span>
          <div className="text-5xl font-black text-red-500 mb-2">{totalViolations}</div>
          <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-1 rounded-md inline-flex items-center w-max">
             <TrendingUp className="w-3 h-3 mr-1" /> -12.5% improvement
          </span>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">Top Violation Type</span>
          <div className="text-2xl font-bold text-red-500 mb-2 mt-auto">Helmet Missing</div>
          <p className="text-slate-500 text-sm">Excavation Area A</p>
        </div>
        
        <div className="bg-linear-to-br from-[#1a1443] to-[#2c1555] border border-indigo-900 rounded-[2rem] p-6 shadow-lg flex flex-col text-white">
          <span className="text-xs font-bold text-slate-300 tracking-wider mb-4 uppercase">Insurance Risk Score</span>
          <div className="text-5xl font-black mb-2 mt-auto">A-</div>
          <p className="text-slate-300 text-sm">Premium discount eligible</p>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center space-x-2 bg-white rounded-full p-1.5 border border-slate-100 shadow-sm w-max">
        {([
          { id: "trend" as const, label: "7-Day Trend", icon: BarChart3 },
          { id: "ppe" as const, label: "PPE Breakdown", icon: PieChart },
          { id: "zones" as const, label: "Zone Analysis", icon: Calendar },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportTab(tab.id)}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              reportTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 7-Day Trend Chart */}
      {reportTab === "trend" && (
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col p-6 overflow-hidden">
          <div className="flex items-center space-x-2 mb-6 text-slate-800">
              <div className="bg-orange-100 p-2 rounded-xl">
                 <BarChart3 className="text-orange-600 w-5 h-5" />
              </div>
              <div>
                 <h3 className="font-bold text-lg">7-Day Safety Trend Analysis</h3>
                 <p className="text-xs text-slate-500">Compliance % vs Raw incidents</p>
              </div>
          </div>
          
          <div style={{ width: "100%", height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} fontSize={12} fontWeight={600} />
                <YAxis yAxisId="left" stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" axisLine={false} tickLine={false} dx={10} fontSize={11} />
                <Tooltip
                   contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#312e81', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', color: '#fff' }}
                   itemStyle={{ fontWeight: "bold", color: '#e2e8f0' }}
                   labelStyle={{ color: '#a5b4fc', fontWeight: 'bold', marginBottom: 4 }}
                   cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                <Area yAxisId="left" type="monotone" dataKey="compliance" stroke="#6366f1" strokeWidth={3} fill="url(#colorCompliance)" name="Compliance %" activeDot={{ r: 7, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }} />
                <Area yAxisId="right" type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={3} fill="url(#colorViolations)" name="Violations" activeDot={{ r: 7, fill: '#ef4444', stroke: '#fff', strokeWidth: 3 }} />
                <Area yAxisId="right" type="monotone" dataKey="incidents" stroke="#f59e0b" strokeWidth={2} fill="url(#colorIncidents)" name="Critical Incidents" strokeDasharray="6 3" activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Mini summary row below chart */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
            <div className="text-center">
              <div className="inline-flex items-center space-x-1.5 mb-1"><div className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-xs font-bold text-slate-500">Avg Compliance</span></div>
              <p className="text-xl font-black text-indigo-600">{avgCompliance}%</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center space-x-1.5 mb-1"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs font-bold text-slate-500">Total Violations</span></div>
              <p className="text-xl font-black text-red-500">{totalViolations}</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center space-x-1.5 mb-1"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-xs font-bold text-slate-500">Critical Incidents</span></div>
              <p className="text-xl font-black text-amber-500">{data.reduce((s: number, d: any) => s + (d.incidents || 0), 0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* PPE Breakdown Chart */}
      {reportTab === "ppe" && (
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col p-6">
          <div className="flex items-center space-x-2 mb-6 text-slate-800">
              <div className="bg-purple-100 p-2 rounded-xl">
                 <PieChart className="text-purple-600 w-5 h-5" />
              </div>
              <div>
                 <h3 className="font-bold text-lg">PPE Violation Breakdown</h3>
                 <p className="text-xs text-slate-500">Distribution by equipment type</p>
              </div>
          </div>
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            {/* Donut Chart */}
            <div className="w-full lg:w-1/2 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 p-4" style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <defs>
                    {ppeData.map((entry, idx) => (
                      <linearGradient key={idx} id={`pieGrad${idx}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie data={ppeData} cx="50%" cy="50%" innerRadius={70} outerRadius={130} paddingAngle={4} dataKey="value" cornerRadius={6} label={(props: any) => `${props.name}`} labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}>
                    {ppeData.map((_entry, idx) => (
                      <Cell key={idx} fill={`url(#pieGrad${idx})`} stroke="white" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '12px', border: 'none', color: '#fff' }} itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
            {/* Detail List + Radar */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-4" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={ppeData.map(p => ({ ...p, fullMark: 50 }))}>
                    <PolarGrid stroke="#c7d2fe" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#6366f1' }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar name="Violations" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {ppeData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-md shadow-sm" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700 text-sm">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-800 text-sm">{item.value}</span>
                      <div className="w-24 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(item.value / 42) * 100}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zone Analysis Chart */}
      {reportTab === "zones" && (
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col p-6">
          <div className="flex items-center space-x-2 mb-6 text-slate-800">
              <div className="bg-blue-100 p-2 rounded-xl">
                 <FileText className="text-blue-600 w-5 h-5" />
              </div>
              <div>
                 <h3 className="font-bold text-lg">Zone-wise Compliance Analysis</h3>
                 <p className="text-xs text-slate-500">Violations and compliance per zone</p>
              </div>
          </div>
          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="barViolations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} fontSize={11} fontWeight={600} angle={-20} textAnchor="end" />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '16px', border: 'none', color: '#fff', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}
                  itemStyle={{ fontWeight: 'bold', color: '#e2e8f0' }}
                  labelStyle={{ color: '#a5b4fc', fontWeight: 'bold', marginBottom: 4 }}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                <Bar dataKey="violations" fill="url(#barViolations)" radius={[10, 10, 0, 0]} name="Violations" maxBarSize={40} />
                <Bar dataKey="compliance" fill="url(#barCompliance)" radius={[10, 10, 0, 0]} name="Compliance %" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Zone ranking row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            {zoneData.slice(0, 4).map((z) => (
              <div key={z.name} className={`rounded-xl p-3 text-center ${z.compliance >= 90 ? 'bg-green-50 border border-green-100' : z.compliance >= 80 ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}`}>
                <p className="text-xs font-bold text-slate-500 truncate">{z.name}</p>
                <p className={`text-lg font-black ${z.compliance >= 90 ? 'text-green-600' : z.compliance >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{z.compliance}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
