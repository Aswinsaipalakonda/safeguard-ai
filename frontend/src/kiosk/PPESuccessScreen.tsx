import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useStore from "../store";

const kf = `
@keyframes success-scale-in{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes success-check{0%{stroke-dashoffset:100}100%{stroke-dashoffset:0}}
@keyframes success-ring-pulse{0%,100%{box-shadow:0 0 0 0 rgba(76,255,114,.4)}50%{box-shadow:0 0 0 30px rgba(76,255,114,0)}}
@keyframes success-fade-up{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
@keyframes success-progress{0%{width:100%}100%{width:0%}}
@keyframes success-glow{0%,100%{opacity:.6}50%{opacity:1}}
`;

export default function PPESuccessScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useStore((s) => s.logout);

  const workerName = (location.state as any)?.workerName || "Worker";
  const workerCode = (location.state as any)?.workerCode || "EMP-0000";
  const initials = workerName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [countdown, setCountdown] = useState(5);
  const [time] = useState(new Date());

  /* ── Auto-logout countdown ──────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          logout();
          localStorage.removeItem("safeguard_worker");
          navigate("/worker-login", { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [logout, navigate]);

  const fDate = time
    .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase()
    .replace(/,/g, "");
  const fTime = time.toLocaleTimeString("en-GB", { hour12: false });

  return (
    <>
      <style>{kf}</style>
      <div className="min-h-[100dvh] flex flex-col font-['Inter',system-ui,sans-serif] bg-[#030803] text-white relative overflow-hidden select-none">
        {/* CRT scanlines */}
        <div
          className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-[.08]"
          style={{
            background:
              "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.3) 3px,rgba(0,0,0,.3) 4px)",
          }}
        />

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4cff72]/10 rounded-full blur-[150px] pointer-events-none" />

        {/* ───── HEADER ───── */}
        <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#060e06]/90 backdrop-blur-md border-b border-[#4cff72]/20">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#4cff72]/15 border border-[#4cff72]/30 flex items-center justify-center text-lg">
              🛡️
            </div>
            <div>
              <div className="text-[#4cff72] text-xs font-bold tracking-[.18em] uppercase leading-none">
                SafeGuard AI
              </div>
              <div className="text-[#4cff72]/50 text-[9px] tracking-[.12em] uppercase leading-none mt-0.5">
                Entry Authorization
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[#4cff72] text-base font-bold tracking-[.1em] tabular-nums leading-none">
              {fTime}
            </div>
            <div className="text-[#4cff72]/40 text-[8px] tracking-[.1em] uppercase leading-none mt-0.5">
              {fDate}
            </div>
          </div>
        </header>

        {/* ───── MAIN ───── */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8">
          {/* ── Checkmark Circle ── */}
          <div
            className="relative"
            style={{ animation: "success-scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
          >
            {/* Pulsing ring */}
            <div
              className="absolute -inset-4 rounded-full border-2 border-[#4cff72]/20"
              style={{ animation: "success-ring-pulse 2s ease-in-out 0.8s infinite" }}
            />
            {/* Main circle */}
            <div className="size-32 sm:size-40 rounded-full bg-[#4cff72]/10 border-2 border-[#4cff72] flex items-center justify-center shadow-[0_0_60px_rgba(76,255,114,.3)]">
              <svg
                className="size-16 sm:size-20 text-[#4cff72]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: 100,
                  animation: "success-check 0.6s ease-out 0.4s forwards",
                }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          {/* ── Status Text ── */}
          <div
            className="text-center space-y-3"
            style={{ animation: "success-fade-up 0.6s ease-out 0.3s both" }}
          >
            <h1 className="text-[#4cff72] text-3xl sm:text-4xl font-black tracking-[.2em] uppercase drop-shadow-[0_0_20px_rgba(76,255,114,.4)]">
              Entry Granted
            </h1>
            <p className="text-white/60 text-sm tracking-[.15em] uppercase">
              All Required PPE Verified Successfully
            </p>
          </div>

          {/* ── Worker Card ── */}
          <div
            className="w-full max-w-sm"
            style={{ animation: "success-fade-up 0.6s ease-out 0.5s both" }}
          >
            <div className="bg-[#4cff72]/5 border border-[#4cff72]/20 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-xl bg-[#4cff72]/15 border border-[#4cff72]/25 flex items-center justify-center text-[#4cff72] font-black text-lg tracking-wider">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg tracking-wider truncate">
                    {workerName}
                  </p>
                  <p className="text-[#4cff72]/50 text-xs font-bold tracking-[.15em] uppercase">
                    {workerCode}
                  </p>
                </div>
                <div className="size-10 rounded-full bg-[#4cff72]/15 flex items-center justify-center">
                  <svg
                    className="size-5 text-[#4cff72]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#4cff72]/10 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[#4cff72]/40 text-[8px] font-bold tracking-[.12em] uppercase">
                    Status
                  </p>
                  <p className="text-[#4cff72] text-xs font-black tracking-wider mt-0.5">
                    CLEARED
                  </p>
                </div>
                <div>
                  <p className="text-[#4cff72]/40 text-[8px] font-bold tracking-[.12em] uppercase">
                    PPE Check
                  </p>
                  <p className="text-[#4cff72] text-xs font-black tracking-wider mt-0.5">
                    PASSED
                  </p>
                </div>
                <div>
                  <p className="text-[#4cff72]/40 text-[8px] font-bold tracking-[.12em] uppercase">
                    Time
                  </p>
                  <p className="text-white/70 text-xs font-bold tracking-wider mt-0.5">
                    {fTime}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Countdown ── */}
          <div
            className="w-full max-w-sm space-y-3"
            style={{ animation: "success-fade-up 0.6s ease-out 0.7s both" }}
          >
            <div className="flex items-center justify-center gap-2">
              <div
                className="size-2 rounded-full bg-[#4cff72]/50"
                style={{ animation: "success-glow 1.5s ease-in-out infinite" }}
              />
              <span className="text-white/40 text-xs tracking-[.15em] uppercase font-bold">
                Auto-logout in {countdown}s
              </span>
            </div>
            <div className="h-1.5 bg-[#4cff72]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4cff72] rounded-full"
                style={{ animation: "success-progress 5s linear forwards" }}
              />
            </div>
            <p className="text-center text-white/20 text-[9px] tracking-[.14em] uppercase">
              Session will end automatically
            </p>
          </div>
        </main>

        {/* ───── FOOTER ───── */}
        <footer className="relative z-10 flex items-center justify-center px-4 py-2 bg-[#060e06]/80 backdrop-blur-sm border-t border-[#4cff72]/15 text-[#4cff72]/30 text-[9px] uppercase tracking-[.1em] font-medium">
          <span>SafeGuard AI&ensp;·&ensp;LNIT SUMMIT 2K26&ensp;·&ensp;Kiosk Mode</span>
        </footer>
      </div>
    </>
  );
}
