/**
 * Ephemeral Waitlist API
 * 
 * Cloudflare Worker + D1 Database
 * Replaces Viral Loops with custom referral tracking
 * 
 * Endpoints:
 * - POST /api/subscribe     - Add new subscriber
 * - GET  /api/stats         - Get waitlist statistics  
 * - GET  /api/subscriber/:code - Get subscriber info by referral code
 * - POST /api/founder       - Mark subscriber as founder (webhook from Stripe)
 */

// CORS headers for frontend requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Verify Stripe webhook signature (HMAC-SHA256)
async function verifyStripeSignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  const elements = signatureHeader.split(',');
  let timestamp = '';
  const signatures = [];

  for (const el of elements) {
    const [key, value] = el.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) {
    throw new Error('Invalid Stripe signature header');
  }

  const ts = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSeconds) {
    throw new Error('Webhook timestamp too old');
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedPayload)
  );

  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison
  const expectedBytes = new TextEncoder().encode(expectedSig);
  let matched = false;
  for (const candidateSig of signatures) {
    const candidateBytes = new TextEncoder().encode(candidateSig);
    if (candidateBytes.length === expectedBytes.length) {
      let diff = 0;
      for (let i = 0; i < expectedBytes.length; i++) {
        diff |= expectedBytes[i] ^ candidateBytes[i];
      }
      if (diff === 0) matched = true;
    }
  }
  if (!matched) {
    throw new Error('Invalid Stripe signature');
  }

  return JSON.parse(rawBody);
}

