import { supabase, send } from './_supabase.js';

// /api/users — manage contacts (אנשי קשר)
//
//   GET                       → list all contacts
//   POST   { name, role, phone, color, status }  → create contact
//   DELETE ?id=123            → delete contact (and its messages)
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return send(res, 200, data);
    }

    if (req.method === 'POST') {
      const { name, role, phone, color, status } = req.body || {};
      if (!name || !String(name).trim()) {
        return send(res, 400, { error: 'נא להכניס שם' });
      }
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: String(name).trim(),
          role: role ? String(role).trim() : '',
          phone: phone ? String(phone).trim() : '',
          color: color || '#4a9eff',
          status: status || 'on',
        })
        .select()
        .single();
      if (error) throw error;
      return send(res, 201, data);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return send(res, 400, { error: 'missing id' });
      // Remove the contact's messages first, then the contact.
      await supabase.from('messages').delete().eq('user_id', id);
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return send(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return send(res, 405, { error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[users]', err);
    return send(res, 500, { error: err.message || 'server error' });
  }
}
