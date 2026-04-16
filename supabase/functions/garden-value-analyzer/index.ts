import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional garden assessor for Mayura Garden Services, a landscaping company in Lower Templestowe, Melbourne, Australia.

Analyze the provided garden photos and provide a detailed assessment including:

1. **Garden Condition** — Overall state (overgrown, well-maintained, needs renovation, etc.)
2. **Key Observations** — Notable plants, lawn condition, hardscape, problem areas
3. **Recommended Services** — Specific services needed (mowing, hedging, pruning, mulching, garden bed cleanup, green waste removal, etc.)
4. **Estimated Effort** — Rough difficulty level (light maintenance, moderate cleanup, heavy renovation)
5. **Suggested Quote Items** — Line items with estimated hours/quantities for quoting

Keep the tone professional and practical. Focus on actionable items that help prepare an accurate quote.
Format the response clearly with headings and bullet points.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }
    if (!lovableApiKey) {
      throw new Error("Missing LOVABLE_API_KEY");
    }

    const { quoteRequestId, photoUrls } = await req.json();

    if (!quoteRequestId || !photoUrls || photoUrls.length === 0) {
      throw new Error("Missing quoteRequestId or photoUrls");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build image content parts for the vision model
    const imageParts = photoUrls.map((url: string) => ({
      type: "image_url" as const,
      image_url: { url },
    }));

    // Call Lovable AI Gateway with vision model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              ...imageParts,
              { type: "text", text: "Please analyze these garden photos and provide a detailed assessment for quoting purposes." },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("Failed to analyze images with AI");
    }

    const data = await response.json();
    const analyzerResult = data.choices?.[0]?.message?.content || "No analysis generated.";

    // Update quote_request with the analysis
    const { error: updateError } = await supabase
      .from("quote_requests")
      .update({ analyzer_result: analyzerResult })
      .eq("id", quoteRequestId);

    if (updateError) {
      console.error("DB update error:", updateError);
      throw new Error("Failed to save analysis result");
    }

    return new Response(JSON.stringify({ success: true, analysis: analyzerResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("garden-value-analyzer error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
