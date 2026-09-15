-- פרלמנט — Neon (Postgres) schema
-- Run this once against your Neon database (Neon Console → SQL Editor, or `psql "$DATABASE_URL" -f schema.sql`).

-- App users. Everyone who has ever entered a name. Chat is strictly user-to-user —
-- no separate "contacts" table: any user can message any other user directly.
create table if not exists users (
  id         serial primary key,
  name       text not null unique,
  avatar     text,               -- data URL or null
  last_seen  timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Direct messages between two users — text / voice / file.
create table if not exists messages (
  id            bigint generated always as identity primary key,
  sender_id     integer not null references users(id) on delete cascade,
  recipient_id  integer not null references users(id) on delete cascade,
  type          text not null default 'text',   -- 'text' | 'voice' | 'file'
  content       text,                            -- text body
  audio_data    text,                            -- voice message data URL
  duration      text,                            -- voice message duration, e.g. "0:12"
  file_name     text,
  file_size     bigint,
  mime_type     text,
  file_data     text,                            -- file/image/video data URL
  created_at    timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at);
create index if not exists messages_recipient_idx on messages (recipient_id, created_at);

-- Showcase feed (יצירות היזמים) — shared community projects, independent of chat.
create table if not exists showcase (
  id          bigint generated always as identity primary key,
  type        text not null,        -- 'אפליקציה' | 'מצגת' | 'סרטון'
  icon        text,
  bg          text,
  image       text,                  -- optional cover image data URL
  title       text not null,
  description text not null default '',
  creator     text not null default 'אני',
  likes       integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists showcase_created_idx on showcase (created_at desc);

-- The serverless functions connect directly with the Neon connection string; no RLS needed
-- (this is a small friends app, same trust model as before).
