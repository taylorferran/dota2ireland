export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { password, state } = req.body;

    if (!password || password !== process.env.REBOOTED2_ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await fetch(`${supabaseUrl}/rest/v1/rebooted2_config`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key: 'table_state', value: state }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Supabase error:', error);
      res.status(response.status).json({ error: 'Database write failed' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('rebooted2-update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
