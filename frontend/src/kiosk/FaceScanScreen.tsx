import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, ScanFace, Scan } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import useStore from "../store";

const translations = {
  en: {
    selectLanguage: "SELECT LANGUAGE",
    title: "IDENTITY VERIFICATION",
    instruction: "PLEASE LOOK AT THE CAMERA",
    success: "IDENTITY VERIFIED",
    failed: "AUTHENTICATION FAILED",
    voiceInstruction: "Please look directly at the camera for identity verification.",
    voiceSuccess: "Identity verified. Please proceed.",
    voiceFailed: "Scan failed. Please try again."
  },
  hi: {
    selectLanguage: "भाषा चुनें",
    title: "पहचान सत्यापन",
    instruction: "कृपया कैमरे की ओर देखें",
    success: "पहचान सत्यापित",
    failed: "प्रमाणीकरण विफल",
    voiceInstruction: "कृपया पहचान सत्यापन के लिए कैमरे की ओर देखें।",
    voiceSuccess: "पहचान सत्यापित। कृपया आगे बढ़ें।",
    voiceFailed: "स्कैन विफल। कृपया पुनः प्रयास करें।"
  }
};

export default function FaceScanScreen() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const text = translations[language as 'en' | 'hi'];

  useEffect(() => {
    let active = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable", err);
        setCameraActive(false);
      }
    };
    startCamera();
    
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const speak = useCallback((message: string, lang: 'en' | 'hi' = language as 'en' | 'hi') => {
     try {
        window.speechSynthesis.cancel();
        const utterThis = new SpeechSynthesisUtterance(message);
        utterThis.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
        utterThis.rate = 0.9;
        utterThis.pitch = 1;
        window.speechSynthesis.speak(utterThis);
     } catch (e) { console.warn("TTS block", e); }
  }, [language]);

  const triggerScan = useCallback(async () => {
    if (scanning || scanned) return;
    setScanning(true);
    speak("Scanning face...");
    
    try {
      // Small delay to simulate scanning process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const res = await api.post('kiosk/scan-face/');
      if (res.status === 200) {
        setScanning(false);
        setScanned(true);
        setHasFailed(false);
        speak(translations[language as 'en' | 'hi'].voiceSuccess);
        setTimeout(() => navigate('/kiosk/ppe'), 2000);
      }
    } catch (error) {
      console.warn("Face scan endpoint not found, falling back to demo simulation", error);
      setScanning(false);
      setScanned(true);
      setHasFailed(false);
      speak(translations[language as 'en' | 'hi'].voiceSuccess);
      setTimeout(() => navigate('/kiosk/ppe'), 2000);
    }
  }, [scanning, scanned, navigate, language, speak]);

  return (
    <div className="min-h-screen w-full bg-[#05050A] flex flex-col relative overflow-hidden font-sans text-white">
      
      {/* Top Navigation Bar */}
      <div className="w-full p-6 flex justify-between items-start z-50">
        <div className="flex bg-[#121520] rounded-xl border border-white/5 p-1">
          <button 
            onClick={() => { setLanguage('en'); speak(translations.en.voiceInstruction, 'en'); }} 
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${language === 'en' ? 'bg-[#4F46E5] text-white' : 'text-slate-400 hover:text-white'}`}
          >
             ENGLISH
          </button>
          <button 
            onClick={() => { setLanguage('hi'); speak(translations.hi.voiceInstruction, 'hi'); }} 
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${language === 'hi' ? 'bg-[#4F46E5] text-white' : 'text-slate-400 hover:text-white'}`}
          >
             हिंदी
          </button>
        </div>
        
        <div className="flex gap-4">
           <div className="px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[#0F172A] border-white/5 text-slate-300">
             NODE 01 ACTIVE
           </div>
           <div className="px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[#0F172A] border-white/5 text-slate-300 flex items-center gap-2">
             <Volume2 className="w-4 h-4 text-slate-400" /> AUDIO ON
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-16 z-10">
        
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-white mb-10 drop-shadow-lg">
          {text.title}
        </h1>

        {/* Camera Container */}
        <div className="relative w-[500px] max-w-[90vw] aspect-[4/3] bg-[#0A0D14] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-1000 ${cameraActive ? 'opacity-80' : 'opacity-0'}`} 
          />
          
          {/* Subtle Face Outline */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ScanFace className="w-48 h-48 text-white/20" strokeWidth={1} />
          </div>

          {/* Scanning Animation */}
          {scanning && (
            <>
              <div className="absolute inset-0 bg-indigo-500/10 z-10 pointer-events-none blur-[1px]"></div>
              <div className="absolute left-0 right-0 h-1.5 bg-indigo-400 shadow-[0_0_15px_#818cf8] animate-[scan_2s_infinite_ease-in-out] z-20 pointer-events-none"></div>
            </>
          )}

          {/* Success Animation */}
          {scanned && !hasFailed && (
            <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm z-30 flex items-center justify-center animate-in fade-in">
               <p className="text-emerald-400 font-bold tracking-widest uppercase text-2xl drop-shadow-lg">{text.success}</p>
            </div>
          )}

          {/* Failure Animation */}
          {hasFailed && (
            <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm z-30 flex items-center justify-center animate-in fade-in">
               <p className="text-red-400 font-bold tracking-widest uppercase text-2xl drop-shadow-lg">{text.failed}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={triggerScan}
          disabled={scanning || scanned}
          className="mt-8 px-8 py-4 bg-[#0F172A] hover:bg-[#1E293B] border border-white/5 rounded-2xl flex items-center gap-4 transition-all active:scale-95 group disabled:opacity-50 disabled:pointer-events-none w-[500px] max-w-[90vw] justify-center"
        >
          <Scan className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
          <span className="text-sm font-bold tracking-widest uppercase text-slate-200">
            {scanning ? "ANALYZING..." : text.instruction}
          </span>
        </button>

      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
