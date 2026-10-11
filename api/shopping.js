import { sql } from './db.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const userId = Number(req.query.user_id);
      if (!Number.isInteger(userId)) return res.status(400).json({ error: 'user_id is required' });

      // ?date=YYYY-MM-DD → that day's items; otherwise → per-day summary (for marking days that have a list)
      const date = req.query.date;
      if (date !== undefined) {
        if (!DATE_RE.test(date)) return res.status(400).json({ error: 'invalid date' });
        const items = await sql`
          select id, text, done, created_at from shopping_items
          where user_id = ${userId} and list_date = ${date}
          order by created_at asc
        `;
        return res.status(200).json(items);
      }
      const days = await sql`
        select to_char(list_date, 'YYYY-MM-DD') as date,
               count(*)::int as total,
               count(*) filter (where not done)::int as remaining
        from shopping_items
        where user_id = ${userId}
        group by list_date
        order by list_date asc
      `;
      return res.status(200).json(days);
    }

    if (req.method === 'POST') {
      const { user_id, date, text } = req.body ?? {};
      if (!Number.isInteger(user_id) || !DATE_RE.test(date ?? '') || !text || !text.trim()) {
        return res.status(400).json({ error: 'user_id, date and text are required' });
      }
      const [item] = await sql`
        insert into shopping_items (user_id, list_date, text)
        values (${user_id}, ${date}, ${text.trim().slice(0, 200)})
        returning id, text, done, created_at
      `;
      return res.status(201).json(item);
    }

    if (req.method === 'PATCH') {
      const { id, done } = req.body ?? {};
      if (!Number.isInteger(id) || typeof done !== 'boolean') {
        return res.status(400).json({ error: 'id and done are required' });
      }
      const [item] = await sql`
        update shopping_items set done = ${done} where id = ${id}
        returning id, text, done, created_at
      `;
      if (!item) return res.status(404).json({ error: 'item not found' });
      return res.status(200).json(item);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'id is required' });
      await sql`delete from shopping_items where id = ${id}`;
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[shopping]', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
