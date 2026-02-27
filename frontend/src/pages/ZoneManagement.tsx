import { useState, useEffect } from "react";
import {
  MapPin, Plus, Search, Edit3, Trash2, X, Camera,
  AlertTriangle, CheckCircle2, ChevronDown, Eye, Settings,
  Wifi, WifiOff, MoreHorizontal, Loader2
} from "lucide-react";
import { zonesAPI, cameraAPI, type Zone } from "../lib/api";

/* ── Display types ── */
interface ZoneDisplay {
  id: number;
  name: string;
  site: string;
  cameras: string[];
  workers: number;
  risk: "Critical" | "High" | "Medium" | "Low";
  compliance: number;
  requiredPPE: string[];
  active: boolean;
  violations24h: number;
  lastIncident: string;
}

interface CameraDisplay {
  id: string;
  name: string;
  zone: string;
  status: "online" | "offline";
  resolution: string;
  fps: number;
  lastMaintenance: string;
}

const zoneToDisplay = (z: Zone): ZoneDisplay => ({
  id: z.id,
  name: z.name,
  site: z.site ? `Site ${z.site}` : "Unassigned",
  cameras: z.camera_ids || [],
  workers: 0,
  risk: z.is_high_risk ? "High" : "Low",
  compliance: 90,
  requiredPPE: z.required_ppe || [],
  active: true,
  violations24h: 0,
  lastIncident: "N/A",
});

const ALL_PPE = ["Helmet", "Vest", "Boots", "Goggles", "Gloves", "Harness"];

