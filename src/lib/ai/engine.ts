import OpenAI from "openai";
import { storage } from "@/lib/storage";
import { AGENT_TOOLS, executeToolCall } from "@/lib/ai/tools";
import { ToolExecution } from "@/lib/types";

export interface AIResponseResult {
  reply: string;
  toolExecutions: ToolExecution[];
  modelUsed: string;
}

function getAIClient(provider?: string) {
  // 1. Groq (Primary requested provider: Ultra-fast Groq LPU with native tool calling)
  if (provider === "groq" || process.env.GROQ_API_KEY) {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && !apiKey.startsWith("your-") && apiKey !== "mock") {
      return {
        client: new OpenAI({
          baseURL: "https://api.groq.com/openai/v1",
          apiKey,
        }),
        defaultModel: process.env.AI_MODEL || "openai/gpt-oss-120b",
      };
    }
  }

  // 2. Google Gemini
  if (provider === "gemini" || process.env.GEMINI_API_KEY) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && !apiKey.startsWith("your-") && apiKey !== "mock") {
      return {
        client: new OpenAI({
          baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
          apiKey,
        }),
        defaultModel: "gemini-2.5-flash",
      };
    }
  }

  // 3. OpenAI Direct
  if (provider === "openai" || process.env.OPENAI_API_KEY) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && !apiKey.startsWith("your-")) {
      return {
        client: new OpenAI({
          baseURL: "https://api.openai.com/v1",
          apiKey,
        }),
        defaultModel: "gpt-4o",
      };
    }
  }

  // 4. OpenRouter
  if (provider === "openrouter" || process.env.OPENROUTER_API_KEY) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey && !apiKey.startsWith("your-")) {
      return {
        client: new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey,
          defaultHeaders: {
            "HTTP-Referer": "https://thisiscrowd.com",
            "X-Title": "Crowd WhatsApp Agent",
          },
        }),
        defaultModel: "anthropic/claude-sonnet-4-20250514",
      };
    }
  }

  return null;
}

/**
 * Intelligent zero-setup fallback agent tailored to Crowd (thisiscrowd.com)
 * used when network to API is unavailable or for instant local testing.
 */
