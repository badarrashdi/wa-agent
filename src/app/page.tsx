"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare,
  Bot,
  User,
  Send,
  Calendar,
  Settings2,
  ShieldCheck,
  Search,
  Sparkles,
  Phone,
  Check,
  CheckCheck,
  AlertTriangle,
  RotateCcw,
  Plus,
  PlayCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ConversationWithLastMessage, Message, Appointment } from "@/lib/types";
import SimulatorModal from "@/components/SimulatorModal";
import SettingsModal from "@/components/SettingsModal";
import WebhookGuideModal from "@/components/WebhookGuideModal";
import AppointmentModal from "@/components/AppointmentModal";

export default function Dashboard() {
  // Data states
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "agent" | "human" | "escalated">("all");

  // Chat input states
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  // Modals
  const [showSimulator, setShowSimulator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selected = conversations.find((c) => c.id === selectedId);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/storage/status");
      const data = await res.json();
      setSystemStatus(data);
    } catch (err) {
      console.warn("Status fetch failed:", err);
    }
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
        if (!selectedId && data.length > 0) {
          setSelectedId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Conversations fetch error:", err);
    }
  }, [selectedId]);

  // Fetch messages
  const fetchMessages = useCallback(async (convoId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convoId}/messages`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Messages fetch error:", err);
    }
  }, []);

  // Fetch appointments for active user
  const fetchAppointments = useCallback(async (phone?: string) => {
    try {
      const url = phone ? `/api/appointments?phone=${encodeURIComponent(phone)}` : "/api/appointments";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err) {
      console.error("Appointments fetch error:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations();
    fetchStatus();
    fetchAppointments();
  }, [fetchConversations, fetchStatus, fetchAppointments]);

  // When selectedId changes
  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
      const activeConvo = conversations.find((c) => c.id === selectedId);
      if (activeConvo) {
        fetchAppointments(activeConvo.phone);
      }
    }
  }, [selectedId, fetchMessages, fetchAppointments, conversations]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Periodic polling fallback for zero-setup mode (every 4s)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchConversations();
      if (selectedId) {
        fetchMessages(selectedId);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchConversations, fetchMessages, selectedId]);


  // Toggle Mode (Agent <-> Human Takeover)
  async function toggleMode() {
    if (!selected) return;
    const newMode = selected.mode === "agent" ? "human" : "agent";
    const newStatus = newMode === "agent" ? "active" : selected.status;

    await fetch(`/api/conversations/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode, status: newStatus }),
    });

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selected.id ? { ...c, mode: newMode, status: newStatus } : c
      )
    );
  }

  // Resolve escalation
  async function resolveEscalation() {
    if (!selected) return;
    await fetch(`/api/conversations/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "agent", status: "active" }),
    });

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selected.id ? { ...c, mode: "agent", status: "active" } : c
      )
    );
  }

  // Send Manual Message
  async function handleSend(customText?: string) {
    const textToSend = customText || input;
    if (!textToSend.trim() || !selectedId || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend.trim() }),
      });
      const newMsg = await res.json();
      if (newMsg && newMsg.id) {
        setMessages((prev) => [...prev, newMsg]);
      }
      setInput("");
      fetchConversations();
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  }

  // Reset Demo Data
  async function handleResetData() {
    if (!confirm("Reset all conversation & appointment data back to default demo seeds?")) return;
    await fetch("/api/storage/status", { method: "POST" });
    fetchConversations();
    fetchStatus();
    fetchAppointments();
  }

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.last_message || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === "agent") return c.mode === "agent";
    if (filterMode === "human") return c.mode === "human";
    if (filterMode === "escalated") return c.status === "escalated";
    return true;
  });

  const activeUserAppointments = appointments.filter(
    (a) => selected && a.phone.replace(/\D/g, "") === selected.phone.replace(/\D/g, "")
  );

  return (
    <div className="flex flex-col h-screen bg-[#0c0c0e] text-zinc-100 font-sans select-none overflow-hidden">
      {/* Top Navigation & Status Bar */}
      <header className="h-14 border-b border-white/[0.08] bg-[#141417] px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <MessageSquare className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">WhatsApp AI Agent</span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  v2.0 Advanced
                </span>
              </div>
            </div>
          </div>

          {/* Persona / Business Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400 font-medium">Business:</span>
            <span className="font-semibold text-white">
              {systemStatus?.active_persona === "dental_clinic"
                ? "Toothsi Dental Clinic"
                : systemStatus?.active_persona === "customer_support"
                ? "SwiftHelp Support"
                : "Aura Essentials"}
            </span>
          </div>

          {/* Storage & AI Engine Status */}
          <div className="hidden lg:flex items-center gap-2">
            <span
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                systemStatus?.is_supabase_connected
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400"
              }`}
            >
              ● {systemStatus?.storage_provider || "Local Zero-Config"}
            </span>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
              ⚡ {systemStatus?.ai_status || "AI Agent Ready"}
            </span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Simulator Button */}
          <button
            onClick={() => setShowSimulator(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </button>

          {/* Appointments Button */}
          <button
            onClick={() => setShowAppointmentModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Appointments</span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {appointments.length}
            </span>
          </button>

          {/* Agent Studio / Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Agent Studio</span>
          </button>

          {/* Meta Webhook Guide */}
          <button
            onClick={() => setShowWebhookGuide(true)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition cursor-pointer"
            title="Meta Webhook Setup & Live Verification"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </button>

          {/* Reset Demo Seed */}
          <button
            onClick={handleResetData}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Reset to Demo Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace (3-Column Layout) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Conversation Sidebar */}
        <div className="w-80 md:w-88 border-r border-white/[0.08] bg-[#121215] flex flex-col shrink-0">
          {/* Search Box */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats, numbers, or tags..."
                className="w-full bg-[#1a1a1e] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-2.5">
              <button
                onClick={() => setFilterMode("all")}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition ${
                  filterMode === "all" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                onClick={() => setFilterMode("agent")}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition ${
                  filterMode === "agent" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-400 hover:text-white"
                }`}
              >
                🤖 AI
              </button>
              <button
                onClick={() => setFilterMode("human")}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition ${
                  filterMode === "human" ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-white"
                }`}
              >
                👤 Human
              </button>
              <button
                onClick={() => setFilterMode("escalated")}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition ${
                  filterMode === "escalated" ? "bg-red-500/20 text-red-400" : "text-zinc-400 hover:text-white"
                }`}
              >
                🚨 Alert
              </button>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">No conversations found.</p>
                <button
                  onClick={() => setShowSimulator(true)}
                  className="text-xs text-emerald-400 underline hover:text-emerald-300"
                >
                  Simulate a test message
                </button>
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const isSelected = convo.id === selectedId;
                const isEscalated = convo.status === "escalated";
                const isAgent = convo.mode === "agent";

                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedId(convo.id)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 relative cursor-pointer ${
                      isSelected
                        ? "bg-[#1c1c22] border-l-2 border-emerald-500"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                          isEscalated
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : isAgent
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {convo.name ? convo.name.slice(0, 2).toUpperCase() : convo.phone.slice(-2)}
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full border-2 border-[#121215] absolute -bottom-0.5 -right-0.5 ${
                          isEscalated
                            ? "bg-red-500"
                            : isAgent
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                    </div>

                    {/* Chat Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-xs text-white truncate">
                          {convo.name || convo.phone}
                        </span>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {convo.last_message_at
                            ? new Date(convo.last_message_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>

                      {/* Phone & Mode Badge */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-zinc-400 font-mono">{convo.phone}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isEscalated
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : isAgent
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {isEscalated ? "ESCALATED" : isAgent ? "AI AGENT" : "HUMAN"}
                        </span>
                      </div>

                      {/* Snippet */}
                      <p className="text-[11px] text-zinc-400 truncate">
                        {convo.last_message || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: WhatsApp Chat Area */}
        <div className="flex-1 flex flex-col bg-[#0b141a] relative">
          {/* Subtle WhatsApp chat wallpaper pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
              backgroundSize: "100px 100px",
            }}
          />

          {selected ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-6 bg-[#202c33] border-b border-white/[0.08] flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {selected.name ? selected.name.slice(0, 2).toUpperCase() : selected.phone.slice(-2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white">{selected.name || "WhatsApp User"}</h2>
                      {selected.status === "escalated" && (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Emergency / Doctor Alert
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="font-mono">{selected.phone}</span>
                      <span>•</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        WhatsApp Business Session Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mode Controller & Actions */}
                <div className="flex items-center gap-2.5">
                  {selected.status === "escalated" && (
                    <button
                      onClick={resolveEscalation}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolve Alert</span>
                    </button>
                  )}

                  {/* Mode Toggle Button */}
                  <button
                    onClick={toggleMode}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
                      selected.mode === "agent"
                        ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300"
                        : "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {selected.mode === "agent" ? (
                      <>
                        <Bot className="w-3.5 h-3.5" />
                        <span>🤖 Agent Mode (Auto-Reply ON)</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5" />
                        <span>👤 Human Mode (Takeover Active)</span>
                      </>
                    )}
                  </button>

                  {/* Quick Simulator CTA for this conversation */}
                  <button
                    onClick={() => {
                      setShowSimulator(true);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition cursor-pointer"
                    title="Simulate User Message for this Contact"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                    <Bot className="w-10 h-10 opacity-30" />
                    <p className="text-xs">No messages exchanged yet in this conversation.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAssistant = msg.role === "assistant";
                    const hasToolCalls = msg.tool_executions && msg.tool_executions.length > 0;
                    const isToolExpanded = expandedTools[msg.id];

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAssistant ? "items-end" : "items-start"}`}
                      >
                        {/* Tool Execution Card (if agent used tools) */}
                        {hasToolCalls && (
                          <div className="max-w-[75%] mb-1.5 w-full">
                            <div className="bg-[#182229] border border-emerald-500/30 rounded-xl overflow-hidden shadow-sm">
                              <button
                                onClick={() =>
                                  setExpandedTools((prev) => ({
                                    ...prev,
                                    [msg.id]: !prev[msg.id],
                                  }))
                                }
                                className="w-full px-3 py-1.5 text-left text-[11px] font-semibold text-emerald-400 bg-emerald-950/30 flex items-center justify-between hover:bg-emerald-950/50 transition cursor-pointer"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Agent Tool Execution ({msg.tool_executions?.length})</span>
                                </span>
                                {isToolExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {isToolExpanded && (
                                <div className="p-3 space-y-2 text-xs font-mono bg-[#111b21] divide-y divide-white/5">
                                  {msg.tool_executions?.map((tool, i) => (
                                    <div key={i} className="pt-2 first:pt-0 space-y-1">
                                      <div className="text-emerald-400 font-bold flex items-center justify-between">
                                        <span>tool: {tool.toolName}()</span>
                                        <span className="text-[10px] text-zinc-500">Function Calling</span>
                                      </div>
                                      <div className="text-zinc-400 text-[11px]">
                                        args: {JSON.stringify(tool.args)}
                                      </div>
                                      <div className="text-zinc-300 text-[11px] bg-black/30 p-2 rounded">
                                        result: {JSON.stringify(tool.result)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* WhatsApp Message Bubble */}
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md relative ${
                            isAssistant
                              ? "bg-[#005c4b] text-white rounded-tr-none"
                              : "bg-[#202c33] text-zinc-100 rounded-tl-none border border-white/5"
                          }`}
                        >
                          <div className="text-xs whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </div>

                          {/* Timestamp & Delivery Ticks */}
                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-white/60">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isAssistant && (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-300 inline" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Composer Bottom */}
              <div className="p-4 bg-[#202c33] border-t border-white/[0.08] shrink-0 z-10 space-y-2">
                {/* Canned Quick Response Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-zinc-500 font-semibold uppercase text-[10px] shrink-0">
                    Quick Reply:
                  </span>
                  <button
                    onClick={() => handleSend("Your dental appointment is officially confirmed! See you then.")}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 shrink-0 border border-white/10 transition cursor-pointer"
                  >
                    Confirm Appointment
                  </button>
                  <button
                    onClick={() => handleSend("Our clinic is located at 123 Health Ave, Suite 400. Parking is free.")}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 shrink-0 border border-white/10 transition cursor-pointer"
                  >
                    Share Address
                  </button>
                  <button
                    onClick={() => handleSend("I have alerted our dental supervisor. We are reviewing your record right now.")}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 shrink-0 border border-white/10 transition cursor-pointer"
                  >
                    Clinical Callback
                  </button>
                </div>

                {/* Input Bar */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 bg-[#2a3942] border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-emerald-500 transition">
                    <textarea
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={
                        selected.mode === "agent"
                          ? "Type a manual reply (AI Auto-Pilot will pause for this message)..."
                          : "Type reply to customer on WhatsApp..."
                      }
                      className="w-full bg-transparent text-xs text-white placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || sending}
                    className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 rounded-2xl text-white shadow-lg shadow-emerald-500/20 transition shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Agent Auto-Reply Notice */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                  <span>
                    {selected.mode === "agent"
                      ? "🤖 AI Agent is active. Messages sent from WhatsApp receive instant automated replies."
                      : "👤 Human Takeover is active. AI will not reply until switched back to Agent mode."}
                  </span>
                  <span className="text-zinc-500 font-mono text-[10px]">
                    Press Enter to send
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 space-y-3 z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                <Bot className="w-8 h-8" />
              </div>
              <h2 className="text-base font-semibold text-white">Select a WhatsApp Conversation</h2>
              <p className="text-xs text-zinc-400 max-w-sm text-center">
                Pick a chat from the sidebar to inspect messages, toggle AI/Human modes, review booked appointments, or trigger manual responses.
              </p>
              <button
                onClick={() => setShowSimulator(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md transition cursor-pointer"
              >
                Launch Simulator
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Customer Inspector & Appointments */}
        {selected && (
          <div className="w-72 lg:w-80 border-l border-white/[0.08] bg-[#121215] flex flex-col shrink-0 overflow-y-auto p-4 space-y-5">
            {/* Customer Profile Card */}
            <div className="bg-[#18181c] border border-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Customer Profile
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-sm flex items-center justify-center">
                  {selected.name ? selected.name.slice(0, 2).toUpperCase() : selected.phone.slice(-2)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selected.name || "WhatsApp Patient"}</h4>
                  <p className="text-xs text-zinc-400 font-mono">{selected.phone}</p>
                </div>
              </div>

              {/* Tags & Sentiment */}
              <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-semibold bg-white/5 text-zinc-300 px-2 py-0.5 rounded border border-white/10">
                  Channel: WhatsApp Cloud
                </span>
                {selected.metadata?.sentiment && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      selected.metadata.sentiment === "positive"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : selected.metadata.sentiment === "frustrated"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    }`}
                  >
                    Sentiment: {selected.metadata.sentiment.toUpperCase()}
                  </span>
                )}
              </div>

              {selected.metadata?.escalation_reason && (
                <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-300">
                  <div className="font-bold flex items-center gap-1 text-[11px] mb-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    Escalation Reason:
                  </div>
                  <p className="text-[11px] leading-relaxed">{selected.metadata.escalation_reason}</p>
                </div>
              )}
            </div>

            {/* Customer Booked Appointments */}
            <div className="bg-[#18181c] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Booked Appointments ({activeUserAppointments.length})
                </h3>
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Book</span>
                </button>
              </div>

              {activeUserAppointments.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center">
                  No appointments booked for this contact yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {activeUserAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 bg-[#111113] border border-white/10 rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-400">{apt.service}</span>
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                          {apt.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {apt.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.time_slot}
                        </span>
                      </div>
                      {apt.notes && <p className="text-[10px] text-zinc-500">{apt.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WhatsApp Integration Details */}
            <div className="bg-[#18181c] border border-white/10 rounded-xl p-4 space-y-2 text-xs text-zinc-400">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Integration Health
              </h3>
              <div className="flex items-center justify-between py-1 border-b border-white/5 text-[11px]">
                <span>Webhook Receiver</span>
                <span className="text-emerald-400 font-mono">/api/webhook</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5 text-[11px]">
                <span>Delivery Statuses</span>
                <span className="text-zinc-300">Sent, Delivered, Read</span>
              </div>
              <div className="flex items-center justify-between py-1 text-[11px]">
                <span>Tool Calling</span>
                <span className="text-emerald-400">Enabled (6 Tools)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SimulatorModal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
        onMessageSent={(convoId) => {
          setSelectedId(convoId);
          fetchConversations();
          fetchMessages(convoId);
          fetchAppointments();
        }}
        currentPhone={selected?.phone}
        currentName={selected?.name || undefined}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsSaved={() => {
          fetchStatus();
        }}
      />

      <WebhookGuideModal
        isOpen={showWebhookGuide}
        onClose={() => setShowWebhookGuide(false)}
        verifyToken={systemStatus?.verify_token}
      />

      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          fetchAppointments(selected?.phone);
        }}
        defaultPhone={selected?.phone}
        defaultName={selected?.name || undefined}
        conversationId={selected?.id}
      />
    </div>
  );
}
