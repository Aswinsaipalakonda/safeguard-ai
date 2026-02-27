import { useState, useRef, useEffect } from "react";
import { Mic, X, Send, BrainCircuit, Loader2, Volume2 } from "lucide-react";
import type { AssistantMessage } from "../lib/useVoiceAssistant";

interface VoiceAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  isProcessing: boolean;
  liveTranscript: string;
  messages: AssistantMessage[];
  supported: boolean;
  onToggleListening: () => void;
  onSubmitText: (text: string) => void;
}

const SUGGESTIONS = [
  "What's the compliance rate?",
  "How many violations today?",
  "List all zones",
  "Which worker has the most violations?",
  "Give me a summary",
  "Generate a DGMS report",
];

export default function VoiceAssistantPanel({
  isOpen,
  onClose,
  isListening,
  isProcessing,
  liveTranscript,
  messages,
  supported,
  onToggleListening,
  onSubmitText,
}: VoiceAssistantPanelProps) {
  const [textInput, setTextInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, liveTranscript, isProcessing]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      onSubmitText(textInput);
      setTextInput("");
    }
  };

  const handleSuggestion = (text: string) => {
    if (!isProcessing) {
      onSubmitText(text);
    }
  };

  if (!isOpen) return null;

  const showSuggestions = messages.length <= 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-4 right-4 bottom-4 w-full max-w-[440px] z-50 flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1443] to-[#2c1555] px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <BrainCircuit className="text-purple-300" size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">SafeGuard AI Assistant</h3>
              <p className="text-purple-300/80 text-[11px]">
                {isListening
                  ? "🎙️ Listening..."
                  : isProcessing
                  ? "⏳ Processing..."
                  : "Ask anything about your facility"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a1443] to-[#2c1555] flex items-center justify-center shrink-0 mt-1 mr-2">
                  <BrainCircuit size={14} className="text-purple-300" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#1a1443] text-white rounded-2xl rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <Volume2 size={10} className="text-purple-500" />
                    <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">
                      SafeGuard AI
                    </span>
                  </div>
                )}
                {msg.text}
                <div
                  className={`text-[10px] mt-1 ${
                    msg.role === "user" ? "text-white/40" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Live transcript bubble */}
          {liveTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] px-4 py-2.5 bg-[#1a1443]/50 text-white/80 rounded-2xl rounded-br-sm text-[13px] italic border border-purple-400/30">
                <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-1.5 animate-pulse" />
                {liveTranscript}
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a1443] to-[#2c1555] flex items-center justify-center shrink-0 mt-1 mr-2">
                <BrainCircuit size={14} className="text-purple-300" />
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 rounded-2xl rounded-bl-sm text-[13px] text-slate-500">
                <Loader2 size={14} className="animate-spin text-purple-500" />
                Querying systems...
              </div>
            </div>
          )}

          {/* Suggestion chips — only on first load */}
          {showSuggestions && !isProcessing && (
            <div className="pt-2">
              <p className="text-[11px] text-slate-400 font-medium mb-2">
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="px-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-full text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input area — ChatGPT style */}
        <div className="border-t border-slate-200 px-4 py-3 bg-white shrink-0">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-1.5 border border-slate-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/20 transition-all"
          >
            {/* Mic button inline */}
            {supported && (
              <button
                type="button"
                onClick={onToggleListening}
                disabled={isProcessing}
                className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 text-white shadow-md shadow-red-200"
                    : "text-slate-400 hover:text-purple-600 hover:bg-purple-100"
                } ${isProcessing ? "opacity-40 cursor-not-allowed" : ""}`}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                <Mic size={18} />
                {isListening && (
                  <span className="absolute w-9 h-9 rounded-full border-2 border-red-400 animate-ping" />
                )}
              </button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={isListening ? liveTranscript || "" : textInput}
              onChange={(e) => {
                if (!isListening) setTextInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  handleSubmit(e);
                }
              }}
              placeholder={
                isListening
                  ? "Listening... speak now"
                  : "Ask about compliance, violations, zones..."
              }
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none py-2"
              disabled={isProcessing}
              readOnly={isListening}
            />

            <button
              type="submit"
              disabled={(!textInput.trim() && !isListening) || isProcessing}
              className="shrink-0 w-9 h-9 rounded-full bg-[#1a1443] text-white flex items-center justify-center hover:bg-[#2c1555] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 mt-2">
            SafeGuard AI • Voice + Text • Real-time facility data
          </p>
        </div>
      </div>
    </>
  );
}
