import { sql } from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const users = await sql`select id, name, last_seen from users order by last_seen desc`;
      return res.status(200).json(users);
    }

    if (req.method === 'POST') {
      const { name } = req.body ?? {};
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'name is required' });
      }
      const trimmed = name.trim().slice(0, 60);
      const [user] = await sql`
        insert into users (name, last_seen)
        values (${trimmed}, now())
        on conflict (name) do update set last_seen = now()
        returning id, name, last_seen
      `;
      return res.status(200).json(user);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[users]', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
