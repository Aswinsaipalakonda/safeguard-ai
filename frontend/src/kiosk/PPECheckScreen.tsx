import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, Scan, CheckCircle2, AlertTriangle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useStore from "../store";
import { kioskAPI } from "../lib/api";
import { motion } from "framer-motion";

const translations = {
  en: {
    scanning: "ANALYZING SAFETY GEAR",
    accessGranted: "ATTENDANCE MARKED SUCCESSFULLY",
    accessDenied: "GEAR CHECK FAILED",
    voiceScanning: "Please stand still while we verify your safety equipment.",
    voiceGranted: "Safety gear verified. Attendance marked successfully. You may proceed.",
    voiceDenied: "Safety violation detected. Please wear the required equipment.",
    retryText: "FIX GEAR & RETRY",
    nextText: "PROCEED TO WORK",
    logoutText: "COMPLETE & LOG OUT",
  },
  hi: {
    scanning: "सुरक्षा गियर का विश्लेषण",
    accessGranted: "उपस्थिति सफलतापूर्वक दर्ज की गई",
    accessDenied: "उपकरण चेक विफल",
    voiceScanning: "कृपया शांत खड़े रहें, हम आपके उपकरणों की जाँच कर रहे हैं।",
    voiceGranted: "उपकरण सत्यापित। उपस्थिति दर्ज की गई। आप प्रवेश कर सकते हैं।",
    voiceDenied: "सुरक्षा उपकरण की कमी पाई गई। कृपया उपकरण पहनें।",
    retryText: "उपकरण ठीक करें",
    nextText: "काम शुरू करें",
    logoutText: "लॉग आउट करें",
  }
};

const DEMO_BOXES = [
  { id: 1, label: "WORKER", cls: "person", rx: 0.15, ry: 0.1, rw: 0.7, rh: 0.8, color: "#4f46e5" }, 
  { id: 2, label: "HELMET", cls: "helmet", rx: 0.35, ry: 0.1, rw: 0.3, rh: 0.2, color: "#10b981" },
  { id: 3, label: "VEST", cls: "vest", rx: 0.25, ry: 0.35, rw: 0.5, rh: 0.35, color: "#10b981" },
  { id: 4, label: "GOGGLES", cls: "goggles", rx: 0.40, ry: 0.22, rw: 0.2, rh: 0.08, color: "#ef4444" },
];

