import fs from "fs";
import path from "path";
import {
  Conversation,
  Message,
  Appointment,
  AgentSettings,
  KnowledgeArticle,
  ConversationWithLastMessage,
} from "@/lib/types";
import { DEFAULT_PERSONAS, DEFAULT_SETTINGS } from "@/lib/ai/personas";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "whatsapp_agent.json");

interface DatabaseSchema {
  conversations: Conversation[];
  messages: Message[];
  appointments: Appointment[];
  settings: AgentSettings;
  knowledge_base: KnowledgeArticle[];
}

const SEED_ARTICLES: KnowledgeArticle[] = [
  {
    id: "kb-1",
    title: "Clinic Hours & Location",
    category: "General",
    content:
      "Dental Care Clinic is located at 123 Health Ave, Suite 400. Operating hours: Monday to Friday 9:00 AM – 6:00 PM, Saturday 9:00 AM – 1:00 PM. Closed on Sundays.",
    keywords: ["hours", "location", "address", "timing", "open", "directions"],
  },
  {
    id: "kb-2",
    title: "Services & Price Estimates",
    category: "Services",
    content:
      "Routine Checkup & Cleaning: $80 - $120. Teeth Whitening: $250. Fillings: $120 - $200 per tooth. Root Canal: $600 - $900. Invisalign consultations are complimentary.",
    keywords: ["price", "cost", "whitening", "cleaning", "filling", "root canal", "services", "fees"],
  },
  {
    id: "kb-3",
    title: "Insurance & Payment Methods",
    category: "Billing",
    content:
      "We accept Delta Dental, Cigna, MetLife, Aetna, and Guardian. For out-of-network patients, we provide itemized super‌ایlls. We also offer 0% interest financing through CareCredit.",
    keywords: ["insurance", "payment", "delta", "cigna", "metlife", "carecredit", "credit card"],
  },
  {
    id: "kb-4",
    title: "Emergency Dental Care Policy",
    category: "Emergency",
    content:
      "For severe toothache, broken tooth, or facial trauma, same-day emergency slots are held every day from 11:00 AM to 1:00 PM and 4:00 PM to 5:00 PM. Call emergency hotline immediately or alert our staff.",
    keywords: ["emergency", "pain", "broken", "severe", "trauma", "urgent", "bleeding"],
  },
];

const SEED_DATA: DatabaseSchema = {
  settings: DEFAULT_SETTINGS,
  knowledge_base: SEED_ARTICLES,
  conversations: [
    {
      id: "conv-101",
      phone: "+1 (555) 234-5678",
      name: "Sarah Jenkins",
      mode: "agent",
      status: "active",
      updated_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      metadata: {
        sentiment: "positive",
        tags: ["appointment-booked", "cleaning"],
      },
    },
    {
      id: "conv-102",
      phone: "+1 (555) 876-5432",
      name: "Marcus Vance",
      mode: "human",
      status: "escalated",
      updated_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      metadata: {
        sentiment: "frustrated",
        escalation_reason: "Severe pain after crown procedure requesting doctor callback",
        tags: ["emergency", "needs-human"],
      },
    },
    {
      id: "conv-103",
      phone: "+1 (555) 345-9876",
      name: "Emily Watson",
      mode: "agent",
      status: "active",
      updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      metadata: {
        sentiment: "neutral",
        tags: ["pricing-inquiry"],
      },
    },
  ],
  messages: [
    {
      id: "msg-1",
      conversation_id: "conv-101",
      role: "user",
      content: "Hi! Do you have an opening for a routine cleaning this Friday morning?",
      type: "text",
      whatsapp_msg_id: "wamid.seed01",
      status: "read",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: "msg-2",
      conversation_id: "conv-101",
      role: "assistant",
      content:
        "Hello Sarah! Yes, we have openings this Friday at 10:00 AM and 11:30 AM with Dr. Smith. Would 10:00 AM work well for you?",
      type: "text",
      status: "read",
      tool_executions: [
        {
          toolName: "check_availability",
          args: { date: "This Friday", service: "cleaning" },
          result: { available_slots: ["10:00 AM", "11:30 AM", "2:00 PM"] },
        },
      ],
      created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    },
    {
      id: "msg-3",
      conversation_id: "conv-101",
      role: "user",
      content: "Yes, 10:00 AM is perfect! Please book that for me.",
      type: "text",
      whatsapp_msg_id: "wamid.seed02",
      status: "read",
      created_at: new Date(Date.now() - 1000 * 60 * 13).toISOString(),
    },
    {
      id: "msg-4",
      conversation_id: "conv-101",
      role: "assistant",
      content:
        "🎉 You're all set! I have booked your routine dental cleaning for this Friday at 10:00 AM. Appointment ID: #APT-401. Please arrive 10 minutes early. Let us know if you have any questions!",
      type: "text",
      status: "delivered",
      tool_executions: [
        {
          toolName: "book_appointment",
          args: {
            customer_name: "Sarah Jenkins",
            phone: "+1 (555) 234-5678",
            date: "2026-10-16",
            time_slot: "10:00 AM",
            service: "Dental Cleaning",
          },
          result: { appointment_id: "APT-401", status: "confirmed" },
        },
      ],
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    // Marcus Vance conversation (escalated)
    {
      id: "msg-5",
      conversation_id: "conv-102",
      role: "user",
      content: "Hello, I had a crown done 2 days ago and now my gum is swelling and I'm in unbearable pain! Can I speak to a doctor right away?",
      type: "text",
      whatsapp_msg_id: "wamid.seed03",
      status: "read",
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: "msg-6",
      conversation_id: "conv-102",
      role: "assistant",
      content:
        "I am so sorry to hear that you are in severe pain, Marcus. I have immediately transferred this conversation to our emergency clinical team and alerted our on-call dental supervisor. A staff member is reviewing your chart right now and will message or call you within a few minutes. If you feel dizzy or experience severe swelling spreading to your throat, please dial 911 immediately.",
      type: "text",
      status: "delivered",
      tool_executions: [
        {
          toolName: "escalate_to_human",
          args: {
            reason: "Severe pain and gum swelling after crown procedure",
            urgency: "emergency",
          },
          result: { status: "escalated_to_human", assigned_queue: "clinical_emergency" },
        },
      ],
      created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    },
  ],
  appointments: [
    {
      id: "APT-401",
      conversation_id: "conv-101",
      phone: "+1 (555) 234-5678",
      customer_name: "Sarah Jenkins",
      service: "Dental Cleaning",
      date: "2026-10-16",
      time_slot: "10:00 AM",
      status: "confirmed",
      notes: "First time visit, booked via WhatsApp Agent",
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
  ],
};

// Memory fallback cache in case filesystem access is restricted
let memoryCache: DatabaseSchema | null = null;

function ensureDataFile(): DatabaseSchema {
  if (memoryCache) return memoryCache;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      memoryCache = JSON.parse(content);
      return memoryCache!;
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_DATA, null, 2), "utf-8");
    memoryCache = JSON.parse(JSON.stringify(SEED_DATA));
    return memoryCache!;
  } catch (err) {
    console.warn("Storage fallback to memory:", err);
    memoryCache = JSON.parse(JSON.stringify(SEED_DATA));
    return memoryCache!;
  }
}

