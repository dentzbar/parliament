import { sql } from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const userId = Number(req.query.user_id);
      if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: 'user_id is required' });
      }
      const withId = req.query.with_id !== undefined ? Number(req.query.with_id) : null;

      if (withId !== null) {
        if (!Number.isInteger(withId)) {
          return res.status(400).json({ error: 'with_id must be a number' });
        }
        const thread = await sql`
          select * from messages
          where (sender_id = ${userId} and recipient_id = ${withId})
             or (sender_id = ${withId} and recipient_id = ${userId})
          order by created_at asc
        `;
        return res.status(200).json(thread);
      }

      // No with_id: return the conversation list (last message + preview per counterpart).
      const conversations = await sql`
        with mine as (
          select *,
                 case when sender_id = ${userId} then recipient_id else sender_id end as other_id
          from messages
          where sender_id = ${userId} or recipient_id = ${userId}
        ),
        latest as (
          select distinct on (other_id) *
          from mine
          order by other_id, created_at desc
        )
        select u.id as user_id, u.name, u.avatar,
               latest.id as last_message_id, latest.type as last_type, latest.content as last_content,
               latest.file_name as last_file_name, latest.mime_type as last_mime_type,
               latest.sender_id as last_sender_id, latest.created_at as last_message_at
        from latest
        join users u on u.id = latest.other_id
        order by latest.created_at desc
      `;
      return res.status(200).json(conversations);
    }

    if (req.method === 'POST') {
      const {
        sender_id, recipient_id, type, content, audio_data, duration,
        file_name, file_size, mime_type, file_data,
      } = req.body ?? {};
      if (!Number.isInteger(sender_id) || !Number.isInteger(recipient_id)) {
        return res.status(400).json({ error: 'sender_id and recipient_id are required' });
      }
      if (sender_id === recipient_id) {
        return res.status(400).json({ error: 'cannot message yourself' });
      }
      const [row] = await sql`
        insert into messages (sender_id, recipient_id, type, content, audio_data, duration, file_name, file_size, mime_type, file_data)
        values (
          ${sender_id}, ${recipient_id}, ${type || 'text'}, ${content || null}, ${audio_data || null},
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
