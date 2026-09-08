# CLAUDE.md — parliament

צ'אט בין חברים (Hebrew, RTL) — WhatsApp-style chat: contacts, businesses, groups, voice/file messages, and a showcase feed. Vanilla single-file frontend + Vercel serverless backend.

## Git & GitHub

- **Remote:** `github.com/dentzbar/parliament` — owned by **dentzbar**, NOT my personal account.
- I (`iftach-danciger`) have **no push access**. Pushing must use the `dentzbar` gh account:
  ```bash
  gh auth switch --user dentzbar
  GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=credential.helper \
    GIT_CONFIG_VALUE_0="!gh auth git-credential" git push origin main
  gh auth switch --user iftach-danciger   # always switch back afterward
  ```
- Both accounts are logged in via `gh` (keyring). Always restore `iftach-danciger` as the active account when done.
- Work directly on `main` (small personal project, no PR flow). Commit only when asked.

## Deploy (Vercel)

- Repo is already connected to Vercel — auto-deploys on push to `main`. Pushing IS deploying, no manual deploy step.
- `api/*.js` are Vercel serverless functions (ES modules, `"type": "module"`).
- **Env vars** (set in Vercel dashboard): Neon `DATABASE_URL`.
- Stack: `@neondatabase/serverless` (Postgres).

## Architecture

- **Frontend:** everything in [index.html](index.html) — HTML + inline CSS + vanilla JS, no build step. Hebrew, RTL.
- **Backend:** [api/contacts.js](api/contacts.js) (contacts/businesses/groups CRUD), [api/messages.js](api/messages.js) (chat messages: text/voice/file), [api/showcase.js](api/showcase.js) (community showcase feed), [api/users.js](api/users.js) (presence/"discover people"), [api/db.js](api/db.js) (Neon client).
- **DB schema:** [schema.sql](schema.sql) — `users`, `contacts`, `messages`, `showcase`. Migrations are `alter ... if not exists` appended to the same file; run against Neon manually.
- **No realtime channel** (Neon has none browser-safe): the open chat thread and contact-list previews are refreshed by polling (`setInterval`) instead of a websocket subscription.
- Voice/image/file messages are stored as base64 data URLs directly in Postgres columns (no object storage) — keep an eye on row size / Neon storage if this app gets heavy use.

## Conventions

- No framework, no bundler — keep the frontend a single self-contained file.
- Conventional commits, imperative mood.
