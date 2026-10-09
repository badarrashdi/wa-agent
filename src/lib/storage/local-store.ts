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
    title: "About Crowd & Global Office Hubs",
    category: "Agency Overview",
    content:
      "Crowd (thisiscrowd.com) is an independent global marketing agency helping ambitious brands amplify sales, profits, and audience growth. Headquartered in London (20-22 Wenlock Road, N1 7GU), with regional hubs in Dubai (Dubai Media City), San Francisco, Amsterdam, Shenzhen / Hong Kong, and Sydney. Operating hours: Monday to Friday 9:00 AM – 6:00 PM (GMT & GST). Contact: results@thisiscrowd.com | +44 20 7101 4455.",
    keywords: ["about", "offices", "location", "address", "london", "dubai", "san francisco", "amsterdam", "contact"],
  },
  {
    id: "kb-2",
    title: "Core Marketing Capabilities & Services",
    category: "Services",
    content:
      "Crowd offers full-service growth marketing: 1. Brand Strategy & Positioning (brand identity, architecture, market entry); 2. Creative & Digital Experiences (custom web design, UI/UX, interactive apps); 3. AI-Powered Marketing & LLM Share-of-Voice (generative content, AI search visibility); 4. Performance Marketing (SEO, Google Ads, Paid Social, Programmatic); 5. Global Localisation & Cultural Adaptation; 6. Video Production & Social Content.",
    keywords: ["services", "capabilities", "branding", "web design", "seo", "ppc", "paid media", "social media", "video"],
  },
  {
    id: "kb-3",
    title: "AI Marketing & LLM Share-of-Voice Strategy",
    category: "Innovation & AI",
    content:
      "As search shifts from traditional engines to AI chatbots (ChatGPT, Perplexity, Google Gemini), brands must monitor their LLM Share-of-Voice. Crowd audits how AI models perceive and cite your brand, optimizes entity relationships, and builds automated AI content workflows to guarantee brand dominance in the AI search era.",
    keywords: ["ai", "llm", "chatgpt", "perplexity", "gemini", "share of voice", "artificial intelligence", "ai marketing"],
  },
  {
    id: "kb-4",
    title: "Client Case Studies & Proven Results",
    category: "Case Studies",
    content:
      "Crowd has driven high-impact global growth for leading brands: • Specialized: International digital experience and e-bike campaign; • Vans: Experiential activation & social reach; • Razor: Transcultural localisation for Asian & European markets; • Asendia: B2B sustainable logistics branding; • Miraggio Residences: Luxury real estate digital identity; • Kenwood: Global kitchen appliance digital marketing.",
    keywords: ["clients", "case studies", "specialized", "vans", "razor", "asendia", "kenwood", "results", "portfolio"],
  },
  {
    id: "kb-5",
    title: "Engagement Models, Budgets & Discovery Calls",
    category: "Commercials",
    content:
      "We offer flexible engagement structures tailored to brand growth stages: 1. Strategic Discovery Sprints (Fixed scope, 4-6 weeks from $15,000 / £12,000); 2. Monthly Growth Retainers (Integrated creative, paid media, and SEO from $8,000/mo); 3. Full Brand & Digital Transformation (Custom enterprise RFPs). We invite prospective clients to a complimentary 30-minute discovery consultation with a Senior Strategy Director.",
    keywords: ["pricing", "cost", "budget", "retainer", "rates", "rfp", "discovery call", "consultation"],
  },
];

