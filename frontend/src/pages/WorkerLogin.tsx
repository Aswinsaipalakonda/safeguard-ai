import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, AlertTriangle, ArrowRight, Fingerprint, Loader2 } from "lucide-react";
import useStore from "../store";
import { authAPI } from "../lib/api";

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
      const response = await authAPI.login(employeeId, password);

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
      setError("No active account found with the given credentials.");
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
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans text-white">
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 bg-slate-900/80 border border-slate-700/50 rounded-[1.25rem] flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
            <Fingerprint className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white">WORKER CHECK-IN</h1>
          <p className="text-slate-400 font-mono text-xs mt-3 uppercase tracking-widest px-4 py-1.5 bg-slate-900/50 rounded-full border border-slate-800">
            Manual Entry Contingency
          </p>
        </div>

        <div className="w-full bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl overflow-hidden relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 animate-in fade-in zoom-in-95">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 focus-within:text-indigo-400 text-slate-500 transition-colors">
              <label className="text-[10px] font-black uppercase tracking-widest ml-1">Employee ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-950/50 border-2 border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all text-lg tracking-wider font-mono placeholder:text-slate-700 placeholder:font-sans"
                  placeholder="EMP-XXXX"
                />
              </div>
            </div>

            <div className="space-y-2 focus-within:text-indigo-400 text-slate-500 transition-colors">
              <label className="text-[10px] font-black uppercase tracking-widest ml-1">Passcode</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border-2 border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all text-lg tracking-[0.3em] font-mono placeholder:text-slate-700 placeholder:tracking-normal placeholder:font-sans"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden rounded-2xl bg-indigo-600 p-[2px] transition-all hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:pointer-events-none mt-2 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center bg-indigo-600 px-6 py-4 rounded-[14px] transition-all group-hover:bg-indigo-500">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <span className="flex items-center text-white font-black text-lg uppercase tracking-widest">
                    Access Terminal <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </div>
            </button>

            <div className="pt-6 mt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={fillDemo}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 transition-all group active:scale-[0.98]"
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-300 group-hover:text-white">Use Demo Worker</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 tracking-widest">EMP-001 • 1234</p>
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  Auto-fill
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="absolute bottom-6 font-mono text-slate-600 text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 text-center w-full">
        SafeGuard AI • Kiosk Mode Active
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
