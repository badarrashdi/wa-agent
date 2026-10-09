import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { message } = body;

  if (!message?.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const conversation = await storage.getConversationById(id);
  if (!conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Send via WhatsApp API or Simulator
  const waResult = await sendWhatsAppMessage(conversation.phone, message.trim());

  const isFailed = Boolean((waResult as any)?.error);

  // Store message in database
  const storedMsg = await storage.addMessage({
    conversation_id: id,
    role: "assistant",
    content: message.trim(),
    type: "text",
    status: isFailed ? "failed" : waResult.simulated ? "delivered" : "sent",
  });

  return Response.json({
    ...storedMsg,
    send_result: waResult,
  });
}
