import { useState, useEffect } from "react";
import { Check, X, HardHat, ShieldOff, Footprints, Eye, Hand } from "lucide-react";
import api from "../lib/api";

// Note: In a real app we would use exact SVG pictograms for PPE, 
// using Lucide icons as approximations for this demo.
const ppeList = [
  { id: "helmet", name: "HELMET", icon: HardHat, required: true },
  { id: "vest", name: "HIGH VIS VEST", icon: ShieldOff, required: true },
  { id: "boots", name: "SAFETY BOOTS", icon: Footprints, required: true },
  { id: "goggles", name: "EYE PROTECT", icon: Eye, required: false },
  { id: "gloves", name: "GLOVES", icon: Hand, required: false },
];

export default function PPECheckScreen() {
  // Simulate API returning violations after 1 second
  const [checking, setChecking] = useState(true);
  const [violations, setViolations] = useState<string[]>([]);
  const [approved, setApproved] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPPE = async () => {
      try {
        const response = await api.post('kiosk/verify-ppe/');
        setChecking(false);
        const data = response.data;
        
        const detectedViolations = data.missing || [];
        setViolations(detectedViolations);
        
        if (detectedViolations.length > 0) {
           setApproved(false);
           // Audio cue for illiterate worker
           try {
              const utter = new SpeechSynthesisUtterance(`PPE Violation Detected. Missing ${detectedViolations.join(', ')}.`);
              speechSynthesis.speak(utter);
           } catch(e) {}
        } else {
           setApproved(true);
        }
      } catch (error) {
        setChecking(false);
        setApproved(false);
      }
    };
    
    // Slight delay to simulate scanning process
    const timer = setTimeout(() => {
        checkPPE();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`h-screen w-screen flex flex-col items-center justify-center p-8 transition-colors duration-1000 ${approved === true ? 'bg-success-green' : approved === false ? 'bg-alert-red' : 'bg-black'}`}>
      
      <div className="absolute top-8 text-center w-full uppercase tracking-widest text-shadow-md">
         {checking ? (
            <h1 className="text-white text-5xl font-black">SCANNING REQUIRED GEAR</h1>
         ) : approved === true ? (
            <h1 className="text-black text-6xl font-black">ACCESS GRANTED</h1>
         ) : (
            <h1 className="text-white text-6xl font-black">ACCESS DENIED</h1>
         )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-6xl mt-20">
        {ppeList.map((item) => {
          const isViolated = violations.includes(item.id);
          const isScanning = checking;
          
          let cardStyle = "bg-slate-900 border-slate-700 text-slate-500 scale-100";
          if (!isScanning) {
             if (isViolated) {
                cardStyle = "bg-black border-4 border-white text-white shadow-[0_0_30px_rgb(255,255,255,0.4)] scale-110";
             } else {
                cardStyle = "bg-green-900/50 border-green-500/50 text-green-500 opacity-50";
             }
          }

          const IconComponent = item.icon;

          return (
            <div key={item.id} className={`flex flex-col items-center justify-center border-4 rounded-[2rem] p-10 transition-all duration-500 ${cardStyle}`}>
               <div className="relative">
                  <IconComponent className="w-32 h-32 mb-6" />
                  
                  {/* Status Overlay */}
                  {!isScanning && (
                     <div className="absolute -top-4 -right-4 p-2 rounded-full bg-white shadow-xl">
                        {isViolated ? (
                           <X className="w-16 h-16 text-alert-red stroke-4" />
                        ) : (
                           <Check className="w-16 h-16 text-success-green stroke-4" />
                        )}
                     </div>
                  )}
               </div>
               
               <span className="text-3xl font-black uppercase tracking-widest text-center mt-4">
                  {item.name}
               </span>
            </div>
          );
        })}
      </div>

      {/* Rety Button for Illiterate User (Massive Touch Target) */}
      {!checking && (
         <button 
           onClick={() => window.location.reload()}
           className="mt-16 bg-white text-black px-16 py-8 rounded-full text-4xl font-black uppercase tracking-widest shadow-2xl hover:bg-slate-200 active:scale-95 transition-transform"
         >
            {approved === false ? "FIX GEAR & RETRY" : "NEXT PERSON"}
         </button>
      )}
    </div>
  );
}
