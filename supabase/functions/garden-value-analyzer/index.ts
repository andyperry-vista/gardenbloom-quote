import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!anthropicKey) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    const { quoteRequestId, photoUrls } = await req.json();

    if (!quoteRequestId || !photoUrls || photoUrls.length === 0) {
      throw new Error("Missing quoteRequestId or photoUrls");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch photos and convert to base64 for Anthropic
    const imageParts = await Promise.all(photoUrls.map(async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
      const buffer = await res.arrayBuffer();
      // Basic mime type guessing
      let mimeType = "image/jpeg";
      if (url.toLowerCase().endsWith(".png")) mimeType = "image/png";
      else if (url.toLowerCase().endsWith(".webp")) mimeType = "image/webp";
      
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType,
          data: encodeBase64(buffer)
        }
      };
    }));

    // Process with Anthropic API
    const response = await fetch(`https://api.anthropic.com/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              ...imageParts,
              { type: "text", text: "Please analyze these garden photos according to your Mayura Garden Services protocol." }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", errText);
      throw new Error("Failed to process images with Anthropic");
    }

    const data = await response.json();
    const analyzerResult = data.content?.[0]?.text || "No analysis generated.";

    // Update quote_request with the analysis
    const { error: updateError } = await supabase
      .from("quote_requests")
      .update({ analyzer_result: analyzerResult })
      .eq("id", quoteRequestId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
