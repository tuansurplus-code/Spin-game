import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gift_id, user_name, user_email, user_phone, user_address } = req.body;

  if (!gift_id || !user_name || !user_email) {
    return res.status(400).json({ error: 'Missing required user details or gift ID' });
  }

  try {
    const { data: gift, error: fetchError } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', gift_id)
      .single();

    if (fetchError || !gift) throw new Error('Gift not found');
    if (gift.stock <= 0) throw new Error('Item is out of stock');

    const { error: winnerError } = await supabase
      .from('winners')
      .insert([{
        gift_id: gift.id,
        gift_label: gift.label,
        user_name,
        user_email,
        user_phone: user_phone || '',
        user_address: user_address || '',
        status: 'Claimed'
      }]);

    if (winnerError) throw winnerError;

    const { error: updateError } = await supabase
      .from('gifts')
      .update({ stock: gift.stock - 1 })
      .eq('id', gift.id);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: 'Prize claimed successfully!'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}