const SEED_DATA: DatabaseSchema = {
  settings: DEFAULT_SETTINGS,
  knowledge_base: SEED_ARTICLES,
  conversations: [
    {
      id: "conv-101",
      phone: "+44 7700 900123",
      name: "Liam Henderson",
      mode: "agent",
      status: "active",
      updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      metadata: {
        sentiment: "positive",
        tags: ["brand-strategy", "discovery-booked"],
      },
    },
    {
      id: "conv-102",
      phone: "+971 50 123 4567",
      name: "Elena Rostova",
      mode: "human",
      status: "escalated",
      updated_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      metadata: {
        sentiment: "frustrated",
        escalation_reason: "Urgent Global RFP with $250k budget requesting direct Managing Director takeover",
        tags: ["rfp", "enterprise", "director-takeover"],
      },
    },
    {
      id: "conv-103",
      phone: "+1 (415) 555-8921",
      name: "Marcus Chen",
      mode: "agent",
      status: "active",
      updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      metadata: {
        sentiment: "neutral",
        tags: ["ai-marketing", "llm-share-of-voice"],
      },
    },
  ],
  messages: [
    {
      id: "msg-1",
      conversation_id: "conv-101",
      role: "user",
      content: "Hello! We're a European FinTech scaleup planning an international rebrand and market expansion. Can we book a strategy discovery session?",
      type: "text",
      whatsapp_msg_id: "wamid.crowd01",
      status: "read",
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    {
      id: "msg-2",
      conversation_id: "conv-101",
      role: "assistant",
      content:
        "Hello Liam! Welcome to Crowd. We'd be delighted to collaborate on your international expansion. Our senior strategy directors have slots open this Friday at 10:00 AM and 02:00 PM GMT. Would 10:00 AM suit your team?",
      type: "text",
      status: "read",
      tool_executions: [
        {
          toolName: "check_availability",
          args: { date: "This Friday", service: "Brand Strategy Call" },
          result: { available_slots: ["10:00 AM", "02:00 PM", "04:30 PM"] },
        },
      ],
      created_at: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
    },
    {
      id: "msg-3",
      conversation_id: "conv-101",
      role: "user",
      content: "10:00 AM this Friday is ideal. Let's confirm that please.",
      type: "text",
      whatsapp_msg_id: "wamid.crowd02",
      status: "read",
      created_at: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    },
    {
      id: "msg-4",
      conversation_id: "conv-101",
      role: "assistant",
      content:
        "🎉 Confirmed! Your **30-Minute Brand Strategy Discovery Session** with Crowd is scheduled for this Friday at 10:00 AM GMT (Consultation ID: #APT-501). One of our Senior Strategy Partners will host the session. Please feel free to email any brand briefs in advance to results@thisiscrowd.com.",
      type: "text",
      status: "delivered",
      tool_executions: [
        {
          toolName: "book_appointment",
          args: {
            customer_name: "Liam Henderson",
            phone: "+44 7700 900123",
            date: "2026-10-16",
            time_slot: "10:00 AM",
            service: "Global Brand Strategy Discovery Session",
          },
          result: { appointment_id: "APT-501", status: "confirmed" },
        },
      ],
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    // Elena Rostova (Escalated RFP)
    {
      id: "msg-5",
      conversation_id: "conv-102",
      role: "user",
      content: "Hi Crowd, we are releasing an urgent $250k global RFP for an omni-channel luxury campaign in Europe and the Gulf. Submission deadline is in 48 hours. I need to speak directly with your Managing Director today.",
      type: "text",
      whatsapp_msg_id: "wamid.crowd03",
      status: "read",
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: "msg-6",
      conversation_id: "conv-102",
      role: "assistant",
      content:
        "🚀 Thank you for reaching out, Elena. Due to the high priority and imminent deadline of your RFP, I have immediately alerted our Managing Director and Senior Partners in our London and Dubai offices. A senior agency director has taken over this thread and will message or call you shortly. You may also send the RFP documentation directly to results@thisiscrowd.com.",
      type: "text",
      status: "delivered",
      tool_executions: [
        {
          toolName: "escalate_to_human",
          args: {
            reason: "High-value $250k enterprise RFP with 48h deadline requesting Managing Director takeover",
            urgency: "high",
          },
          result: { status: "escalated_to_human", assigned_queue: "managing_director_partners" },
        },
      ],
      created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    },
  ],
  appointments: [
    {
      id: "APT-501",
      conversation_id: "conv-101",
      phone: "+44 7700 900123",
      customer_name: "Liam Henderson",
      service: "Global Brand Strategy Discovery Session",
      date: "2026-10-16",
      time_slot: "10:00 AM",
      status: "confirmed",
      notes: "FinTech rebrand & European expansion. Booked via Crowd WhatsApp Agent",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ],
};

let memoryCache: DatabaseSchema | null = null;

function ensureDataFile(): DatabaseSchema {
  if (memoryCache) return memoryCache;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      // If old schema had dental clinic, refresh to Crowd
      if (parsed.settings?.persona === "dental_clinic" || !parsed.settings?.persona) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_DATA, null, 2), "utf-8");
        memoryCache = JSON.parse(JSON.stringify(SEED_DATA));
        return memoryCache!;
      }
      memoryCache = parsed;
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
      id: "APT-" + Math.floor(500 + Math.random() * 499),
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
