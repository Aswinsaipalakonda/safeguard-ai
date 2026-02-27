import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Lock, Mail, EyeOff, Eye } from "lucide-react";
import useStore from "../store";
import api from "../lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post(
        "auth/token/",
        {
          username: username,
          password: password,
        },
      );
      if (response.data.access) {
        const token = response.data.access;
        const userRole = response.data.role || 'WORKER';

        login(token, userRole);
        
        if (userRole === 'WORKER') {
          navigate("/kiosk");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#bfe0f8] via-[#e4f1f9] to-[#d3eaf8] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Abstract light lines decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[150vw] h-[150vw] md:w-screen md:h-[100vw] rounded-full border-[1.5px] border-white/40 opacity-50 shadow-[inset_0_0_100px_rgba(255,255,255,0.5)]"></div>
        <div className="absolute w-[200vw] h-[200vw] md:w-[150vw] md:h-[150vw] rounded-full border-[1.5px] border-white/20"></div>
      </div>

      <div className="w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(40,110,180,0.15)] overflow-hidden relative z-10 p-8 sm:p-10 pt-10 border border-white/60 backdrop-blur-sm">
        {/* Soft top inner glow mimicking the image */}
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#dff0fb] to-transparent opacity-80 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Top Floating Box */}
          <div className="bg-white p-4 rounded-[1.2rem] shadow-[0_8px_20px_rgb(0,0,0,0.06)] border border-slate-50 mb-7 transition-transform hover:scale-105">
            <LogIn className="w-7 h-7 text-slate-800" strokeWidth={2.5} />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3 text-center">
            SafeGuard AI
          </h1>
          <p className="text-slate-500 text-[0.95rem] text-center mb-8 px-2 leading-relaxed">
            Enterprise Access Control Gateway. Authenticate to manage security
            protocols.
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            {error && <div className="text-red-500 text-sm text-center mb-2">{error}</div>}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-[1.1rem] w-[1.1rem] text-slate-400 group-focus-within:text-slate-600 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-[#f4f5f7] border-2 border-transparent rounded-[1.1rem] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#dff0fb] focus:ring-4 focus:ring-[#dff0fb]/50 transition-all font-medium text-[0.95rem]"
                placeholder="Email"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[1.1rem] w-[1.1rem] text-slate-400 group-focus-within:text-slate-600 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-12 py-3.5 bg-[#f4f5f7] border-2 border-transparent rounded-[1.1rem] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#dff0fb] focus:ring-4 focus:ring-[#dff0fb]/50 transition-all font-medium text-[0.95rem]"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <Eye className="h-[1.1rem] w-[1.1rem]" />
                ) : (
                  <EyeOff className="h-[1.1rem] w-[1.1rem]" />
                )}
              </button>
            </div>

            <div className="flex justify-end pt-1 pb-3">
              <a
                href="#"
                className="text-[0.9rem] font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-4 px-4 rounded-[1.1rem] text-white font-medium text-[1.05rem] transition-all duration-200 ${
                isLoading
                  ? "bg-slate-700 cursor-not-allowed opacity-90"
                  : "bg-[#18181b] hover:bg-black hover:shadow-[0_8px_20px_rgb(0,0,0,0.2)] active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                "Secure Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
