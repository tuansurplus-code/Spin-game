module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { gift_id, user_name, user_email, user_phone, gift_label } = body || {};

    if (!gift_id || !user_name || !user_email) {
      return res.status(400).json({ success: false, error: 'Missing required user or gift details.' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const headers = {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const giftRes = await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift_id}&select=*`, { headers });
    const giftData = await giftRes.json();
    const gift = Array.isArray(giftData) ? giftData[0] : null;

    if (!gift || gift.stock <= 0) {
      return res.status(400).json({ success: false, error: 'Item is out of stock.' });
    }

    const resolvedLabel = gift_label || gift.name || gift.title || 'Prize';

    const winRes = await fetch(`${SUPABASE_URL}/rest/v1/winners`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        gift_id: gift_id, 
        gift_label: resolvedLabel,
        user_name: user_name, 
        user_email: user_email, 
        user_phone: user_phone,
        status: 'Claimed'
      })
    });

    if (!winRes.ok) {
      const errData = await winRes.json();
      return res.status(500).json({ success: false, error: JSON.stringify(errData) });
    }

    await fetch(`${SUPABASE_URL}/rest/v1/gifts?id=eq.${gift_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ stock: gift.stock - 1 })
    });

    return res.status(200).json({ success: true, message: 'Claim submitted successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};
