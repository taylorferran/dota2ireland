import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Map your Stripe Payment Link IDs to ticket types.
const PAYMENT_LINK_MAP = {
  [process.env.STRIPE_PLINK_QUB]: 'qub_player',
  [process.env.STRIPE_PLINK_REBOOT]: 'reboot_team',
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySignature(payload, header, secret) {
  const parts = {};
  header.split(',').forEach((item) => {
    const [key, value] = item.split('=');
    parts[key] = value;
  });

  const signed = `${parts.t}.${payload}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signed)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(parts.v1),
    Buffer.from(expected)
  );
}

// Disable Vercel's automatic body parsing so we can read the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read raw body for signature verification
  const rawBody = await getRawBody(req);
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // Verify webhook signature
  try {
    const valid = verifySignature(
      rawBody.toString(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    if (!valid) throw new Error('Invalid signature');
  } catch {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = JSON.parse(rawBody.toString());

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const ticketType = PAYMENT_LINK_MAP[session.payment_link];

    if (ticketType) {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error } = await supabase.rpc('increment_sold', {
        ticket_id: ticketType,
      });

      if (error) {
        return res.status(500).json({ error: 'Failed to update stock' });
      }
    }
  }

  return res.status(200).json({ received: true });
}
