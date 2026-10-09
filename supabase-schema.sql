-- NextGen WhatsApp AI Agent - Complete Supabase Schema
-- Run this in the Supabase SQL Editor if you are using Supabase

-- 1. Conversations Table
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  phone text unique not null,
  name text,
  mode text not null default 'agent' check (mode in ('agent', 'human')),
  status text not null default 'active' check (status in ('active', 'escalated', 'resolved')),
  metadata jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- 2. Messages Table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  type text default 'text',
  whatsapp_msg_id text unique,
  status text default 'delivered',
  tool_executions jsonb,
  created_at timestamp with time zone default now()
);

-- 3. Appointments Table
create table if not exists appointments (
  id text primary key,
  conversation_id uuid references conversations(id) on delete set null,
  phone text not null,
  customer_name text not null,
  service text not null,
  date text not null,
  time_slot text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamp with time zone default now()
);

-- 4. Knowledge Base Table
create table if not exists knowledge_articles (
  id text primary key,
  title text not null,
  category text not null,
  content text not null,
  keywords text[] default array[]::text[],
  created_at timestamp with time zone default now()
);

-- Indexes for lightning performance
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_messages_created on messages(created_at asc);
create index if not exists idx_conversations_updated on conversations(updated_at desc);
create index if not exists idx_conversations_phone on conversations(phone);
create index if not exists idx_appointments_phone on appointments(phone);
create index if not exists idx_appointments_date on appointments(date);

-- Enable Realtime
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table appointments;