async function fallbackSimulatedAgent(
  userMessage: string,
  customerName?: string,
  customerPhone?: string,
  conversationId?: string
): Promise<AIResponseResult> {
  const lower = userMessage.toLowerCase();
  const toolExecutions: ToolExecution[] = [];

  // Check Escalation: RFPs, urgent enterprise inquiries, director requests
  if (
    lower.includes("rfp") ||
    lower.includes("proposal") ||
    lower.includes("budget") && (lower.includes("100k") || lower.includes("200k") || lower.includes("500k") || lower.includes("million")) ||
    lower.includes("director") ||
    lower.includes("managing director") ||
    lower.includes("partner") ||
    lower.includes("talk to a human") ||
    lower.includes("speak to human") ||
    lower.includes("urgent")
  ) {
    const res = await executeToolCall(
      "escalate_to_human",
      {
        reason: lower.includes("rfp")
          ? "Client requested RFP review with Senior Leadership"
          : "Enterprise marketing inquiry requesting direct Managing Director takeover",
        urgency: "high",
      },
      conversationId,
      customerPhone
    );

    toolExecutions.push({
      toolName: "escalate_to_human",
      args: { reason: "Urgent Strategic Partnership / Leadership Takeover", urgency: "high" },
      result: res,
    });

    return {
      reply: `🚀 Thank you for reaching out, ${customerName || "there"}. I have immediately routed your inquiry to our Managing Director and Senior Strategy Partners at Crowd.\n\nA senior team member is reviewing your brief right now and will connect with you shortly. If your RFP has an imminent submission deadline, feel free to email results@thisiscrowd.com directly.`,
      toolExecutions,
      modelUsed: "gemini-crowd-agent-simulator",
    };
  }

  // Check Booking: Strategy Session / Discovery Call
  if (
    lower.includes("book") ||
    lower.includes("call") ||
    lower.includes("discovery") ||
    lower.includes("meeting") ||
    lower.includes("consultation") ||
    lower.includes("confirm") ||
    lower.includes("friday at 10") ||
    lower.includes("10:00 am") ||
    lower.includes("tuesday")
  ) {
    const slot = lower.includes("2:00") ? "02:00 PM" : "10:00 AM";
    const date = lower.includes("tuesday") ? "Next Tuesday" : "This Friday";

    const res = await executeToolCall(
      "book_appointment",
      {
        customer_name: customerName || "Prospective Client",
        phone: customerPhone || "+44 20 7101 4455",
        date,
        time_slot: slot,
        service: "30-Min Global Brand Strategy Discovery Session",
      },
      conversationId,
      customerPhone
    );

    toolExecutions.push({
      toolName: "book_appointment",
      args: {
        customer_name: customerName || "Prospective Client",
        date,
        time_slot: slot,
        service: "30-Min Global Brand Strategy Discovery Session",
      },
      result: res,
    });

    return {
      reply: `🎉 Confirmed! I've scheduled your **30-Minute Brand Strategy Discovery Session** with Crowd for **${date} at ${slot}** (Consultation ID: #${res.appointment_id || "APT-501"}).\n\nOne of our Senior Strategy Directors will meet with you to review your goals, discuss market expansion, and tailor an actionable roadmap. Would you like us to review any specific deck or website in advance?`,
      toolExecutions,
      modelUsed: "gemini-crowd-agent-simulator",
    };
  }

  // Check Availability
  if (
    lower.includes("available") ||
    lower.includes("opening") ||
    lower.includes("slot") ||
    lower.includes("when can") ||
    lower.includes("schedule") ||
    lower.includes("time")
  ) {
    const res = await executeToolCall(
      "check_availability",
      { date: "This Friday", service: "Brand Strategy Call" },
      conversationId,
      customerPhone
    );

    toolExecutions.push({
      toolName: "check_availability",
      args: { date: "This Friday", service: "Brand Strategy Call" },
      result: res,
    });

    const slots = res.available_slots || ["10:00 AM", "02:00 PM", "04:30 PM"];
    return {
      reply: `We'd love to connect! Our senior strategy team has the following discovery consultation openings this week:\n\n• ${slots.slice(0, 3).join("\n• ")}\n\nWhich slot aligns best with your schedule?`,
      toolExecutions,
      modelUsed: "gemini-crowd-agent-simulator",
    };
  }

  // Check Knowledge Base: Services, AI Marketing, Offices, Clients, Pricing
  if (
    lower.includes("service") ||
    lower.includes("ai") ||
    lower.includes("llm") ||
    lower.includes("office") ||
    lower.includes("location") ||
    lower.includes("where") ||
    lower.includes("client") ||
    lower.includes("cost") ||
    lower.includes("pricing") ||
    lower.includes("price") ||
    lower.includes("retainer") ||
    lower.includes("specialized") ||
    lower.includes("vans")
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
        reply: `${res.matches[0].snippet}\n\nWould you like to book a complimentary 30-minute discovery call to discuss how we can tailor this for your brand?`,
        toolExecutions,
        modelUsed: "gemini-crowd-agent-simulator",
      };
    }
  }

  // Default welcome for Crowd
  return {
    reply: `Hello! Welcome to **Crowd** (thisiscrowd.com) 👋 We help ambitious brands cut through the noise with AI-powered marketing, global localisation, and world-class digital experiences.\n\nHow can we support your growth today?\n1. Explore our services (Branding, AI Marketing, Performance Media, Web Design)\n2. Book a 30-min strategy discovery session\n3. Learn about our client case studies (Specialized, Vans, Razor, Asendia)\n4. Connect directly with our Senior Leadership`,
    toolExecutions,
    modelUsed: "gemini-crowd-agent-simulator",
  };
}

export async function generateAgentResponse(
  conversationId: string,
  incomingMessage: string,
  customerName?: string,
  customerPhone?: string
): Promise<AIResponseResult> {
  const settings = await storage.getSettings();
  const aiConfig = getAIClient(settings.provider);

  // If no external client available or in test simulator without network
  if (!aiConfig) {
    return fallbackSimulatedAgent(incomingMessage, customerName, customerPhone, conversationId);
  }

  const { client, defaultModel } = aiConfig;
  const targetModel = settings.model || defaultModel;

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
      })}\nClient Contact Name: ${customerName || "Prospective Client"}\nClient Phone: ${customerPhone || "Unknown"}\nAgency Working Hours: ${settings.business_hours}\nGlobal Offices: ${settings.address}`,
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
        model: targetModel,
        temperature: settings.temperature ?? 0.3,
        messages: conversationMessages,
        tools: AGENT_TOOLS,
        tool_choice: "auto",
      });

      const responseMessage = completion.choices[0]?.message;
      if (!responseMessage) break;

      // Check for tool calls
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
        continue;
      }

      // Final response from LLM
      return {
        reply: responseMessage.content || "Thank you for reaching out to Crowd. How else may we assist you?",
        toolExecutions,
        modelUsed: completion.model || targetModel,
      };
    }

    return {
      reply: "Thank you for contacting Crowd. Your message has been received and our team will be in touch.",
      toolExecutions,
      modelUsed: targetModel,
    };
  } catch (error: any) {
    console.error("AI Generation error with Gemini/provider, falling back to agency simulator:", error);
    return fallbackSimulatedAgent(incomingMessage, customerName, customerPhone, conversationId);
  }
}
