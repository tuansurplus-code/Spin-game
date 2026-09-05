const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ success: false, error: 'Missing Supabase environment variables.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (req.method === 'GET') {
    try {
      const [giftsRes, winnersRes, fieldsRes, settingsRes] = await Promise.all([
        supabase.from('gifts').select('*').order('id', { ascending: true }),
        supabase.from('winners').select('*').order('id', { ascending: false }),
        supabase.from('form_fields').select('*').order('id', { ascending: true }),
        supabase.from('settings').select('*')
      ]);

      return res.status(200).json({
        success: true,
        gifts: giftsRes.data || [],
        winners: winnersRes.data || [],
        form_fields: fieldsRes.data || [],
        settings: settingsRes.data || []
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      // Safely parse body if sent as string or object
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      body = body || {};

      let { action, table, data, id, form_fields, gifts, settings } = body;

      // Auto-map frontend request payload structures
      if (!table) {
        if (action === 'save_fields' || form_fields) {
          table = 'form_fields';
          data = form_fields;
          action = 'save_bulk';
        } else if (action === 'save_prizes' || gifts) {
          table = 'gifts';
          data = gifts;
          action = 'save_bulk';
        } else if (action === 'save_settings' || settings) {
          table = 'settings';
          data = settings;
          action = 'save_bulk';
        }
      }

      if (!table) {
        return res.status(400).json({ 
          success: false, 
          error: 'Target table not specified.', 
          receivedBody: body 
        });
      }

      let result;

      if (action === 'save_bulk' || Array.isArray(data)) {
        await supabase.from(table).delete().neq('id', 0);
        if (Array.isArray(data) && data.length > 0) {
          const cleanData = data.map(({ id, ...rest }) => rest);
          result = await supabase.from(table).insert(cleanData);
        } else {
          result = { error: null };
        }
      } else if (action === 'insert') {
        result = await supabase.from(table).insert([data]).select();
      } else if (action === 'update') {
        result = await supabase.from(table).update(data).eq('id', id).select();
      } else if (action === 'delete') {
        result = await supabase.from(table).delete().eq('id', id);
      } else {
        return res.status(400).json({ success: false, error: 'Invalid action specified.' });
      }

      if (result && result.error) {
        return res.status(400).json({ success: false, error: result.error.message });
      }

      return res.status(200).json({ success: true, data: result?.data || [] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
