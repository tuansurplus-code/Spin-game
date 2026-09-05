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
      const body = req.body;

      // Handle bulk array saves (e.g., saving all form fields or gifts at once)
      if (body.table && Array.isArray(body.data)) {
        const { table, data } = body;
        // Clear existing and re-insert or upsert
        await supabase.from(table).delete().neq('id', 0); // clear table
        if (data.length > 0) {
          const { error } = await supabase.from(table).insert(data);
          if (error) return res.status(400).json({ success: false, error: error.message });
        }
        return res.status(200).json({ success: true });
      }

      // Handle single action object format
      const { action, table, data, id } = body;
      if (!table) {
        return res.status(400).json({ success: false, error: 'Target table not specified.' });
      }

      let result;
      if (action === 'insert') {
        result = await supabase.from(table).insert([data]).select();
      } else if (action === 'update') {
        result = await supabase.from(table).update(data).eq('id', id).select();
      } else if (action === 'delete') {
        result = await supabase.from(table).delete().eq('id', id);
      } else {
        return res.status(400).json({ success: false, error: 'Invalid action specified.' });
      }

      if (result.error) {
        return res.status(400).json({ success: false, error: result.error.message });
      }

      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
