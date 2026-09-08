import { sql } from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const contactId = req.query.contact_id;
      if (!contactId) return res.status(400).json({ error: 'contact_id is required' });
      const rows = await sql`
        select * from messages where contact_id = ${contactId} order by created_at asc
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const {
        contact_id, from_name, type, content, audio_data, duration,
        file_name, file_size, mime_type, file_data,
      } = req.body ?? {};
      if (!contact_id || !from_name) {
        return res.status(400).json({ error: 'contact_id and from_name are required' });
      }
      const [row] = await sql`
        insert into messages (contact_id, from_name, type, content, audio_data, duration, file_name, file_size, mime_type, file_data)
        values (
          ${contact_id}, ${from_name}, ${type || 'text'}, ${content || null}, ${audio_data || null},
          ${duration || null}, ${file_name || null}, ${file_size || null}, ${mime_type || null}, ${file_data || null}
        )
        returning *
      `;
      return res.status(201).json(row);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'missing id' });
      const [deleted] = await sql`delete from messages where id = ${id} returning id`;
      if (!deleted) return res.status(404).json({ error: 'message not found' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[messages]', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
