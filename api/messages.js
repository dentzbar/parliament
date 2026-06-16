import { supabase, send } from './_supabase.js';

// /api/messages — send & receive chat messages
//
// A message belongs either to the "general" channel (channel='general', user_id=null)
// or to a direct conversation with a contact (channel='dm', user_id=<contact id>).
//
//   GET  ?channel=general                 → general channel messages
//   GET  ?channel=dm&user_id=123          → direct messages with contact 123
//   POST { channel, user_id?, text, sender }  → send a message
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const channel = req.query.channel || 'general';
      let query = supabase
        .from('messages')
        .select('*')
        .eq('channel', channel)
        .order('created_at', { ascending: true });

      if (channel === 'dm') {
        const userId = req.query.user_id;
        if (!userId) return send(res, 400, { error: 'missing user_id' });
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return send(res, 200, data);
    }

    if (req.method === 'POST') {
      const { channel, user_id, text, sender } = req.body || {};
      if (!text || !String(text).trim()) {
        return send(res, 400, { error: 'הודעה ריקה' });
      }
      const ch = channel === 'dm' ? 'dm' : 'general';
      if (ch === 'dm' && !user_id) {
        return send(res, 400, { error: 'missing user_id' });
      }
      const { data, error } = await supabase
        .from('messages')
        .insert({
          channel: ch,
          user_id: ch === 'dm' ? user_id : null,
          text: String(text).trim(),
          sender: sender || 'אני',
        })
        .select()
        .single();
      if (error) throw error;
      return send(res, 201, data);
    }

    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[messages]', err);
    return send(res, 500, { error: err.message || 'server error' });
  }
}
