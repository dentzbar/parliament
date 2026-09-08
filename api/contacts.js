import { sql } from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`select * from contacts order by created_at asc`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const {
        id, name, status, is_business, category, phone, description,
        is_group, members, avatar,
      } = req.body ?? {};
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'id is required' });
      }
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'name is required' });
      }
      const [row] = await sql`
        insert into contacts (id, name, status, is_business, category, phone, description, is_group, members, avatar)
        values (
          ${id}, ${name.trim()}, ${status || ''}, ${!!is_business}, ${category || null},
          ${phone || null}, ${description || null}, ${!!is_group}, ${members || null}, ${avatar || null}
        )
        returning *
      `;
      return res.status(201).json(row);
    }

    if (req.method === 'PATCH') {
      const { id, name, status, avatar, background } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'id is required' });

      const [existing] = await sql`select * from contacts where id = ${id}`;
      if (!existing) return res.status(404).json({ error: 'contact not found' });

      const [row] = await sql`
        update contacts set
          name = ${name !== undefined ? name : existing.name},
          status = ${status !== undefined ? status : existing.status},
          avatar = ${avatar !== undefined ? avatar : existing.avatar},
          background = ${background !== undefined ? background : existing.background}
        where id = ${id}
        returning *
      `;
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'missing id' });
      await sql`delete from messages where contact_id = ${id}`;
      const [deleted] = await sql`delete from contacts where id = ${id} returning id`;
      if (!deleted) return res.status(404).json({ error: 'contact not found' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[contacts]', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
