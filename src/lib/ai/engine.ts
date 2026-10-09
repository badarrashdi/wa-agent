import OpenAI from "openai";
import { storage } from "@/lib/storage";
import { AGENT_TOOLS, executeToolCall } from "@/lib/ai/tools";
import { ToolExecution } from "@/lib/types";

export interface AIResponseResult {
  reply: string;
  toolExecutions: ToolExecution[];
  modelUsed: string;
}

function getAIClient(provider: string) {
  let apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  let baseURL = "https://openrouter.ai/api/v1";

  if (provider === "groq" || (!process.env.OPENROUTER_API_KEY && process.env.GROQ_API_KEY)) {
    apiKey = process.env.GROQ_API_KEY;
    baseURL = "https://api.groq.com/openai/v1";
  } else if (provider === "openai" || (!process.env.OPENROUTER_API_KEY && process.env.OPENAI_API_KEY)) {
    apiKey = process.env.OPENAI_API_KEY;
    baseURL = "https://api.openai.com/v1";
  }

  if (!apiKey || apiKey.startsWith("your-") || apiKey === "mock") {
    return null;
  }

  return new OpenAI({
    baseURL,
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://whatsapp-agent.app",
      "X-Title": "WhatsApp AI Agent",
    },
  });
}

/**
 * Intelligent zero-setup mock agent that mimics tool calling and response generation
 * when no external LLM API key has been supplied yet.
 */
async function fallbackSimulatedAgent(
  userMessage: string,
  customerName?: string,
  customerPhone?: string,
  conversationId?: string
): Promise<AIResponseResult> {
  const lower = userMessage.toLowerCase();
  const toolExecutions: ToolExecution[] = [];

  // Check emergency / escalation
  if (
    lower.includes("emergency") ||
    lower.includes("unbearable pain") ||
    lower.includes("severe pain") ||
    lower.includes("swelling") ||
    lower.includes("bleeding") ||
    lower.includes("talk to a human") ||
    lower.includes("speak to doctor") ||
    lower.includes("talk to doctor") ||
    lower.includes("manager") ||
    lower.includes("angry")
  ) {
    const res = await executeToolCall(
      "escalate_to_human",
      {
        reason: lower.includes("pain") || lower.includes("swelling")
          ? "Patient reported severe distress/pain symptoms"
          : "Customer requested human takeover",
        urgency: lower.includes("pain") || lower.includes("swelling") ? "emergency" : "high",
      },
      conversationId,
      customerPhone
    );

    toolExecutions.push({
      toolName: "escalate_to_human",
      args: { reason: "Urgent care / Human takeover requested", urgency: "emergency" },
      result: res,
    });

    return {
      reply: `🚨 I have prioritized your message and transferred this conversation directly to our on-call dental supervisor and front desk team. A team member is being notified right now and will message or call you shortly.\n\nIf you are experiencing severe difficulty breathing or uncontrollable bleeding, please immediately contact emergency services.`,
      toolExecutions,
      modelUsed: "agent-engine-local-fallback",
    };
  }

  // Check booking confirmation
  if (
    lower.includes("book") ||
    lower.includes("confirm") ||
    lower.includes("yes 10") ||
    lower.includes("10:00 am") ||
    lower.includes("11:30 am") ||
    lower.includes("schedule me")
  ) {
    const slot = lower.includes("11:30") ? "11:30 AM" : "10:00 AM";
    const date = "This Friday";

    const res = await executeToolCall(
      "book_appointment",
      {
        customer_name: customerName || "Valued Patient",
        phone: customerPhone || "+1 (555) 000-0000",
        date,
        time_slot: slot,
        service: "Routine Dental Cleaning & Checkup",
      },
      conversationId,
      customerPhone
    );

    toolExecutions.push({
      toolName: "book_appointment",
      args: {
        customer_name: customerName || "Valued Patient",
        date,
        time_slot: slot,
        service: "Routine Dental Cleaning & Checkup",
      },
      result: res,
    });

    return {
      reply: `🎉 Great! I have booked your appointment for **${date} at ${slot}** with Toothsi Dental Care. (Appointment ID: #${res.appointment_id || "APT-401"}).\n\nPlease arrive 10 minutes prior to complete any intake documentation. Is there anything else I can help you with today?`,
      toolExecutions,
      modelUsed: "agent-engine-local-fallback",
    };
  }

  // Check availability
  if (
    lower.includes("opening") ||
    lower.includes("available") ||
    lower.includes("slot") ||
    lower.includes("when can") ||
    lower.includes("friday") ||
    lower.includes("tomorrow")
  ) {
    const res = await executeToolCall(
      "check_availability",
      { date: "This Friday", service: "cleaning" },
      conversationId,
      customerPhone
    );

    toolExecutions.push({
      toolName: "check_availability",
      args: { date: "This Friday", service: "Dental Examination" },
      result: res,
    });

    const slots = res.available_slots || ["10:00 AM", "11:30 AM", "2:00 PM"];
    return {
      reply: `Hello! We have openings available this Friday at:\n\n• ${slots.slice(0, 3).join("\n• ")}\n\nWhich of these times works best for you?`,
      toolExecutions,
      modelUsed: "agent-engine-local-fallback",
    };
  }

  // Check FAQ / Knowledge Base
  if (
    lower.includes("price") ||
    lower.includes("cost") ||
    lower.includes("insurance") ||
    lower.includes("hour") ||
    lower.includes("where") ||
    lower.includes("address") ||
    lower.includes("whitening")
  ) {
    const res = await executeToolCall(
      "lookup_knowledge_base",
      { query: userMessage },
      conversationId,
      customerPhone
    );

    toolExecutions.push({
      toolName: "lookup_knowledge_base",
      args: { query: userMessage },
      result: res,
    });

    if (res.found && res.matches?.length > 0) {
      return {
        reply: `${res.matches[0].snippet}\n\nWould you like me to check available slots for a consultation?`,
        toolExecutions,
        modelUsed: "agent-engine-local-fallback",
      };
    }
  }

  // General greeting
  return {
    reply: `Hello! Welcome to Toothsi Dental Care. 👋 How can I help you today? I can help you:\n\n1. Check available appointment openings\n2. Book or reschedule a visit\n3. Answer questions about procedures, prices, and insurance\n4. Connect you with our clinic team`,
    toolExecutions,
    modelUsed: "agent-engine-local-fallback",
  };
}

