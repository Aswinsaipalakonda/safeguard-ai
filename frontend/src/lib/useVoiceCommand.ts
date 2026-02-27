import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface VoiceCommand {
  phrases: string[];
  action: (navigate: ReturnType<typeof useNavigate>) => void;
  description: string;
}

const COMMANDS: VoiceCommand[] = [
  { phrases: ["show violations", "open violations", "violations"], action: (nav) => nav("/violations"), description: "Go to Violations Log" },
  { phrases: ["show dashboard", "open dashboard", "go to dashboard", "dashboard"], action: (nav) => nav("/monitoring"), description: "Go to Dashboard" },
  { phrases: ["show attendance", "open attendance", "attendance"], action: (nav) => nav("/attendance"), description: "Go to Attendance" },
  { phrases: ["show heatmap", "open heatmap", "heat map"], action: (nav) => nav("/heatmap"), description: "Go to Heatmap" },
  { phrases: ["show reports", "open reports", "generate report", "reports"], action: (nav) => nav("/reports"), description: "Go to Reports" },
  { phrases: ["show settings", "open settings", "settings"], action: (nav) => nav("/settings"), description: "Go to Settings" },
  { phrases: ["show map", "open map", "factory map", "show factory"], action: (nav) => nav("/factory-map"), description: "Go to Factory Map" },
  { phrases: ["show timeline", "open timeline", "incidents", "incident timeline"], action: (nav) => nav("/timeline"), description: "Go to Timeline" },
  { phrases: ["show insights", "ai insights", "open insights", "model performance"], action: (nav) => nav("/ai-insights"), description: "Go to AI Insights" },
  { phrases: ["show leaderboard", "leaderboard", "open leaderboard"], action: (nav) => nav("/leaderboard"), description: "Go to Leaderboard" },
  { phrases: ["emergency", "sos", "help", "alert"], action: () => { /* handled specially */ }, description: "Trigger Emergency Alert" },
];

export function useVoiceCommand() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        processCommand(finalTranscript.toLowerCase().trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const processCommand = useCallback((text: string) => {
    for (const cmd of COMMANDS) {
      for (const phrase of cmd.phrases) {
        if (text.includes(phrase)) {
          setLastCommand(cmd.description);
          cmd.action(navigate);
          // Voice feedback
          if ("speechSynthesis" in window) {
            const utter = new SpeechSynthesisUtterance(cmd.description);
            utter.rate = 1.1;
            utter.pitch = 1;
            window.speechSynthesis.speak(utter);
          }
          return;
        }
      }
    }
    setLastCommand("Command not recognized");
  }, [navigate]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !supported) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript("");
      setLastCommand("");
    } catch { /* already started */ }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    lastCommand,
    supported,
    startListening,
    stopListening,
    toggleListening,
    commands: COMMANDS.map(c => ({ phrase: c.phrases[0], description: c.description })),
  };
}
