-- פרלמנט — Neon (Postgres) schema
-- Run this once against your Neon database (Neon Console → SQL Editor, or `psql "$DATABASE_URL" -f schema.sql`).

-- App users (for "discover people" + presence). Keyed by chosen display name.
create table if not exists users (
  id         serial primary key,
  name       text not null unique,
  last_seen  timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Contacts: 1:1 chats, businesses, and groups all live in one table.
-- id is client-generated (e.g. "c123..."/"biz123..."/"grp123...") so the frontend can keep using string ids.
create table if not exists contacts (
  id          text primary key,
  name        text not null,
  status      text default '',
  is_business boolean not null default false,
  category    text,
  phone       text,
  description text,
  is_group    boolean not null default false,
  members     text,              -- comma-separated display names (group members)
  avatar      text,               -- data URL or null
  background  text,               -- chat background data URL or null
  created_at  timestamptz not null default now()
);

-- Chat messages — text / voice / file, tied to a contact thread.
create table if not exists messages (
  id         bigint generated always as identity primary key,
  contact_id text not null references contacts(id) on delete cascade,
  from_name  text not null,
  type       text not null default 'text',   -- 'text' | 'voice' | 'file'
  content    text,                            -- text body
  audio_data text,                            -- voice message data URL
  duration   text,                            -- voice message duration, e.g. "0:12"
  file_name  text,
  file_size  bigint,
  mime_type  text,
  file_data  text,                            -- file/image/video data URL
  created_at timestamptz not null default now()
);

create index if not exists messages_contact_idx on messages (contact_id, created_at);

-- Showcase feed (יצירות היזמים) — shared community projects.
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
