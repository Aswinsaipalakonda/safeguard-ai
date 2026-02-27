import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircle, Lock, ShieldAlert, ArrowRight, ScanFace, CheckCircle2, Factory } from "lucide-react";
import useStore from "../store";
import api from "../lib/api";

export default function WorkerLogin() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("auth/token/", {
        username: employeeId,
        password: password,
      });

      if (response.data.access) {
        const token = response.data.access;
        const userRole = response.data.role || 'WORKER';
        
        if (userRole !== 'WORKER') {
          setError("Access Denied. Only authorized personnel can use this terminal.");
          setIsLoading(false);
          return;
        }

        login(token, userRole);
        navigate("/kiosk");
      }
    } catch {
      // Fallback: allow demo login without backend
      if (employeeId === "EMP-001" && password === "1234") {
        login("demo-jwt-token-worker-2025", "WORKER");
        navigate("/kiosk");
        return;
      }
      setError("No active account found with the given credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    setEmployeeId("EMP-001");
    setPassword("1234");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans relative overflow-hidden text-white">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>

      <div className="w-full max-w-5xl z-10 flex flex-col md:flex-row bg-slate-900/60 backdrop-blur-2xl rounded-[3rem] border border-slate-800/80 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Left Side Branding */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-linear-to-b from-indigo-900/50 to-slate-900 p-12 border-r border-slate-800/50 relative overflow-hidden">
           <div className="absolute inset-0 bg-linear-to-br from-indigo-600/20 to-transparent pointer-events-none"></div>
           <div className="relative z-10">
              <div className="bg-white/10 w-max p-3 rounded-2xl mb-8 backdrop-blur-md border border-white/5">
                 <Factory className="w-10 h-10 text-indigo-400" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-wide mb-6">
                SafeGuard AI<br/>
                <span className="text-indigo-400 font-serif italic font-medium">Terminal</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xs leading-relaxed">
                 Automated safety enforcement and identity verification.
              </p>
           </div>
           
           <div className="relative z-10 space-y-4">
              <div className="flex items-center text-slate-300 text-sm font-medium bg-slate-950/40 p-3 rounded-xl border border-white/5">
                 <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-3" />
                 Face ID Integration Active
              </div>
              <div className="flex items-center text-slate-300 text-sm font-medium bg-slate-950/40 p-3 rounded-xl border border-white/5">
                 <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-3" />
                 Real-time PPE Scanning
              </div>
           </div>
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-indigo-500/10 p-5 rounded-full mb-4 ring-1 ring-indigo-500/20 md:hidden">
               <ScanFace className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-black tracking-widest uppercase mb-2">Worker Entry</h2>
            <p className="text-slate-400 font-medium">Enter your credentials to begin your shift.</p>
          </div>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 text-sm flex items-center shadow-lg animate-in fade-in slide-in-from-top-2">
               <ShieldAlert className="w-5 h-5 mr-3 shrink-0" />
               <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div className="space-y-2 group">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 group-focus-within:text-indigo-400 transition-colors">Employee ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <UserCircle className="h-6 w-6 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-950/80 border-2 border-slate-800 text-white rounded-2xl py-4 pl-14 pr-4 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all text-lg tracking-wider"
                  placeholder="EMP-XXXX"
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 group-focus-within:text-indigo-400 transition-colors">Passcode</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-6 w-6 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border-2 border-slate-800 text-white rounded-2xl py-4 pl-14 pr-4 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all text-lg tracking-[0.3em]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-4 px-6 rounded-2xl text-white font-black text-lg sm:text-xl uppercase tracking-widest transition-all mt-4 ${
                isLoading
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-[0_10px_40px_rgba(79,70,229,0.3)] hover:shadow-[0_10px_60px_rgba(79,70,229,0.5)] hover:-translate-y-1 active:translate-y-0"
              }`}
            >
              {isLoading ? "Verifying..." : (
                <span className="flex items-center">
                  START SCANNING <ArrowRight className="ml-3 w-6 h-6" />
                </span>
              )}
            </button>
            
            {/* Demo Credential Hint */}
            <div className="mt-8 pt-6 border-t border-slate-800/50">
               <button 
                  type="button" 
                  onClick={fillDemo} 
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50 transition-all group cursor-pointer"
               >
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Use Demo Worker Account</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">EMP-001 · 1234</p>
                  </div>
                  <span className="text-[10px] font-black tracking-wider bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                    Auto-Fill
                  </span>
               </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="absolute bottom-6 font-mono text-slate-600 text-[10px] font-bold tracking-[0.3em] uppercase opacity-50">
        SafeGuard AI • Node 04
      </div>
    </div>
  );
}
