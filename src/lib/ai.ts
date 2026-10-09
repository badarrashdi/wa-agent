import { generateAgentResponse } from "@/lib/ai/engine";

export { generateAgentResponse };

export async function getAIResponse(
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const result = await generateAgentResponse(
    "temp",
    lastUserMsg?.content || "Hello"
  );
  return result.reply;
}
