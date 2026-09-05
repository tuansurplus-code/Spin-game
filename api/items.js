module.exports = async function handler(req, res) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const headers = {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    };

    const [giftsRes, fieldsRes, settingsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/gifts?select=*&active=eq.true&stock=gt.0&order=id.asc`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/form_fields?select=*&order=created_at.asc`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/settings?select=*`, { headers })
    ]);

    return res.status(200).json({
      success: true,
      gifts: await giftsRes.json(),
      form_fields: await fieldsRes.json(),
      settings: await settingsRes.json()
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
