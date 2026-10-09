import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";
import { generateAgentResponse } from "@/lib/ai/engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = body.phone || "+1 (555) 999-8877";
    const name = body.name || "Test User";
    const userMessage = body.message?.trim() || "Hi, I'd like to book an appointment";
    const msgType = body.type || "text";

    // 1. Find or create conversation
    let conversation = await storage.getConversationByPhone(phone);
    if (!conversation) {
      conversation = await storage.createConversation({
        phone,
        name,
        mode: "agent",
        status: "active",
      });
    }

    // 2. Add incoming user message
    const userMsg = await storage.addMessage({
      conversation_id: conversation.id,
      role: "user",
      content: userMessage,
      type: msgType,
      whatsapp_msg_id: `wamid.sim_${Date.now()}`,
      status: "read",
    });

    // 3. If mode is human, no auto reply
    if (conversation.mode === "human") {
      return Response.json({
        simulated: true,
        status: "held_for_human",
        conversation,
        userMessage: userMsg,
        reply: null,
        toolExecutions: [],
      });
    }

    // 4. Run AI Agent execution
    const aiResult = await generateAgentResponse(
      conversation.id,
      userMessage,
      conversation.name || name,
      phone
    );

    // 5. Add assistant message
    const assistantMsg = await storage.addMessage({
      conversation_id: conversation.id,
      role: "assistant",
      content: aiResult.reply,
      type: "text",
      tool_executions: aiResult.toolExecutions,
      status: "delivered",
    });

    // Refresh conversation state
    const refreshedConversation = await storage.getConversationById(conversation.id);

    return Response.json({
      simulated: true,
      status: "replied",
      conversation: refreshedConversation,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      reply: aiResult.reply,
      toolExecutions: aiResult.toolExecutions,
      modelUsed: aiResult.modelUsed,
    });
  } catch (error) {
    console.error("[Simulator Error]:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
