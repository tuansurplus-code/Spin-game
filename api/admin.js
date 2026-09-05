module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD || req.headers['x-admin-auth'] !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid admin credentials.' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    if (req.method === 'GET') {
      const [giftsRes, winnersRes, fieldsRes, settingsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/gifts?select=*&order=id.asc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/winners?select=*&order=created_at.desc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/form_fields?select=*&order=created_at.asc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/settings?select=*`, { headers })
      ]);

      return res.status(200).json({
        success: true,
        gifts: await giftsRes.json(),
        claims: await winnersRes.json(),
        form_fields: await fieldsRes.json(),
        settings: await settingsRes.json()
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { action } = body || {};

    if (action === 'save_prizes') {
      const gifts = body.gifts || [];
      for (const gift of gifts) {
        const payload = {
          name: gift.label || gift.name || 'Prize',
          stock: Number(gift.stock ?? 10),
          color: gift.color || '#3b82f6',
          probability: Number(gift.weight ?? gift.probability ?? 10),
          active: true
        };

        if (gift.id) {
          await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload)
          });
        } else {
          await fetch(`${SUPABASE_URL}/rest/v1/gifts`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
        }
      }
      return res.status(200).json({ success: true });
    }

    if (action === 'save_fields') {
      const fields = body.form_fields || [];
      for (const f of fields) {
        const payload = {
          field_label: f.field_label,
          field_name: f.field_name || f.field_label.toLowerCase().replace(/\s+/g, '_'),
          field_type: f.field_type || 'text',
          is_required: f.is_required ?? true
        };

        if (f.id) {
          await fetch(`${SUPABASE_URL}/rest/v1/form_fields?id=eq.${f.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload)
          });
        } else {
          await fetch(`${SUPABASE_URL}/rest/v1/form_fields`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
        }
      }
      return res.status(200).json({ success: true });
    }

    if (action === 'save_settings') {
      const settings = body.settings || [];
      for (const s of settings) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.${s.key}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ value: String(s.value) })
        });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, error: 'Invalid action provided.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};
