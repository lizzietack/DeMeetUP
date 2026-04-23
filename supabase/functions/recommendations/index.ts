import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = { id: claimsData.claims.sub as string };

    // Fetch user's interaction history (last 50 interactions)
    const { data: interactions } = await supabase
      .from("user_interactions")
      .select("companion_profile_id, interaction_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch all companion profiles with their info
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: companions } = await adminClient
      .from("companion_profiles")
      .select(`
        id, services, gender, hourly_rate, overnight_rate, verified,
        profiles!companion_profiles_user_id_fkey (display_name, location, bio)
      `);

    if (!companions || companions.length === 0) {
      return new Response(
        JSON.stringify({ recommended: [], becauseYouViewed: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's profile for preferences
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("location")
      .eq("user_id", user.id)
      .single();

    // Build context for AI
    const viewedIds = [...new Set((interactions || [])
      .filter((i: any) => i.interaction_type === "view")
      .map((i: any) => i.companion_profile_id))];

    const likedIds = [...new Set((interactions || [])
      .filter((i: any) => i.interaction_type === "like")
      .map((i: any) => i.companion_profile_id))];

    const interactionSummary = {
      viewedCompanions: viewedIds.slice(0, 10).map((id) => {
        const c = companions.find((comp: any) => comp.id === id);
        return c ? {
          id: c.id,
          name: (c as any).profiles?.display_name,
          services: c.services,
          gender: c.gender,
          rate: c.hourly_rate,
          location: (c as any).profiles?.location,
        } : null;
      }).filter(Boolean),
      likedCompanions: likedIds.slice(0, 5).map((id) => {
        const c = companions.find((comp: any) => comp.id === id);
        return c ? {
          id: c.id,
          services: c.services,
          gender: c.gender,
          rate: c.hourly_rate,
        } : null;
      }).filter(Boolean),
      userLocation: userProfile?.location,
    };

    const allCompanions = companions.map((c: any) => ({
      id: c.id,
      name: c.profiles?.display_name,
      services: c.services,
      gender: c.gender,
      rate: c.hourly_rate,
      location: c.profiles?.location,
      verified: c.verified,
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: return random recommendations if no AI key
      const shuffled = [...allCompanions].sort(() => Math.random() - 0.5);
      return new Response(
        JSON.stringify({
          recommended: shuffled.slice(0, 6).map((c: any) => c.id),
          becauseYouViewed: [],
          reasons: {},
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a recommendation engine for a premium companion discovery platform. 
Analyze the user's interaction history and preferences to rank companions.
Return a JSON object with:
- "recommended": array of companion IDs ranked by relevance (top 6)
- "becauseYouViewed": array of objects {viewedId, suggestedIds: [max 3], viewedName} for "Because you viewed X" suggestions
- "reasons": object mapping companion ID to a short reason string (max 8 words)

Prioritize: similar services to viewed/liked, same location, verified profiles, price range alignment.
If no interaction history, recommend verified and diverse profiles.`;

    const userPrompt = `User interactions: ${JSON.stringify(interactionSummary)}
Available companions: ${JSON.stringify(allCompanions)}
Return recommendations as JSON.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_recommendations",
              description: "Return companion recommendations",
              parameters: {
                type: "object",
                properties: {
                  recommended: {
                    type: "array",
                    items: { type: "string" },
                    description: "Companion IDs ranked by relevance",
                  },
                  becauseYouViewed: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        viewedId: { type: "string" },
                        viewedName: { type: "string" },
                        suggestedIds: { type: "array", items: { type: "string" } },
                      },
                      required: ["viewedId", "viewedName", "suggestedIds"],
                    },
                  },
                  reasons: {
                    type: "object",
                    additionalProperties: { type: "string" },
                  },
                },
                required: ["recommended", "becauseYouViewed", "reasons"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_recommendations" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fallback
      const shuffled = [...allCompanions].sort(() => Math.random() - 0.5);
      return new Response(
        JSON.stringify({
          recommended: shuffled.slice(0, 6).map((c: any) => c.id),
          becauseYouViewed: [],
          reasons: {},
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let result;
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        result = { recommended: allCompanions.slice(0, 6).map((c: any) => c.id), becauseYouViewed: [], reasons: {} };
      }
    } else {
      result = { recommended: allCompanions.slice(0, 6).map((c: any) => c.id), becauseYouViewed: [], reasons: {} };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommendations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
