import { sql } from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const users = await sql`select id, name, avatar, last_seen from users order by name asc`;
      return res.status(200).json(users);
    }

    if (req.method === 'POST') {
      const { name, avatar } = req.body ?? {};
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'name is required' });
      }
      const trimmed = name.trim().slice(0, 60);
      const [user] = await sql`
        insert into users (name, avatar, last_seen)
        values (${trimmed}, ${avatar || null}, now())
        on conflict (name) do update set last_seen = now(), avatar = coalesce(${avatar || null}, users.avatar)
        returning id, name, avatar, last_seen
      `;
      return res.status(200).json(user);
    }

    if (req.method === 'PATCH') {
      const { id, name, avatar } = req.body ?? {};
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'id is required' });
      }
      const [existing] = await sql`select * from users where id = ${id}`;
      if (!existing) return res.status(404).json({ error: 'user not found' });

      const [user] = await sql`
        update users set
          name = ${name !== undefined && name.trim() ? name.trim() : existing.name},
          avatar = ${avatar !== undefined ? avatar : existing.avatar}
        where id = ${id}
        returning id, name, avatar, last_seen
      `;
      return res.status(200).json(user);
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[users]', err);
    if (err.message && err.message.includes('duplicate key')) {
      return res.status(409).json({ error: 'השם הזה כבר תפוס' });
    }
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
