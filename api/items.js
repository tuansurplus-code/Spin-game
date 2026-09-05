import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('active', true)
      .gt('stock', 0);

    if (error) throw error;

    return res.status(200).json({ success: true, items: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}