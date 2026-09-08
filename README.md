# פרלמנט (Parliament)

צ'אט בין חברים — Hebrew, RTL WhatsApp-style chat between friends. Contacts, businesses, groups, text/voice/file messages, and a community showcase feed. Deployed on Vercel, data stored in Neon (PostgreSQL).

## Structure

```
parliament/
├── index.html         # The full UI (Hebrew, RTL). Static front-end, no build step.
├── api/
│   ├── db.js           # Neon client
│   ├── contacts.js     # Serverless function — contacts/businesses/groups (GET / POST / PATCH / DELETE)
│   ├── messages.js      # Serverless function — chat messages (GET / POST / DELETE)
│   ├── showcase.js      # Serverless function — showcase feed (GET / POST)
│   └── users.js         # Serverless function — presence / discover (GET / POST)
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

| Method   | Endpoint                        | Purpose |
|----------|----------------------------------|---------|
| `GET`    | `/api/contacts`                  | list contacts/businesses/groups |
| `POST`   | `/api/contacts`                  | create one `{ id, name, status?, is_business?, category?, phone?, description?, is_group?, members?, avatar? }` |
| `PATCH`  | `/api/contacts`                  | update `{ id, name?, status?, avatar?, background? }` |
| `DELETE` | `/api/contacts?id=`              | delete contact/group + its messages |
| `GET`    | `/api/messages?contact_id=`      | message history for a thread |
| `POST`   | `/api/messages`                  | send `{ contact_id, from_name, type, content?, audio_data?, duration?, file_name?, file_size?, mime_type?, file_data? }` |
| `DELETE` | `/api/messages?id=`              | delete one message |
| `GET`    | `/api/showcase`                  | list showcase items |
| `POST`   | `/api/showcase`                  | add one `{ type, icon?, bg?, image?, title, description?, creator?, likes? }` |
| `GET`    | `/api/users`                     | list known users (discover) |
| `POST`   | `/api/users`                     | upsert presence `{ name }` |

There's no websocket/realtime channel — the frontend polls `/api/messages` and `/api/contacts` on an interval while a chat is open.

## Neon SQL setup

Run this once, either from the Neon Console's SQL editor or from your terminal:

```bash
psql "$DATABASE_URL" -f schema.sql
```

This creates the `users`, `contacts`, `messages`, and `showcase` tables (all `create table if not exists`, so it's safe to re-run).
