/**
 * DiscVault – Amazon Creators API Proxy
 * Netlify Serverless Function: netlify/functions/search.js
 *
 * Uses Amazon's newer OAuth2-based Creators API (v3.1)
 * Your keys are stored securely in Netlify environment variables —
 * they are NEVER visible in the browser or in your code files.
 *
 * Environment variables to set in Netlify dashboard:
 *
 *   AMAZON_CLIENT_ID       Your Credential ID (amzn1.application-oa2-client.xxx)
 *   AMAZON_CLIENT_SECRET   Your Secret (amzn1.oa2-cs.v1.xxx)
 *   PA_ASSOCIATE_TAG       ronburke-20
 */

// ── Step 1: Get a short-lived OAuth2 access token ────────────────────────────
async function getAccessToken() {
  const clientId     = process.env.AMAZON_CLIENT_ID;
  const clientSecret = process.env.AMAZON_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing AMAZON_CLIENT_ID or AMAZON_CLIENT_SECRET in environment variables.");
  }

  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     clientId,
    client_secret: clientSecret,
    scope:         "advertising::audiences",
  });

  const res = await fetch("https://api.amazon.com/auth/o2/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token fetch failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ── Step 2: Search for products using the Creators API ───────────────────────
async function searchProducts({ keywords, itemCount = 12 }) {
  const token        = await getAccessToken();
  const associateTag = process.env.PA_ASSOCIATE_TAG;

  if (!associateTag) {
    throw new Error("Missing PA_ASSOCIATE_TAG in environment variables.");
  }

  const payload = JSON.stringify({
    Keywords:    keywords,
    SearchIndex: "Movies",
    ItemCount:   itemCount,
    PartnerTag:  associateTag,
    PartnerType: "Associates",
    Marketplace: "www.amazon.com",
    Resources: [
      "Images.Primary.Large",
      "ItemInfo.Title",
      "ItemInfo.ContentInfo",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "CustomerReviews.Count",
      "CustomerReviews.StarRating",
    ],
  });

  const res = await fetch("https://api.amazon.com/paapi5/searchitems", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
      "x-amz-target":  "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
    },
    body: payload,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PA API search failed (${res.status}): ${err}`);
  }

  return res.json();
}

// ── Step 3: Normalize Amazon response → DiscVault product shape ──────────────
function normalizeItem(item, associateTag) {
  const asin      = item.ASIN;
  const title     = item.ItemInfo?.Title?.DisplayValue     ?? "Unknown Title";
  const image     = item.Images?.Primary?.Large?.URL       ?? null;
  const price     = item.Offers?.Listings?.[0]?.Price?.Amount ?? null;
  const origPrice = item.Offers?.Listings?.[0]?.SavingBasis?.Amount ?? price;
  const rating    = item.CustomerReviews?.StarRating?.Value ?? null;
  const reviews   = item.CustomerReviews?.Count             ?? 0;
  const year      = item.ItemInfo?.ContentInfo?.PublicationDate?.DisplayValue?.slice(0, 4) ?? "";

  const format = title.match(/4K|UHD/i)    ? "4K UHD"
               : title.match(/Blu.?ray/i)  ? "Blu-ray"
               : "DVD";

  const affiliateUrl = `https://www.amazon.com/dp/${asin}?tag=${associateTag}`;

  return {
    asin, title, image, price, originalPrice: origPrice,
    rating, reviews, year, format, genre: "Drama",
    newRelease: false, bestSeller: false, affiliateUrl,
  };
}

// ── Netlify handler ───────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type":                 "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { keywords = "Blu-ray 4K 2024", genre } = JSON.parse(event.body || "{}");
    const query = genre && genre !== "All" ? `${keywords} ${genre}` : keywords;

    const data     = await searchProducts({ keywords: query });
    const products = (data.SearchResult?.Items ?? []).map(
      item => normalizeItem(item, process.env.PA_ASSOCIATE_TAG)
    );

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ products }),
    };
  } catch (err) {
    console.error("DiscVault API error:", err.message);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
