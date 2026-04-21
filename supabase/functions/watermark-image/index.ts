import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Image, TextLayout } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth check - accept both user tokens and internal service calls
    const authHeader = req.headers.get("Authorization");
    const isInternal = req.headers.get("X-Internal-Call") === "true";
    
    if (!isInternal && authHeader) {
      const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
      const token = authHeader.replace("Bearer ", "");
      const { error: authError } = await anonClient.auth.getUser(token);
      if (authError) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { image_url, moderation_id, bucket = "companion-images" } = await req.json();

    if (!image_url) {
      return new Response(JSON.stringify({ error: "image_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the image
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const contentType = imageResponse.headers.get("content-type") || "";
    const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());

    // imagescript supports PNG and JPEG only. Skip anything else (webp, gif, avif, heic...)
    const isSupported =
      contentType.includes("png") ||
      contentType.includes("jpeg") ||
      contentType.includes("jpg");

    if (!isSupported) {
      console.log(`Skipping watermark for unsupported content-type: ${contentType}`);
      if (moderation_id) {
        await supabase
          .from("image_moderation")
          .update({ ai_analysis: { watermarked: false, skipped: `unsupported: ${contentType}` } })
          .eq("id", moderation_id);
      }
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: `Unsupported image type: ${contentType}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let image;
    try {
      image = await Image.decode(imageBuffer);
    } catch (decodeErr) {
      console.error("Decode failed, skipping watermark:", decodeErr);
      if (moderation_id) {
        await supabase
          .from("image_moderation")
          .update({ ai_analysis: { watermarked: false, skipped: "decode_failed" } })
          .eq("id", moderation_id);
      }
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Could not decode image" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create watermark text overlay
    const watermarkText = "LUXE";
    const opacity = 25; // Very subtle, ~10% opacity (0-255)
    const fontSize = Math.max(20, Math.floor(image.width / 15));

    // Create a diagonal repeating watermark pattern
    const watermarkColor = Image.rgbaToColor(255, 255, 255, opacity);

    // Draw watermark text at multiple positions diagonally
    const spacingX = Math.floor(image.width / 3);
    const spacingY = Math.floor(image.height / 4);

    for (let y = spacingY / 2; y < image.height; y += spacingY) {
      for (let x = spacingX / 4; x < image.width; x += spacingX) {
        // Draw simple letter marks as pixel patterns since TextLayout may not be available
        drawWatermarkDot(image, Math.floor(x), Math.floor(y), fontSize, watermarkColor);
      }
    }

    // Also draw a single subtle bottom-right watermark
    const smallSize = Math.max(12, Math.floor(image.width / 25));
    const cornerColor = Image.rgbaToColor(255, 255, 255, 35);
    drawWatermarkDot(image, image.width - smallSize * 4, image.height - smallSize * 2, smallSize, cornerColor);

    // Encode back to PNG
    const watermarkedBuffer = await image.encode(1); // PNG format

    // Extract the storage path from the URL
    const urlParts = image_url.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length < 2) {
      throw new Error("Could not parse storage path from image URL");
    }
    const storagePath = urlParts[1];

    // Re-upload the watermarked image (overwrite)
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, watermarkedBuffer, {
        upsert: true,
        contentType: "image/png",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Update moderation record if provided
    if (moderation_id) {
      await supabase
        .from("image_moderation")
        .update({ ai_analysis: { watermarked: true } })
        .eq("id", moderation_id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Watermark applied successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("watermark-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Draws a subtle cross/diamond watermark pattern at position
 */
function drawWatermarkDot(image: Image, cx: number, cy: number, size: number, color: number) {
  const half = Math.floor(size / 2);
  
  // Draw a diamond shape as watermark indicator
  for (let dy = -half; dy <= half; dy++) {
    const width = half - Math.abs(dy);
    for (let dx = -width; dx <= width; dx++) {
      const px = cx + dx;
      const py = cy + dy;
      if (px >= 1 && px <= image.width && py >= 1 && py <= image.height) {
        // Blend with existing pixel
        const existing = image.getPixelAt(px, py);
        const [er, eg, eb, ea] = Image.colorToRGBA(existing);
        const [wr, wg, wb, wa] = Image.colorToRGBA(color);
        const alpha = wa / 255;
        const nr = Math.round(er * (1 - alpha) + wr * alpha);
        const ng = Math.round(eg * (1 - alpha) + wg * alpha);
        const nb = Math.round(eb * (1 - alpha) + wb * alpha);
        image.setPixelAt(px, py, Image.rgbaToColor(nr, ng, nb, ea));
      }
    }
  }
}
