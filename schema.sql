-- פרלמנט — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

-- Contacts / users (אנשי קשר)
create table if not exists users (
  id         bigint generated always as identity primary key,
  name       text not null,
  role       text default '',
  phone      text default '',
  color      text default '#4a9eff',
  status     text default 'on',          -- on | busy | away
  created_at timestamptz not null default now()
);

-- Chat messages (general channel + direct messages)
create table if not exists messages (
  id         bigint generated always as identity primary key,
  channel    text not null default 'general',  -- 'general' | 'dm'
  user_id    bigint references users(id) on delete cascade,  -- set only for DMs
  sender     text not null default 'אני',
  text       text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_channel_idx on messages (channel, created_at);
create index if not exists messages_dm_idx on messages (user_id, created_at);

-- The serverless functions use the service_role key, which bypasses RLS.
-- RLS stays off here for simplicity (this is a small friends app).
