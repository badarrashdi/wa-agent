import { storage } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isWhatsAppConfigured } from "@/lib/whatsapp";

export async function GET() {
  const isSupabase = isSupabaseConfigured();
  const isWhatsApp = isWhatsAppConfigured();
  const convos = await storage.getConversations();
  const appointments = await storage.getAppointments();
  const settings = await storage.getSettings();

  const hasApiKey = !!(
    process.env.GEMINI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GROQ_API_KEY
  );

  const activeProvider = process.env.GEMINI_API_KEY ? "Google Gemini" : settings.provider.toUpperCase();

  return Response.json({
    storage_provider: isSupabase ? "Supabase (PostgreSQL)" : "Local Persistent Engine (Zero-Setup)",
    is_supabase_connected: isSupabase,
    is_whatsapp_connected: isWhatsApp,
    ai_status: hasApiKey ? `Connected (${activeProvider})` : "Zero-Config Fallback Simulator",
    has_ai_key: hasApiKey,
    conversations_count: convos.length,
    appointments_count: appointments.length,
    active_persona: settings.persona,
    webhook_url: "/api/webhook",
    verify_token: process.env.WHATSAPP_VERIFY_TOKEN || "whatsapp_agent_verify_token_123",
  });
}

export async function POST() {
  await storage.resetData();
  return Response.json({ success: true, message: "Storage reset to default seed data" });
}