export default function ZoneManagement() {
  const [zones, setZones] = useState<ZoneDisplay[]>([]);
  const [cameras, setCameras] = useState<CameraDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"zones" | "cameras">("zones");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [selectedZone, setSelectedZone] = useState<ZoneDisplay | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState<number | null>(null);

  const [newZone, setNewZone] = useState({ name: "", site: "Manufacturing Plant Alpha", risk: "Low", requiredPPE: ["Helmet", "Vest", "Boots"] });

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  // Fetch zones and cameras from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [zonesRes, camerasRes] = await Promise.all([
          zonesAPI.list({ page_size: 50 }),
          cameraAPI.list().catch(() => ({ data: { results: [] } })),
        ]);
        const zoneDisplays = zonesRes.data.results.map(zoneToDisplay);
        setZones(zoneDisplays);

        // Map cameras if available
        const camData = Array.isArray(camerasRes.data) ? camerasRes.data : (camerasRes.data as any).results || [];
        const camDisplays: CameraDisplay[] = camData.map((c: any) => ({
          id: c.camera_id || c.id,
          name: c.name || c.camera_id || c.id,
          zone: c.zone || "Unknown",
          status: c.status === "active" || c.is_active ? "online" as const : "offline" as const,
          resolution: c.resolution || "1080p",
          fps: c.fps || 30,
          lastMaintenance: c.last_maintenance || "Unknown",
        }));
        setCameras(camDisplays);
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredZones = zones.filter(z => {
    const matchSearch = z.name.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "ALL" || z.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  const filteredCameras = cameras.filter(c => c.zone.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddZone = async () => {
    if (!newZone.name) return;
    try {
      const res = await zonesAPI.create({
        name: newZone.name,
        required_ppe: newZone.requiredPPE,
        is_high_risk: newZone.risk === "High" || newZone.risk === "Critical",
      });
      const display = zoneToDisplay(res.data);
      display.site = newZone.site;
      display.risk = newZone.risk as any;
      setZones(prev => [display, ...prev]);
      setShowAddModal(false);
      setNewZone({ name: "", site: "Manufacturing Plant Alpha", risk: "Low", requiredPPE: ["Helmet", "Vest", "Boots"] });
      showToast(`Zone "${display.name}" created`);
    } catch {
      const zone: ZoneDisplay = {
        id: Date.now(), name: newZone.name, site: newZone.site, cameras: [],
        workers: 0, risk: newZone.risk as any, compliance: 100, requiredPPE: newZone.requiredPPE,
        active: true, violations24h: 0, lastIncident: "Never",
      };
      setZones(prev => [zone, ...prev]);
      setShowAddModal(false);
      setNewZone({ name: "", site: "Manufacturing Plant Alpha", risk: "Low", requiredPPE: ["Helmet", "Vest", "Boots"] });
      showToast(`Zone "${zone.name}" created (offline)`);
    }
  };

  const handleToggleZone = (id: number) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, active: !z.active } : z));
    setShowDropdown(null);
    showToast("Zone status updated");
  };

  const handleDeleteZone = async (id: number) => {
    try { await zonesAPI.delete(id); } catch { /* remove locally */ }
    setZones(prev => prev.filter(z => z.id !== id));
    setShowDropdown(null);
    showToast("Zone removed");
  };

  const riskColor = (risk: string) => {
    if (risk === "Critical") return "bg-red-500";
    if (risk === "High") return "bg-orange-500";
    if (risk === "Medium") return "bg-amber-500";
    return "bg-green-500";
  };

  const riskBadge = (risk: string) => {
    if (risk === "Critical") return "bg-red-100 text-red-700";
    if (risk === "High") return "bg-orange-100 text-orange-700";
    if (risk === "Medium") return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  };

  const zoneCounts = { total: zones.length, active: zones.filter(z => z.active).length, critical: zones.filter(z => z.risk === "Critical").length, cameras: cameras.length, online: cameras.filter(c => c.status === "online").length };

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
          <h1 className="text-2xl font-bold text-slate-800">Zone & Camera Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure safety zones, PPE rules, and camera assignments</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#18181b] text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md">
            <Plus className="w-4 h-4" />Add Zone
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Zones", value: zoneCounts.total, icon: <MapPin className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-50" },
          { label: "Active Zones", value: zoneCounts.active, icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, bg: "bg-green-50" },
          { label: "Critical Zones", value: zoneCounts.critical, icon: <AlertTriangle className="w-5 h-5 text-red-500" />, bg: "bg-red-50" },
          { label: "Total Cameras", value: zoneCounts.cameras, icon: <Camera className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
          { label: "Cameras Online", value: zoneCounts.online, icon: <Wifi className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50" },
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

      {/* Tab Toggle + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          <button onClick={() => setTab("zones")} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${tab === "zones" ? "bg-[#18181b] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>
            <MapPin className="w-3.5 h-3.5 inline mr-1.5" />Zones
          </button>
          <button onClick={() => setTab("cameras")} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${tab === "cameras" ? "bg-[#18181b] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>
            <Camera className="w-3.5 h-3.5 inline mr-1.5" />Cameras
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === "zones" ? "Search zones..." : "Search cameras..."} className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all" />
        </div>
        {tab === "zones" && (
          <div className="relative">
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-xl px-4 pr-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
              <option value="ALL">All Risk Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* ZONES TAB */}
      {tab === "zones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredZones.map(zone => (
            <div key={zone.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer relative group ${!zone.active ? "opacity-60" : ""}`} onClick={() => setSelectedZone(zone)}>
              {!zone.active && <div className="absolute top-4 left-4 text-[9px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">INACTIVE</div>}
              
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-8 rounded-full ${riskColor(zone.risk)}`} />
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{zone.name}</h3>
                    <p className="text-[10px] text-slate-400">{zone.site}</p>
                  </div>
                </div>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowDropdown(showDropdown === zone.id ? null : zone.id)} className="p-1.5 rounded-lg hover:bg-slate-100"><MoreHorizontal className="w-4 h-4 text-slate-400" /></button>
                  {showDropdown === zone.id && (
                    <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-slate-200 py-2 w-40 z-30">
                      <button onClick={() => { setSelectedZone(zone); setShowDropdown(null); }} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Eye className="w-3.5 h-3.5" />Details</button>
                      <button onClick={() => showToast(`Editing ${zone.name}...`)} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Edit3 className="w-3.5 h-3.5" />Edit Zone</button>
                      <button onClick={() => handleToggleZone(zone.id)} className="w-full text-left px-4 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-2"><Settings className="w-3.5 h-3.5" />{zone.active ? "Deactivate" : "Activate"}</button>
                      <hr className="my-1 border-slate-100" />
                      <button onClick={() => handleDeleteZone(zone.id)} className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-800 tabular-nums">{zone.compliance}%</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Compliance</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-800 tabular-nums">{zone.workers}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Workers</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-800 tabular-nums">{zone.violations24h}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">24h Alerts</p>
                </div>
              </div>

              {/* PPE Tags + Risk Badge */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {zone.requiredPPE.slice(0, 3).map(p => (
                    <span key={p} className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{p}</span>
                  ))}
                  {zone.requiredPPE.length > 3 && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">+{zone.requiredPPE.length - 3}</span>}
                </div>
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${riskBadge(zone.risk)}`}>{zone.risk.toUpperCase()}</span>
              </div>

              {/* Cameras Row */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500">{zone.cameras.length} cameras · Last incident: {zone.lastIncident}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CAMERAS TAB */}
      {tab === "cameras" && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-6 py-4">CAMERA</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-4">ZONE</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-4">STATUS</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-4 hidden md:table-cell">RESOLUTION</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-4 hidden md:table-cell">FPS</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase px-4 py-4 hidden lg:table-cell">LAST MAINTENANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCameras.map(cam => (
                  <tr key={cam.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => showToast(`Viewing ${cam.name} stream...`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cam.status === "online" ? "bg-green-50" : "bg-red-50"}`}>
                          <Camera className={`w-4 h-4 ${cam.status === "online" ? "text-green-600" : "text-red-500"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{cam.name}</p>
                          <p className="text-[10px] text-slate-400">{cam.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><span className="text-xs text-slate-600 font-medium">{cam.zone}</span></td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${cam.status === "online" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {cam.status === "online" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {cam.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell"><span className="text-xs text-slate-600">{cam.resolution}</span></td>
                    <td className="px-4 py-4 hidden md:table-cell"><span className="text-xs text-slate-600 tabular-nums">{cam.fps}</span></td>
                    <td className="px-4 py-4 hidden lg:table-cell"><span className="text-xs text-slate-500">{cam.lastMaintenance}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Zone Detail Modal */}
      {selectedZone && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedZone(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full p-8 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedZone(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-4 h-12 rounded-full ${riskColor(selectedZone.risk)}`} />
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedZone.name}</h2>
                <p className="text-sm text-slate-500">{selectedZone.site}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ml-auto ${riskBadge(selectedZone.risk)}`}>{selectedZone.risk.toUpperCase()} RISK</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{selectedZone.compliance}%</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Compliance</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{selectedZone.workers}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Workers</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{selectedZone.cameras.length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Cameras</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{selectedZone.violations24h}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">24h Violations</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">Required PPE</h3>
              <div className="flex flex-wrap gap-2">
                {selectedZone.requiredPPE.map(ppe => (
                  <span key={ppe} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-bold">{ppe}</span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">Assigned Cameras</h3>
              <div className="space-y-2">
                {cameras.filter(c => selectedZone.cameras.includes(c.id)).map(cam => (
                  <div key={cam.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${cam.status === "online" ? "bg-green-500" : "bg-red-500"}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{cam.name}</p>
                        <p className="text-[10px] text-slate-400">{cam.id} · {cam.resolution} · {cam.fps} FPS</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold ${cam.status === "online" ? "text-green-600" : "text-red-500"}`}>{cam.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { handleToggleZone(selectedZone.id); setSelectedZone(null); }} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${selectedZone.active ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-green-500 text-white hover:bg-green-600"}`}>
                {selectedZone.active ? "Deactivate Zone" : "Activate Zone"}
              </button>
              <button onClick={() => { showToast("Zone configuration saved"); setSelectedZone(null); }} className="flex-1 bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Zone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><MapPin className="w-6 h-6 text-indigo-500" />Add New Zone</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1.5 block">Zone Name *</label>
                <input value={newZone.name} onChange={e => setNewZone({ ...newZone, name: e.target.value })} placeholder="e.g., Conveyor Belt Section D" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1.5 block">Site</label>
                  <select value={newZone.site} onChange={e => setNewZone({ ...newZone, site: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
                    <option>Manufacturing Plant Alpha</option>
                    <option>Mining Site Beta</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1.5 block">Risk Level</label>
                  <select value={newZone.risk} onChange={e => setNewZone({ ...newZone, risk: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1.5 block">Required PPE</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PPE.map(ppe => (
                    <button key={ppe} type="button" onClick={() => setNewZone(prev => ({ ...prev, requiredPPE: prev.requiredPPE.includes(ppe) ? prev.requiredPPE.filter(p => p !== ppe) : [...prev.requiredPPE, ppe] }))} className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${newZone.requiredPPE.includes(ppe) ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"}`}>
                      {ppe}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleAddZone} className="flex-1 py-3 bg-[#18181b] text-white rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-md">Create Zone</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
