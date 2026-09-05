import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: gifts, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('active', true)
      .gt('stock', 0);

    if (error) throw error;
    if (!gifts || gifts.length === 0) {
      return res.status(400).json({ error: 'No available items in stock' });
    }

    const totalWeight = gifts.reduce((sum, item) => sum + item.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let winningItem = gifts[0];

    for (const item of gifts) {
      if (randomNum < item.weight) {
        winningItem = item;
        break;
      }
      randomNum -= item.weight;
    }

    const winningIndex = gifts.findIndex(g => g.id === winningItem.id);

    return res.status(200).json({
      success: true,
      winningIndex,
      winningItem
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}