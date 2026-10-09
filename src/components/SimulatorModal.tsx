"use client";

import { useState } from "react";
import { X, Send, Bot, User, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, RefreshCw } from "lucide-react";

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageSent: (conversationId: string) => void;
  currentPhone?: string;
  currentName?: string;
}

const PRESET_SCENARIOS = [
  {
    title: "📅 Book Strategy Call",
    desc: "Test consultation slot booking with Senior Strategy Director",
    message: "Hi! We're planning an international rebrand and would like to schedule a 30-min strategy discovery call this Friday at 10:00 AM.",
  },
  {
    title: "💡 AI Marketing & LLM SEO",
    desc: "Test knowledge base retrieval for AI workflows & LLM share-of-voice",
    message: "What AI-powered marketing services do you offer, and how do you optimize brands for LLM Share-of-Voice?",
  },
  {
    title: "🚀 Urgent $250k RFP (Escalation)",
    desc: "Test automated detection & immediate escalation to Managing Director",
    message: "We have an urgent $250k RFP for an omni-channel global campaign with a 48h deadline. Can I speak with your Managing Director today?",
  },
  {
    title: "📍 Global Offices & Clients",
    desc: "Test agency credentials, office locations, and case studies",
    message: "Where are your global offices located, and what campaigns have you delivered for brands like Specialized and Vans?",
  },
];

export default function SimulatorModal({
  isOpen,
  onClose,
  onMessageSent,
  currentPhone = "+44 7700 900123",
  currentName = "Liam Henderson",
}: SimulatorModalProps) {
  const [phone, setPhone] = useState(currentPhone);
  const [name, setName] = useState(currentName);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  if (!isOpen) return null;

  async function handleSimulate(customMsg?: string) {
    const textToSend = (customMsg !== undefined ? customMsg : message).trim();
    if (!textToSend || loading) return;

    setLoading(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          name: name.trim(),
          message: textToSend,
        }),
      });

      const data = await res.json();
      setLastResult(data);
      if (data.conversation?.id) {
        onMessageSent(data.conversation.id);
      }
      if (!customMsg) {
        setMessage("");
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1f1f23]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">WhatsApp Webhook Simulator</h2>
              <p className="text-xs text-zinc-400">
                Simulate incoming WhatsApp messages & test AI tool calling end-to-end
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Contact Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Simulated Sender Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 234-5678"
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Customer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Jenkins"
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Quick Test Scenarios (1-Click Run)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_SCENARIOS.map((scenario, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setMessage(scenario.message);
                    handleSimulate(scenario.message);
                  }}
                  disabled={loading}
                  className="text-left p-3 rounded-xl bg-[#202024] hover:bg-[#27272c] border border-white/5 hover:border-emerald-500/30 transition group flex flex-col justify-between"
                >
                  <div className="font-medium text-xs text-white group-hover:text-emerald-400 transition flex items-center justify-between w-full">
                    <span>{scenario.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition" />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{scenario.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Custom WhatsApp Message
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type any message to test how the agent handles it..."
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition resize-none"
              />
              <button
                onClick={() => handleSimulate()}
                disabled={!message.trim() || loading}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 transition"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send to Webhook</span>
              </button>
            </div>
          </div>

          {/* Results Telemetry */}
          {lastResult && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Webhook Ingestion Successful
                </span>
                <span className="text-zinc-400 text-[11px]">
                  Mode: {lastResult.conversation?.mode?.toUpperCase()}
                </span>
              </div>

              {/* Tool Execution Logs */}
              {lastResult.toolExecutions?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Tools Executed by Agent:
                  </span>
                  {lastResult.toolExecutions.map((t: any, i: number) => (
                    <div
                      key={i}
                      className="bg-[#121214] border border-white/10 rounded-lg p-2.5 text-xs font-mono space-y-1"
                    >
                      <div className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t.toolName}()</span>
                      </div>
                      <div className="text-zinc-400 text-[11px]">
                        Result: {JSON.stringify(t.result).slice(0, 120)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Outgoing AI Reply */}
              {lastResult.reply && (
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                    WhatsApp AI Reply Sent Back:
                  </span>
                  <div className="bg-[#18181b] border border-white/10 rounded-lg p-3 text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {lastResult.reply}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-[#1f1f23] text-xs text-zinc-400">
          <span>Updates conversation list & chat stream in real time</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
