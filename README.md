# 🆘 פרלמנט (Parliament)

צ'אט בין חברים — Hebrew chat app between friends. Deployed on Vercel, data stored in Supabase (PostgreSQL).

## Structure

```
parliament/
├── public/
│   └── index.html       # The full UI (Hebrew, RTL). Static front-end.
├── api/
│   ├── _supabase.js     # Shared Supabase client + helpers
│   ├── users.js         # Serverless function — contacts (GET / POST / DELETE)
│   └── messages.js      # Serverless function — chat (GET / POST)
├── schema.sql           # Database tables — run once in Supabase
├── package.json
└── vercel.json
```

## One-time setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste [`schema.sql`](schema.sql), and run it.
3. From **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-side only — keep secret)

### 2. Vercel
1. Import the repo at [vercel.com](https://vercel.com).
2. Under **Settings → Environment Variables**, add the two values above.
3. Deploy.

## Local development

```bash
npm install
# put SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in a .env.local file
vercel dev
```

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET`    | `/api/users` | list contacts |
| `POST`   | `/api/users` | add contact `{ name, role, phone, color, status }` |
| `DELETE` | `/api/users?id=` | delete contact + their messages |
| `GET`    | `/api/messages?channel=general` | general channel history |
| `GET`    | `/api/messages?channel=dm&user_id=` | direct-message history |
| `POST`   | `/api/messages` | send `{ channel, user_id?, text, sender }` |

Meetings (פגישות) remain a local-only daily agenda in the browser.
