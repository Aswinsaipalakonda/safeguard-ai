import { useState } from "react";
import { Save, Bell, Camera, User, Lock, ShieldAlert } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Settings saved successfully!");
    }, 800);
  };

  return (
    <div className="space-y-6 font-sans">
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
          
          {(activeTab === "cameras" || activeTab === "security") && (
            <div className="flex flex-col items-center justify-center space-y-3 py-10">
               <div className="bg-slate-50 p-4 rounded-full">
                  <ShieldAlert className="w-8 h-8 text-slate-400" />
               </div>
               <h3 className="text-lg font-bold text-slate-700">Administrator Access Required</h3>
               <p className="text-slate-500 text-sm text-center max-w-sm">Contact your sysadmin to modify network camera configs or change security rules.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
