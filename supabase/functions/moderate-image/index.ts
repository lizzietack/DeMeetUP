import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image_url, image_type, moderation_id } = await req.json();

    if (!image_url || !moderation_id) {
      return new Response(JSON.stringify({ error: "image_url and moderation_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Gemini Vision for analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an image moderation AI for a premium social platform. Analyze the uploaded image and return a JSON assessment. Be strict but fair.

Evaluate:
1. face_detected (boolean): Is there a clear, real human face visible?
2. face_count (number): How many faces are detected?
3. nsfw_score (number 0-100): 0=completely safe, 100=explicit. Flag anything above 30.
4. quality_score (number 0-100): Image quality assessment. Below 30 is too low quality.
5. is_stock_photo (boolean): Does this appear to be a stock photo or watermarked image?
6. is_screenshot (boolean): Is this a screenshot rather than a real photo?
7. overall_verdict: "approved" | "rejected" | "needs_review"
8. rejection_reasons (string[]): List of specific reasons if rejected.
9. confidence (number 0-100): How confident are you in this assessment?

Return ONLY valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image for our platform moderation:" },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_moderation_result",
              description: "Submit the image moderation analysis result",
              parameters: {
                type: "object",
                properties: {
                  face_detected: { type: "boolean" },
                  face_count: { type: "number" },
                  nsfw_score: { type: "number" },
                  quality_score: { type: "number" },
                  is_stock_photo: { type: "boolean" },
                  is_screenshot: { type: "boolean" },
                  overall_verdict: { type: "string", enum: ["approved", "rejected", "needs_review"] },
                  rejection_reasons: { type: "array", items: { type: "string" } },
                  confidence: { type: "number" },
                },
                required: ["face_detected", "nsfw_score", "quality_score", "overall_verdict", "rejection_reasons", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_moderation_result" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      // If AI fails, set to needs_review so admin can handle
      await supabase
        .from("image_moderation")
        .update({
          status: "pending_review",
          ai_analysis: { error: "AI analysis failed", raw: errText },
        })
        .eq("id", moderation_id);

      return new Response(JSON.stringify({ status: "pending_review", message: "AI analysis failed, queued for manual review" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let analysis: any;

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try parsing content
        const content = aiData.choices?.[0]?.message?.content || "";
        analysis = JSON.parse(content);
      }
    } catch {
      analysis = {
        overall_verdict: "needs_review",
        rejection_reasons: ["Could not parse AI response"],
        confidence: 0,
      };
    }

    // Determine status
    let status: string;
    let rejectionReason: string | null = null;

    if (analysis.overall_verdict === "approved" && analysis.confidence >= 60) {
      status = "approved";
    } else if (analysis.overall_verdict === "rejected") {
      status = "rejected";
      rejectionReason = (analysis.rejection_reasons || []).join("; ");
    } else {
      status = "pending_review";
    }

    // Additional hard rules
    if (analysis.nsfw_score > 30) {
      status = "rejected";
      rejectionReason = "Image flagged as inappropriate content";
    }
    if (analysis.quality_score < 30) {
      status = "rejected";
      rejectionReason = "Image quality too low";
    }
    if (image_type === "profile" && !analysis.face_detected) {
      status = "rejected";
      rejectionReason = "Profile photos must contain a clear face";
    }

    // Update moderation record
    await supabase
      .from("image_moderation")
      .update({
        status,
        ai_analysis: analysis,
        rejection_reason: rejectionReason,
      })
      .eq("id", moderation_id);

    // Update profile photo_verified if profile image approved
    if (image_type === "profile" && status === "approved") {
      await supabase
        .from("profiles")
        .update({ photo_verified: true })
        .eq("user_id", user.id);
    }

    // Apply watermark to approved images
    if (status === "approved") {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/watermark-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Call": "true",
          },
          body: JSON.stringify({
            image_url,
            moderation_id,
          }),
        });
      } catch (wmErr) {
        console.error("Watermark failed (non-blocking):", wmErr);
      }
    }

    // Flag user if suspicious
    if (analysis.is_stock_photo || analysis.is_screenshot) {
      await supabase
        .from("profiles")
        .update({ flagged_for_review: true })
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({ status, analysis, rejection_reason: rejectionReason }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("moderate-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
