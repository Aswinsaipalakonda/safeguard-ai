import { DownloadCloud, BarChart3, ShieldCheck, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from "react";
import api from "../lib/api";
import useStore from "../store";

export default function ComplianceReports() {
  const [data, setData] = useState<any[]>([]);
  const token = useStore((state) => state.token);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("analytics/compliance/");
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };

    fetchData();
  }, [token]);
  return (
    <div className="space-y-6 flex flex-col h-full font-sans">
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
        <button onClick={() => alert("Compiling DGMS Report PDF...")} className="flex items-center justify-center w-full lg:w-auto space-x-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 font-bold rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow">
          <DownloadCloud size={18} />
          <span>Generate Factory Act PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">Weekly Safety Index</span>
          <div className="text-5xl font-black text-slate-800 mb-2">91.2<span className="text-3xl">%</span></div>
          <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-1 rounded-md inline-flex items-center w-max">
             <TrendingUp className="w-3 h-3 mr-1" /> +2.4% vs last week
          </span>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">Top Violation Type</span>
          <div className="text-2xl font-bold text-red-500 mb-2 mt-auto">Unfastened Harness</div>
          <p className="text-slate-500 text-sm">Zone C - Assembly</p>
        </div>
        
        <div className="bg-linear-to-br from-[#1a1443] to-[#2c1555] border border-indigo-900 rounded-[2rem] p-6 shadow-lg flex flex-col text-white">
          <span className="text-xs font-bold text-slate-300 tracking-wider mb-4 uppercase">Insurance Risk Score</span>
          <div className="text-5xl font-black mb-2 mt-auto">A-</div>
          <p className="text-slate-300 text-sm">Premium discount eligible</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm flex-1 min-h-0 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center space-x-2 mb-6 text-slate-800">
            <div className="bg-orange-100 p-2 rounded-xl">
               <BarChart3 className="text-orange-600 w-5 h-5" />
            </div>
            <div>
               <h3 className="font-bold text-lg">7-Day Safety Trend Analysis</h3>
               <p className="text-xs text-slate-500">Compliance % vs Raw incidents</p>
            </div>
        </div>
        
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} dy={10} />
              <YAxis yAxisId="left" stroke="#64748b" axisLine={false} tickLine={false} dx={-10} />
              <YAxis yAxisId="right" orientation="right" stroke="#ef4444" axisLine={false} tickLine={false} dx={10} />
              <Tooltip 
                 contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                 itemStyle={{ fontWeight: "bold" }}
              />
              <Line yAxisId="left" type="monotone" dataKey="compliance" stroke="#3b82f6" strokeWidth={4} activeDot={{ r: 8 }} name="Compliance %" />
              <Line yAxisId="right" type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={4} name="Total Violations" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