function saveDataFile(data: DatabaseSchema) {
  memoryCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed writing data file, maintained in memory:", err);
  }
}

export const localStore = {
  getConversations(): ConversationWithLastMessage[] {
    const data = ensureDataFile();
    const sorted = [...data.conversations].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return sorted.map((c) => {
      const msgs = data.messages.filter((m) => m.conversation_id === c.id);
      const lastMsg = msgs[msgs.length - 1];
      return {
        ...c,
        last_message: lastMsg ? lastMsg.content : null,
        last_message_at: lastMsg ? lastMsg.created_at : c.updated_at,
      };
    });
  },

  getConversationById(id: string): Conversation | null {
    const data = ensureDataFile();
    return data.conversations.find((c) => c.id === id) || null;
  },

  getConversationByPhone(phone: string): Conversation | null {
    const data = ensureDataFile();
    // Normalize phone comparison
    const cleanPhone = phone.replace(/\D/g, "");
    return (
      data.conversations.find(
        (c) => c.phone.replace(/\D/g, "") === cleanPhone
      ) || null
    );
  },

  createConversation(conv: Partial<Conversation> & { phone: string }): Conversation {
    const data = ensureDataFile();
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: conv.id || "conv-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      phone: conv.phone,
      name: conv.name || null,
      mode: conv.mode || "agent",
      status: conv.status || "active",
      updated_at: now,
      created_at: now,
      metadata: conv.metadata || { tags: [] },
    };

    data.conversations.push(newConv);
    saveDataFile(data);
    return newConv;
  },

  updateConversation(id: string, updates: Partial<Conversation>): Conversation | null {
    const data = ensureDataFile();
    const idx = data.conversations.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    data.conversations[idx] = {
      ...data.conversations[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveDataFile(data);
    return data.conversations[idx];
  },

  getMessages(conversationId: string): Message[] {
    const data = ensureDataFile();
    return data.messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  addMessage(msg: Omit<Message, "id" | "created_at"> & { id?: string; created_at?: string }): Message {
    const data = ensureDataFile();
    const newMsg: Message = {
      id: msg.id || "msg-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      created_at: msg.created_at || new Date().toISOString(),
      ...msg,
    };

    data.messages.push(newMsg);

    // Update conversation updated_at
    const conv = data.conversations.find((c) => c.id === msg.conversation_id);
    if (conv) {
      conv.updated_at = newMsg.created_at;
    }

    saveDataFile(data);
    return newMsg;
  },

  getAppointments(phone?: string): Appointment[] {
    const data = ensureDataFile();
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      return data.appointments.filter(
        (a) => a.phone.replace(/\D/g, "") === cleanPhone
      );
    }
    return data.appointments;
  },

  createAppointment(apt: Omit<Appointment, "id" | "created_at">): Appointment {
    const data = ensureDataFile();
    const newApt: Appointment = {
      id: "APT-" + Math.floor(100 + Math.random() * 900),
      created_at: new Date().toISOString(),
      ...apt,
    };
    data.appointments.push(newApt);
    saveDataFile(data);
    return newApt;
  },

  updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
    const data = ensureDataFile();
    const idx = data.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    data.appointments[idx] = { ...data.appointments[idx], ...updates };
    saveDataFile(data);
    return data.appointments[idx];
  },

  getSettings(): AgentSettings {
    const data = ensureDataFile();
    return data.settings || DEFAULT_SETTINGS;
  },

  saveSettings(settings: Partial<AgentSettings>): AgentSettings {
    const data = ensureDataFile();
    data.settings = { ...data.settings, ...settings };
    saveDataFile(data);
    return data.settings;
  },

  getKnowledgeBase(query?: string): KnowledgeArticle[] {
    const data = ensureDataFile();
    if (!query) return data.knowledge_base;

    const q = query.toLowerCase();
    return data.knowledge_base.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.toLowerCase().includes(q))
    );
  },

  resetToDefault() {
    saveDataFile(JSON.parse(JSON.stringify(SEED_DATA)));
  },
};
