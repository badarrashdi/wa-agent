import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const diagnostics: Record<string, any> = {
    env_vars_present: {
      WHATSAPP_PHONE_NUMBER_ID: Boolean(phoneId),
      WHATSAPP_ACCESS_TOKEN: Boolean(token),
      WHATSAPP_VERIFY_TOKEN: Boolean(verifyToken),
      GROQ_API_KEY: Boolean(groqKey),
      GEMINI_API_KEY: Boolean(geminiKey),
      NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(supabaseKey),
    },
    meta_whatsapp: {
      status: "untested",
    },
    groq_ai: {
      status: "untested",
    },
    gemini_ai: {
      status: "untested",
    },
    supabase_db: {
      status: "untested",
    },
  };

  // 1. Test Supabase
  try {
    const settings = await storage.getSettings();
    diagnostics.supabase_db = {
      status: "healthy",
      connected: true,
      business_name: settings.business_name,
    };
  } catch (err: any) {
    diagnostics.supabase_db = {
      status: "error",
      error: err.message || String(err),
    };
  }

  // 2. Test Groq API (Primary if configured)
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: {
          Authorization: `Bearer ${groqKey}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        diagnostics.groq_ai = {
          status: "healthy",
          valid: true,
          default_model: process.env.AI_MODEL || "openai/gpt-oss-120b",
          active: true,
        };
      } else {
        diagnostics.groq_ai = { status: "error", error: data?.error?.message || data };
      }
    } catch (err: any) {
      diagnostics.groq_ai = { status: "network_error", error: err.message };
    }
  } else {
    diagnostics.groq_ai = { status: "not_configured" };
  }

  // 3. Test Gemini API
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        diagnostics.gemini_ai = { status: "healthy", valid: true };
      } else {
        diagnostics.gemini_ai = { status: "error", error: data?.error?.message || data };
      }
    } catch (err: any) {
      diagnostics.gemini_ai = { status: "network_error", error: err.message };
    }
  } else {
    diagnostics.gemini_ai = { status: "missing_api_key" };
  }

  // 4. Test Meta WhatsApp Phone ID & Token
  if (phoneId && token) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v22.0/${phoneId}?fields=id,display_phone_number,name_status,status&access_token=${token}`
      );
      const phoneData = await res.json();

      if (res.ok) {
        diagnostics.meta_whatsapp = {
          status: "healthy",
          phone_number: phoneData.display_phone_number,
          connection_status: phoneData.status,
          phone_id: phoneData.id,
        };
      } else {
        diagnostics.meta_whatsapp = {
          status: "token_or_phone_id_error",
          error: phoneData.error?.message || phoneData,
          code: phoneData.error?.code,
          details: phoneData.error?.error_data?.details,
        };
      }
    } catch (err: any) {
      diagnostics.meta_whatsapp = { status: "network_error", error: err.message };
    }
  } else {
    diagnostics.meta_whatsapp = { status: "missing_credentials" };
  }

  return Response.json(diagnostics);
}
