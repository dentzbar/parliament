# פרלמנט (Parliament)

צ'אט בין חברים — Hebrew, RTL chat, strictly user-to-user. On entry, pick an existing user or create a new one; message any other user directly with text, voice, or file messages. Includes a community showcase feed. Deployed on Vercel, data stored in Neon (PostgreSQL).

## Structure

```
parliament/
├── index.html         # The full UI (Hebrew, RTL). Static front-end, no build step.
├── api/
│   ├── db.js           # Neon client
│   ├── users.js         # Serverless function — user directory (GET / POST / PATCH)
│   ├── messages.js      # Serverless function — direct messages between users (GET / POST / DELETE)
│   └── showcase.js      # Serverless function — showcase feed (GET / POST)
├── schema.sql           # Database tables — run once against Neon
├── package.json
└── vercel.json
```

## One-time setup

### 1. Neon

1. Create a project at [neon.tech](https://neon.tech) (or reuse an existing one).
2. Copy the pooled connection string from the Neon dashboard → `DATABASE_URL`.
3. Run [`schema.sql`](schema.sql) against it once — see **Neon SQL setup** below.

### 2. Vercel

1. Repo is already connected to Vercel (auto-deploy on push to `main`).
2. Under **Settings → Environment Variables**, set `DATABASE_URL` to the Neon connection string.
3. Push to `main` to deploy.

## Local development

```bash
npm install
# put DATABASE_URL in a .env.local file
vercel dev
```

## API

| Method   | Endpoint                          | Purpose |
|----------|-------------------------------------|---------|
| `GET`    | `/api/users`                        | list all users |
| `POST`   | `/api/users`                        | create/upsert `{ name, avatar? }` — used both on first entry and to bump presence |
| `PATCH`  | `/api/users`                        | update `{ id, name?, avatar? }` |
| `GET`    | `/api/messages?user_id=&with_id=`   | message thread between two users |
| `GET`    | `/api/messages?user_id=`            | conversation list (last message + preview per counterpart) |
| `POST`   | `/api/messages`                     | send `{ sender_id, recipient_id, type, content?, audio_data?, duration?, file_name?, file_size?, mime_type?, file_data? }` |
| `DELETE` | `/api/messages?id=`                 | delete one message |
| `GET`    | `/api/showcase`                     | list showcase items |
| `POST`   | `/api/showcase`                     | add one `{ type, icon?, bg?, image?, title, description?, creator?, likes? }` |

There's no websocket/realtime channel — the frontend polls `/api/messages` and `/api/users` on an interval while the app is open.

## Neon SQL setup

Run this once, either from the Neon Console's SQL editor or from your terminal:

```bash
psql "$DATABASE_URL" -f schema.sql
```

This creates the `users`, `messages`, and `showcase` tables (all `create table if not exists`, so it's safe to re-run).
