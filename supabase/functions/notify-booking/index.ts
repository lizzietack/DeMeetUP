import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      companion_user_id,
      guest_name,
      service,
      booking_date,
      booking_time,
      total,
      currency_symbol,
    } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get companion's email from auth and phone + name from profiles table
    const { data: userData } = await supabase.auth.admin.getUserById(companion_user_id)
    const companionEmail = userData?.user?.email

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, phone')
      .eq('user_id', companion_user_id)
      .single()

    const companionName = profile?.display_name || 'there'
    const companionPhone = (profile as any)?.phone || null
    const sym = currency_symbol || 'GH₵'

    const messageBody = `Hi ${companionName}! New booking from ${guest_name}: ${service} on ${booking_date} at ${booking_time}. Total: ${sym}${total}. Open DeMeetUP to accept or decline.`

    const results: Record<string, any> = {}

    // ── EMAIL via Resend ──────────────────────────────────────────────
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey && companionEmail) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'DeMeetUP <bookings@demeetup.app>',
            to: [companionEmail],
            subject: `New Booking Request from ${guest_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #d4af37;">New Booking Request 🎉</h1>
                <p>Hi ${companionName}, someone wants to book you!</p>
                <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 6px 0;"><strong>Guest</strong></td><td>${guest_name}</td></tr>
                    <tr><td style="padding: 6px 0;"><strong>Service</strong></td><td>${service}</td></tr>
                    <tr><td style="padding: 6px 0;"><strong>Date</strong></td><td>${booking_date}</td></tr>
                    <tr><td style="padding: 6px 0;"><strong>Time</strong></td><td>${booking_time}</td></tr>
                    <tr><td style="padding: 6px 0;"><strong>Total</strong></td><td><strong>${sym}${total}</strong></td></tr>
                  </table>
                </div>
                <a href="https://demeetup.app/dashboard" style="display: inline-block; background: #d4af37; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open DeMeetUP to Respond</a>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">You have 1 hour to accept before the request expires.</p>
              </div>
            `,
          }),
        })
        results.email = emailRes.ok ? 'sent' : `failed (${emailRes.status})`
      } catch (e: any) {
        results.email = `error: ${e.message}`
      }
    } else {
      results.email = resendApiKey ? 'no_email_on_account' : 'RESEND_API_KEY_not_set'
    }

    // ── SMS via SMSOnlineGH ───────────────────────────────────────────
    const smsonlineghKey = Deno.env.get('SMSONLINEGH_API_KEY')
    const smsonlineghSender = Deno.env.get('SMSONLINEGH_SENDER_ID') || 'DeMeetUP'

    if (smsonlineghKey && companionPhone) {
      try {
        // Normalise to 233XXXXXXXXX format
        let phone = companionPhone.replace(/\s+/g, '').replace(/^\+/, '')
        if (phone.startsWith('0')) phone = '233' + phone.slice(1)

        const smsRes = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Host': 'api.smsonlinegh.com',
            'Authorization': `key ${smsonlineghKey}`,
          },
          body: JSON.stringify({
            text: messageBody,
            type: 0,
            sender: smsonlineghSender,
            destinations: [phone],
          }),
        })

        const smsData = await smsRes.json()
        results.sms = smsRes.ok
          ? `sent (handshake: ${smsData?.handshake})`
          : `failed (${smsRes.status}): ${JSON.stringify(smsData)}`
      } catch (e: any) {
        results.sms = `error: ${e.message}`
      }
    } else {
      results.sms = smsonlineghKey ? 'no_phone_in_profile' : 'SMSONLINEGH_API_KEY_not_set'
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('notify-booking error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})