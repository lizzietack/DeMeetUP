import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    let callerId: string;
    try {
      const { data, error } = await userClient.auth.getClaims(token);
      if (error || !data?.claims) return json({ error: "Unauthorized" }, 401);
      callerId = data.claims.sub as string;
    } catch {
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const platformRole = body.platform_role === "companion" ? "companion" : "guest";
    const grantAdmin = !!body.grant_admin;
    const redirectTo = typeof body.redirect_to === "string" ? body.redirect_to : undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Invalid email" }, 400);
    }

    // Upsert pending invitation (replace any prior pending one)
    await admin.from("invitations")
      .update({ status: "revoked" })
      .eq("status", "pending")
      .ilike("email", email);

    const { data: inv, error: invErr } = await admin
      .from("invitations")
      .insert({
        email,
        platform_role: platformRole,
        grant_admin: grantAdmin,
        invited_by: callerId,
      })
      .select()
      .single();
    if (invErr) return json({ error: invErr.message }, 400);

    // Send invite email via Supabase Admin API
    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { invited_by: callerId, platform_role: platformRole, grant_admin: grantAdmin },
    });

    if (inviteErr) {
      // Common case: user already exists. Keep invitation row so role applies if they re-signup,
      // but report a friendly note.
      return json({
        success: false,
        invitation: inv,
        warning: inviteErr.message,
      }, 200);
    }

    return json({ success: true, invitation: inv }, 200);
  } catch (e: any) {
    console.error("admin-invite-user error:", e);
    return json({ error: e?.message || "Server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}