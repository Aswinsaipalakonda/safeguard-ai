import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { kioskAPI } from "../lib/api";

/* ── inline keyframes for the scanner effect ────────────────────────── */
const scanlineKf = `
@keyframes scanline{0%{top:-4%}100%{top:104%}}
@keyframes glow-pulse{0%,100%{opacity:.45}50%{opacity:.9}}
@keyframes orbit{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes dash-spin{0%{stroke-dashoffset:0}100%{stroke-dashoffset:-1200}}
`;

export default function FaceScanScreen() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [scanState, setScanState] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [matchedName, setMatchedName] = useState("");
  const [matchedCode, setMatchedCode] = useState("");
  const [similarity, setSimilarity] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Clock ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Camera ────────────────────────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => { if (active && videoRef.current) videoRef.current.srcObject = stream; })
      .catch((e) => console.warn("Camera access denied or missing", e));
    return () => {
      active = false;
      const s = videoRef.current?.srcObject as MediaStream;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ── Capture ───────────────────────────────────────────────────────── */
  const captureFrame = useCallback((): string | null => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return null;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  }, []);

  /* ── Scan ───────────────────────────────────────────────────────────── */
  const triggerScan = useCallback(async () => {
    if (scanState === "scanning" || scanState === "success") return;
    setScanState("scanning");
    setProgress(0);
    setErrorMessage("");

    let cur = 0;
    const pt = setInterval(() => { cur += Math.random() * 8; if (cur > 90) cur = 90; setProgress(Math.floor(cur)); }, 200);

    try {
      const frame = captureFrame();
      if (!frame) throw new Error("Failed to capture camera frame");

      const res = await kioskAPI.scanFace(frame);
      clearInterval(pt);
      setProgress(100);
      setMatchedName(res.data.name);
      setMatchedCode(res.data.employee_code);
      setSimilarity(res.data.similarity || 99);
      setScanState("success");

      const name = res.data.name;
      const code = res.data.employee_code;
      setTimeout(() => navigate("/kiosk/ppe", { state: { workerName: name, workerCode: code } }), 2500);
    } catch (err: any) {
      clearInterval(pt);
      setProgress(0);
      setErrorMessage(err?.response?.data?.error || "Face verification failed. Please try again.");
      setScanState("error");
    }
  }, [scanState, captureFrame, navigate]);

  /* ── Derived ───────────────────────────────────────────────────────── */
  const fDate = time.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase().replace(/,/g, "");
  const fTime = time.toLocaleTimeString("en-GB", { hour12: false });
  const initials = matchedName ? matchedName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "";
  const accent = scanState === "error" ? "#ff4444" : "#4cff72";

  /* ── Step data ──────────────────────────────────────────────────────── */
  const steps = [
    { n: "1", label: "Face Scan", active: true },
    { n: "2", label: "PPE Check", active: false },
    { n: "3", label: "Entry", active: false },
  ];

  return (
    <>
      <style>{scanlineKf}</style>
      <div className="min-h-[100dvh] flex flex-col font-['Inter',system-ui,sans-serif] bg-[#030803] text-white relative overflow-hidden select-none">

        {/* ░░ CRT Scan-line overlay ░░ */}
        <div className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-[.12]" style={{
          background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.35) 3px,rgba(0,0,0,.35) 4px)",
        }} />

        {/* ░░ Subtle radial vignette ░░ */}
        <div className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,.7)_100%)]" />

        {/* ────────────── HEADER ────────────── */}
        <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#060e06]/90 backdrop-blur-md border-b border-[#4cff72]/20">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 sm:size-8 rounded-lg bg-[#4cff72]/15 border border-[#4cff72]/30 flex items-center justify-center text-base sm:text-lg shrink-0">🦺</div>
            <div className="min-w-0">
              <div className="text-[#4cff72] text-[10px] sm:text-xs font-bold tracking-[.18em] uppercase truncate leading-none">SafeGuard AI</div>
              <div className="text-[#4cff72]/50 text-[8px] sm:text-[9px] tracking-[.15em] uppercase leading-none mt-0.5 hidden sm:block">Worker Entry Portal</div>
            </div>
          </div>

          {/* Step pills — hidden on very small screens */}
          <div className="hidden md:flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-1">
                {i > 0 && <div className="w-6 lg:w-10 h-px bg-[#4cff72]/20" />}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] tracking-widest font-bold uppercase transition-all ${s.active ? "bg-[#4cff72]/15 text-[#4cff72] border border-[#4cff72]/40 shadow-[0_0_12px_rgba(76,255,114,.15)]" : "text-[#4cff72]/30 border border-transparent"}`}>
                  <span className="size-4 rounded-full bg-[#4cff72]/10 flex items-center justify-center text-[9px]">{s.n}</span>
                  <span className="hidden lg:inline">{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Clock */}
          <div className="text-right shrink-0">
            <div className="text-[#4cff72] text-sm sm:text-base font-bold tracking-[.12em] tabular-nums leading-none">{fTime}</div>
            <div className="text-[#4cff72]/40 text-[8px] sm:text-[9px] tracking-[.12em] uppercase leading-none mt-0.5">{fDate}</div>
          </div>
        </header>

        {/* ────────────── MAIN ────────────── */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 gap-6 sm:gap-8 overflow-y-auto">

          {/* ── SCANNER VIEWPORT ── */}
          <div
            className="relative w-[min(70vw,380px)] sm:w-[min(55vw,420px)] aspect-square shrink-0 flex items-center justify-center cursor-pointer"
            onClick={() => { if (scanState === "idle" || scanState === "error") triggerScan(); }}
          >
            {/* Ambient glow behind ring */}
            <div className="absolute inset-[-20%] rounded-full blur-3xl transition-colors duration-700" style={{ background: `radial-gradient(circle,${accent}15 0%,transparent 70%)` }} />

            {/* Dashed orbit ring (SVG for precise dash control) */}
            <svg className="absolute inset-[-6px] w-[calc(100%+12px)] h-[calc(100%+12px)]" viewBox="0 0 200 200">
              <circle
                cx="100" cy="100" r="97"
                fill="none" stroke={accent} strokeWidth=".6"
                strokeDasharray="6 10" opacity=".25"
                style={scanState === "scanning" ? { animation: "dash-spin 20s linear infinite" } : undefined}
              />
            </svg>

            {/* 4 Corner brackets */}
            {[0, 90, 180, 270].map((deg) => (
              <div key={deg} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-[22%] h-1 rounded-full transition-colors duration-500" style={{ background: accent, boxShadow: `0 0 14px ${accent}` }} />
              </div>
            ))}

            {/* Spinning ring while scanning */}
            {scanState === "scanning" && (
              <div className="absolute inset-[-2px] rounded-full border-[3px] border-transparent border-t-[#4cff72] border-r-[#4cff72]/30" style={{ animation: "orbit 2s linear infinite" }} />
            )}

            {/* State ring glow */}
            {(scanState === "success" || scanState === "error") && (
              <>
                <div className="absolute inset-[-3px] rounded-full transition-all duration-500 border-[3px]" style={{ borderColor: accent, boxShadow: `0 0 30px ${accent}80, inset 0 0 30px ${accent}20` }} />
                <div className="absolute inset-0 rounded-full border-[2px] opacity-50" style={{ borderColor: accent, animation: "glow-pulse 2s ease-in-out infinite" }} />
              </>
            )}

            {/* ── Inner circle ── */}
            <div className={`absolute inset-[10px] sm:inset-[14px] rounded-full overflow-hidden transition-all duration-700
              ${scanState === "success" ? "bg-[#4cff72]" : scanState === "error" ? "bg-[#ff4444]" : "bg-[#080f08]"}`}
            >
              {/* Camera feed */}
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-500
                  ${scanState === "idle" ? "opacity-60" : scanState === "scanning" ? "opacity-40" : "opacity-0"}`}
                autoPlay muted playsInline
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Green tint overlay when camera shown */}
              {(scanState === "idle" || scanState === "scanning") && (
                <div className="absolute inset-0 bg-[#0a200a]/60 mix-blend-multiply" />
              )}

              {/* Scan-line sweeping effect */}
              {scanState === "scanning" && (
                <div className="absolute left-0 w-full h-[6%] bg-gradient-to-b from-transparent via-[#4cff72]/40 to-transparent pointer-events-none z-10" style={{ animation: "scanline 2.2s linear infinite" }} />
              )}

              {/* ✦ IDLE overlay */}
              {scanState === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  {/* Crosshair */}
                  <div className="relative size-28 sm:size-36">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-[#4cff72]/25" />
                    <div className="absolute left-1/2 top-0 h-full w-px bg-[#4cff72]/25" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full border border-[#4cff72]/50" />
                  </div>
                  <p className="mt-3 text-[#4cff72]/70 text-[10px] sm:text-[11px] tracking-[.2em] uppercase font-semibold">Tap to scan</p>
                </div>
              )}

              {/* ✦ SCANNING overlay — face landmark dots */}
              {scanState === "scanning" && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="relative w-[55%] aspect-[3/4]">
                    {/* Ghost face silhouette */}
                    <svg viewBox="0 0 120 160" className="w-full h-full" fill="none">
                      <ellipse cx="60" cy="60" rx="38" ry="46" stroke="#4cff72" strokeWidth="1" opacity=".3" />
                      <path d="M22 130 C22 105 38 95 60 95 C82 95 98 105 98 130" stroke="#4cff72" strokeWidth="1" opacity=".2" />
                    </svg>
                    {/* Landmark dots */}
                    {[
                      { x: "35%", y: "38%" }, { x: "65%", y: "38%" }, // eyes
                      { x: "50%", y: "52%" },                          // nose
                      { x: "40%", y: "64%" }, { x: "60%", y: "64%" }, // mouth
                    ].map((p, i) => (
                      <div
                        key={i}
                        className="absolute size-2 sm:size-2.5 rounded-full bg-[#4cff72] shadow-[0_0_8px_#4cff72]"
                        style={{ left: p.x, top: p.y, transform: "translate(-50%,-50%)", animation: `glow-pulse 1.2s ease-in-out ${i * 120}ms infinite` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ✦ SUCCESS overlay */}
              {scanState === "success" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-2 sm:gap-3 animate-in zoom-in-75 duration-300">
                  <svg className="size-16 sm:size-20 text-[#030803] drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div className="size-20 sm:size-24 rounded-full bg-[#030803] border-[3px] border-white/90 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-2xl">
                    {initials}
                  </div>
                </div>
              )}

              {/* ✦ ERROR overlay */}
              {scanState === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 animate-in zoom-in-75 duration-300">
                  <svg className="size-24 sm:size-28 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* ── STATUS & CONTROLS ── */}
          <div className="w-full max-w-lg flex flex-col items-center text-center px-2">

            {/* ✧ IDLE */}
            {scanState === "idle" && (
              <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <h2 className="text-white text-base sm:text-lg font-bold tracking-[.15em] uppercase">Position your face</h2>
                <p className="text-[#4cff72]/50 text-[10px] sm:text-[11px] tracking-[.14em] uppercase leading-relaxed">
                  Good lighting&ensp;·&ensp;No sunglasses&ensp;·&ensp;Look straight
                </p>
                <button
                  onClick={triggerScan}
                  className="mt-1 group relative px-8 sm:px-10 py-3 sm:py-3.5 bg-[#4cff72] hover:bg-[#6fff96] text-[#030803] font-black uppercase text-sm sm:text-base tracking-[.14em] rounded-lg transition-all active:scale-95 shadow-[0_0_25px_rgba(76,255,114,.25)] hover:shadow-[0_0_40px_rgba(76,255,114,.4)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 8a5 5 0 0 1-10 0 5 5 0 0 1 10 0Z"/><path d="M2 21a10 10 0 0 1 20 0"/></svg>
                    Start Face Scan
                  </span>
                </button>
                <button
                  onClick={() => navigate("/kiosk/enroll")}
                  className="text-[#4cff72]/40 hover:text-[#4cff72] text-[10px] sm:text-[11px] tracking-[.12em] uppercase font-semibold transition-colors"
                >
                  First time? Enroll your face&ensp;→
                </button>
              </div>
            )}

            {/* ✧ SCANNING */}
            {scanState === "scanning" && (
              <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
                <h2 className="text-white text-base sm:text-lg font-bold tracking-[.14em] uppercase">Analyzing biometrics…</h2>
                <p className="text-[#4cff72]/50 text-[10px] tracking-[.12em] uppercase">Hold still · Looking straight · 1–2 seconds</p>

                {/* Progress */}
                <div className="w-full max-w-[280px] sm:max-w-xs mt-2">
                  <div className="h-1.5 bg-[#4cff72]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4cff72] shadow-[0_0_10px_#4cff72] transition-all duration-200 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-[#4cff72]/60 text-[9px] sm:text-[10px] tracking-[.1em] mt-1.5 tabular-nums">SFace embedding match&ensp;{progress}%</p>
                </div>

                {/* Tech pills */}
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-2">
                  {["OpenCV SFace", "YuNet ONNX", "128-dim", "99.60% LFW"].map((t) => (
                    <span key={t} className="px-2.5 py-0.5 rounded-full bg-[#4cff72]/5 border border-[#4cff72]/20 text-[#4cff72]/60 text-[8px] sm:text-[9px] tracking-[.1em] uppercase font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ✧ SUCCESS */}
            {scanState === "success" && (
              <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-[#4cff72] text-xl sm:text-2xl font-black tracking-[.16em] uppercase drop-shadow-[0_0_12px_rgba(76,255,114,.5)]">
                  Access Granted
                </h2>
                <p className="text-white text-sm sm:text-base font-bold tracking-wider">
                  Welcome back, {matchedName}
                </p>

                <div className="flex items-center gap-3 mt-1">
                  <span className="px-3 py-1 bg-[#4cff72]/10 border border-[#4cff72]/30 text-[#4cff72] rounded-md text-[11px] sm:text-xs font-bold tracking-[.12em]">{matchedCode}</span>
                  <span className="px-3 py-1 bg-[#4cff72]/10 border border-[#4cff72]/30 text-[#4cff72] rounded-md text-[11px] sm:text-xs font-bold tracking-[.12em] tabular-nums">{similarity.toFixed(1)}% match</span>
                </div>

                <button
                  onClick={() => navigate("/kiosk/ppe", { state: { workerName: matchedName, workerCode: matchedCode } })}
                  className="mt-3 px-8 sm:px-10 py-3 sm:py-3.5 bg-[#4cff72] hover:bg-[#6fff96] text-[#030803] font-black uppercase text-sm sm:text-base tracking-[.14em] rounded-lg transition-all active:scale-95 shadow-[0_0_25px_rgba(76,255,114,.3)]"
                >
                  Proceed to PPE Scan&ensp;→
                </button>

                <p className="text-[#4cff72]/30 text-[9px] tracking-widest uppercase mt-1 animate-pulse">Auto-redirecting…</p>
              </div>
            )}

            {/* ✧ ERROR */}
            {scanState === "error" && (
              <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-[#ff4444] text-xl sm:text-2xl font-black tracking-[.14em] uppercase drop-shadow-[0_0_12px_rgba(255,68,68,.5)]">
                  Not Recognized
                </h2>
                <p className="text-white/70 text-xs sm:text-sm font-medium tracking-wider text-center max-w-sm leading-relaxed">
                  {errorMessage || "Identity could not be verified. Please try again or see the safety officer at Gate B."}
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <button
                    onClick={() => { setScanState("idle"); setErrorMessage(""); }}
                    className="px-7 py-3 border-2 border-[#ffb042] text-[#ffb042] bg-[#ffb042]/5 font-bold uppercase text-sm tracking-[.12em] rounded-lg transition-all active:scale-95 hover:bg-[#ffb042] hover:text-[#030803]"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate("/kiosk/enroll")}
                    className="px-7 py-3 border-2 border-[#4cff72]/40 text-[#4cff72]/70 font-bold uppercase text-sm tracking-[.12em] rounded-lg transition-all active:scale-95 hover:border-[#4cff72] hover:text-[#4cff72]"
                  >
                    Enroll Face
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ────────────── FOOTER ────────────── */}
        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-4 sm:px-6 py-1.5 bg-[#060e06]/80 backdrop-blur-sm border-t border-[#4cff72]/15 text-[#4cff72]/35 text-[8px] sm:text-[9px] uppercase tracking-[.1em] font-medium">
          <span>CAM-GATE-1&ensp;·&ensp;WebRTC&ensp;·&ensp;YuNet Detector</span>
          <span>SFace 128-d&ensp;·&ensp;Cosine ≥ 0.363</span>
        </footer>
      </div>
    </>
  );
}

