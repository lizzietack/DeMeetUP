import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ATTEMPTS = 5

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authClient = createClient(supabaseUrl, anonKey)
    const { data: claimsData, error: authError } = await authClient.auth.getClaims(token)
    if (authError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = claimsData.claims.sub as string

    // ── Validate input ────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const code = typeof body?.code === 'string' ? body.code.trim() : ''
    if (!/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'Code must be 6 digits' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)

    // ── Look up pending verification ──────────────────────────────────
    const { data: verif, error: fetchErr } = await admin
      .from('phone_verifications')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchErr) {
      console.error('fetch error:', fetchErr)
      return new Response(JSON.stringify({ error: 'Failed to verify' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!verif) {
      return new Response(JSON.stringify({ error: 'No verification in progress. Request a new code.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Expired?
    if (new Date(verif.expires_at).getTime() < Date.now()) {
      await admin.from('phone_verifications').delete().eq('user_id', userId)
      return new Response(JSON.stringify({ error: 'Code expired. Request a new one.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Too many attempts?
    if (verif.attempts >= MAX_ATTEMPTS) {
      await admin.from('phone_verifications').delete().eq('user_id', userId)
      return new Response(JSON.stringify({ error: 'Too many attempts. Request a new code.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Compare hash ──────────────────────────────────────────────────
    const expectedHash = await sha256Hex(`${code}:${userId}:${verif.phone}`)
    if (expectedHash !== verif.code_hash) {
      const remaining = MAX_ATTEMPTS - (verif.attempts + 1)
      await admin
        .from('phone_verifications')
        .update({ attempts: verif.attempts + 1 })
        .eq('user_id', userId)
      return new Response(
        JSON.stringify({
          error: remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : 'Too many attempts. Request a new code.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Success: save phone to profiles, delete verification ─────────
    const verifiedAt = new Date().toISOString()
    const { error: updateErr } = await admin
      .from('profiles')
      .update({ phone: verif.phone, phone_verified_at: verifiedAt })
      .eq('user_id', userId)
    if (updateErr) {
      console.error('profile update error:', updateErr)
      return new Response(JSON.stringify({ error: 'Failed to save phone' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await admin.from('phone_verifications').delete().eq('user_id', userId)

    return new Response(JSON.stringify({ success: true, phone: verif.phone, verified_at: verifiedAt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('verify-phone-otp error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})