export default function PPECheckScreen() {
  const [phase, setPhase] = useState<"scanning" | "result" | "success">("scanning");
  const [approved, setApproved] = useState<boolean | null>(null);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const navigate = useNavigate();
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);
  const logout = useStore((state) => state.logout);
  const text = translations[language];

  const handleLogout = () => {
    logout();
    navigate("/worker-login");
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrame = useRef(0);
  const scanStart = useRef(Date.now());

  const speak = useCallback((message: string) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(message);
      u.lang = language === "hi" ? "hi-IN" : "en-US";
      u.rate = 0.9; u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch (e) { console.warn("TTS", e); }
  }, [language]);

  /* Start Camera */
  useEffect(() => {
    let active = true;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; }
      } catch { console.warn("Camera unavailable"); }
    };
    initCamera();
    
    return () => { 
        active = false;
        streamRef.current?.getTracks().forEach(t => t.stop()); 
    };
  }, []);

  /* Draw Box Overlay */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!videoRef.current || videoRef.current.readyState < 2) {
        ctx.fillStyle = "#0A0D14";
        ctx.fillRect(0, 0, w, h);
      }

      const t = (Date.now() - scanStart.current) / 1000;

      if (phase === "scanning" || phase === "result") {
        DEMO_BOXES.forEach((det) => {
          const drift = Math.sin(t * 2 + det.id) * 4;
          const bx = det.rx * w + drift;
          const by = det.ry * h + Math.cos(t * 1.5 + det.id) * 3;
          const bw = det.rw * w;
          const bh = det.rh * h;

          ctx.lineWidth = 2.5;
          ctx.strokeStyle = det.color;
          ctx.setLineDash(det.cls === "person" ? [8, 4] : []);
          
          if (phase === "result" && !approved && det.color === "#ef4444") {
             ctx.shadowColor = "#ef4444";
             ctx.shadowBlur = 20 + Math.sin(t * 10) * 10;
          } else {
             ctx.shadowColor = det.color;
             ctx.shadowBlur = 10;
          }

          ctx.strokeRect(bx, by, bw, bh);
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          ctx.fillStyle = det.color;
          ctx.font = `bold 12px monospace`;
          ctx.fillRect(bx, by - 20, ctx.measureText(det.label).width + 12, 20);
          
          ctx.fillStyle = "#ffffff";
          ctx.fillText(det.label, bx + 6, by - 5);
        });
      }

      // Scanning Laser
      if (phase === "scanning") {
          const scanY = (t * 80) % h;
          ctx.fillStyle = "rgba(79, 70, 229, 0.15)";
          ctx.fillRect(0, 0, w, scanY);
          ctx.fillStyle = "rgba(79, 70, 229, 0.8)";
          ctx.shadowColor = "#818cf8";
          ctx.shadowBlur = 20;
          ctx.fillRect(0, scanY, w, 2);
          ctx.shadowBlur = 0;
      }

      animFrame.current = requestAnimationFrame(draw);
    };

    animFrame.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame.current);
  }, [phase, approved]);

  /* Scanning Logic */
  useEffect(() => {
    speak(text.voiceScanning);
    const timer = setTimeout(async () => {
      let pass = true;
      let missing: string[] = [];
      try {
        const res = await kioskAPI.verifyPPE("placeholder_image");
        pass = res.data.approved;
        missing = res.data.missing;
      } catch {
        // Fallback demo: Mostly pass
        pass = Math.random() > 0.3;
        missing = pass ? [] : ["goggles"];
      }

      setApproved(pass);
      setMissingItems(missing);
      setPhase("result");
      speak(pass ? text.voiceGranted : text.voiceDenied);

      if (pass) {
        setTimeout(() => setPhase("success"), 2500);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [speak, text]);

  // Removed auto-navigation useEffect here so the user can see the success state


  return (
    <div className="min-h-screen w-full bg-[#05050A] flex flex-col relative overflow-hidden font-sans text-white">
      
      {/* Top Navigation */}
      <div className="w-full p-6 flex justify-between items-start z-50">
        <div className="flex bg-[#121520] rounded-xl border border-white/5 p-1">
          <button 
            onClick={() => { setLanguage('en'); }} 
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${language === 'en' ? 'bg-[#4F46E5] text-white' : 'text-slate-400 hover:text-white'}`}
          >
             ENGLISH
          </button>
          <button 
            onClick={() => { setLanguage('hi'); }} 
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${language === 'hi' ? 'bg-[#4F46E5] text-white' : 'text-slate-400 hover:text-white'}`}
          >
             हिंदी
          </button>
        </div>
        
        <div className="flex gap-4">
           <div className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider border text-slate-300 transition-colors ${phase === 'scanning' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : approved === false ? 'bg-red-500/10 border-red-500/30 text-red-400' : approved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#0F172A] border-white/5'}`}>
             {phase === 'scanning' ? 'SCANNING GEAR' : approved ? 'ALL CLEAR' : 'VIOLATION DETECTED'}
           </div>
           <div className="px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[#0F172A] border-white/5 text-slate-300 flex items-center gap-2">
             <Volume2 className="w-4 h-4 text-slate-400" /> AUDIO ON
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-16 z-10 w-full overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-white mb-10 drop-shadow-lg">
          PPE VERIFICATION
        </h1>

        {/* Camera Feed */}
        <div className="relative w-[600px] max-w-[90vw] aspect-[4/3] bg-[#0A0D14] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center justify-center transition-all duration-700">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-1000 ${phase === 'success' ? 'opacity-20 blur-sm flex-none' : 'opacity-100'}`} 
          />
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={600} 
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ${phase === 'success' ? 'opacity-0 hidden' : 'opacity-100'}`} 
          />

          {/* Centered Results Overlays inside the frame */}
          {phase === "result" && !approved && (
            <div className="absolute inset-x-8 bottom-8 bg-red-950/90 backdrop-blur-xl border border-red-500/50 p-6 rounded-2xl flex items-center shadow-[0_0_40px_rgba(220,38,38,0.3)] gap-4 animate-in slide-in-from-bottom-5">
              <AlertTriangle className="w-10 h-10 text-red-400 shrink-0" />
              <div>
                <p className="text-red-100 font-black text-xl tracking-widest uppercase">{text.accessDenied}</p>
                <p className="text-red-400 font-bold tracking-widest text-xs mt-1">MISSING: {missingItems.join(", ").toUpperCase()}</p>
              </div>
            </div>
          )}

          {/* Success Overlay replacing camera entirely inside the frame */}
          {phase === "success" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-50 bg-[#05050A]/90 backdrop-blur-xl flex flex-col items-center justify-center"
            >
              <div className="relative flex items-center justify-center mb-10">
                {/* Expanding pulse rings */}
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [1, 1.5, 2], opacity: [1, 0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  className="absolute w-32 h-32 rounded-full border border-emerald-500/50"
                />
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [1, 1.5, 2], opacity: [1, 0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                  className="absolute w-32 h-32 rounded-full border border-emerald-500/50"
                />
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [1, 1.5, 2], opacity: [1, 0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                  className="absolute w-32 h-32 rounded-full border border-emerald-500/50"
                />
                
                {/* Main Success Circle */}
                <motion.div
                  initial={{ scale: 0, boxShadow: "0px 0px 0px rgba(52,211,153,0)" }}
                  animate={{ scale: 1, boxShadow: "0px 0px 80px rgba(52,211,153,0.5)" }}
                  transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                  className="w-32 h-32 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center z-10"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-50" strokeWidth={3} />
                  </motion.div>
                </motion.div>
              </div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-2xl md:text-3xl font-black uppercase tracking-widest text-emerald-400 mt-2 text-center drop-shadow-lg"
              >
                 {text.accessGranted}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-4 text-emerald-100/70 text-sm font-bold tracking-[0.2em]"
              >
                {text.nextText}
              </motion.p>
            </motion.div>
          )}
        </div>

        {/* Action Button Section directly below frame */}
        <div className="mt-8 w-[600px] max-w-[90vw]">
          {phase === "scanning" && (
            <div className="w-full px-8 py-4 bg-[#0F172A] border border-white/5 rounded-2xl flex justify-center items-center gap-4 group">
               <Scan className="w-5 h-5 text-indigo-400 animate-pulse" />
               <span className="text-sm font-bold tracking-widest uppercase text-slate-200">
                 {text.scanning}
               </span>
            </div>
          )}
          {phase === "result" && !approved && (
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-8 py-4 bg-[#0F172A] hover:bg-red-950/40 border border-white/5 hover:border-red-500/30 rounded-2xl flex justify-center items-center gap-4 group transition-colors active:scale-95"
            >
               <AlertTriangle className="w-5 h-5 text-red-400 group-hover:text-red-300" />
               <span className="text-sm font-bold tracking-widest uppercase text-red-400 group-hover:text-red-300">
                 {text.retryText}
               </span>
            </button>
          )}
          {phase === "success" && (
            <button 
              onClick={handleLogout}
              className="w-full px-8 py-4 bg-[#0F172A] border border-emerald-500/20 hover:bg-emerald-950/40 hover:border-emerald-500/40 rounded-2xl flex justify-center items-center gap-4 group transition-colors active:scale-95 cursor-pointer"
            >
               <LogOut className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300" />
               <span className="text-sm font-bold tracking-widest uppercase text-emerald-400 group-hover:text-emerald-300">
                 {text.logoutText}
               </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
