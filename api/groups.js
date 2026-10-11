import { sql } from './db.js';

function toIdList(value) {
  if (!Array.isArray(value)) return null;
  const ids = [...new Set(value.map(Number))];
  return ids.every(Number.isInteger) ? ids : null;
}

async function isMember(groupId, userId) {
  const [row] = await sql`select 1 from group_members where group_id = ${groupId} and user_id = ${userId}`;
  return Boolean(row);
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Groups the user belongs to, with member ids (the client already has the users list for names/avatars).
      const userId = Number(req.query.user_id);
      if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: 'user_id is required' });
      }
      const groups = await sql`
        select g.id, g.name, g.avatar, g.created_by, g.created_at,
               array_agg(gm.user_id order by gm.joined_at) as member_ids
        from chat_groups g
        join group_members gm on gm.group_id = g.id
        where g.id in (select group_id from group_members where user_id = ${userId})
        group by g.id
        order by g.created_at desc
      `;
      return res.status(200).json(groups);
    }

    if (req.method === 'POST') {
      const { name, avatar, created_by, member_ids } = req.body ?? {};
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'name is required' });
      }
      if (!Number.isInteger(created_by)) {
        return res.status(400).json({ error: 'created_by is required' });
      }
      const memberIds = toIdList(member_ids);
      if (!memberIds || !memberIds.length) {
        return res.status(400).json({ error: 'member_ids must be a non-empty list of user ids' });
      }
      const allIds = [...new Set([created_by, ...memberIds])];
      const [group] = await sql`
        with g as (
          insert into chat_groups (name, avatar, created_by)
          values (${name.trim().slice(0, 60)}, ${avatar || null}, ${created_by})
          returning *
        ),
        m as (
          insert into group_members (group_id, user_id)
          select g.id, unnest(${allIds}::int[]) from g
          returning user_id
        )
        select g.id, g.name, g.avatar, g.created_by, g.created_at,
               (select array_agg(user_id) from m) as member_ids
        from g
      `;
      return res.status(201).json(group);
    }

    if (req.method === 'PATCH') {
      // Rename / change avatar / add members. Only members may edit.
      const { id, user_id, name, avatar, add_member_ids } = req.body ?? {};
      if (!Number.isInteger(id) || !Number.isInteger(user_id)) {
        return res.status(400).json({ error: 'id and user_id are required' });
      }
      if (!(await isMember(id, user_id))) {
        return res.status(403).json({ error: 'not a member of this group' });
      }
      if (name !== undefined || avatar !== undefined) {
        const [existing] = await sql`select * from chat_groups where id = ${id}`;
        await sql`
          update chat_groups set
            name = ${typeof name === 'string' && name.trim() ? name.trim().slice(0, 60) : existing.name},
            avatar = ${avatar !== undefined ? avatar : existing.avatar}
          where id = ${id}
        `;
      }
      if (add_member_ids !== undefined) {
        const addIds = toIdList(add_member_ids);
        if (!addIds) return res.status(400).json({ error: 'add_member_ids must be a list of user ids' });
        if (addIds.length) {
          await sql`
            insert into group_members (group_id, user_id)
            select ${id}, unnest(${addIds}::int[])
            on conflict do nothing
          `;
        }
      }
      const [group] = await sql`
        select g.id, g.name, g.avatar, g.created_by, g.created_at,
               array_agg(gm.user_id order by gm.joined_at) as member_ids
        from chat_groups g
        join group_members gm on gm.group_id = g.id
        where g.id = ${id}
        group by g.id
      `;
      return res.status(200).json(group);
    }

    if (req.method === 'DELETE') {
      // Leave a group. The last member leaving deletes the group (and its messages, via cascade).
      const id = Number(req.query.id);
      const userId = Number(req.query.user_id);
      if (!Number.isInteger(id) || !Number.isInteger(userId)) {
        return res.status(400).json({ error: 'id and user_id are required' });
      }
      const [left] = await sql`
        delete from group_members where group_id = ${id} and user_id = ${userId} returning group_id
      `;
      if (!left) return res.status(404).json({ error: 'not a member of this group' });
      await sql`
        delete from chat_groups g
        where g.id = ${id} and not exists (select 1 from group_members where group_id = ${id})
      `;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('[groups]', err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
