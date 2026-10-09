import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { generateAgentResponse } from "@/lib/ai/engine";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "whatsapp_agent_verify_token_123";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[Webhook] Verification successful");
    return new Response(challenge, { status: 200 });
  }

  console.warn("[Webhook] Verification failed with token:", token);
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify object type
    if (body.object !== "whatsapp_business_account") {
      return Response.json({ status: "ignored" });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Handle status receipts (sent, delivered, read)
    if (value?.statuses?.[0]) {
      const statusUpdate = value.statuses[0];
      console.log(`[WhatsApp Status]: ${statusUpdate.status} for ${statusUpdate.id}`);
      return Response.json({ status: "status_acknowledged" });
    }

    // Only process actual messages
    if (!value?.messages?.[0]) {
      return Response.json({ status: "no_message" });
    }

    const message = value.messages[0];
    const contact = value.contacts?.[0];

    const phone = message.from;
    const name = contact?.profile?.name || null;
    const whatsappMsgId = message.id;

    let text = "";
    let messageType: "text" | "interactive" | "image" | "audio" = "text";

    if (message.type === "text") {
      text = message.text?.body || "";
      messageType = "text";
    } else if (message.type === "interactive") {
      messageType = "interactive";
      text =
        message.interactive?.button_reply?.title ||
        message.interactive?.list_reply?.title ||
        "[Selected option]";
    } else if (message.type === "audio") {
      messageType = "audio";
      text = "[Voice Note received - Transcription requested]";
    } else if (message.type === "image") {
      messageType = "image";
      text = message.image?.caption || "[Image attachment received]";
    } else {
      text = `[Unsupported message type: ${message.type}]`;
    }

    // Find or create conversation
    let conversation = await storage.getConversationByPhone(phone);

    if (!conversation) {
      conversation = await storage.createConversation({
        phone,
        name,
        mode: "agent",
        status: "active",
      });
    } else if (name && name !== conversation.name) {
      await storage.updateConversation(conversation.id, { name });
    }

    // Store incoming user message
    await storage.addMessage({
      conversation_id: conversation.id,
      role: "user",
      content: text,
      type: messageType,
      whatsapp_msg_id: whatsappMsgId,
      status: "read",
    });

    // If human takeover is active, do not auto-reply
    if (conversation.mode === "human") {
      console.log(`[Webhook] Conversation ${conversation.id} is in HUMAN mode. Skipping AI.`);
      return Response.json({ status: "stored_for_human", conversation_id: conversation.id });
    }

    // Generate intelligent AI response with tool-calling
    const aiResult = await generateAgentResponse(
      conversation.id,
      text,
      conversation.name || name || undefined,
      phone
    );

    // Send AI reply back to WhatsApp
    await sendWhatsAppMessage(phone, aiResult.reply);

    // Store assistant message with tool executions
    await storage.addMessage({
      conversation_id: conversation.id,
      role: "assistant",
      content: aiResult.reply,
      type: "text",
      tool_executions: aiResult.toolExecutions,
      status: "delivered",
    });

    return Response.json({
      status: "replied",
      conversation_id: conversation.id,
      tools_executed: aiResult.toolExecutions.length,
    });
  } catch (error) {
    console.error("[Webhook Error]:", error);
    return Response.json({ status: "error", error: String(error) }, { status: 500 });
  }
}
