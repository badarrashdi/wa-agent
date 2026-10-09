"use client";

import { useState } from "react";
import { X, Copy, Check, ExternalLink, ShieldCheck, PlayCircle, Radio } from "lucide-react";

interface WebhookGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  verifyToken?: string;
}

export default function WebhookGuideModal({
  isOpen,
  onClose,
  verifyToken = "whatsapp_agent_verify_token_123",
}: WebhookGuideModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const webhookUrl = `${origin}/api/webhook`;

  async function testLocalHandshake() {
    setTesting(true);
    setTestStatus(null);
    try {
      const testChallenge = "test_challenge_abc_123";
      const res = await fetch(
        `/api/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
          verifyToken
        )}&hub.challenge=${testChallenge}`
      );
      const text = await res.text();
      if (res.ok && text === testChallenge) {
        setTestStatus("✅ GET Verification Challenge PASSED (HTTP 200)");
      } else {
        setTestStatus(`❌ Verification failed: HTTP ${res.status} - ${text}`);
      }
    } catch (e: any) {
      setTestStatus(`❌ Error connecting to webhook: ${e.message}`);
    } finally {
      setTesting(false);
    }
  }

  function copyToClipboard(text: string, type: "url" | "token") {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1f1f23]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Meta WhatsApp Webhook Setup</h2>
              <p className="text-xs text-zinc-400">
                Official Meta Cloud API webhook configuration & live verification
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Credentials Card */}
          <div className="space-y-3 bg-[#121214] border border-white/10 rounded-xl p-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Webhook Callback URL
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 truncate">
                  {webhookUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(webhookUrl, "url")}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium flex items-center gap-1.5 transition text-white"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                For local testing with Meta, forward via ngrok: <code>ngrok http 3000</code> and use your ngrok URL.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Webhook Verify Token
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-blue-400 truncate">
                  {verifyToken}
                </code>
                <button
                  onClick={() => copyToClipboard(verifyToken, "token")}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium flex items-center gap-1.5 transition text-white"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Test Handshake Button */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Test local webhook verification handshake:</span>
              <button
                onClick={testLocalHandshake}
                disabled={testing}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>{testing ? "Testing..." : "Test Verification"}</span>
              </button>
            </div>

            {testStatus && (
              <div className="bg-[#18181b] border border-white/10 rounded-lg p-2.5 text-xs font-mono text-zinc-300">
                {testStatus}
              </div>
            )}
          </div>

          {/* Setup Steps */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              3-Step Meta Developer Portal Setup
            </h3>
            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="p-3 bg-[#202024] rounded-xl border border-white/5 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Open WhatsApp Configuration</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Go to{" "}
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 underline inline-flex items-center gap-1"
                    >
                      Meta Developer Dashboard <ExternalLink className="w-3 h-3" />
                    </a>{" "}
                    &gt; Select your App &gt; WhatsApp &gt; <strong>Configuration</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#202024] rounded-xl border border-white/5 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Paste Callback URL & Verify Token</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Click <strong>Edit</strong> under Webhook. Paste the Callback URL and Verify Token from above, then click <strong>Verify and save</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#202024] rounded-xl border border-white/5 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">Subscribe to "messages"</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Under Webhook Fields, click <strong>Manage</strong> and check the <strong>messages</strong> box. You're ready to receive live WhatsApp chats!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-white/10 bg-[#1f1f23]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
