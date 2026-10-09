"use client";

import { useState, useEffect } from "react";
import { X, Settings2, Check, RefreshCw, Sparkles, Building2, Cpu, Wrench } from "lucide-react";
import { AgentSettings } from "@/lib/types";
import { PersonaPreset } from "@/lib/ai/personas";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

const AVAILABLE_TOOLS = [
  { id: "check_availability", label: "Check Slot Availability", desc: "Allows agent to check clinic/calendar open times" },
  { id: "book_appointment", label: "Book Appointments", desc: "Confirms and books patient/customer appointments in DB" },
  { id: "cancel_or_reschedule_appointment", label: "Reschedule / Cancel", desc: "Modifies appointment records upon request" },
  { id: "lookup_knowledge_base", label: "Knowledge Base / FAQ", desc: "Searches business policies, prices, and questions" },
  { id: "escalate_to_human", label: "Escalate to Human", desc: "Automatic human handover on emergency or frustration" },
  { id: "collect_customer_lead", label: "Capture Leads", desc: "Records customer interest and contact info" },
];

export default function SettingsModal({
  isOpen,
  onClose,
  onSettingsSaved,
}: SettingsModalProps) {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [personas, setPersonas] = useState<PersonaPreset[]>([]);
  const [activeTab, setActiveTab] = useState<"persona" | "model" | "business" | "tools">("persona");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          setSettings(data.settings);
          setPersonas(data.personas || []);
        });
    }
  }, [isOpen]);

  if (!isOpen || !settings) return null;

  async function handleSave() {
    if (!settings || saving) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      onSettingsSaved();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleSelectPersona(p: PersonaPreset) {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            persona: p.id,
            system_prompt: p.system_prompt,
            business_name: p.business_name,
            business_hours: p.business_hours,
            address: p.address,
            phone_number: p.phone_number,
            email: p.email,
            enabled_tools: p.enabled_tools,
          }
        : null
    );
  }

  function toggleTool(toolId: string) {
    if (!settings) return;
    const exists = settings.enabled_tools.includes(toolId);
    setSettings({
      ...settings,
      enabled_tools: exists
        ? settings.enabled_tools.filter((t) => t !== toolId)
        : [...settings.enabled_tools, toolId],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1f1f23]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Agent Studio & Business Config</h2>
              <p className="text-xs text-zinc-400">
                Configure AI prompts, business profile, models, and tool permissions
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

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#141417] px-6 gap-2">
          <button
            onClick={() => setActiveTab("persona")}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === "persona"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Persona & Prompt
          </button>
          <button
            onClick={() => setActiveTab("model")}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === "model"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            AI Model & Provider
          </button>
          <button
            onClick={() => setActiveTab("business")}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === "business"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Business Profile
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === "tools"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Agent Tools ({settings.enabled_tools.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "persona" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Select Business Preset
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {personas.map((p) => {
                    const isSelected = settings.persona === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPersona(p)}
                        className={`text-left p-3.5 rounded-xl border transition ${
                          isSelected
                            ? "bg-emerald-950/30 border-emerald-500 text-white"
                            : "bg-[#202024] border-white/5 text-zinc-300 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs">{p.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">{p.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-400">
                    System Instructions (Prompt)
                  </label>
                  <span className="text-[11px] text-zinc-500">Live updated</span>
                </div>
                <textarea
                  rows={9}
                  value={settings.system_prompt}
                  onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === "model" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  AI Provider
                </label>
                <select
                  value={settings.provider}
                  onChange={(e) => setSettings({ ...settings, provider: e.target.value as any })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="openrouter">OpenRouter (Claude 3.5 Sonnet, GPT-4o, DeepSeek)</option>
                  <option value="groq">Groq (Ultra-fast Llama 3.3 70B - Recommended for WhatsApp)</option>
                  <option value="openai">OpenAI Direct (GPT-4o, GPT-4o-mini)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  placeholder="anthropic/claude-sonnet-4-20250514 or llama-3.3-70b-versatile"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Leave default or input any model ID supported by your chosen provider.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Creativity (Temperature)</span>
                  <span className="font-mono text-emerald-400">{settings.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.temperature}
                  onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          )}

          {activeTab === "business" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Business / Clinic Name
                  </label>
                  <input
                    type="text"
                    value={settings.business_name}
                    onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Public Contact Phone
                  </label>
                  <input
                    type="text"
                    value={settings.phone_number}
                    onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={settings.business_hours}
                  onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Clinic / Office Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {activeTab === "tools" && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Enable or disable agent function calling tools. When enabled, the AI can query data and execute actions autonomously on WhatsApp.
              </p>
              <div className="space-y-2.5">
                {AVAILABLE_TOOLS.map((tool) => {
                  const isEnabled = settings.enabled_tools.includes(tool.id);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isEnabled
                          ? "bg-[#202024] border-emerald-500/50"
                          : "bg-[#18181b] border-white/5 opacity-60"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-white flex items-center gap-2">
                          <span>{tool.label}</span>
                          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                            {tool.id}()
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{tool.desc}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          isEnabled
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-white/20"
                        }`}
                      >
                        {isEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#1f1f23]">
          {savedSuccess ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4" />
              Settings successfully saved!
            </span>
          ) : (
            <span className="text-xs text-zinc-400">Saved changes apply immediately</span>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
