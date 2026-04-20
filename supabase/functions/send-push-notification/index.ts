import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VAPID_PUBLIC_KEY = 'BNuq5x-F1DxrpZK1KyWp11R0nBWGQCxFU01SMipORokbgef3IHFwPJpSNzaFfTt0COax1C9TpeOwlvM0r0V4DGM'

// Base64url decode helper
function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
  const binary = atob(base64 + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// Import VAPID private key for signing
async function getVapidKeyPair() {
  const privateKeyRaw = Deno.env.get('VAPID_PRIVATE_KEY')!
  const publicKeyRaw = VAPID_PUBLIC_KEY

  const privateKeyBytes = base64UrlDecode(privateKeyRaw)
  const publicKeyBytes = base64UrlDecode(publicKeyRaw)

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: base64UrlEncode(privateKeyBytes),
      x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
      y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  return { privateKey, publicKeyBytes }
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Create JWT for VAPID
async function createVapidJwt(audience: string, privateKey: CryptoKey): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: audience,
    exp: now + 86400,
    sub: 'mailto:noreply@velvetcircle.app',
  }

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)))
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const unsigned = `${encodedHeader}.${encodedPayload}`

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsigned)
  )

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(signature)
  let r: Uint8Array, s: Uint8Array

  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32)
    s = sigBytes.slice(32)
  } else {
    // DER format
    const rLen = sigBytes[3]
    const rStart = 4
    r = sigBytes.slice(rStart, rStart + rLen)
    const sLen = sigBytes[rStart + rLen + 1]
    const sStart = rStart + rLen + 2
    s = sigBytes.slice(sStart, sStart + sLen)
    // Trim leading zeros
    if (r.length > 32) r = r.slice(r.length - 32)
    if (s.length > 32) s = s.slice(s.length - 32)
    // Pad if needed
    if (r.length < 32) { const t = new Uint8Array(32); t.set(r, 32 - r.length); r = t }
    if (s.length < 32) { const t = new Uint8Array(32); t.set(s, 32 - s.length); s = t }
  }

  const rawSig = new Uint8Array(64)
  rawSig.set(r, 0)
  rawSig.set(s, 32)

  return `${unsigned}.${base64UrlEncode(rawSig)}`
}

// Send a single push notification
async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: string,
  vapidPrivateKey: CryptoKey,
  vapidPublicKeyBytes: Uint8Array
) {
  const url = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`

  const jwt = await createVapidJwt(audience, vapidPrivateKey)
  const vapidPublicKeyB64 = base64UrlEncode(vapidPublicKeyBytes)

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt}, k=${vapidPublicKeyB64}`,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
    },
    body: new TextEncoder().encode(payload),
  })

  return { status: response.status, ok: response.ok }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, title, body, url, type } = await req.json()

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: 'user_id and title required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get all subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)

    if (error) throw error
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({ title, body: body || '', url: url || '/', type: type || 'general' })
    const { privateKey, publicKeyBytes } = await getVapidKeyPair()

    let sent = 0
    const expired: string[] = []

    for (const sub of subscriptions) {
      try {
        const result = await sendPushNotification(sub, payload, privateKey, publicKeyBytes)
        if (result.ok) {
          sent++
        } else if (result.status === 404 || result.status === 410) {
          expired.push(sub.id)
        }
      } catch (e) {
        console.error('Push failed for subscription', sub.id, e)
      }
    }

    // Clean up expired subscriptions
    if (expired.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expired)
    }

    return new Response(JSON.stringify({ sent, expired: expired.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Push notification error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
