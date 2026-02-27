import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { kioskAPI, type PPEDetection } from "../lib/api";
import useStore from "../store";

/* ── Inline keyframes ─────────────────────────────────────────────── */
const kf = `
@keyframes ppe-scanline{0%{top:-8%}100%{top:108%}}
@keyframes ppe-pulse{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes ppe-slide-up{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
@keyframes ppe-glow{0%,100%{box-shadow:0 0 8px var(--glow)}50%{box-shadow:0 0 22px var(--glow)}}
@keyframes popup-scale{0%{transform:scale(0.7);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
@keyframes popup-check{0%{stroke-dashoffset:100}100%{stroke-dashoffset:0}}
@keyframes popup-ring{0%,100%{box-shadow:0 0 0 0 rgba(76,255,114,.45)}50%{box-shadow:0 0 0 28px rgba(76,255,114,0)}}
@keyframes popup-progress{0%{width:100%}100%{width:0%}}
@keyframes popup-fade{0%{opacity:0;transform:translateY(16px)}100%{opacity:1;transform:translateY(0)}}
`;

/* ── PPE item display config ──────────────────────────────────────── */
const PPE_META: Record<string, { icon: string; label: string }> = {
  helmet:     { icon: "⛑️", label: "Hard Hat" },
  no_helmet:  { icon: "⛑️", label: "No Hard Hat" },
  goggles:    { icon: "🥽", label: "Safety Goggles" },
  no_goggles: { icon: "🥽", label: "No Goggles" },
  glove:      { icon: "🧤", label: "Gloves" },
  no_glove:   { icon: "🧤", label: "No Gloves" },
  mask:       { icon: "😷", label: "Face Mask" },
  no_mask:    { icon: "😷", label: "No Mask" },
  shoes:      { icon: "👢", label: "Safety Boots" },
  no_shoes:   { icon: "👢", label: "No Boots" },
};

/* ── Read admin PPE settings (from Settings page localStorage) ── */
const getOptionalViolationClasses = (): Set<string> => {
  try {
    const raw = localStorage.getItem("safeguard_settings");
    if (!raw) return new Set();
    const s = JSON.parse(raw);
    const opt = new Set<string>();
    if (s.reqHelmet === false) opt.add("no_helmet");
    if (s.reqEyes === false) opt.add("no_goggles");
    if (s.reqGloves === false) opt.add("no_glove");
    if (s.reqMask === false) opt.add("no_mask");
    if (s.reqBoots === false) opt.add("no_shoes");
    return opt;
  } catch { return new Set(); }
};

