// Generic supplier scraper for materials. Currently supports:
//  - bunnings   (Bunnings Doncaster, VIC)
//  - colsmith   (Colsmith Wholesale Nursery)
//  - plantmulti (Plant Multi Nursery)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function requireAdminOrManager(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: ok } = await supabase.rpc("is_admin_or_manager", { _user_id: data.claims.sub });
  if (!ok) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

interface ParsedProduct {
  name: string;
  price: number | null;
  unit: string;
  inStock: boolean;
  category: string;
}

interface SupplierConfig {
  id: string;
  label: string;
  location: string;
  searchUrl: (q: string) => string;
  defaultCategory: string;
  defaultUnit: string;
}

const SUPPLIERS: Record<string, SupplierConfig> = {
  bunnings: {
    id: 'bunnings',
    label: 'Bunnings',
    location: 'Doncaster, VIC',
    searchUrl: (q) =>
      `https://www.bunnings.com.au/search/products?q=${encodeURIComponent(q)}&sort=BoostOrder&page=1&pageSize=10`,
    defaultCategory: 'General',
    defaultUnit: 'each',
  },
  colsmith: {
    id: 'colsmith',
    label: 'Colsmith Wholesale Nursery',
    location: 'Skye, VIC',
    searchUrl: (q) => `https://www.colsmith.com.au/?s=${encodeURIComponent(q)}`,
    defaultCategory: 'Plants & Seeds',
    defaultUnit: 'each',
  },
  plantmulti: {
    id: 'plantmulti',
    label: 'Plant Multi Nursery',
    location: 'Devon Meadows, VIC',
    searchUrl: (q) => `http://www.plantmultinursery.com/?s=${encodeURIComponent(q)}`,
    defaultCategory: 'Plants & Seeds',
    defaultUnit: 'each',
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const query: string = body?.query ?? '';
    const supplierId: string = body?.supplier ?? 'bunnings';

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return json({ success: false, error: 'Search query must be at least 2 characters' }, 400);
    }
    const supplier = SUPPLIERS[supplierId];
    if (!supplier) {
      return json({ success: false, error: `Unknown supplier: ${supplierId}` }, 400);
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) return json({ success: false, error: 'Firecrawl not configured' }, 500);

    const searchUrl = supplier.searchUrl(query.trim());
    console.log(`Scraping ${supplier.label}:`, searchUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Firecrawl error:', data);
      return json({ success: false, error: data.error || `Failed to search ${supplier.label}` }, response.status);
    }

    const markdown: string = data.data?.markdown || data.markdown || '';
    const products = parseProducts(markdown, supplier);

    return json({
      success: true,
      supplier: { id: supplier.id, label: supplier.label, location: supplier.location },
      products,
    });
  } catch (error) {
    console.error('Error:', error);
    return json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseProducts(markdown: string, supplier: SupplierConfig): ParsedProduct[] {
  const products: ParsedProduct[] = [];
  const lines = markdown.split('\n').filter((l) => l.trim());

  let currentName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('[') && line.includes('](/') && line.length < 30) continue;
    if (/sort by|filter|compare|add to cart|read more/i.test(line)) continue;
    if (line.startsWith('#')) {
      // Heading might itself be a product name (common on WordPress nursery sites)
      const cleaned = line.replace(/^#+\s*/, '').replace(/\[|\]|\(.*?\)/g, '').replace(/\*+/g, '').trim();
      if (cleaned.length > 4 && cleaned.length < 200) currentName = cleaned;
      continue;
    }

    const priceMatch = line.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);

    if (priceMatch && currentName) {
      const price = parseFloat(priceMatch[1].replace(',', ''));
      const inStock =
        !/out of stock|sold out|unavailable/i.test(line) &&
        !/out of stock|sold out|unavailable/i.test(lines[i + 1] ?? '');

      const nameLower = currentName.toLowerCase();
      let unit = supplier.defaultUnit;
      if (/\/m\b|per metre|per m\b/.test(nameLower)) unit = 'metre';
      else if (/\/kg|per kg/.test(nameLower)) unit = 'kg';
      else if (/bag|20kg|25kg|30kg/.test(nameLower)) unit = 'bag';
      else if (/pack/.test(nameLower)) unit = 'pack';
      else if (/roll/.test(nameLower)) unit = 'roll';
      else if (/litre|ltr/.test(nameLower)) unit = 'litre';
      else if (/pot|tube|140mm|200mm|300mm|hiko/.test(nameLower)) unit = 'pot';

      let category = supplier.defaultCategory;
      if (/soil|compost|mulch|potting|manure/.test(nameLower)) category = 'Soil & Mulch';
      else if (/paver|brick|block|stone|sand|gravel|concrete|cement/.test(nameLower)) category = 'Paving & Hardscape';
      else if (/pipe|fitting|tap|hose|drip|irrigation|sprinkler/.test(nameLower)) category = 'Irrigation';
      else if (/plant|seed|tree|shrub|flower|grass|turf|nursery|tube|pot/.test(nameLower)) category = 'Plants & Seeds';
      else if (/timber|sleeper|post|fence|beam|joist|pine|treated/.test(nameLower)) category = 'Timber & Edging';
      else if (/light|solar|led|lamp/.test(nameLower)) category = 'Lighting';
      else if (/fertiliser|fertilizer|weed|spray|pesticide/.test(nameLower)) category = 'Fertilisers & Chemicals';
      else if (/tool|shovel|rake|wheelbarrow|saw|drill/.test(nameLower)) category = 'Tools';

      products.push({ name: currentName, price, unit, inStock, category });
      currentName = '';
      if (products.length >= 12) break;
    } else if (line.length > 6 && line.length < 200 && !priceMatch) {
      const cleaned = line.replace(/\[|\]|\(.*?\)/g, '').replace(/\*+/g, '').trim();
      if (cleaned.length > 6) currentName = cleaned;
    }
  }

  // For nursery sites that don't list prices on the search page, still return products with null price
  if (products.length === 0) {
    const titleLines = markdown
      .split('\n')
      .filter((l) => l.trim().startsWith('#'))
      .map((l) => l.replace(/^#+\s*/, '').replace(/\[|\]|\(.*?\)/g, '').trim())
      .filter((l) => l.length > 4 && l.length < 120);
    for (const t of titleLines.slice(0, 12)) {
      products.push({
        name: t,
        price: null,
        unit: supplier.defaultUnit,
        inStock: true,
        category: supplier.defaultCategory,
      });
    }
  }

  return products;
}
