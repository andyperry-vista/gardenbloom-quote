// Google Places (New) proxy: autocomplete + place details
// Restricts results to Australia. Returns formatted address + components.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    if (action === 'autocomplete') {
      const input = String(body?.input ?? '').trim();
      if (input.length < 3) {
        return new Response(JSON.stringify({ suggestions: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          input,
          includedRegionCodes: ['au'],
          languageCode: 'en-AU',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Places autocomplete error', res.status, data);
        return new Response(JSON.stringify({ error: data?.error?.message || 'Autocomplete failed' }), {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const suggestions = (data.suggestions ?? [])
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          placeId: s.placePrediction.placeId,
          text: s.placePrediction.text?.text ?? '',
          mainText: s.placePrediction.structuredFormat?.mainText?.text ?? '',
          secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
        }));

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'details') {
      const placeId = String(body?.placeId ?? '').trim();
      if (!placeId) {
        return new Response(JSON.stringify({ error: 'placeId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,location',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Places details error', res.status, data);
        return new Response(JSON.stringify({ error: data?.error?.message || 'Details failed' }), {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const components: Record<string, string> = {};
      for (const c of data.addressComponents ?? []) {
        for (const t of c.types ?? []) components[t] = c.shortText ?? c.longText ?? '';
      }

      return new Response(JSON.stringify({
        formattedAddress: data.formattedAddress ?? '',
        components,
        location: data.location ?? null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('places-autocomplete error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
