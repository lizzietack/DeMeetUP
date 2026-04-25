import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Normalise any Ghana phone input to 233XXXXXXXXX (no +). Returns null if invalid.
function normalizeGhanaPhone(input: string): string | null {
  if (!input) return null
  let p = input.replace(/[\s\-()]/g, '').replace(/^\+/, '')
  if (p.startsWith('0')) p = '233' + p.slice(1)
  if (!/^233\d{9}$/.test(p)) return null
  return p
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateCode(): string {
  // Cryptographically random 6-digit code, zero-padded
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return (arr[0] % 1_000_000).toString().padStart(6, '0')
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
    const rawPhone = typeof body?.phone === 'string' ? body.phone : ''
    const phone = normalizeGhanaPhone(rawPhone)
    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Invalid Ghana phone number. Use format 0241234567 or +233241234567.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── Rate-limit: prevent rapid resends (60s) ───────────────────────
    const admin = createClient(supabaseUrl, serviceKey)
    const { data: existing } = await admin
      .from('phone_verifications')
      .select('created_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      const ageSec = (Date.now() - new Date(existing.created_at).getTime()) / 1000
      if (ageSec < 60) {
        return new Response(
          JSON.stringify({ error: `Please wait ${Math.ceil(60 - ageSec)}s before requesting another code.` }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    // ── Generate + store hashed code ──────────────────────────────────
    const code = generateCode()
    const codeHash = await sha256Hex(`${code}:${userId}:${phone}`)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

    // Upsert (replaces any prior pending verification for this user)
    const { error: upsertError } = await admin
      .from('phone_verifications')
      .upsert(
        {
          user_id: userId,
          phone,
          code_hash: codeHash,
          expires_at: expiresAt,
          attempts: 0,
        },
        { onConflict: 'user_id' },
      )
    if (upsertError) {
      console.error('upsert error:', upsertError)
      return new Response(JSON.stringify({ error: 'Failed to store verification' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Send SMS via SMSOnlineGH ──────────────────────────────────────
    const smsKey = Deno.env.get('SMSONLINEGH_API_KEY')
    const smsSender = Deno.env.get('SMSONLINEGH_SENDER_ID') || 'DeMeetUP'
    if (!smsKey) {
      return new Response(JSON.stringify({ error: 'SMS provider not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const smsRes = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Host': 'api.smsonlinegh.com',
        'Authorization': `key ${smsKey}`,
      },
      body: JSON.stringify({
        text: `Your DeMeetUP verification code is ${code}. It expires in 10 minutes. Do not share this code.`,
        type: 0,
        sender: smsSender,
        destinations: [phone],
      }),
    })

    const smsData = await smsRes.json().catch(() => ({}))
    if (!smsRes.ok) {
      console.error('SMS send failed:', smsRes.status, smsData)
      return new Response(
        JSON.stringify({ error: 'Failed to send SMS. Check the number and try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        phone,
        message: 'Verification code sent',
        expiresInSeconds: 600,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: any) {
    console.error('send-phone-otp error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})