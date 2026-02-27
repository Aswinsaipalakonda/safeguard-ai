import { useEffect, useState } from "react";
import { MoveRight, ScanFace } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function FaceScanScreen() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Kiosk auto-simulation
  useEffect(() => {
    // Audio instruction trigger
    try {
       const utterThis = new SpeechSynthesisUtterance("Please look at the camera for face scan");
       speechSynthesis.speak(utterThis);
    } catch (e) { console.warn("TTS blocked by browser policy without user interaction", e); }
    
    setTimeout(async () => {
      setScanning(true);
      try {
        await api.post('kiosk/scan-face/');
        setScanning(false);
        setScanned(true);
        // Auto redirect to PPE check
        setTimeout(() => navigate('/kiosk/ppe'), 1500);
      } catch (error) {
        console.error("Face scan failed", error);
        setScanning(false);
      }
    }, 2000);
  }, [navigate]);

  return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-mono">
      {/* Kiosk Background Texture */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="z-10 flex flex-col items-center">
         <h1 className="text-white text-5xl font-black mb-12 uppercase tracking-[0.3em] text-center">
            IDENTITY VERIFICATION
         </h1>
         
         {/* Giant Face Scanner UI */}
         <div className="relative w-96 h-128 border-4 border-slate-800 rounded-3xl overflow-hidden flex items-center justify-center bg-slate-900 shadow-2xl">
            {scanning && (
               <div className="absolute inset-0 bg-safety-yellow/20 animate-pulse"></div>
            )}
            
            {/* Scanner Line */}
            {scanning && (
               <div className="absolute top-0 left-0 right-0 h-2 bg-safety-yellow shadow-[0_0_20px_#eab308] animate-ping" style={{ animation: 'scan 2s infinite linear' }}></div>
            )}

            {!scanned ? (
               <ScanFace className={`w-48 h-48 ${scanning ? 'text-safety-yellow' : 'text-slate-700'}`} />
            ) : (
               <div className="text-success-green border-8 border-success-green w-48 h-48 rounded-full flex items-center justify-center bg-green-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
               </div>
            )}
         </div>

         {/* massive instruction block for illiterate context - bold shapes & colors */}
         <div className="mt-12 bg-slate-900 border-2 border-slate-700 rounded-full px-12 py-6 flex items-center space-x-6 cursor-pointer" onClick={() => navigate('/kiosk/ppe')}>
            <div className={`w-8 h-8 rounded-full ${scanned ? 'bg-green-500' : 'bg-safety-yellow animate-bounce'}`}></div>
            <span className="text-3xl text-white font-black uppercase tracking-widest">
               {scanned ? "VERIFIED. PROCEED" : "LOOK AT CAMERA"}
            </span>
            {scanned && <MoveRight className="w-10 h-10 text-white animate-pulse" />}
         </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
