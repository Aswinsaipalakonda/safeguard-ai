import { useState, useEffect } from "react";
import { ShieldAlert, AlertCircle, Camera, CheckCircle2, TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function LiveMonitoring() {
  const [activeViolations, setActiveViolations] = useState<string[]>([]);
  
  const cameras = [
    { id: "cam-assembly-1", name: "Assembly Line 1", active: true, violations: 0 },
    { id: "cam-welding-2", name: "Welding Zone B", active: true, violations: 2 },
    { id: "cam-loading-3", name: "Loading Dock South", active: true, violations: 0 },
  ];

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/live/");
    
    ws.onopen = () => {
      console.log("Connected to Live Monitoring WebSocket");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.camera_id) {
        setActiveViolations([data.camera_id]);
        
        // Auto-clear violation after 3 seconds for demo purposes
        setTimeout(() => {
          setActiveViolations((prev) => prev.filter(id => id !== data.camera_id));
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full font-sans">
      
      {/* Left / Center Main Content */}
      <div className="flex-1 space-y-6">
         {/* Alert Banner */}
         {activeViolations.length > 0 && (
          <div className="bg-[#1a1a2e] text-orange-400 px-6 py-4 rounded-full flex items-center justify-between shadow-lg">
             <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium tracking-wide">
                   We have detected a recent PPE violation. Please check the camera feeds immediately.
                </span>
             </div>
             <button onClick={() => alert("Connecting to live feed...")} className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold tracking-widest hover:bg-slate-200">
                VIEW NOW
             </button>
          </div>
         )}
         
         {/* Top Data Gradients */}
         <div className="flex items-center space-x-4 mb-2">
            <span className="text-xs font-bold text-slate-400 tracking-wider">FACTORY VIEW</span>
            <div className="flex space-x-2">
               <button className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-medium">MANAGEMENT</button>
               <button onClick={() => alert("Switching to Security Experience...")} className="text-slate-500 px-4 py-1.5 rounded-full text-xs font-medium hover:bg-slate-200">SECURITY EXPERIENCE</button>
            </div>
            <div className="ml-auto">
               <button onClick={() => alert("Opening New Report Modal...")} className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-red-600 shadow-md">
                 NEW REPORT ▼
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Gradient Card 1 */}
            <div className="bg-linear-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <span className="text-xs text-slate-400 font-medium tracking-wider">TOTAL VIOLATIONS</span>
                  <button className="bg-white/10 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md">TODAY ▾</button>
               </div>
               
               <div className="text-center my-8">
                  <h1 className="text-5xl font-bold mb-2">124</h1>
                  <span className="text-xs font-mono text-green-400 bg-white/5 px-2 py-1 rounded-full items-center inline-flex">
                     <TrendingDown className="w-3 h-3 mr-1"/> -12.5% 
                  </span>
                  <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-4">VIOLATIONS LOGGED TODAY</p>
               </div>

               <div className="space-y-3 mt-8 text-sm font-medium border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center text-slate-300">
                     <span>Helmet Missing</span> <span>82</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                     <span>Unfastened Vest</span> <span>31</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                     <span>Restricted Area Entry</span> <span>11</span>
                  </div>
               </div>
            </div>

            {/* Primary Gradient Card 2 */}
            <div className="bg-linear-to-br from-[#1a1443] to-[#2c1555] rounded-[2rem] p-6 text-white shadow-xl">
               <div className="flex justify-between items-start mb-6">
                  <span className="text-xs text-slate-400 font-medium tracking-wider">COMPLIANCE RATE</span>
                  <button className="bg-white/10 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md">TODAY ▾</button>
               </div>
               
               <div className="text-center my-8">
                  <h1 className="text-5xl font-bold mb-2">91<span className="text-3xl">%</span></h1>
                  <span className="text-xs font-mono text-green-400 bg-white/5 px-2 py-1 rounded-full items-center inline-flex">
                     <TrendingUp className="w-3 h-3 mr-1"/> +2.3%
                  </span>
                  <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-4">OVERALL SAFETY SCORE</p>
               </div>

               <div className="space-y-3 mt-8 text-sm font-medium border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center text-slate-300">
                     <span>Assembly Line</span> <span>95%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                     <span>Welding Zone</span> <span className="text-red-400">76%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                     <span>Loading Dock</span> <span>99%</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Bottom White Cards (KPIs) */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
               <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <ShieldAlert className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-500 tracking-wider">HIGH RISKS</p>
                  <div className="flex items-end mt-1 space-x-2">
                     <h2 className="text-2xl font-bold">14</h2>
                     <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-md flex items-center mb-1">
                       <TrendingUp className="w-3 h-3 mr-1" /> +8%
                     </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Today vs Last Week</p>
               </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
               <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-500 tracking-wider">RESOLVED</p>
                  <div className="flex items-end mt-1 space-x-2">
                     <h2 className="text-2xl font-bold">110</h2>
                     <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-0.5 rounded-md flex items-center mb-1">
                       <TrendingUp className="w-3 h-3 mr-1" /> +4%
                     </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Today vs Last Week</p>
               </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
               <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-xs font-bold text-slate-500 tracking-wider">CAMERA UPTIME</p>
                  <div className="flex items-end mt-1 space-x-2">
                     <h2 className="text-2xl font-bold">100<span className="text-lg">%</span></h2>
                     <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-0.5 rounded-md flex items-center mb-1">
                       STABLE
                     </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">All sectors operational</p>
               </div>
            </div>
         </div>
      </div>

      {/* Right Side Panel - Notifications / Camera List mimicking "Appointments" */}
      <div className="w-full xl:w-96 bg-white rounded-[2rem] p-6 shadow-md border border-slate-200 flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">Camera Feeds</h3>
            <span onClick={() => alert("Loading full camera grid...")} className="text-xs text-red-500 font-bold uppercase cursor-pointer hover:underline">ALL CAMERAS</span>
         </div>

         {/* Calendar/Date Mock UI */}
         <div className="mb-6 border-b border-slate-100 pb-6">
            <span className="font-medium text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</span>
            <div className="flex justify-between mt-4">
               {['M','T','W','T','F','S','S'].map((day, i) => (
                  <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium ${i===2 ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'text-slate-400'}`}>
                     {day}
                  </div>
               ))}
            </div>
         </div>

         {/* Camera List */}
         <div className="flex-1 space-y-4 overflow-y-auto mb-6">
            {cameras.map(cam => {
               const hasViolation = activeViolations.includes(cam.id);
               return (
                  <div key={cam.id} className={`p-4 rounded-2xl border ${hasViolation ? 'border-red-200 bg-red-50/50' : 'border-slate-100 bg-slate-50'} transition-colors cursor-pointer hover:border-indigo-300`} onClick={() => alert(`Connecting to ${cam.name} stream...`)}>
                     <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700 text-sm">{cam.name}</span>
                        <div className={`w-2 h-2 rounded-full ${hasViolation ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                     </div>
                     <div className="h-24 bg-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                        {hasViolation && <div className="absolute inset-x-0 bottom-0 top-0 border-2 border-red-500 z-10"></div>}
                        <Camera className="text-slate-400 w-8 h-8 opacity-50" />
                     </div>
                  </div>
               )
            })}
         </div>

         {/* Bottom Notification Alert */}
         <div className="mt-auto bg-[#fafafa] p-4 rounded-2xl border border-slate-100 text-center">
             <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">SYSTEM STATUS</p>
             <p className="text-sm font-bold text-slate-800 mb-4">You have <span className="text-red-500">2 unresolved</span> critical incidents today.</p>
             <button onClick={() => alert("Alerts cleared successfully!")} className="w-full bg-[#fa3e5c] text-white py-3 rounded-full font-bold text-sm tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                - CLEAR ALERTS
             </button>
         </div>
      </div>

    </div>
  );
}
