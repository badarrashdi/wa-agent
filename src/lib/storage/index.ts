import { isSupabaseConfigured } from "@/lib/supabase";
import { localStore } from "@/lib/storage/local-store";
import { supabaseStore } from "@/lib/storage/supabase-store";
import {
  Conversation,
  Message,
  Appointment,
  AgentSettings,
  KnowledgeArticle,
  ConversationWithLastMessage,
} from "@/lib/types";

export const storage = {
  isSupabaseActive(): boolean {
    return isSupabaseConfigured();
  },

  async getConversations(): Promise<ConversationWithLastMessage[]> {
    if (this.isSupabaseActive()) {
      return supabaseStore.getConversations();
    }
    return localStore.getConversations();
  },

  async getConversationById(id: string): Promise<Conversation | null> {
    if (this.isSupabaseActive()) {
      return supabaseStore.getConversationById(id);
    }
    return localStore.getConversationById(id);
  },

  async getConversationByPhone(phone: string): Promise<Conversation | null> {
    if (this.isSupabaseActive()) {
      return supabaseStore.getConversationByPhone(phone);
    }
    return localStore.getConversationByPhone(phone);
  },

  async createConversation(conv: Partial<Conversation> & { phone: string }): Promise<Conversation> {
    if (this.isSupabaseActive()) {
      return supabaseStore.createConversation(conv);
    }
    return localStore.createConversation(conv);
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
    if (this.isSupabaseActive()) {
      return supabaseStore.updateConversation(id, updates);
    }
    return localStore.updateConversation(id, updates);
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    if (this.isSupabaseActive()) {
      return supabaseStore.getMessages(conversationId);
    }
    return localStore.getMessages(conversationId);
  },

  async addMessage(msg: Omit<Message, "id" | "created_at"> & { id?: string; created_at?: string }): Promise<Message> {
    if (this.isSupabaseActive()) {
      return supabaseStore.addMessage(msg);
    }
    return localStore.addMessage(msg);
  },

  // Appointments (available both locally and can be synced)
  async getAppointments(phone?: string): Promise<Appointment[]> {
    return localStore.getAppointments(phone);
  },

  async createAppointment(apt: Omit<Appointment, "id" | "created_at">): Promise<Appointment> {
    return localStore.createAppointment(apt);
  },

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    return localStore.updateAppointment(id, updates);
  },

  // Agent Settings (Live customizer in UI)
  async getSettings(): Promise<AgentSettings> {
    return localStore.getSettings();
  },

  async saveSettings(settings: Partial<AgentSettings>): Promise<AgentSettings> {
    return localStore.saveSettings(settings);
  },

  // Knowledge Base
  async getKnowledgeBase(query?: string): Promise<KnowledgeArticle[]> {
    return localStore.getKnowledgeBase(query);
  },

  async resetData(): Promise<void> {
    localStore.resetToDefault();
  },
};
