import { useState } from "react";
import { Save, Bell, Camera, User, Lock, ShieldAlert, CheckCircle2, XCircle, RefreshCw, Key, Smartphone } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [twoFA, setTwoFA] = useState(true);
  const [cameras, setCameras] = useState([
    { id: "cam-assembly-1", name: "Assembly Line 1", ip: "192.168.1.101", resolution: "1920x1080", zone: "Assembly Line", status: "online", fps: 30, lastMaintenance: "2025-06-28" },
    { id: "cam-welding-2", name: "Welding Zone B", ip: "192.168.1.102", resolution: "2560x1440", zone: "Welding Zone", status: "online", fps: 25, lastMaintenance: "2025-06-25" },
    { id: "cam-loading-3", name: "Loading Dock South", ip: "192.168.1.103", resolution: "1920x1080", zone: "Loading Dock", status: "online", fps: 30, lastMaintenance: "2025-07-01" },
    { id: "cam-excavation-4", name: "Excavation Area A", ip: "192.168.1.104", resolution: "3840x2160", zone: "Excavation Area", status: "online", fps: 15, lastMaintenance: "2025-06-20" },
    { id: "cam-shaft-5", name: "Underground Shaft B", ip: "192.168.1.105", resolution: "1920x1080", zone: "Underground Shaft", status: "offline", fps: 0, lastMaintenance: "2025-06-15" },
  ]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Settings saved successfully!");
    }, 800);
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-wide mb-1">System Settings</h1>
          <p className="text-slate-500 text-sm">Configure AI thresholds, notifications, and account details.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all ${
            isSaving 
              ? "bg-indigo-300 text-white cursor-not-allowed" 
              : "bg-indigo-600 text-white shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/50"
          }`}
        >
          {isSaving ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
             <Save size={18} />
          )}
          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-4 shrink-0 h-max">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab("general")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'general' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <User size={18} /><span>General</span>
            </button>
            <button 
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Bell size={18} /><span>Notifications</span>
            </button>
            <button 
              onClick={() => setActiveTab("ai")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'ai' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <ShieldAlert size={18} /><span>AI Configuration</span>
            </button>
            <button 
              onClick={() => setActiveTab("cameras")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'cameras' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Camera size={18} /><span>Cameras & Zones</span>
            </button>
            <button 
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Lock size={18} /><span>Security</span>
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8">
          {activeTab === "general" && (
            <div className="space-y-6 max-w-xl">
               <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Profile Information</h3>
               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                    <input type="text" defaultValue="Alan Johnson" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                    <input type="email" defaultValue="alan.j@manufacturingalpha.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                    <input type="text" disabled defaultValue="Head Supervisor" className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed" />
                  </div>
               </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-6 max-w-xl">
               <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">AI Engine Configuration</h3>
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-slate-700">Minimum Confidence Threshold</label>
                        <span className="text-indigo-600 font-bold">{confidenceThreshold}%</span>
                    </div>
                    <input 
                       type="range" 
                       min="50" max="99" 
                       value={confidenceThreshold}
                       onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                       className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    />
                    <p className="text-xs text-slate-500 mt-2">Detections with a confidence score below this threshold will not trigger alerts.</p>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-slate-700 font-medium">Enable Face Verification Integration</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1 ml-8">Automatically cross-reference unknown faces with the worker registry.</p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 max-w-xl">
               <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Alert Preferences</h3>
               <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                     <div>
                        <p className="font-semibold text-slate-800">Push Notifications</p>
                        <p className="text-xs text-slate-500">Receive instantly on this device.</p>
                     </div>
                     <div className={`w-12 h-6 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`} onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                     </div>
                  </label>

                  <label className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                     <div>
                        <p className="font-semibold text-slate-800">Email Summaries</p>
                        <p className="text-xs text-slate-500">Daily digest of violation reports.</p>
                     </div>
                     <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  </label>
               </div>
            </div>
          )}
          
          {activeTab === "cameras" && (
            <div className="space-y-6">
               <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Camera & Zone Management</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-700">{cameras.filter(c => c.status === "online").length}/{cameras.length}</p>
                    <p className="text-xs text-indigo-500 font-medium">Cameras Online</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{new Set(cameras.map(c => c.zone)).size}</p>
                    <p className="text-xs text-emerald-500 font-medium">Zones Monitored</p>
                  </div>
               </div>
               <div className="space-y-3">
                 {cameras.map(cam => (
                   <div key={cam.id} className="border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all">
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center space-x-3">
                         <div className={`w-3 h-3 rounded-full ${cam.status === "online" ? "bg-green-500" : "bg-red-500"}`} />
                         <div>
                           <p className="font-bold text-slate-800">{cam.name}</p>
                           <p className="text-xs text-slate-400">{cam.ip} · {cam.zone}</p>
                         </div>
                       </div>
                       <div className="flex items-center space-x-2">
                         {cam.status === "online" ? (
                           <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1"><CheckCircle2 className="w-3 h-3" /><span>ONLINE</span></span>
                         ) : (
                           <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1"><XCircle className="w-3 h-3" /><span>OFFLINE</span></span>
                         )}
                         <button onClick={() => { setCameras(prev => prev.map(c => c.id === cam.id ? { ...c, status: c.status === "online" ? "offline" : "online", fps: c.status === "online" ? 0 : 30 } : c)); showToast(`${cam.name} ${cam.status === "online" ? "disabled" : "enabled"}`); }} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                           <RefreshCw className="w-4 h-4 text-slate-400" />
                         </button>
                       </div>
                     </div>
                     <div className="grid grid-cols-3 gap-2 text-center">
                       <div className="bg-slate-50 rounded-lg p-2"><p className="text-[10px] text-slate-400 uppercase">Resolution</p><p className="text-xs font-bold text-slate-700">{cam.resolution}</p></div>
                       <div className="bg-slate-50 rounded-lg p-2"><p className="text-[10px] text-slate-400 uppercase">FPS</p><p className="text-xs font-bold text-slate-700">{cam.fps}</p></div>
                       <div className="bg-slate-50 rounded-lg p-2"><p className="text-[10px] text-slate-400 uppercase">Maintained</p><p className="text-xs font-bold text-slate-700">{cam.lastMaintenance}</p></div>
                     </div>
                   </div>
                 ))}
               </div>
               <button onClick={() => showToast("Camera discovery scan initiated...")} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 font-medium hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                 + Add New Camera
               </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 max-w-xl">
               <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Security Settings</h3>
               
               {/* Password Change */}
               <div className="space-y-4">
                 <h4 className="font-semibold text-slate-700 flex items-center space-x-2"><Lock className="w-4 h-4" /><span>Change Password</span></h4>
                 <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
                   <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                   <input type="password" placeholder="Minimum 12 characters" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
                   <input type="password" placeholder="Re-enter new password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                 </div>
                 <button onClick={() => showToast("Password updated successfully!")} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700">Update Password</button>
               </div>

               {/* 2FA */}
               <div className="pt-4 border-t border-slate-100 space-y-4">
                 <h4 className="font-semibold text-slate-700 flex items-center space-x-2"><Smartphone className="w-4 h-4" /><span>Two-Factor Authentication</span></h4>
                 <label className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                   <div>
                     <p className="font-semibold text-slate-800">Enable 2FA</p>
                     <p className="text-xs text-slate-500">Require a code from your authenticator app at login.</p>
                   </div>
                   <div className={`w-12 h-6 rounded-full p-1 transition-colors ${twoFA ? 'bg-indigo-600' : 'bg-slate-300'}`} onClick={() => { setTwoFA(!twoFA); showToast(twoFA ? "2FA disabled" : "2FA enabled"); }}>
                     <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${twoFA ? 'translate-x-6' : 'translate-x-0'}`} />
                   </div>
                 </label>
               </div>

               {/* API Key */}
               <div className="pt-4 border-t border-slate-100 space-y-3">
                 <h4 className="font-semibold text-slate-700 flex items-center space-x-2"><Key className="w-4 h-4" /><span>API Access</span></h4>
                 <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">API Key</p>
                   <div className="flex items-center space-x-2">
                     <code className="text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border flex-1 font-mono">sg-live-k8s7d•••••••••••wq2x</code>
                     <button onClick={() => showToast("API key copied to clipboard!")} className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-200">Copy</button>
                   </div>
                   <p className="text-xs text-slate-400 mt-2">Last used: 2 hours ago · Created: Jun 15, 2025</p>
                 </div>
                 <button onClick={() => showToast("New API key generated!")} className="text-sm text-red-500 font-medium hover:underline">Regenerate API Key</button>
               </div>

               {/* Active Sessions */}
               <div className="pt-4 border-t border-slate-100 space-y-3">
                 <h4 className="font-semibold text-slate-700">Active Sessions</h4>
                 <div className="space-y-2">
                   <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
                     <div><p className="text-sm font-bold text-slate-700">Chrome · Windows 11</p><p className="text-xs text-slate-400">192.168.1.45 · Current session</p></div>
                     <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                     <div><p className="text-sm font-bold text-slate-700">Safari · iPhone 15</p><p className="text-xs text-slate-400">10.0.0.23 · 3 hours ago</p></div>
                     <button onClick={() => showToast("Session revoked!")} className="text-xs text-red-500 font-bold hover:underline">Revoke</button>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
