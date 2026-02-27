import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, ShieldCheck, AlertTriangle, Clock, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useStore from "../store";

/* ── Translations ── */
const translations = {
  en: {
    scanning: "SCANNING SAFETY GEAR",
    accessGranted: "ALL CLEAR — PROCEED TO WORK",
    accessDenied: "GEAR CHECK FAILED",
    voiceScanning: "Please stand still while we verify your safety equipment.",
    voiceGranted: "Safety gear verified. You may enter the zone safely.",
    voiceDenied: "Safety violation detected. Please wear the required protective equipment and retry.",
    retryText: "FIX GEAR & RETRY",
    nextText: "PROCEED TO WORK",
    checkinConfirm: "CHECK-IN CONFIRMED",
    worker: "Worker",
    zone: "Assigned Zone",
    shift: "Shift",
    time: "Check-in Time",
  },
  hi: {
    scanning: "सुरक्षा गियर स्कैनिंग",
    accessGranted: "प्रवेश स्वीकृत — काम शुरू करें",
    accessDenied: "उपकरण चेक विफल",
    voiceScanning: "कृपया शांत खड़े रहें, हम आपके सुरक्षा उपकरणों की जाँच कर रहे हैं।",
    voiceGranted: "सुरक्षा उपकरण सत्यापित। आप सुरक्षित रूप से प्रवेश कर सकते हैं।",
    voiceDenied: "सुरक्षा उपकरण की कमी पाई गई। कृपया आवश्यक सुरक्षा उपकरण पहनें और पुनः प्रयास करें।",
    retryText: "उपकरण ठीक करें",
    nextText: "काम शुरू करें",
    checkinConfirm: "चेक-इन पुष्टि",
    worker: "कर्मचारी",
    zone: "ज़ोन",
    shift: "शिफ्ट",
    time: "चेक-इन समय",
  }
};

/* ── Mock detection bounding boxes ── */
const MOCK_DETECTIONS = [
  { id: 1, label: "WORKER_042", cls: "person", x: 0.12, y: 0.08, w: 0.35, h: 0.84, color: "#00FFFF", conf: 0.97 },
  { id: 2, label: "HELMET", cls: "helmet", x: 0.15, y: 0.08, w: 0.12, h: 0.14, color: "#00FF00", conf: 0.95 },
  { id: 3, label: "SAFETY VEST", cls: "vest", x: 0.13, y: 0.28, w: 0.33, h: 0.30, color: "#00FF00", conf: 0.92 },
  { id: 4, label: "BOOTS", cls: "boots", x: 0.14, y: 0.72, w: 0.18, h: 0.18, color: "#00FF00", conf: 0.89 },
  { id: 5, label: "WORKER_089", cls: "person", x: 0.55, y: 0.12, w: 0.35, h: 0.80, color: "#00FFFF", conf: 0.96 },
  { id: 6, label: "NO HELMET", cls: "no_helmet", x: 0.58, y: 0.12, w: 0.12, h: 0.14, color: "#FF0000", conf: 0.91 },
  { id: 7, label: "SAFETY VEST", cls: "vest", x: 0.56, y: 0.32, w: 0.33, h: 0.28, color: "#00FF00", conf: 0.88 },
  { id: 8, label: "GOGGLES", cls: "goggles", x: 0.60, y: 0.17, w: 0.08, h: 0.06, color: "#00FF00", conf: 0.86 },
];

/* ── PPE breakdown items ── */
const PPE_ITEMS = [
  { label: "Hard Hat", key: "helmet", base: 82 },
  { label: "Safety Vest", key: "vest", base: 96 },
  { label: "Gloves", key: "gloves", base: 78 },
  { label: "Boots", key: "boots", base: 91 },
  { label: "Eye Protection", key: "goggles", base: 75 },
];

