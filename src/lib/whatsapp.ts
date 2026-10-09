export interface WhatsAppSendResult {
  messaging_product?: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
  simulated?: boolean;
  error?: any;
}

export function isWhatsAppConfigured(): boolean {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return !!(
    token &&
    phoneId &&
    !token.includes("your-permanent-token") &&
    !phoneId.includes("your-phone-number-id")
  );
}

/**
 * Send WhatsApp text message via Meta Graph API v22.0
 * Falls back to simulation during local development when credentials are unset.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Clean phone number (strip +, whitespace, parentheses, dashes - Meta expects pure digits e.g. 918802368235)
  const cleanTo = to.replace(/\D/g, "");

  if (!isWhatsAppConfigured()) {
    console.log(
      `[WhatsApp Sim] -> Outgoing to ${cleanTo}: "${body.slice(0, 80)}..." (Simulation Mode)`
    );
    return {
      messaging_product: "whatsapp",
      contacts: [{ input: cleanTo, wa_id: cleanTo.replace("+", "") }],
      messages: [{ id: `wamid.sim_${Date.now()}` }],
      simulated: true,
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanTo,
          type: "text",
          text: {
            preview_url: false,
            body,
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("[WhatsApp API Error]:", JSON.stringify(data));
      return {
        error: data?.error || data,
        simulated: false,
      };
    }
    return data;
  } catch (error) {
    console.error("[WhatsApp Network Error]:", error);
    return {
      error,
      simulated: true,
      messages: [{ id: `wamid.sim_fallback_${Date.now()}` }],
    };
  }
}

/**
 * Send WhatsApp interactive button reply message
 */
export async function sendWhatsAppInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const cleanTo = to.replace(/\D/g, "");

  if (!isWhatsAppConfigured()) {
    console.log(`[WhatsApp Sim Interactive] -> Outgoing to ${cleanTo}: ${buttons.map((b) => b.title).join(", ")}`);
    return {
      messaging_product: "whatsapp",
      simulated: true,
      messages: [{ id: `wamid.sim_btn_${Date.now()}` }],
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanTo,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: bodyText },
            action: {
              buttons: buttons.slice(0, 3).map((b) => ({
                type: "reply",
                reply: { id: b.id, title: b.title.slice(0, 20) },
              })),
            },
          },
        }),
      }
    );

    return await res.json();
  } catch (error) {
    return { error, simulated: true };
  }
}
