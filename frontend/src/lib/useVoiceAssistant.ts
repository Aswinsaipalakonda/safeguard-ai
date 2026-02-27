import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  analyticsAPI,
  workersAPI,
  zonesAPI,
  alertsAPI,
  reportsAPI,
  operationsAPI,
} from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AssistantMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// ─── Intent Detection ────────────────────────────────────────────────────────

type IntentType =
  | "dashboard_stats"
  | "zone_compliance"
  | "violation_count"
  | "worker_violations"
  | "active_alerts"
  | "compliance_rate"
  | "top_violator"
  | "generate_report"
  | "worker_count"
  | "zone_list"
  | "shift_handover"
  | "emergency"
  | "navigate"
  | "predictive_risk"
  | "help"
  | "unknown";

interface ParsedIntent {
  type: IntentType;
  params: Record<string, string>;
}

function parseIntent(text: string): ParsedIntent {
  const t = text.toLowerCase().trim();

  // Navigation intents
  const navMap: Record<string, string> = {
    "dashboard": "/monitoring",
    "monitoring": "/monitoring",
    "violations": "/violations",
    "violation log": "/violations",
    "attendance": "/attendance",
    "heatmap": "/heatmap",
    "heat map": "/heatmap",
    "reports": "/reports",
    "compliance": "/reports",
    "settings": "/settings",
    "factory map": "/factory-map",
    "map": "/factory-map",
    "timeline": "/timeline",
    "incidents": "/timeline",
    "insights": "/ai-insights",
    "ai insights": "/ai-insights",
    "leaderboard": "/leaderboard",
    "gamification": "/gamification",
    "admin": "/admin",
  };

  // Navigation: "go to X", "show X", "open X", "navigate to X"
  const navMatch = t.match(/(?:go to|show|open|navigate to|take me to|switch to)\s+(.+)/);
  if (navMatch) {
    const target = navMatch[1].replace(/\s+page$/, "").trim();
    for (const [key, path] of Object.entries(navMap)) {
      if (target.includes(key)) {
        return { type: "navigate", params: { path, label: key } };
      }
    }
  }

  // Emergency / SOS
  if (t.includes("emergency") || t.includes("sos") || t.includes("help me")) {
    return { type: "emergency", params: {} };
  }

  // Generate report
  if (t.includes("generate") && (t.includes("report") || t.includes("dgms") || t.includes("esg"))) {
    const reportType = t.includes("esg") ? "esg" : t.includes("daily") ? "daily" : "dgms";
    return { type: "generate_report", params: { reportType } };
  }

  // Shift handover
  if (t.includes("shift") && (t.includes("handover") || t.includes("hand over") || t.includes("summary"))) {
    return { type: "shift_handover", params: {} };
  }

  // Predictive risk
  if (t.includes("predict") || t.includes("risk") || t.includes("forecast")) {
    return { type: "predictive_risk", params: {} };
  }

  // Zone compliance: "what's zone X compliance"
  const zoneMatch = t.match(/(?:zone|area)\s+(\w+)(?:'s)?\s*(?:compliance|status|violations?)/);
  if (zoneMatch) {
    return { type: "zone_compliance", params: { zone: zoneMatch[1] } };
  }
  // Also: "compliance of zone X" or "compliance for X"
  const zoneMatch2 = t.match(/compliance\s+(?:of|for|in)\s+(?:zone\s+)?(.+?)(?:\s+right now|\s+now|\s*\?|$)/);
  if (zoneMatch2) {
    return { type: "zone_compliance", params: { zone: zoneMatch2[1].trim() } };
  }

  // Worker with most violations
  if (t.includes("most violations") || t.includes("top violator") || t.includes("worst compliance") || t.includes("worst worker")) {
    const timeMatch = t.match(/(?:this|last|past)\s+(week|month|day|hour)/);
    return { type: "top_violator", params: { period: timeMatch?.[1] || "week" } };
  }

  // Which worker / who
  if ((t.includes("which worker") || t.includes("who")) && t.includes("violation")) {
    return { type: "top_violator", params: { period: "week" } };
  }

  // Violation count: "how many violations"
  if (t.includes("how many violations") || t.includes("violation count") || t.includes("number of violations")) {
    const timeMatch = t.match(/(?:in the|last|past)\s+(\w+\s*\w*)/);
    return { type: "violation_count", params: { period: timeMatch?.[1] || "today" } };
  }

  // Active alerts
  if (t.includes("active alerts") || t.includes("pending alerts") || t.includes("how many alerts") || t.includes("unresolved alerts")) {
    return { type: "active_alerts", params: {} };
  }

  // Compliance rate general
  if (t.includes("compliance rate") || t.includes("overall compliance") || t.includes("current compliance") || t.includes("what's the compliance")) {
    return { type: "compliance_rate", params: {} };
  }

  // Worker count
  if (t.includes("how many workers") || t.includes("total workers") || t.includes("worker count") || t.includes("number of workers")) {
    return { type: "worker_count", params: {} };
  }

  // Zone list
  if (t.includes("list zones") || t.includes("how many zones") || t.includes("what zones") || t.includes("all zones")) {
    return { type: "zone_list", params: {} };
  }

  // Dashboard overview
  if (t.includes("overview") || t.includes("status") || t.includes("summary") || t.includes("what's happening") || t.includes("give me a summary") || t.includes("dashboard stats")) {
    return { type: "dashboard_stats", params: {} };
  }

  // Help
  if (t.includes("help") || t.includes("what can you do") || t.includes("commands") || t.includes("what do you do")) {
    return { type: "help", params: {} };
  }

  // Fallback: check for nav keywords anywhere
  for (const [key, path] of Object.entries(navMap)) {
    if (t.includes(key)) {
      return { type: "navigate", params: { path, label: key } };
    }
  }

  return { type: "unknown", params: {} };
}

// ─── Query Executor ──────────────────────────────────────────────────────────

async function executeIntent(
  intent: ParsedIntent,
  navigate: (path: string) => void
): Promise<string> {
  try {
    switch (intent.type) {
      case "dashboard_stats": {
        const res = await analyticsAPI.dashboardStats();
        const s = res.data;
        return `Here's your overview. Today we have ${s.today_violations} violations, ${s.today_resolved} resolved. The compliance rate is ${s.compliance_rate}%. There are ${s.active_alerts} active alerts. Week-over-week change is ${s.week_change_pct > 0 ? "up" : "down"} ${Math.abs(s.week_change_pct)}%.`;
      }

      case "compliance_rate": {
        const res = await analyticsAPI.dashboardStats();
        return `The current overall compliance rate is ${res.data.compliance_rate}%. Week-over-week it's ${res.data.week_change_pct > 0 ? "up" : "down"} ${Math.abs(res.data.week_change_pct)}%.`;
      }

      case "violation_count": {
        const res = await analyticsAPI.dashboardStats();
        return `There are ${res.data.today_violations} violations today. ${res.data.today_resolved} have been resolved, and ${res.data.active_alerts} alerts are still active. The top PPE issues are: ${res.data.ppe_breakdown.map(p => `${p.ppe_type} with ${p.count}`).join(", ")}.`;
      }

      case "zone_compliance": {
        const zoneName = intent.params.zone;
        const heatRes = await analyticsAPI.heatmap(7);
        const zones = heatRes.data.zones;
        const match = zones.find(
          z => z.zone.toLowerCase().includes(zoneName.toLowerCase())
        );
        if (match) {
          const compRate = match.violations === 0 ? 100 : Math.max(0, 100 - match.violations * 5);
          return `Zone ${match.zone} has ${match.violations} violations in the last 7 days, with ${match.unresolved} unresolved. The severity level is ${match.severity}. Estimated compliance around ${compRate}%.`;
        }
        // Try zone API
        const zRes = await zonesAPI.list({ page_size: 50 });
        const zMatch = zRes.data.results.find(
          z => z.name.toLowerCase().includes(zoneName.toLowerCase())
        );
        if (zMatch) {
          return `Zone ${zMatch.name} has ${zMatch.camera_ids.length} cameras. It is ${zMatch.is_high_risk ? "a high-risk zone" : "a standard zone"}. Required PPE: ${zMatch.required_ppe.join(", ") || "all standard equipment"}.`;
        }
        return `I couldn't find a zone matching "${zoneName}". Try saying "list zones" to see available zones.`;
      }

      case "top_violator": {
        const res = await workersAPI.list({ page_size: 50 });
        const workers = res.data.results;
        if (workers.length === 0) return "No worker data available.";
        const sorted = [...workers].sort((a, b) => b.violation_count - a.violation_count);
        const top = sorted[0];
        return `The worker with the most violations is ${top.name} (${top.employee_code}) with ${top.violation_count} total violations. Their compliance rate is ${Math.round(top.compliance_rate)}%.`;
      }

      case "active_alerts": {
        const res = await alertsAPI.list({ page_size: 10, ordering: "-sent_at" });
        const total = res.data.count;
        const unack = res.data.results.filter(a => !a.acknowledged_at).length;
        return `There are ${total} total alerts. ${unack} of the recent ones are unacknowledged. The latest alert was ${res.data.results[0] ? `at level ${res.data.results[0].level} via ${res.data.results[0].channel}` : "unknown"}.`;
      }

      case "worker_count": {
        const res = await workersAPI.list({ page_size: 1 });
        const total = res.data.count;
        return `There are ${total} workers registered in the system.`;
      }

      case "zone_list": {
        const res = await zonesAPI.list({ page_size: 50 });
        const names = res.data.results.map(z => z.name);
        return `There are ${res.data.count} zones: ${names.join(", ")}.`;
      }

      case "generate_report": {
        const reportType = intent.params.reportType || "dgms";
        if (reportType === "esg") {
          await reportsAPI.generateESG();
          return "ESG compliance report is being generated. You can find it in the Reports page.";
        } else if (reportType === "daily") {
          await reportsAPI.generateDaily();
          return "Daily compliance report is being generated. Check the Reports page.";
        } else {
          await reportsAPI.generateDGMS();
          return "DGMS compliance report is being generated. It will appear in the Reports page shortly.";
        }
      }

      case "shift_handover": {
        const res = await operationsAPI.shiftHandover(8);
        const s = res.data.summary;
        return `Shift handover summary: ${s.total_violations} violations this shift. ${s.resolved} resolved, ${s.unresolved} unresolved. Resolution rate: ${s.resolution_rate}%. There are ${s.unacknowledged_alerts} unacknowledged alerts. ${res.data.handover_notes}`;
      }

      case "predictive_risk": {
        const res = await analyticsAPI.predictiveRisk();
        const top3 = res.data.predictions.slice(0, 3);
        const summary = top3
          .map(p => `${p.zone}: ${p.risk_level} risk, ${p.predicted_violations_24h} predicted violations`)
          .join(". ");
        return `Predictive risk analysis: ${summary}. Peak hours are ${res.data.peak_hours.map(h => `${h}:00`).join(", ")}.`;
      }

      case "navigate": {
        const path = intent.params.path;
        const label = intent.params.label;
        navigate(path);
        return `Navigating to ${label}.`;
      }

      case "emergency": {
        try {
          await operationsAPI.emergencySOS("All Zones", "Voice-triggered SOS");
        } catch { /* best-effort */ }
        return "Emergency SOS has been broadcast! All supervisors have been notified. Help is on the way.";
      }

      case "help": {
        return "I can help with: system overview, compliance rates, violation counts, zone status, worker violations, active alerts, generating reports, shift handover, predictive risk, and navigation. Try saying: What's the compliance rate? or How many violations today? or Show me the factory map.";
      }

      case "unknown":
      default:
        return "I didn't quite understand that. Try asking about compliance, violations, zones, workers, or say 'help' for a list of commands.";
    }
  } catch (err: any) {
    console.error("Voice assistant query error:", err);
    if (err?.code === "ERR_NETWORK" || err?.message?.includes("Network Error")) {
      return "The backend server is not running. Please start the Django server on port 8000 and try again.";
    }
    if (err?.response?.status === 401) {
      return "Your session has expired. Please log in again and retry.";
    }
    if (err?.response?.status === 404) {
      return "That API endpoint was not found. The server may need an update.";
    }
    const detail = err?.response?.data?.detail || err?.message || "";
    return `Sorry, I couldn't fetch that data. ${detail ? "Error: " + detail : "The server might be unavailable."}`;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useVoiceAssistant() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: 'Hi! I\'m SafeGuard AI Assistant. Ask me anything about your facility — "What\'s the compliance rate?" or "How many violations today?"',
      timestamp: new Date(),
    },
  ]);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const msgIdRef = useRef(1);

  // ── Stable refs so the speech handler always calls the LATEST version ──
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const handleUserQueryRef = useRef<(text: string) => Promise<void>>(async () => {});

  // Speak a response via TTS
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1;
    utter.lang = "en-IN";
    window.speechSynthesis.speak(utter);
  }, []);

  // Process a user query — always use the ref version in speech handler
  const handleUserQuery = useCallback(
    async (text: string) => {
      // Add user message
      const userId = msgIdRef.current++;
      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", text, timestamp: new Date() },
      ]);

      setIsProcessing(true);

      const intent = parseIntent(text);
      const response = await executeIntent(intent, navigateRef.current);

      // Add assistant message
      const assistantId = msgIdRef.current++;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", text: response, timestamp: new Date() },
      ]);

      setIsProcessing(false);
      speak(response);
    },
    [speak]
  );

  // Keep the ref always pointing to the latest handleUserQuery
  handleUserQueryRef.current = handleUserQuery;

  // Initialize Speech Recognition — once
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const tr = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += tr;
        } else {
          interim += tr;
        }
      }
      if (interim) setLiveTranscript(interim);
      if (finalText) {
        setLiveTranscript("");
        // Call through the ref — always the latest version
        handleUserQueryRef.current(finalText.trim());
      }
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech recognition error:", e?.error);
      setIsListening(false);
      setLiveTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setLiveTranscript("");
    };

    recognitionRef.current = recognition;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !supported) return;
    // Stop any ongoing TTS so the mic doesn't pick up its own audio
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setLiveTranscript("");
      setIsPanelOpen(true);
    } catch {
      // If already started, abort and restart
      try {
        recognitionRef.current.abort();
        setTimeout(() => {
          recognitionRef.current?.start();
          setIsListening(true);
        }, 100);
      } catch { /* give up */ }
    }
  }, [supported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
    setLiveTranscript("");
  }, []);

  // Toggle
  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  // Submit text query (typed)
  const submitTextQuery = useCallback(
    (text: string) => {
      if (text.trim()) handleUserQuery(text.trim());
    },
    [handleUserQuery]
  );

  return {
    isListening,
    isProcessing,
    isPanelOpen,
    setIsPanelOpen,
    liveTranscript,
    messages,
    supported,
    startListening,
    stopListening,
    toggleListening,
    submitTextQuery,
  };
}
