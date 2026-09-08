import { sql } from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`select * from showcase order by created_at desc`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { type, icon, bg, image, title, description, creator, likes } = req.body ?? {};
      if (!type || !title || !title.trim()) {
        return res.status(400).json({ error: 'type and title are required' });
      }
      const [row] = await sql`
        insert into showcase (type, icon, bg, image, title, description, creator, likes)
        values (
          ${type}, ${icon || null}, ${bg || null}, ${image || null},
          ${title.trim()}, ${description || ''}, ${creator || 'אני'}, ${likes || 0}
        )
        returning *
      `;
      return res.status(201).json(row);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[showcase]', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