export default function PPECheckScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const workerName = (location.state as any)?.workerName || "Worker";
  const workerCode = (location.state as any)?.workerCode || "EMP-0000";
  const initials = workerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const [time, setTime] = useState(new Date());
  const [scanning, setScanning] = useState(false);
  const [detections, setDetections] = useState<PPEDetection[]>([]);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const [error, setError] = useState("");
  const [optionalClasses, setOptionalClasses] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState(5);
  const logout = useStore((s) => s.logout);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const busyRef = useRef(false);

  /* ── Clock ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Camera ─────────────────────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: 1280, height: 720 } })
      .then((s) => {
        if (active && videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => setError("Camera access denied. Please allow camera permissions."));
    return () => {
      active = false;
      const s = videoRef.current?.srcObject as MediaStream;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ── Capture a frame ────────────────────────────────────────────── */
  const captureFrame = useCallback((): string | null => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return null;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  }, []);

  /* ── Draw bounding boxes on overlay canvas ──────────────────────── */
  const drawDetections = useCallback((dets: PPEDetection[], optClasses?: Set<string>) => {
    const ov = overlayRef.current;
    const v = videoRef.current;
    if (!ov || !v) return;

    const dw = ov.clientWidth;
    const dh = ov.clientHeight;
    ov.width = dw;
    ov.height = dh;

    const ctx = ov.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, dw, dh);

    for (const det of dets) {
      const [nx1, ny1, nx2, ny2] = det.bbox;
      const x1 = nx1 * dw;
      const y1 = ny1 * dh;
      const x2 = nx2 * dw;
      const y2 = ny2 * dh;
      const bw = x2 - x1;
      const bh = y2 - y1;

      const isOptional = det.is_violation && (optClasses?.has(det.class) ?? false);
      const color = det.is_violation ? (isOptional ? "#ffb042" : "#ff3344") : "#4cff72";
      const bgAlpha = det.is_violation ? (isOptional ? "rgba(255,176,66,0.12)" : "rgba(255,51,68,0.12)") : "rgba(76,255,114,0.08)";

      // ── Filled background
      ctx.fillStyle = bgAlpha;
      ctx.fillRect(x1, y1, bw, bh);

      // ── Main border
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x1, y1, bw, bh);

      // ── Corner brackets (thicker, longer corners)
      const cl = Math.min(18, bw * 0.25, bh * 0.25);
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      // top-left
      ctx.beginPath(); ctx.moveTo(x1, y1 + cl); ctx.lineTo(x1, y1); ctx.lineTo(x1 + cl, y1); ctx.stroke();
      // top-right
      ctx.beginPath(); ctx.moveTo(x2 - cl, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + cl); ctx.stroke();
      // bottom-left
      ctx.beginPath(); ctx.moveTo(x1, y2 - cl); ctx.lineTo(x1, y2); ctx.lineTo(x1 + cl, y2); ctx.stroke();
      // bottom-right
      ctx.beginPath(); ctx.moveTo(x2 - cl, y2); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 - cl); ctx.stroke();

      // ── Label pill
      const meta = PPE_META[det.class] || { icon: "🔍", label: det.class };
      const label = `${meta.icon} ${meta.label}  ${Math.round(det.confidence * 100)}%`;
      ctx.font = "bold 12px Inter, system-ui, sans-serif";
      const tm = ctx.measureText(label);
      const lw = tm.width + 14;
      const lh = 22;
      const lx = Math.max(0, Math.min(x1, dw - lw));
      const ly = Math.max(lh, y1) - lh - 4;

      // pill background
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(lx, ly, lw, lh, 4);
      ctx.fill();

      // pill text
      ctx.fillStyle = (det.is_violation && !isOptional) ? "#fff" : "#030803";
      ctx.fillText(label, lx + 7, ly + 15);

      // ── Confidence bar under label
      const barW = lw;
      const barH = 3;
      const barY = ly + lh + 2;
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(lx, barY, barW, barH);
      ctx.fillStyle = color;
      ctx.fillRect(lx, barY, barW * det.confidence, barH);
    }
  }, []);

  /* ── Single scan cycle ──────────────────────────────────────────── */
  const runScan = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setScanning(true);
    setError("");

    try {
      const frame = captureFrame();
      if (!frame) throw new Error("Camera not ready");

      const res = await kioskAPI.verifyPPE(frame);
      const dets = res.data.detections || [];
      setDetections(dets);

      // Read which PPE violations are optional per admin settings
      const optClasses = getOptionalViolationClasses();
      setOptionalClasses(optClasses);

      const hasPositive = dets.some((d: PPEDetection) => !d.is_violation);
      const hasRequiredViolation = dets.some(
        (d: PPEDetection) => d.is_violation && !optClasses.has(d.class)
      );
      // Check if admin has set ALL PPE items as optional (nothing is required)
      const ALL_VIOLATION_CLASSES = ["no_helmet", "no_goggles", "no_glove", "no_mask", "no_shoes"];
      const allPPEOptional = ALL_VIOLATION_CLASSES.every((c) => optClasses.has(c));

      // Approve when:
      //  - all PPE items are optional (nothing required → always pass), OR
      //  - at least one positive PPE detected and no required violations, OR
      //  - all detected violations are optional (admin waived those items)
      const allViolationsOptional = dets.length > 0 && dets.every(
        (d: PPEDetection) => !d.is_violation || optClasses.has(d.class)
      );
      setApproved(
        allPPEOptional
          ? true
          : dets.length === 0
            ? null
            : (hasPositive && !hasRequiredViolation) || allViolationsOptional
      );

      // Only show required missing items
      const missingToClass: Record<string, string> = {
        helmet: "no_helmet", goggles: "no_goggles", gloves: "no_glove",
        mask: "no_mask", boots: "no_shoes",
      };
      const allMissing: string[] = res.data.missing || [];
      setMissing(allMissing.filter((m) => !optClasses.has(missingToClass[m] || "")));
      setScanCount((c) => c + 1);
      drawDetections(dets, optClasses);
    } catch (err: any) {
      const msg = err?.response?.data?.missing?.[0] || err?.message || "Detection failed";
      setError(msg);
    } finally {
      busyRef.current = false;
      setScanning(false);
    }
  }, [captureFrame, drawDetections]);

  /* ── Record check-in to DB when approved ─────────────────────────── */
  const checkinDone = useRef(false);
  useEffect(() => {
    if (approved !== true || checkinDone.current) return;
    checkinDone.current = true;
    kioskAPI.checkin({
      employee_code: workerCode,
      approved: true,
      missing,
      detections,
    }).catch(() => {/* best-effort — don't block logout */});
  }, [approved, workerCode, missing, detections]);

  /* ── Auto-logout countdown on full compliance ────────────────────── */
  useEffect(() => {
    if (approved !== true) { setCountdown(5); return; }
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          // Stop camera
          const s = videoRef.current?.srcObject as MediaStream;
          s?.getTracks().forEach((t) => t.stop());
          // Logout
          logout();
          localStorage.removeItem("safeguard_worker");
          navigate("/worker-login", { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [approved, logout, navigate]);

  /* ── Derived ────────────────────────────────────────────────────── */
  const fDate = time.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).toUpperCase().replace(/,/g, "");
  const fTime = time.toLocaleTimeString("en-GB", { hour12: false });

  const compliantDets = detections.filter((d) => !d.is_violation);
  const requiredViolationDets = detections.filter((d) => d.is_violation && !optionalClasses.has(d.class));
  const optionalViolationDets = detections.filter((d) => d.is_violation && optionalClasses.has(d.class));

  const noDetections = scanCount > 0 && detections.length === 0;
  const statusColor = approved === null ? (noDetections ? "#ffb042" : "#4cff72") : approved ? "#4cff72" : "#ff3344";
  const statusLabel = approved === null ? (noDetections ? "NO PPE DETECTED" : "READY TO SCAN") : approved ? "COMPLIANT" : "VIOLATION DETECTED";

  return (
    <>
      <style>{kf}</style>
      <div className="min-h-[100dvh] flex flex-col font-['Inter',system-ui,sans-serif] bg-[#030803] text-white relative overflow-hidden select-none">

        {/* CRT scanlines */}
        <div className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-[.08]" style={{
          background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.3) 3px,rgba(0,0,0,.3) 4px)",
        }} />

        {/* ───── HEADER ───── */}
        <header className="relative z-10 flex items-center justify-between px-3 sm:px-6 py-2 bg-[#060e06]/90 backdrop-blur-md border-b border-[#4cff72]/20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 sm:size-8 rounded-lg bg-[#4cff72]/15 border border-[#4cff72]/30 flex items-center justify-center text-base sm:text-lg shrink-0">🛡️</div>
            <div className="min-w-0">
              <div className="text-[#4cff72] text-[10px] sm:text-xs font-bold tracking-[.18em] uppercase leading-none truncate">SafeGuard AI</div>
              <div className="text-[#4cff72]/50 text-[8px] sm:text-[9px] tracking-[.12em] uppercase leading-none mt-0.5">PPE Compliance Scanner</div>
            </div>
          </div>

          {/* Worker chip */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#4cff72]/8 border border-[#4cff72]/20">
            <div className="size-6 rounded-full bg-[#4cff72]/20 flex items-center justify-center text-[9px] font-bold text-[#4cff72]">{initials}</div>
            <span className="text-white/80 text-[10px] font-bold tracking-wider">{workerName}</span>
            <span className="text-[#4cff72]/50 text-[9px] tracking-wider">{workerCode}</span>
          </div>

          {/* Status beacon */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full border transition-colors duration-500" style={{ borderColor: `${statusColor}40`, background: `${statusColor}08` }}>
              <div className="size-2 rounded-full animate-pulse" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[.12em]" style={{ color: statusColor }}>{statusLabel}</span>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[#4cff72] text-sm sm:text-base font-bold tracking-[.1em] tabular-nums leading-none">{fTime}</div>
              <div className="text-[#4cff72]/40 text-[8px] tracking-[.1em] uppercase leading-none mt-0.5">{fDate}</div>
            </div>
          </div>
        </header>

        {/* ───── MAIN ───── */}
        <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* ── LEFT: Camera feed + overlay ── */}
          <div className="flex-1 relative bg-black min-h-[40vh] lg:min-h-0">
            {/* Video */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay muted playsInline
            />

            {/* Detection overlay canvas  */}
            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

            {/* Hidden capture canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanline animation while scanning */}
            {scanning && (
              <div className="absolute left-0 w-full h-[4%] bg-gradient-to-b from-transparent via-[#4cff72]/30 to-transparent z-20 pointer-events-none" style={{ animation: "ppe-scanline 1.5s linear infinite" }} />
            )}

            {/* Grid overlay */}
            <div className="absolute inset-0 z-[5] pointer-events-none opacity-[.06]" style={{
              backgroundImage: "linear-gradient(#4cff72 1px, transparent 1px), linear-gradient(90deg, #4cff72 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }} />

            {/* Top-left HUD badge */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-[#4cff72]/20">
              <div className="size-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-[10px] font-bold tracking-[.1em] uppercase">Live Feed</span>
              {scanCount > 0 && (
                <span className="text-[#4cff72]/60 text-[9px] tracking-wider ml-1">· Scan #{scanCount}</span>
              )}
            </div>

            {/* YOLO model badge */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-[#4cff72]/15">
              <span className="text-[#4cff72]/60 text-[8px] sm:text-[9px] tracking-[.1em] uppercase font-bold">YOLOv8m · PPE Detection</span>
            </div>

            {/* Bottom detection count strip */}
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-2 bg-gradient-to-t from-black/80 to-transparent">
              <span className="text-[#4cff72] text-[10px] font-bold tracking-wider uppercase">
                {detections.length} detection{detections.length !== 1 ? "s" : ""}
              </span>
              {compliantDets.length > 0 && (
                <span className="text-[#4cff72]/70 text-[9px]">✓ {compliantDets.length} compliant</span>
              )}
              {requiredViolationDets.length > 0 && (
                <span className="text-[#ff3344]/90 text-[9px]">✗ {requiredViolationDets.length} violation{requiredViolationDets.length !== 1 ? "s" : ""}</span>
              )}
              {optionalViolationDets.length > 0 && (
                <span className="text-[#ffb042]/80 text-[9px]">⚠ {optionalViolationDets.length} optional</span>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="absolute bottom-14 left-4 right-4 z-20 px-4 py-2 bg-[#ff3344]/90 rounded-lg text-white text-xs font-bold text-center">
                {error}
              </div>
            )}
          </div>

          {/* ── RIGHT: Status panel ── */}
          <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-[#060e06]/95 backdrop-blur-md border-l border-[#4cff72]/15 overflow-y-auto">

            {/* Verdict banner */}
            <div className="p-4 sm:p-5 border-b border-[#4cff72]/10" style={{ animation: "ppe-slide-up .4s ease-out" }}>
              {approved === null && !noDetections ? (
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#4cff72]/10 border border-[#4cff72]/20 flex items-center justify-center text-lg animate-pulse">📡</div>
                  <div>
                    <h2 className="text-white text-base font-bold tracking-[.12em] uppercase">Ready to Scan</h2>
                    <p className="text-[#4cff72]/40 text-[10px] tracking-wider uppercase">Tap Scan PPE to begin detection</p>
                  </div>
                </div>
              ) : approved === null && noDetections ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#ffb042]/8 border border-[#ffb042]/25">
                  <div className="size-11 rounded-xl bg-[#ffb042] flex items-center justify-center text-[#030803] shrink-0 shadow-[0_0_15px_rgba(255,176,66,.4)]">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  </div>
                  <div>
                    <h2 className="text-[#ffb042] text-lg font-black tracking-[.14em] uppercase">No PPE Detected</h2>
                    <p className="text-white/70 text-[10px] tracking-wider">Ensure worker &amp; PPE are visible in frame, then scan again</p>
                  </div>
                </div>
              ) : approved ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#4cff72]/8 border border-[#4cff72]/25" style={{ "--glow": "#4cff72", animation: "ppe-glow 2s ease-in-out infinite" } as React.CSSProperties}>
                  <div className="size-11 rounded-xl bg-[#4cff72] flex items-center justify-center text-[#030803] shrink-0 shadow-[0_0_15px_rgba(76,255,114,.4)]">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <h2 className="text-[#4cff72] text-lg font-black tracking-[.14em] uppercase drop-shadow-[0_0_8px_rgba(76,255,114,.4)]">Verified</h2>
                    <p className="text-white/70 text-[10px] tracking-wider">Logging out in {countdown}s…</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#ff3344]/8 border border-[#ff3344]/30" style={{ "--glow": "#ff3344", animation: "ppe-glow 1.5s ease-in-out infinite" } as React.CSSProperties}>
                  <div className="size-11 rounded-xl bg-[#ff3344] flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(255,51,68,.5)]">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[#ff3344] text-lg font-black tracking-[.14em] uppercase drop-shadow-[0_0_8px_rgba(255,51,68,.4)]">Entry Blocked</h2>
                    <p className="text-white/70 text-[10px] tracking-wider">
                      Missing: {missing.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Detection list */}
            <div className="flex-1 p-4 sm:p-5 space-y-2 overflow-y-auto">
              <h3 className="text-[#4cff72]/60 text-[9px] font-bold tracking-[.16em] uppercase mb-3">
                Detection Results {scanCount > 0 && `(Scan #${scanCount})`}
              </h3>

              {detections.length === 0 && approved === null && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2 animate-pulse">📷</div>
                  <p className="text-white/30 text-xs tracking-wider">Waiting for first scan…</p>
                </div>
              )}

              {detections.length === 0 && approved !== null && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-white/30 text-xs tracking-wider">No PPE items detected in frame</p>
                  <p className="text-[#4cff72]/30 text-[9px] tracking-wider mt-1">Ensure worker is visible in camera</p>
                </div>
              )}

              {/* Compliant items */}
              {compliantDets.map((det, i) => {
                const meta = PPE_META[det.class] || { icon: "✓", label: det.label };
                return (
                  <div key={`c-${i}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#4cff72]/5 border border-[#4cff72]/15 transition-all" style={{ animation: `ppe-slide-up ${0.2 + i * 0.08}s ease-out` }}>
                    <span className="text-xl shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-bold tracking-wider truncate">{meta.label}</span>
                        <span className="text-[#4cff72] text-[10px] font-bold tabular-nums">{Math.round(det.confidence * 100)}%</span>
                      </div>
                      <div className="mt-1 h-1 bg-[#4cff72]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#4cff72] rounded-full transition-all duration-500" style={{ width: `${det.confidence * 100}%` }} />
                      </div>
                    </div>
                    <svg className="size-5 text-[#4cff72] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                );
              })}

              {/* Required Violations */}
              {requiredViolationDets.map((det, i) => {
                const meta = PPE_META[det.class] || { icon: "✗", label: det.label };
                return (
                  <div key={`v-${i}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#ff3344]/8 border border-[#ff3344]/25 transition-all" style={{ animation: `ppe-slide-up ${0.2 + i * 0.08}s ease-out` }}>
                    <span className="text-xl shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-bold tracking-wider truncate">{meta.label}</span>
                        <span className="text-[#ff3344] text-[10px] font-bold tabular-nums">{Math.round(det.confidence * 100)}%</span>
                      </div>
                      <div className="mt-1 h-1 bg-[#ff3344]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#ff3344] rounded-full transition-all duration-500" style={{ width: `${det.confidence * 100}%` }} />
                      </div>
                    </div>
                    <svg className="size-5 text-[#ff3344] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                );
              })}

              {/* Optional Violations (waived by admin settings) */}
              {optionalViolationDets.length > 0 && (
                <>
                  <h3 className="text-[#ffb042]/60 text-[9px] font-bold tracking-[.16em] uppercase mt-4 mb-1">Optional Items (Waived)</h3>
                  {optionalViolationDets.map((det, i) => {
                    const meta = PPE_META[det.class] || { icon: "⚠", label: det.label };
                    return (
                      <div key={`o-${i}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#ffb042]/5 border border-[#ffb042]/15 transition-all" style={{ animation: `ppe-slide-up ${0.2 + i * 0.08}s ease-out` }}>
                        <span className="text-xl shrink-0">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-bold tracking-wider truncate">{meta.label}</span>
                            <span className="text-[#ffb042] text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded bg-[#ffb042]/10 border border-[#ffb042]/20">OPTIONAL</span>
                          </div>
                          <div className="mt-1 h-1 bg-[#ffb042]/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#ffb042] rounded-full transition-all duration-500" style={{ width: `${det.confidence * 100}%` }} />
                          </div>
                        </div>
                        <svg className="size-5 text-[#ffb042] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 sm:p-5 border-t border-[#4cff72]/10 space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={runScan}
                  disabled={scanning || approved === true}
                  className="flex-1 py-3 bg-[#4cff72] hover:bg-[#6fff96] disabled:opacity-50 text-[#030803] font-black uppercase text-sm tracking-[.12em] rounded-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(76,255,114,.25)]"
                >
                  {scanning ? "Scanning…" : approved === true ? "✓ Verified" : "Scan PPE"}
                </button>
                <button
                  onClick={() => navigate("/kiosk")}
                  className="px-5 py-3 border border-[#4cff72]/25 text-[#4cff72]/60 hover:text-[#4cff72] hover:border-[#4cff72]/50 font-bold uppercase text-sm tracking-[.12em] rounded-lg transition-all active:scale-95"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* ───── FOOTER ───── */}
        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-4 sm:px-6 py-1 bg-[#060e06]/80 backdrop-blur-sm border-t border-[#4cff72]/15 text-[#4cff72]/30 text-[8px] sm:text-[9px] uppercase tracking-[.1em] font-medium">
          <span>YOLOv8m PPE Detector&ensp;·&ensp;keremberke/protective-equipment</span>
          <span>10 Classes&ensp;·&ensp;Conf ≥ 35%&ensp;·&ensp;Real-time Inference</span>
        </footer>

        {/* ═══════ FULL-SCREEN SUCCESS POPUP ═══════ */}
        {approved === true && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: "popup-fade .3s ease-out" }}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#030803]/85 backdrop-blur-md" />

            {/* Popup card */}
            <div
              className="relative z-10 w-[92vw] max-w-md mx-auto rounded-3xl border-2 border-[#4cff72]/30 bg-[#060e06] p-8 sm:p-10 flex flex-col items-center gap-6 shadow-[0_0_80px_rgba(76,255,114,.15)]"
              style={{ animation: "popup-scale .6s cubic-bezier(.34,1.56,.64,1) forwards" }}
            >
              {/* Pulsing ring + check circle */}
              <div className="relative">
                <div className="absolute -inset-3 rounded-full border-2 border-[#4cff72]/20" style={{ animation: "popup-ring 2s ease-in-out .6s infinite" }} />
                <div className="size-28 sm:size-32 rounded-full bg-[#4cff72]/10 border-2 border-[#4cff72] flex items-center justify-center shadow-[0_0_50px_rgba(76,255,114,.3)]">
                  <svg className="size-14 sm:size-16 text-[#4cff72]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: "popup-check .5s ease-out .35s forwards" }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              <div className="text-center space-y-2" style={{ animation: "popup-fade .5s ease-out .25s both" }}>
                <h1 className="text-[#4cff72] text-2xl sm:text-3xl font-black tracking-[.2em] uppercase drop-shadow-[0_0_16px_rgba(76,255,114,.4)]">Entry Granted</h1>
                <p className="text-white/60 text-xs sm:text-sm tracking-[.12em] uppercase">All Required PPE Verified</p>
                {optionalViolationDets.length > 0 && (
                  <p className="text-[#ffb042]/60 text-[10px] tracking-wider">{optionalViolationDets.length} optional item{optionalViolationDets.length !== 1 ? "s" : ""} waived by admin</p>
                )}
              </div>

              {/* Worker chip */}
              <div className="w-full bg-[#4cff72]/5 border border-[#4cff72]/15 rounded-2xl p-4 flex items-center gap-3" style={{ animation: "popup-fade .5s ease-out .4s both" }}>
                <div className="size-12 rounded-xl bg-[#4cff72]/15 border border-[#4cff72]/25 flex items-center justify-center text-[#4cff72] font-black text-base tracking-wider">{initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base tracking-wider truncate">{workerName}</p>
                  <p className="text-[#4cff72]/50 text-[10px] font-bold tracking-[.15em] uppercase">{workerCode}</p>
                </div>
                <svg className="size-6 text-[#4cff72] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>

              {/* Countdown */}
              <div className="w-full space-y-2" style={{ animation: "popup-fade .5s ease-out .55s both" }}>
                <div className="flex items-center justify-center gap-2">
                  <div className="size-2 rounded-full bg-[#4cff72]/50 animate-pulse" />
                  <span className="text-white/40 text-xs tracking-[.14em] uppercase font-bold">Auto-logout in <span className="text-[#4cff72] text-sm font-black tabular-nums">{countdown}</span>s</span>
                </div>
                <div className="h-1.5 bg-[#4cff72]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4cff72] rounded-full" style={{ animation: "popup-progress 5s linear forwards" }} />
                </div>
                <p className="text-center text-white/15 text-[8px] tracking-[.12em] uppercase">Session will end automatically</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