export default function PPECheckScreen() {
  const [phase, setPhase] = useState<"scanning" | "result" | "checkin">("scanning");
  const [approved, setApproved] = useState<boolean | null>(null);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [ppeRates, setPpeRates] = useState(PPE_ITEMS.map(i => ({ ...i, rate: 0 })));
  const [scanLine, setScanLine] = useState(0);
  const [checkinCountdown, setCheckinCountdown] = useState(5);
  const navigate = useNavigate();
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);
  const text = translations[language];

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

  /* ── Start camera ── */
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 1280, height: 720 } });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; }
      } catch { console.warn("Camera unavailable — using placeholder"); }
    })();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  /* ── Animate bounding boxes on canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw video frame
      if (videoRef.current && videoRef.current.readyState >= 2) {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, w, h);
        ctx.restore();
      } else {
        // Placeholder dark background
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, w, h);
        // Grid pattern
        ctx.strokeStyle = "rgba(100,100,100,0.1)";
        for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
        for (let i = 0; i < h; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
      }

      // Dark overlay
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, w, h);

      const t = (Date.now() - scanStart.current) / 1000;

      if (phase === "scanning" || phase === "result") {
        // Draw bounding boxes with animation
        MOCK_DETECTIONS.forEach((det) => {
          const drift = Math.sin(t * 0.8 + det.id) * 4;
          const bx = det.x * w + drift;
          const by = det.y * h + Math.cos(t * 0.6 + det.id) * 3;
          const bw = det.w * w;
          const bh = det.h * h;

          // Pulsing glow for violations
          if (det.color === "#FF0000") {
            const pulse = 0.3 + Math.sin(t * 4) * 0.2;
            ctx.shadowColor = "#FF0000";
            ctx.shadowBlur = 20 + Math.sin(t * 3) * 10;
            ctx.strokeStyle = `rgba(255,0,0,${pulse + 0.5})`;
          } else {
            ctx.shadowColor = det.color;
            ctx.shadowBlur = 8;
            ctx.strokeStyle = det.color;
          }

          ctx.lineWidth = det.cls === "person" ? 2 : 2.5;
          ctx.setLineDash(det.cls === "person" ? [6, 4] : []);

          // Draw rounded rect
          const r = 4;
          ctx.beginPath();
          ctx.moveTo(bx + r, by);
          ctx.lineTo(bx + bw - r, by);
          ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
          ctx.lineTo(bx + bw, by + bh - r);
          ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
          ctx.lineTo(bx + r, by + bh);
          ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
          ctx.lineTo(bx, by + r);
          ctx.quadraticCurveTo(bx, by, bx + r, by);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // Label background
          const labelText = `${det.label} ${(det.conf * 100).toFixed(0)}%`;
          ctx.font = `bold ${Math.max(11, w * 0.018)}px monospace`;
          const tw = ctx.measureText(labelText).width + 12;
          const lh = Math.max(18, w * 0.028);

          ctx.fillStyle = det.color === "#FF0000" ? "rgba(220,38,38,0.85)" : det.color === "#00FFFF" ? "rgba(8,145,178,0.8)" : "rgba(22,163,74,0.85)";
          ctx.beginPath();
          ctx.roundRect(bx, by - lh - 4, tw, lh, 3);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(labelText, bx + 6, by - 8);
        });
      }

      // Scan line animation
      if (phase === "scanning") {
        const scanY = (t * 120) % h;
        setScanLine(scanY);
        const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
        grad.addColorStop(0, "rgba(59,130,246,0)");
        grad.addColorStop(0.5, "rgba(59,130,246,0.4)");
        grad.addColorStop(1, "rgba(59,130,246,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 30, w, 60);
      }

      // HUD overlay text
      ctx.shadowBlur = 0;
      ctx.font = `bold ${Math.max(11, w * 0.017)}px monospace`;
      // Top-left
      ctx.fillStyle = "#00FF00";
      ctx.fillText(`CAM-1 ● LIVE   ZONE: ENTRY CHECKPOINT`, 14, 24);
      // Top-right
      ctx.fillStyle = "#00FF00";
      const accText = `AI ACCURACY: 98.4%`;
      ctx.fillText(accText, w - ctx.measureText(accText).width - 14, 24);
      // Bottom-left
      ctx.fillStyle = "rgba(0,255,0,0.7)";
      ctx.font = `${Math.max(10, w * 0.014)}px monospace`;
      ctx.fillText(`COORD: 26.85°N / 75.76°E`, 14, h - 36);
      ctx.fillText(`TEMP: 28.5°C   MOTION: DETECTED`, 14, h - 18);
      // Bottom-right
      const timeStr = new Date().toLocaleTimeString();
      ctx.fillText(timeStr, w - ctx.measureText(timeStr).width - 14, h - 18);

      animFrame.current = requestAnimationFrame(draw);
    };

    animFrame.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame.current);
  }, [phase]);

  /* ── Scanning → Result after 4s ── */
  useEffect(() => {
    speak(text.voiceScanning);
    const timer = setTimeout(() => {
      // Demo: randomly pass or fail (80% chance pass)
      const pass = Math.random() > 0.2;
      setApproved(pass);
      setMissingItems(pass ? [] : ["helmet"]);
      setPhase("result");
      speak(pass ? text.voiceGranted : text.voiceDenied);

      // Animate PPE rates
      PPE_ITEMS.forEach((item, i) => {
        setTimeout(() => {
          setPpeRates(prev => prev.map((p, j) => j === i ? { ...p, rate: item.base + Math.random() * 8 - 4 } : p));
        }, i * 200);
      });

      // If approved, show check-in confirmation after 2s
      if (pass) {
        setTimeout(() => setPhase("checkin"), 2500);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  /* ── Check-in countdown ── */
  useEffect(() => {
    if (phase !== "checkin") return;
    const interval = setInterval(() => {
      setCheckinCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/worker-login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, navigate]);

  return (
    <div className="min-h-screen w-full bg-[#020617] flex flex-col lg:flex-row relative overflow-hidden font-sans text-white">
      {/* ── SOS Button ── */}
      <button
        onClick={() => speak("Emergency alert sent. Help is on the way.")}
        className="fixed bottom-6 right-6 z-[100] w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse border-4 border-red-400"
      >
        SOS
      </button>

      {/* ── Top Bar ── */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50">
        <div className="flex bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 p-1.5">
          <button onClick={() => { setLanguage("en"); }} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${language === "en" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>English</button>
          <button onClick={() => { setLanguage("hi"); }} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${language === "hi" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>हिंदी</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 px-4 py-2 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Audio On</span>
          </div>
          <div className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider border ${phase === "scanning" ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : approved ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-red-500/20 border-red-500/50 text-red-300"}`}>
            {phase === "scanning" ? "● SCANNING" : approved ? "✓ PASSED" : "✗ FAILED"}
          </div>
        </div>
      </div>

      {/* ── Camera Feed (Canvas) ── */}
      <div className="flex-1 relative min-h-[60vh] lg:min-h-screen">
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        <canvas
          ref={canvasRef}
          width={960}
          height={720}
          className="w-full h-full object-cover"
        />

        {/* Scan line glow */}
        {phase === "scanning" && (
          <div
            className="absolute left-0 right-0 h-1 bg-blue-400 shadow-[0_0_20px_#3b82f6,0_0_60px_#3b82f6] pointer-events-none transition-all"
            style={{ top: `${(scanLine / 720) * 100}%` }}
          />
        )}

        {/* Center Status Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {phase === "scanning" && (
            <div className="flex flex-col items-center animate-pulse">
              <div className="w-24 h-24 border-4 border-blue-400 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                <div className="w-16 h-16 border-2 border-blue-300 rounded-full animate-spin" style={{ borderTopColor: "transparent" }} />
              </div>
              <p className="text-blue-300 font-mono font-bold text-lg tracking-widest">{text.scanning}</p>
            </div>
          )}
          {phase === "result" && approved === false && (
            <div className="flex flex-col items-center bg-red-900/60 backdrop-blur-md rounded-3xl p-8 border border-red-500/40 shadow-[0_0_60px_rgba(220,38,38,0.3)]">
              <AlertTriangle className="w-16 h-16 text-red-400 mb-3 animate-bounce" />
              <p className="text-red-200 font-black text-2xl tracking-widest">{text.accessDenied}</p>
              <p className="text-red-300 text-sm mt-2">Missing: {missingItems.join(", ").toUpperCase()}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: PPE Breakdown ── */}
      <div className="w-full lg:w-[360px] bg-[#0a0a12] border-l border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h2 className="text-lg font-black uppercase tracking-widest text-slate-200">PPE Breakdown</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">Real-time compliance analysis</p>
        </div>

        <div className="space-y-5">
          {ppeRates.map(item => (
            <div key={item.key}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-bold text-slate-300">{item.label}</span>
                <span className="text-sm font-mono text-slate-400">{item.rate > 0 ? `${item.rate.toFixed(1)}%` : "—"}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${item.rate}%`,
                    background: item.rate >= 90 ? "linear-gradient(90deg, #22c55e, #4ade80)" : item.rate >= 75 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #ef4444, #f87171)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Detection Stats */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Detection Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Workers", value: "2", color: "text-cyan-400" },
              { label: "Compliant", value: "1", color: "text-emerald-400" },
              { label: "Violations", value: "1", color: "text-red-400" },
              { label: "FPS", value: "24", color: "text-amber-400" },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className={`text-xl font-black font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Model Info */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Engine</h3>
          <div className="text-xs text-slate-500 font-mono space-y-1">
            <p>Model: YOLOv8s-PPE <span className="text-emerald-400">v2.4</span></p>
            <p>Inference: <span className="text-amber-400">23ms</span>/frame</p>
            <p>mAP50: <span className="text-cyan-400">94.2%</span></p>
            <p>Classes: helmet, vest, goggles, gloves, boots</p>
          </div>
        </div>

        {/* Action Button */}
        {phase === "result" && (
          <button
            onClick={() => {
              if (approved) {
                setPhase("checkin");
              } else {
                window.location.reload();
              }
            }}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all ${
              approved
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.3)]"
            }`}
          >
            {approved ? text.nextText : text.retryText}
          </button>
        )}
      </div>

      {/* ── Check-in Confirmation Overlay ── */}
      {phase === "checkin" && (
        <div className="fixed inset-0 z-[90] bg-[#020617]/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-400/30 shadow-[0_0_60px_rgba(34,197,94,0.3)]">
              <UserCheck className="w-12 h-12 text-emerald-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-emerald-50 mb-8">{text.checkinConfirm}</h1>

            <div className="bg-slate-900/80 rounded-3xl border border-slate-700 p-6 space-y-4 text-left mb-8">
              {[
                { label: text.worker, value: "Rajesh Kumar (EMP-042)" },
                { label: text.zone, value: "Excavation Area A" },
                { label: text.shift, value: "Day Shift (6:00 AM – 2:00 PM)" },
                { label: text.time, value: new Date().toLocaleTimeString() },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm text-slate-400 font-bold">{row.label}</span>
                  <span className="text-sm text-white font-mono">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">Redirecting in {checkinCountdown}s...</span>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-bold tracking-wider">SAFETY VERIFIED • ATTENDANCE RECORDED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
