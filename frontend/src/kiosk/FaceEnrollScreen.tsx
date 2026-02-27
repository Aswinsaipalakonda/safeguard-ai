import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { kioskAPI } from "../lib/api";

/* ── Inline keyframes ───────────────────────────────────────────────── */
const kf = `
@keyframes enroll-scanline{0%{top:-6%}100%{top:106%}}
@keyframes enroll-orbit{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes enroll-pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes enroll-slide-up{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
`;

/* ── PPE checklist items — manufacturing safety context ─────────────── */
const safetyChecklist = [
  { icon: "⛑️", label: "Hard Hat", desc: "Head protection required on factory floor" },
  { icon: "🥽", label: "Safety Goggles", desc: "Eye protection in welding & grinding zones" },
  { icon: "🦺", label: "Hi-Vis Vest", desc: "Visibility gear for all shift workers" },
  { icon: "🧤", label: "Safety Gloves", desc: "Hand protection near machinery" },
];

export default function FaceEnrollScreen() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [step, setStep] = useState<"preview" | "capturing" | "success" | "error">("preview");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [enrolledName, setEnrolledName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Read worker identity from login storage ─────────────────────── */
  const stored = (() => {
    try {
      const raw = localStorage.getItem("safeguard_worker");
      if (raw) return JSON.parse(raw) as { employee_code: string; name: string };
    } catch { /* ignore */ }
    return null;
  })();
  const empCode = stored?.employee_code || "";
  const empName = stored?.name || empCode;

  /* ── Clock ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Camera ──────────────────────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((s) => { if (active && videoRef.current) videoRef.current.srcObject = s; })
      .catch((e) => console.warn("Camera access denied", e));
    return () => {
      active = false;
      const s = videoRef.current?.srcObject as MediaStream;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ── Capture frame ───────────────────────────────────────────────── */
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

  /* ── Enroll handler ──────────────────────────────────────────────── */
  const handleEnroll = useCallback(async () => {
    if (step === "capturing") return;
    if (!empCode) {
      setErrorMessage("No employee code found. Please log in again at the worker terminal.");
      setStep("error");
      return;
    }

    setStep("capturing");
    setErrorMessage("");
    setProgress(0);

    // Animate progress
    let cur = 0;
    const pt = setInterval(() => { cur += Math.random() * 10; if (cur > 85) cur = 85; setProgress(Math.floor(cur)); }, 180);

    try {
      const frame = captureFrame();
      if (!frame) throw new Error("Camera frame capture failed. Ensure camera permissions are granted.");

      const res = await kioskAPI.enrollFace(empCode, frame);
      clearInterval(pt);
      setProgress(100);
      setEnrolledName(res.data.name || empName);
      setStep("success");

      setTimeout(() => navigate("/kiosk"), 3000);
    } catch (err: any) {
      clearInterval(pt);
      setProgress(0);
      setErrorMessage(err?.response?.data?.error || err?.message || "Enrollment failed. Please try again.");
      setStep("error");
    }
  }, [step, empCode, empName, captureFrame, navigate]);

  /* ── Derived ─────────────────────────────────────────────────────── */
  const fDate = time.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase().replace(/,/g, "");
  const fTime = time.toLocaleTimeString("en-GB", { hour12: false });
  const accent = step === "error" ? "#ff4444" : "#4cff72";
  const initials = enrolledName ? enrolledName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : empCode.slice(-3);

  return (
    <>
      <style>{kf}</style>
      <div className="min-h-[100dvh] flex flex-col font-['Inter',system-ui,sans-serif] bg-[#030803] text-white relative overflow-hidden select-none">

        {/* ░░ CRT scanlines ░░ */}
        <div className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-[.10]" style={{
          background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.3) 3px,rgba(0,0,0,.3) 4px)",
        }} />
        <div className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,.65)_100%)]" />

        {/* ────────── HEADER ────────── */}
        <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#060e06]/90 backdrop-blur-md border-b border-[#4cff72]/20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 sm:size-8 rounded-lg bg-[#4cff72]/15 border border-[#4cff72]/30 flex items-center justify-center text-base sm:text-lg shrink-0">🦺</div>
            <div className="min-w-0">
              <div className="text-[#4cff72] text-[10px] sm:text-xs font-bold tracking-[.18em] uppercase truncate leading-none">SafeGuard AI</div>
              <div className="text-[#4cff72]/50 text-[8px] sm:text-[9px] tracking-[.15em] uppercase leading-none mt-0.5">Biometric Enrollment</div>
            </div>
          </div>

          {/* Worker badge */}
          {empCode && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#4cff72]/8 border border-[#4cff72]/20">
              <div className="size-5 rounded-full bg-[#4cff72]/20 flex items-center justify-center text-[8px] font-bold text-[#4cff72]">
                {empName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <span className="text-[#4cff72]/70 text-[10px] font-bold tracking-wider uppercase">{empCode}</span>
            </div>
          )}

          <div className="text-right shrink-0">
            <div className="text-[#4cff72] text-sm sm:text-base font-bold tracking-[.12em] tabular-nums leading-none">{fTime}</div>
            <div className="text-[#4cff72]/40 text-[8px] sm:text-[9px] tracking-[.12em] uppercase leading-none mt-0.5">{fDate}</div>
          </div>
        </header>

        {/* ────────── MAIN ────────── */}
        <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-4 py-6 sm:py-8 gap-6 lg:gap-12 overflow-y-auto">

          {/* ── LEFT: Camera viewport ── */}
          <div className="flex flex-col items-center gap-5 shrink-0">
            <div
              className="relative w-[min(75vw,340px)] sm:w-[min(50vw,380px)] aspect-square flex items-center justify-center cursor-pointer"
              onClick={() => { if (step === "preview" || step === "error") handleEnroll(); }}
            >
              {/* Ambient glow */}
              <div className="absolute inset-[-25%] rounded-full blur-3xl transition-colors duration-700" style={{ background: `radial-gradient(circle,${accent}12 0%,transparent 70%)` }} />

              {/* Dashed orbit */}
              <svg className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)]" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="97" fill="none" stroke={accent} strokeWidth=".7" strokeDasharray="4 8" opacity=".2"
                  style={step === "capturing" ? { animation: "enroll-orbit 15s linear infinite", transformOrigin: "center" } : undefined} />
              </svg>

              {/* Corner brackets */}
              {[0, 90, 180, 270].map((deg) => (
                <div key={deg} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 w-[20%] h-1 rounded-full transition-colors duration-500" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
                </div>
              ))}

              {/* Spinning ring while capturing */}
              {step === "capturing" && (
                <div className="absolute inset-[-2px] rounded-full border-[3px] border-transparent border-t-[#4cff72] border-r-[#4cff72]/20" style={{ animation: "enroll-orbit 1.8s linear infinite" }} />
              )}

              {/* State ring */}
              {(step === "success" || step === "error") && (
                <div className="absolute inset-[-3px] rounded-full transition-all duration-500 border-[3px]" style={{ borderColor: accent, boxShadow: `0 0 30px ${accent}60, inset 0 0 20px ${accent}15` }} />
              )}

              {/* ── Inner circle ── */}
              <div className={`absolute inset-[10px] sm:inset-[12px] rounded-full overflow-hidden transition-all duration-700
                ${step === "success" ? "bg-[#4cff72]" : step === "error" ? "bg-[#ff4444]" : "bg-[#080f08]"}`}
              >
                {/* Camera feed */}
                <video
                  ref={videoRef}
                  className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-500
                    ${step === "preview" ? "opacity-60" : step === "capturing" ? "opacity-35" : "opacity-0"}`}
                  autoPlay muted playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Tint */}
                {(step === "preview" || step === "capturing") && (
                  <div className="absolute inset-0 bg-[#0a200a]/50 mix-blend-multiply" />
                )}

                {/* Scanline while capturing */}
                {step === "capturing" && (
                  <div className="absolute left-0 w-full h-[5%] bg-gradient-to-b from-transparent via-[#4cff72]/35 to-transparent pointer-events-none z-10" style={{ animation: "enroll-scanline 2s linear infinite" }} />
                )}

                {/* ✦ PREVIEW overlay — face guide */}
                {step === "preview" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    {/* Face oval guide */}
                    <svg className="w-[60%] aspect-[3/4] opacity-40" viewBox="0 0 120 160" fill="none">
                      <ellipse cx="60" cy="65" rx="36" ry="45" stroke="#4cff72" strokeWidth="1.5" strokeDasharray="6 4" />
                      <line x1="60" y1="15" x2="60" y2="115" stroke="#4cff72" strokeWidth=".5" opacity=".3" />
                      <line x1="20" y1="65" x2="100" y2="65" stroke="#4cff72" strokeWidth=".5" opacity=".3" />
                    </svg>
                    <p className="text-[#4cff72]/60 text-[9px] sm:text-[10px] tracking-[.2em] uppercase font-semibold mt-2">Align face here</p>
                  </div>
                )}

                {/* ✦ CAPTURING overlay */}
                {step === "capturing" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <svg className="w-[55%] aspect-[3/4]" viewBox="0 0 120 160" fill="none">
                      <ellipse cx="60" cy="65" rx="36" ry="45" stroke="#4cff72" strokeWidth="1.5" opacity=".5" />
                      {/* Grid dots for biometric mapping */}
                      {[
                        [38, 52], [82, 52],   // eyes
                        [60, 72],               // nose
                        [48, 88], [72, 88],     // mouth corners
                        [60, 38],               // forehead
                        [35, 70], [85, 70],     // cheeks
                      ].map(([cx, cy], i) => (
                        <circle key={i} cx={cx} cy={cy} r="2.5" fill="#4cff72" opacity=".8" style={{ animation: `enroll-pulse 1s ease-in-out ${i * 100}ms infinite` }} />
                      ))}
                    </svg>
                  </div>
                )}

                {/* ✦ SUCCESS overlay */}
                {step === "success" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-2 animate-in zoom-in-75 duration-300">
                    <svg className="size-14 sm:size-16 text-[#030803] drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <div className="size-16 sm:size-20 rounded-full bg-[#030803] border-[3px] border-white/90 flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-2xl">
                      {initials}
                    </div>
                  </div>
                )}

                {/* ✦ ERROR overlay */}
                {step === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 animate-in zoom-in-75 duration-300">
                    <svg className="size-20 sm:size-24 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar below camera */}
            {step === "capturing" && (
              <div className="w-full max-w-[260px] sm:max-w-[300px]" style={{ animation: "enroll-slide-up .4s ease-out" }}>
                <div className="h-1.5 bg-[#4cff72]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4cff72] shadow-[0_0_10px_#4cff72] transition-all duration-200 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[#4cff72]/50 text-[9px] tracking-[.1em] mt-1.5 text-center tabular-nums">Extracting face embedding… {progress}%</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Info panel ── */}
          <div className="flex flex-col items-center lg:items-start gap-5 max-w-md w-full px-2">

            {/* ✧ PREVIEW controls */}
            {step === "preview" && (
              <div className="flex flex-col items-center lg:items-start gap-4 w-full" style={{ animation: "enroll-slide-up .5s ease-out" }}>
                <div>
                  <h1 className="text-white text-lg sm:text-xl font-bold tracking-[.14em] uppercase text-center lg:text-left">
                    Biometric Enrollment
                  </h1>
                  <p className="text-[#4cff72]/50 text-[10px] sm:text-[11px] tracking-[.12em] uppercase mt-1 text-center lg:text-left leading-relaxed">
                    Register your face for shift entry verification
                  </p>
                </div>

                {/* Worker ID card */}
                {empCode && (
                  <div className="w-full bg-[#0a180a] border border-[#4cff72]/15 rounded-xl p-4 flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-[#4cff72]/10 border border-[#4cff72]/25 flex items-center justify-center text-[#4cff72] text-lg font-black shrink-0">
                      {empName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white text-sm font-bold tracking-wider truncate">{empName}</div>
                      <div className="text-[#4cff72]/50 text-[10px] tracking-[.14em] uppercase font-medium">{empCode} · Active Shift</div>
                    </div>
                  </div>
                )}

                {/* Safety requirements info */}
                <div className="w-full bg-[#0a180a] border border-[#4cff72]/10 rounded-xl p-4">
                  <p className="text-[#4cff72]/60 text-[9px] tracking-[.14em] uppercase font-bold mb-3">After enrollment you'll need</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {safetyChecklist.map((item) => (
                      <div key={item.label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#4cff72]/5 border border-[#4cff72]/10">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <div className="text-white/80 text-[10px] font-bold tracking-wider uppercase truncate">{item.label}</div>
                          <div className="text-[#4cff72]/30 text-[8px] tracking-wider truncate hidden sm:block">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handleEnroll}
                  className="w-full sm:w-auto group relative px-8 sm:px-10 py-3 sm:py-3.5 bg-[#4cff72] hover:bg-[#6fff96] text-[#030803] font-black uppercase text-sm sm:text-base tracking-[.14em] rounded-lg transition-all active:scale-95 shadow-[0_0_25px_rgba(76,255,114,.25)] hover:shadow-[0_0_40px_rgba(76,255,114,.4)]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M7 21v-1a5 5 0 0 1 10 0v1" />
                    </svg>
                    Capture & Enroll Face
                  </span>
                </button>

                <button
                  onClick={() => navigate("/kiosk")}
                  className="text-[#4cff72]/40 hover:text-[#4cff72] text-[10px] tracking-[.12em] uppercase font-semibold transition-colors self-center lg:self-start"
                >
                  ← Back to face scan
                </button>
              </div>
            )}

            {/* ✧ CAPTURING info */}
            {step === "capturing" && (
              <div className="flex flex-col items-center lg:items-start gap-3 w-full" style={{ animation: "enroll-slide-up .4s ease-out" }}>
                <h2 className="text-white text-base sm:text-lg font-bold tracking-[.14em] uppercase">Processing…</h2>
                <p className="text-[#4cff72]/50 text-[10px] tracking-[.12em] uppercase leading-relaxed">
                  Detecting face · Mapping 128 biometric landmarks · Generating SFace embedding
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {["YuNet ONNX", "SFace 128-d", "Cosine Match"].map((t) => (
                    <span key={t} className="px-2.5 py-0.5 rounded-full bg-[#4cff72]/5 border border-[#4cff72]/15 text-[#4cff72]/50 text-[8px] sm:text-[9px] tracking-[.1em] uppercase font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ✧ SUCCESS */}
            {step === "success" && (
              <div className="flex flex-col items-center lg:items-start gap-4 w-full" style={{ animation: "enroll-slide-up .5s ease-out" }}>
                <div>
                  <h2 className="text-[#4cff72] text-xl sm:text-2xl font-black tracking-[.14em] uppercase drop-shadow-[0_0_12px_rgba(76,255,114,.5)] text-center lg:text-left">
                    Enrollment Complete
                  </h2>
                  <p className="text-white text-sm font-bold tracking-wider mt-1 text-center lg:text-left">
                    Biometric profile created for <span className="text-[#4cff72]">{enrolledName}</span>
                  </p>
                </div>

                {/* Access card */}
                <div className="w-full bg-[#0a180a] border border-[#4cff72]/20 rounded-xl p-4 flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-[#4cff72] flex items-center justify-center text-[#030803] text-lg font-black shrink-0 shadow-[0_0_15px_rgba(76,255,114,.3)]">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-sm font-bold tracking-wider truncate">{enrolledName}</div>
                    <div className="text-[#4cff72]/50 text-[10px] tracking-[.14em] uppercase">{empCode} · Face Enrolled ✓</div>
                  </div>
                  <div className="size-8 rounded-full bg-[#4cff72]/15 flex items-center justify-center shrink-0">
                    <svg className="size-4 text-[#4cff72]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/kiosk")}
                  className="w-full sm:w-auto px-8 py-3 bg-[#4cff72] hover:bg-[#6fff96] text-[#030803] font-black uppercase text-sm tracking-[.14em] rounded-lg transition-all active:scale-95 shadow-[0_0_25px_rgba(76,255,114,.3)]"
                >
                  Proceed to Face Scan →
                </button>
                <p className="text-[#4cff72]/30 text-[9px] tracking-widest uppercase animate-pulse self-center lg:self-start">Auto-redirecting…</p>
              </div>
            )}

            {/* ✧ ERROR */}
            {step === "error" && (
              <div className="flex flex-col items-center lg:items-start gap-4 w-full" style={{ animation: "enroll-slide-up .5s ease-out" }}>
                <div>
                  <h2 className="text-[#ff4444] text-xl sm:text-2xl font-black tracking-[.14em] uppercase drop-shadow-[0_0_12px_rgba(255,68,68,.5)] text-center lg:text-left">
                    Enrollment Failed
                  </h2>
                  <p className="text-white/70 text-xs sm:text-sm font-medium tracking-wider mt-1 text-center lg:text-left leading-relaxed max-w-sm">
                    {errorMessage}
                  </p>
                </div>

                {/* Troubleshooting tips */}
                <div className="w-full bg-[#180a0a] border border-[#ff4444]/15 rounded-xl p-4">
                  <p className="text-[#ff4444]/60 text-[9px] tracking-[.14em] uppercase font-bold mb-2">Troubleshooting</p>
                  <ul className="space-y-1.5">
                    {[
                      "Remove safety goggles & face shield before scanning",
                      "Ensure adequate lighting at the enrollment station",
                      "Face the camera directly — avoid side angles",
                      "If issue persists, contact the shift supervisor",
                    ].map((tip, i) => (
                      <li key={i} className="text-white/50 text-[10px] tracking-wider flex items-start gap-2">
                        <span className="text-[#ff4444]/50 mt-px shrink-0">▸</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => { setStep("preview"); setErrorMessage(""); }}
                    className="flex-1 sm:flex-none px-7 py-3 border-2 border-[#ffb042] text-[#ffb042] bg-[#ffb042]/5 font-bold uppercase text-sm tracking-[.12em] rounded-lg transition-all active:scale-95 hover:bg-[#ffb042] hover:text-[#030803]"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate("/worker-login")}
                    className="flex-1 sm:flex-none px-7 py-3 border-2 border-[#4cff72]/30 text-[#4cff72]/60 font-bold uppercase text-sm tracking-[.12em] rounded-lg transition-all active:scale-95 hover:border-[#4cff72] hover:text-[#4cff72]"
                  >
                    Re-Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ────────── FOOTER ────────── */}
        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-4 sm:px-6 py-1.5 bg-[#060e06]/80 backdrop-blur-sm border-t border-[#4cff72]/15 text-[#4cff72]/35 text-[8px] sm:text-[9px] uppercase tracking-[.1em] font-medium">
          <span>Enrollment Station&ensp;·&ensp;WebRTC&ensp;·&ensp;YuNet Detector</span>
          <span>SFace 128-d&ensp;·&ensp;ISO/IEC 24745 Biometric Template</span>
        </footer>
      </div>
    </>
  );
}