export async function generateAgentResponse(
  conversationId: string,
  incomingMessage: string,
  customerName?: string,
  customerPhone?: string
): Promise<AIResponseResult> {
  const settings = await storage.getSettings();
  const client = getAIClient(settings.provider);

  // If no external LLM client configured, run high-precision fallback agent
  if (!client) {
    return fallbackSimulatedAgent(incomingMessage, customerName, customerPhone, conversationId);
  }

  const history = await storage.getMessages(conversationId);
  const toolExecutions: ToolExecution[] = [];

  const conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${settings.system_prompt}\n\nToday's Date: ${new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}\nCustomer Name: ${customerName || "Customer"}\nCustomer Phone: ${customerPhone || "Unknown"}\nBusiness Hours: ${settings.business_hours}\nAddress: ${settings.address}`,
    },
    ...history.slice(-10).map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: m.content,
    })),
  ];

  try {
    let currentIteration = 0;
    const maxIterations = 4;

    while (currentIteration < maxIterations) {
      currentIteration++;

      const completion = await client.chat.completions.create({
        model: settings.model || "anthropic/claude-sonnet-4-20250514",
        temperature: settings.temperature ?? 0.3,
        messages: conversationMessages,
        tools: AGENT_TOOLS,
        tool_choice: "auto",
      });

      const responseMessage = completion.choices[0]?.message;
      if (!responseMessage) break;

      // Check if tool calls were requested
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        conversationMessages.push(responseMessage);

        for (const tc of responseMessage.tool_calls) {
          if (tc.type === "function") {
            const toolName = tc.function.name;
            let args: Record<string, any> = {};
            try {
              args = JSON.parse(tc.function.arguments || "{}");
            } catch {
              args = {};
            }

            const executionResult = await executeToolCall(
              toolName,
              args,
              conversationId,
              customerPhone
            );

            toolExecutions.push({
              toolName,
              args,
              result: executionResult,
              timestamp: new Date().toISOString(),
            });

            conversationMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(executionResult),
            });
          }
        }
        // Continue loop to get final conversational reply with tool results included
        continue;
      }

      // Final assistant response generated
      return {
        reply: responseMessage.content || "Thank you for contacting us! How else may I assist you?",
        toolExecutions,
        modelUsed: completion.model || settings.model,
      };
    }

    return {
      reply: "Thank you for reaching out. Your request has been recorded.",
      toolExecutions,
      modelUsed: settings.model,
    };
  } catch (error: any) {
    console.error("AI Generation error, falling back:", error);
    return fallbackSimulatedAgent(incomingMessage, customerName, customerPhone, conversationId);
  }
}