// Generate a unique 8-character referral code
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0,O,1,I,L)
  let code = 'EPH';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Validate email format
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Calculate position based on referral count and signup time
// More referrals = better position, earlier signup = tiebreaker
async function calculatePosition(db, subscriberId, referralCount) {
  // Count how many people have more referrals OR same referrals but signed up earlier
  const result = await db.prepare(`
    SELECT COUNT(*) as position FROM subscribers 
    WHERE is_active = 1 
    AND (
      referral_count > ? 
      OR (referral_count = ? AND created_at < (SELECT created_at FROM subscribers WHERE id = ?))
    )
  `).bind(referralCount, referralCount, subscriberId).first();
  
  return (result?.position || 0) + 1;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ============================================
      // POST /api/subscribe - New waitlist signup
      // ============================================
      if (path === '/api/subscribe' && request.method === 'POST') {
        const body = await request.json();
        const { email, referrer } = body;

        // Validate email
        if (!email || !isValidEmail(email)) {
          return Response.json(
            { error: 'Invalid email address' },
            { status: 400, headers: corsHeaders }
          );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if email already exists
        const existing = await env.ephemeral_waitlist.prepare(
          'SELECT * FROM subscribers WHERE email = ?'
        ).bind(normalizedEmail).first();

        if (existing) {
          // Return existing subscriber info
          const position = await calculatePosition(env.ephemeral_waitlist, existing.id, existing.referral_count);
          return Response.json({
            success: true,
            isExisting: true,
            referralCode: existing.referral_code,
            position: position,
            referralCount: existing.referral_count,
          }, { headers: corsHeaders });
        }

        // Generate unique referral code
        let referralCode;
        let isUnique = false;
        while (!isUnique) {
          referralCode = generateReferralCode();
          const check = await env.ephemeral_waitlist.prepare(
            'SELECT id FROM subscribers WHERE referral_code = ?'
          ).bind(referralCode).first();
          if (!check) isUnique = true;
        }

        // Find referrer if provided
        let referrerId = null;
        if (referrer) {
          const referrerRecord = await env.ephemeral_waitlist.prepare(
            'SELECT id FROM subscribers WHERE referral_code = ?'
          ).bind(referrer.toUpperCase()).first();
          if (referrerRecord) {
            referrerId = referrerRecord.id;
          }
        }

        // Insert new subscriber
        const result = await env.ephemeral_waitlist.prepare(`
          INSERT INTO subscribers (email, referral_code, referred_by, created_at, is_active, is_founder, referral_count)
          VALUES (?, ?, ?, datetime('now'), 1, 0, 0)
        `).bind(normalizedEmail, referralCode, referrerId).run();

        const newId = result.meta.last_row_id;

        // If they were referred, increment referrer's count
        if (referrerId) {
          await env.ephemeral_waitlist.prepare(`
            UPDATE subscribers SET referral_count = referral_count + 1 WHERE id = ?
          `).bind(referrerId).run();
        }

        // Calculate position
        const position = await calculatePosition(env.ephemeral_waitlist, newId, 0);

        // Get total count for display
        const stats = await env.ephemeral_waitlist.prepare(
          'SELECT COUNT(*) as total FROM subscribers WHERE is_active = 1'
        ).first();

        // Auto-sync to Beehiiv if configured (non-blocking)
        if (env.BEEHIIV_API_KEY && env.BEEHIIV_PUBLICATION_ID) {
          console.log('Beehiiv sync starting for:', normalizedEmail);
          ctx.waitUntil(
            fetch(
              `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${env.BEEHIIV_API_KEY}`,
                },
                body: JSON.stringify({
                  email: normalizedEmail,
                  utm_source: 'website',
                  utm_medium: 'waitlist',
                  send_welcome_email: true,
                  double_opt_override: 'off',
                  custom_fields: [
                    { name: 'referral_code', value: referralCode },
                    { name: 'referral_link', value: `https://ephemeralsocial.com/?ref=${referralCode}` },
                    { name: 'waitlist_position', value: String(position) },
                  ],
                }),
              }
            ).then(async (res) => {
              const body = await res.text();
              console.log('Beehiiv response:', res.status, body);
            }).catch(err => console.error('Beehiiv sync failed:', err))
          );
        } else {
          console.log('Beehiiv NOT configured - BEEHIIV_API_KEY:', !!env.BEEHIIV_API_KEY, 'BEEHIIV_PUBLICATION_ID:', !!env.BEEHIIV_PUBLICATION_ID);
        }

        return Response.json({
          success: true,
          isExisting: false,
          referralCode: referralCode,
          position: position,
          referralCount: 0,
          totalWaitlist: stats?.total || 0,
        }, { headers: corsHeaders });
      }

      // ============================================
      // GET /api/stats - Waitlist statistics
      // ============================================
      if (path === '/api/stats' && request.method === 'GET') {
        const stats = await env.ephemeral_waitlist.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_founder = 1 THEN 1 ELSE 0 END) as founders
          FROM subscribers WHERE is_active = 1
        `).first();

        return Response.json({
          total: stats?.total || 0,
          founders: stats?.founders || 0,
        }, { headers: corsHeaders });
      }

      // ============================================
      // GET /api/subscriber/:code - Get subscriber by referral code
      // ============================================
      if (path.startsWith('/api/subscriber/') && request.method === 'GET') {
        const code = path.split('/').pop().toUpperCase();
        
        const subscriber = await env.ephemeral_waitlist.prepare(`
          SELECT id, referral_code, referral_count, is_founder, created_at
          FROM subscribers WHERE referral_code = ? AND is_active = 1
        `).bind(code).first();

        if (!subscriber) {
          return Response.json(
            { error: 'Subscriber not found' },
            { status: 404, headers: corsHeaders }
          );
        }

        const position = await calculatePosition(env.ephemeral_waitlist, subscriber.id, subscriber.referral_count);

        return Response.json({
          referralCode: subscriber.referral_code,
          position: position,
          referralCount: subscriber.referral_count,
          isFounder: subscriber.is_founder === 1,
        }, { headers: corsHeaders });
      }

      // ============================================
      // POST /api/founder - Mark as founder (Stripe webhook)
      // ============================================
      if (path === '/api/founder' && request.method === 'POST') {
        // Verify Stripe webhook signature when secret is configured
        const rawBody = await request.text();
        let body;

        if (!env.STRIPE_WEBHOOK_SECRET) {
          return Response.json(
            { error: 'Webhook secret not configured' },
            { status: 500, headers: corsHeaders }
          );
        }

        const signature = request.headers.get('Stripe-Signature');
        if (!signature) {
          return Response.json(
            { error: 'Missing signature' },
            { status: 400, headers: corsHeaders }
          );
        }
        try {
          body = await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
          console.error('Stripe signature verification failed:', err.message);
          return Response.json(
            { error: 'Invalid signature' },
            { status: 400, headers: corsHeaders }
          );
        }

        // Handle Stripe webhook format
        if (body.type === 'checkout.session.completed') {
          const session = body.data?.object;
          const email = session?.customer_email || session?.customer_details?.email;
          const referralCode = session?.client_reference_id;

          console.log('Stripe webhook received:', { email, referralCode, type: body.type });

          // Find subscriber by referral code (preferred) or email
          let subscriber;
          if (referralCode) {
            subscriber = await env.ephemeral_waitlist.prepare(
              'SELECT id FROM subscribers WHERE referral_code = ?'
            ).bind(referralCode.toUpperCase()).first();
          }
          if (!subscriber && email) {
            subscriber = await env.ephemeral_waitlist.prepare(
              'SELECT id FROM subscribers WHERE email = ?'
            ).bind(email.toLowerCase().trim()).first();
          }

          if (!subscriber) {
            console.log('Subscriber not found for:', { email, referralCode });
            // Return 200 to acknowledge receipt (Stripe will retry on non-2xx)
            return Response.json({
              success: false,
              message: 'Subscriber not found',
            }, { headers: corsHeaders });
          }

          // Mark as founder
          await env.ephemeral_waitlist.prepare(
            'UPDATE subscribers SET is_founder = 1, founder_at = datetime("now") WHERE id = ?'
          ).bind(subscriber.id).run();

          console.log('Marked as founder:', subscriber.id);

          return Response.json({
            success: true,
            message: 'Marked as founder',
          }, { headers: corsHeaders });
        }

        // Acknowledge other event types we don't handle
        return Response.json({
          success: true,
          message: 'Event type not handled',
        }, { headers: corsHeaders });
      }

      // ============================================
      // POST /api/beehiiv-sync - Sync to Beehiiv (optional)
      // ============================================
      if (path === '/api/beehiiv-sync' && request.method === 'POST') {
        // This can be called after subscribe to also add to Beehiiv
        // Keeps Beehiiv as your email sending platform
        const body = await request.json();
        const { email } = body;

        if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
          return Response.json({
            success: false,
            message: 'Beehiiv not configured',
          }, { headers: corsHeaders });
        }

        try {
          const beehiivResponse = await fetch(
            `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.BEEHIIV_API_KEY}`,
              },
              body: JSON.stringify({
                email: email,
                utm_source: 'website',
                utm_medium: 'waitlist',
              }),
            }
          );

          return Response.json({
            success: beehiivResponse.ok,
          }, { headers: corsHeaders });
        } catch (error) {
          return Response.json({
            success: false,
            error: error.message,
          }, { headers: corsHeaders });
        }
      }

      // 404 for unknown routes
      return Response.json(
        { error: 'Not found' },
        { status: 404, headers: corsHeaders }
      );

    } catch (error) {
      console.error('Worker error:', error);
      return Response.json(
        { error: 'Internal server error', details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
