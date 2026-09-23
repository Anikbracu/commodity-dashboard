// Fetches the latest price for each automated commodity and upserts it into Supabase.
// Run manually with: node fetch-prices.js
// Run on a schedule via the included GitHub Actions workflow.
//
// Required environment variables (set as GitHub Actions secrets, or in a local .env):
//   SUPABASE_URL            - your Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY - service role key (bypasses RLS, admin-level, keep secret)
//   ALPHA_VANTAGE_KEY       - free key from https://www.alphavantage.co/support/#api-key
//   METALPRICE_API_KEY      - free key from https://metalpriceapi.com

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AV_KEY = process.env.ALPHA_VANTAGE_KEY;
const METAL_KEY = process.env.METALPRICE_API_KEY;

async function upsertPrice(commodityId, dateStr, price) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/prices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ commodity_id: commodityId, price_date: dateStr, price }),
  });
  if (!res.ok) {
    console.error(`Failed to upsert ${commodityId}:`, await res.text());
  } else {
    console.log(`Upserted ${commodityId} @ ${dateStr} = ${price}`);
  }
}

// Alpha Vantage covers WTI, WHEAT, COTTON on a "daily" or "monthly" interval.
async function fetchAlphaVantage(commodityId, functionName) {
  const url = `https://www.alphavantage.co/query?function=${functionName}&interval=daily&apikey=${AV_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const latest = data?.data?.[0]; // Alpha Vantage returns newest-first
  if (!latest || latest.value === ".") {
    console.error(`No data returned for ${commodityId}`, data);
    return;
  }
  await upsertPrice(commodityId, latest.date, parseFloat(latest.value));
}

// MetalpriceAPI covers Gold (XAU) spot price in USD.
async function fetchGold() {
  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${METAL_KEY}&base=USD&currencies=XAU`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data?.success) {
    console.error("Gold fetch failed", data);
    return;
  }
  // MetalpriceAPI returns XAU as a fraction of 1 USD; invert to get USD per troy ounce.
  const pricePerOunce = 1 / data.rates.XAU;
  const dateStr = new Date(data.timestamp * 1000).toISOString().slice(0, 10);
  await upsertPrice("gold", dateStr, Math.round(pricePerOunce * 100) / 100);
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  await fetchAlphaVantage("wti_crude", "WTI");
  await fetchAlphaVantage("wheat", "WHEAT");
  await fetchAlphaVantage("cotton", "COTTON");
  await fetchGold();

  // Soybean Oil and Copra have no reliable free live API (see project notes).
  // Until you wire up a paid vendor or a source-specific fetch, update these
  // two manually via the admin dashboard, or insert rows directly in Supabase.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
