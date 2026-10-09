export type ConversationMode = "agent" | "human";
export type ConversationStatus = "active" | "escalated" | "resolved";
export type MessageRole = "user" | "assistant" | "system";
export type MessageType = "text" | "interactive" | "image" | "audio" | "location";

export interface ToolExecution {
  toolName: string;
  args: Record<string, any>;
  result: Record<string, any>;
  timestamp?: string;
}

export interface Conversation {
  id: string;
  phone: string;
  name: string | null;
  mode: ConversationMode;
  status: ConversationStatus;
  updated_at: string;
  created_at: string;
  metadata?: {
    sentiment?: "positive" | "neutral" | "negative" | "frustrated";
    escalation_reason?: string;
    notes?: string;
    tags?: string[];
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  whatsapp_msg_id?: string | null;
  status?: "sent" | "delivered" | "read";
  tool_executions?: ToolExecution[];
  created_at: string;
}

export interface ConversationWithLastMessage extends Conversation {
  last_message: string | null;
  last_message_at?: string;
  unread_count?: number;
}

export interface Appointment {
  id: string;
  conversation_id?: string;
  phone: string;
  customer_name: string;
  service: string;
  date: string; // YYYY-MM-DD
  time_slot: string; // e.g. "10:00 AM"
  status: "confirmed" | "cancelled" | "completed";
  notes?: string;
  created_at: string;
}

export interface AgentSettings {
  business_name: string;
  persona: "dental_clinic" | "customer_support" | "ecommerce" | "custom";
  system_prompt: string;
  model: string;
  provider: "openrouter" | "openai" | "groq";
  temperature: number;
  auto_escalate_frustration: boolean;
  enabled_tools: string[];
  business_hours: string;
  address: string;
  phone_number: string;
  email: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
}
