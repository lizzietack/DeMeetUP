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
    const targetUserId = String(body.user_id || "").trim();
    if (!targetUserId) return json({ error: "Missing user_id" }, 400);
    if (targetUserId === callerId) {
      return json({ error: "You cannot delete your own account" }, 400);
    }

    // Best-effort cleanup of related rows (FKs aren't all set up).
    // Order matters: child rows first.
    const cleanups: Array<Promise<unknown>> = [
      admin.from("companion_images").delete().in(
        "companion_profile_id",
        // subselect via filter: fetch ids first
        (await admin
          .from("companion_profiles")
          .select("id")
          .eq("user_id", targetUserId)).data?.map((r: any) => r.id) || ["00000000-0000-0000-0000-000000000000"],
      ),
      admin.from("companion_profiles").delete().eq("user_id", targetUserId),
      admin.from("saved_companions").delete().eq("user_id", targetUserId),
      admin.from("blocked_users").delete().eq("blocker_id", targetUserId),
      admin.from("blocked_users").delete().eq("blocked_id", targetUserId),
      admin.from("user_interactions").delete().eq("user_id", targetUserId),
      admin.from("user_presence").delete().eq("user_id", targetUserId),
      admin.from("push_subscriptions").delete().eq("user_id", targetUserId),
      admin.from("phone_otps").delete().eq("user_id", targetUserId),
      admin.from("phone_verifications").delete().eq("user_id", targetUserId),
      admin.from("message_reactions").delete().eq("user_id", targetUserId),
      admin.from("reports").delete().eq("reporter_id", targetUserId),
      admin.from("reports").delete().eq("reported_user_id", targetUserId),
      admin.from("user_roles").delete().eq("user_id", targetUserId),
      admin.from("profiles").delete().eq("user_id", targetUserId),
    ];
    const results = await Promise.allSettled(cleanups);
    const warnings = results
      .map((r, i) => r.status === "rejected" ? `step ${i}: ${(r.reason as any)?.message}` : null)
      .filter(Boolean);

    // Finally, delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(targetUserId);
    if (delErr) {
      console.error("auth.admin.deleteUser error:", delErr);
      return json({ error: delErr.message, warnings }, 400);
    }

    return json({ success: true, warnings }, 200);
  } catch (e: any) {
    console.error("admin-delete-user error:", e);
    return json({ error: e?.message || "Server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}