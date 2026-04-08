import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search Bunnings website for the product
    const searchUrl = `https://www.bunnings.com.au/search/products?q=${encodeURIComponent(query.trim())}&sort=BoostOrder&page=1&pageSize=10`;

    console.log('Scraping Bunnings search:', searchUrl);

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
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Failed to search Bunnings' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the markdown to extract product info
    const markdown = data.data?.markdown || data.markdown || '';
    const products = parseProducts(markdown);

    return new Response(
      JSON.stringify({ success: true, products }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface ParsedProduct {
  name: string;
  price: number | null;
  unit: string;
  inStock: boolean;
  category: string;
}

function parseProducts(markdown: string): ParsedProduct[] {
  const products: ParsedProduct[] = [];
  
  // Split by product patterns - Bunnings search results typically show product name followed by price
  // Look for price patterns like $XX.XX or $X,XXX.XX
  const lines = markdown.split('\n').filter(l => l.trim());
  
  let currentName = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip navigation, breadcrumb, and UI elements
    if (line.startsWith('[') && line.includes('](/') && line.length < 30) continue;
    if (line.includes('Sort by') || line.includes('Filter') || line.includes('Compare')) continue;
    if (line.startsWith('#')) continue;
    
    // Look for price pattern
    const priceMatch = line.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    
    if (priceMatch && currentName) {
      const price = parseFloat(priceMatch[1].replace(',', ''));
      const inStock = !line.toLowerCase().includes('out of stock') && 
                      !line.toLowerCase().includes('unavailable');
      
      // Try to determine unit from the name
      let unit = 'each';
      const nameLower = currentName.toLowerCase();
      if (nameLower.includes('/m') || nameLower.includes('per metre') || nameLower.includes('per m')) unit = 'metre';
      else if (nameLower.includes('/kg') || nameLower.includes('per kg')) unit = 'kg';
      else if (nameLower.includes('bag') || nameLower.includes('20kg') || nameLower.includes('25kg') || nameLower.includes('30kg')) unit = 'bag';
      else if (nameLower.includes('pack')) unit = 'pack';
      else if (nameLower.includes('roll')) unit = 'roll';
      else if (nameLower.includes('litre') || nameLower.includes('ltr')) unit = 'litre';
      
      // Guess category from name
      let category = 'General';
      if (nameLower.match(/soil|compost|mulch|potting|manure/)) category = 'Soil & Mulch';
      else if (nameLower.match(/paver|brick|block|stone|sand|gravel|concrete|cement/)) category = 'Paving & Hardscape';
      else if (nameLower.match(/pipe|fitting|tap|hose|drip|irrigation|sprinkler/)) category = 'Irrigation';
      else if (nameLower.match(/plant|seed|tree|shrub|flower|grass|turf/)) category = 'Plants & Seeds';
      else if (nameLower.match(/timber|sleeper|post|fence|beam|joist|pine|treated/)) category = 'Timber & Edging';
      else if (nameLower.match(/light|solar|led|lamp/)) category = 'Lighting';
      else if (nameLower.match(/fertiliser|fertilizer|weed|spray|pesticide/)) category = 'Fertilisers & Chemicals';
      else if (nameLower.match(/tool|shovel|rake|wheelbarrow|saw|drill/)) category = 'Tools';
      
      products.push({
        name: currentName,
        price,
        unit,
        inStock,
        category,
      });
      
      currentName = '';
      if (products.length >= 10) break;
    } else if (line.length > 15 && line.length < 200 && !priceMatch) {
      // Potential product name - clean it up
      const cleaned = line.replace(/\[|\]|\(.*?\)/g, '').replace(/\*+/g, '').trim();
      if (cleaned.length > 10) {
        currentName = cleaned;
      }
    }
  }
  
  return products;
}
