import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DownloadCloud, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";
import useStore from "../store";

interface Violation {
  id: string;
  time: string;
  worker: string;
  zone: string;
  ppe: string;
  confidence: string;
  status: string;
}

export default function ViolationsLog() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const token = useStore((state) => state.token);

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const response = await api.get("violations/");
        const data = response.data.violations || response.data;
        const mappedData = data.map((v: any) => ({
          id: `V-${v.id}`,
          time: new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          worker: v.worker || "Unknown",
          zone: v.zone,
          ppe: v.ppe_type,
          confidence: `${(v.confidence * 100).toFixed(0)}%`,
          status: v.resolved_at ? "Resolved" : "Active"
        }));
        setViolations(mappedData);
      } catch (error) {
        console.error("Failed to fetch violations:", error);
      }
    };

    fetchViolations();
  }, [token]);
  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-wide mb-1">Violations Registry</h1>
          <p className="text-slate-500 text-sm">Review and resolve safety incidents in real-time.</p>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
            <button onClick={() => alert("Opening filter preferences...")} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
              <Filter size={16} />
              <span>Filter</span>
            </button>
            <button onClick={() => alert("Downloading Violations CSV...")} className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-[#fa3e5c] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors">
              <DownloadCloud size={16} />
              <span>Export CSV</span>
            </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto p-4">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider rounded-tl-xl py-4">ID</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Time</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Zone</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider py-4">Missing PPE</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider text-right py-4">Confidence</TableHead>
                <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider text-right rounded-tr-xl py-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.map((v) => (
                <TableRow key={v.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                  <TableCell className="font-medium text-slate-800 py-4">{v.id}</TableCell>
                  <TableCell className="text-slate-500 py-4">{v.time}</TableCell>
                  <TableCell className="text-slate-600 py-4">{v.zone}</TableCell>
                  <TableCell className="text-red-500 font-medium py-4">{v.ppe}</TableCell>
                  <TableCell className="text-right text-slate-500 py-4">{v.confidence}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
