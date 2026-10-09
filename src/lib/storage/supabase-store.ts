import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { localStore } from "@/lib/storage/local-store";
import {
  Conversation,
  Message,
  Appointment,
  AgentSettings,
  KnowledgeArticle,
  ConversationWithLastMessage,
} from "@/lib/types";

export const supabaseStore = {
  async getConversations(): Promise<ConversationWithLastMessage[]> {
    const client = getSupabase();
    if (!client) return localStore.getConversations();

    try {
      const { data: convos, error } = await client
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error || !convos) {
        console.warn("Supabase query failed, falling back to local:", error?.message);
        return localStore.getConversations();
      }

      const results = await Promise.all(
        convos.map(async (c) => {
          const { data: lastMsgs } = await client
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const lastMsg = lastMsgs?.[0];
          return {
            ...c,
            status: c.status || (c.mode === "human" ? "escalated" : "active"),
            last_message: lastMsg?.content || null,
            last_message_at: lastMsg?.created_at || c.updated_at,
          } as ConversationWithLastMessage;
        })
      );

      return results;
    } catch (e) {
      console.warn("Supabase exception, falling back:", e);
      return localStore.getConversations();
    }
  },

  async getConversationById(id: string): Promise<Conversation | null> {
    const client = getSupabase();
    if (!client) return localStore.getConversationById(id);

    try {
      const { data, error } = await client
        .from("conversations")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) return localStore.getConversationById(id);
      return data as Conversation;
    } catch {
      return localStore.getConversationById(id);
    }
  },

  async getConversationByPhone(phone: string): Promise<Conversation | null> {
    const client = getSupabase();
    if (!client) return localStore.getConversationByPhone(phone);

    try {
      const { data, error } = await client
        .from("conversations")
        .select("*")
        .eq("phone", phone)
        .single();

      if (error || !data) {
        // Try sanitized match in local
        return localStore.getConversationByPhone(phone);
      }
      return data as Conversation;
    } catch {
      return localStore.getConversationByPhone(phone);
    }
  },

  async createConversation(conv: Partial<Conversation> & { phone: string }): Promise<Conversation> {
    const client = getSupabase();
    if (!client) return localStore.createConversation(conv);

    try {
      const { data, error } = await client
        .from("conversations")
        .insert({
          phone: conv.phone,
          name: conv.name || null,
          mode: conv.mode || "agent",
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !data) {
        return localStore.createConversation(conv);
      }
      return {
        ...data,
        status: data.mode === "human" ? "escalated" : "active",
      } as Conversation;
    } catch {
      return localStore.createConversation(conv);
    }
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
    const client = getSupabase();
    if (!client) return localStore.updateConversation(id, updates);

    try {
      const { data, error } = await client
        .from("conversations")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        return localStore.updateConversation(id, updates);
      }
      return data as Conversation;
    } catch {
      return localStore.updateConversation(id, updates);
    }
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const client = getSupabase();
    if (!client) return localStore.getMessages(conversationId);

    try {
      const { data, error } = await client
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error || !data) {
        return localStore.getMessages(conversationId);
      }
      return data as Message[];
    } catch {
      return localStore.getMessages(conversationId);
    }
  },

  async addMessage(msg: Omit<Message, "id" | "created_at"> & { id?: string; created_at?: string }): Promise<Message> {
    const client = getSupabase();
    if (!client) return localStore.addMessage(msg);

    try {
      const { data, error } = await client
        .from("messages")
        .insert({
          conversation_id: msg.conversation_id,
          role: msg.role,
          content: msg.content,
          whatsapp_msg_id: msg.whatsapp_msg_id || null,
        })
        .select()
        .single();

      if (error || !data) {
        return localStore.addMessage(msg);
      }

      await client
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", msg.conversation_id);

      return data as Message;
    } catch {
      return localStore.addMessage(msg);
    }
  },
};
