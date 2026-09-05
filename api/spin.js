module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/gifts?select=*&active=eq.true&stock=gt.0`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const items = await response.json();

    if (!response.ok || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No active prizes available.' });
    }

    const totalWeight = items.reduce((acc, item) => acc + (Number(item.probability ?? item.weight) || 1), 0);
    let randomNum = Math.random() * totalWeight;
    let winningIndex = 0;

    for (let i = 0; i < items.length; i++) {
      const weight = Number(items[i].probability ?? items[i].weight) || 1;
      if (randomNum < weight) {
        winningIndex = i;
        break;
      }
      randomNum -= weight;
    }

    return res.status(200).json({
      success: true,
      winningIndex,
      winningItem: items[winningIndex]
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
