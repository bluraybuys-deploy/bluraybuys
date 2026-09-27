import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Replace these with your real credentials before deploying
const CONFIG = {
  AFFILIATE_TAG: "ronburke-20",           // Your Amazon Associates tag
  PA_API_KEY: "YOUR_PA_API_KEY",         // Amazon PA API access key
  PA_SECRET: "YOUR_PA_SECRET",          // Amazon PA API secret
  // Note: In production, PA API calls must go through a backend/serverless function
  // This demo uses mock data; see DEPLOYMENT.md for wiring up real API calls
};

// ─── MOCK DATA (replaced by real PA API calls in production) ─────────────────
const MOCK_PRODUCTS = [
  { asin: "B0CKQNFXRD", title: "Dune: Part Two", format: "4K UHD", year: 2024, genre: "Sci-Fi", rating: 4.8, reviews: 3241, price: 24.99, originalPrice: 34.99, image: "https://m.media-amazon.com/images/I/81fC7SYBQWL._AC_SL1500_.jpg", newRelease: true, bestSeller: false },
  { asin: "B0CW19GL5H", title: "Oppenheimer", format: "4K UHD", year: 2023, genre: "Drama", rating: 4.7, reviews: 5822, price: 19.99, originalPrice: 29.99, image: "https://m.media-amazon.com/images/I/81jtHxTWWOL._AC_SL1500_.jpg", newRelease: false, bestSeller: true },
  { asin: "B0CSKBXMB7", title: "Poor Things", format: "Blu-ray", year: 2023, genre: "Drama", rating: 4.5, reviews: 1203, price: 17.99, originalPrice: 24.99, image: "https://m.media-amazon.com/images/I/71SvALLFWdL._AC_SL1500_.jpg", newRelease: false, bestSeller: false },
  { asin: "B0CVBLHFSG", title: "Killers of the Flower Moon", format: "4K UHD", year: 2023, genre: "Drama", rating: 4.6, reviews: 2108, price: 22.99, originalPrice: 34.99, image: "https://m.media-amazon.com/images/I/81XZ7OWKISL._AC_SL1500_.jpg", newRelease: false, bestSeller: false },
  { asin: "B0C9BXQXQV", title: "The Creator", format: "4K UHD", year: 2023, genre: "Sci-Fi", rating: 4.3, reviews: 987, price: 18.99, originalPrice: 29.99, image: "https://m.media-amazon.com/images/I/71Z2KkQHF7L._AC_SL1500_.jpg", newRelease: false, bestSeller: false },
  { asin: "B0CWXMX98N", title: "Godzilla x Kong", format: "4K UHD", year: 2024, genre: "Action", rating: 4.4, reviews: 4102, price: 21.99, originalPrice: 34.99, image: "https://m.media-amazon.com/images/I/81Z5QRSVTSL._AC_SL1500_.jpg", newRelease: true, bestSeller: false },
  { asin: "B0CXYZ1234", title: "The Holdovers", format: "Blu-ray", year: 2023, genre: "Drama", rating: 4.9, reviews: 2890, price: 15.99, originalPrice: 22.99, image: "https://m.media-amazon.com/images/I/71sVqaJzQ3L._AC_SL1500_.jpg", newRelease: false, bestSeller: true },
  { asin: "B0D1ABCDEF", title: "Alien: Romulus", format: "4K UHD", year: 2024, genre: "Horror", rating: 4.5, reviews: 3341, price: 26.99, originalPrice: 34.99, image: "https://m.media-amazon.com/images/I/71abc123XYL._AC_SL1500_.jpg", newRelease: true, bestSeller: false },
  { asin: "B0BXYZ9876", title: "Maestro", format: "Blu-ray", year: 2023, genre: "Drama", rating: 4.2, reviews: 764, price: 14.99, originalPrice: 22.99, image: "https://m.media-amazon.com/images/I/71def456ABL._AC_SL1500_.jpg", newRelease: false, bestSeller: false },
  { asin: "B0CABC1234", title: "Napoleon", format: "4K UHD", year: 2023, genre: "Drama", rating: 4.1, reviews: 1543, price: 19.99, originalPrice: 34.99, image: "https://m.media-amazon.com/images/I/81ghi789CDL._AC_SL1500_.jpg", newRelease: false, bestSeller: false },
  { asin: "B0D2XYZABC", title: "A Quiet Place: Day One", format: "4K UHD", year: 2024, genre: "Horror", rating: 4.3, reviews: 2211, price: 23.99, originalPrice: 34.99, image: "https://m.media-amazon.com/images/I/71jkl012EFL._AC_SL1500_.jpg", newRelease: true, bestSeller: false },
  { asin: "B0CDEF5678", title: "Wonka", format: "Blu-ray", year: 2023, genre: "Family", rating: 4.6, reviews: 6721, price: 16.99, originalPrice: 24.99, image: "https://m.media-amazon.com/images/I/81mno345GHL._AC_SL1500_.jpg", newRelease: false, bestSeller: true },
];

const GENRES = ["All", "Action", "Drama", "Sci-Fi", "Horror", "Family", "Thriller", "Comedy"];
const FORMATS = ["All Formats", "4K UHD", "Blu-ray", "DVD"];
const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "New Releases" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function affiliateUrl(asin) {
  return `https://www.amazon.com/dp/${asin}?tag=${CONFIG.AFFILIATE_TAG}`;
}

function StarRating({ rating, count }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ display: "flex", gap: 1 }}>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{
            color: i <= full ? "#C9A84C" : (i === full + 1 && half ? "#C9A84C" : "#3A4A5A"),
            fontSize: 12,
            opacity: i === full + 1 && half ? 0.6 : 1
          }}>★</span>
        ))}
      </div>
      <span style={{ color: "#8A9AB0", fontSize: 11 }}>({count?.toLocaleString()})</span>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      background: color,
      color: "#fff",
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.08em",
      padding: "2px 6px",
      borderRadius: 2,
      textTransform: "uppercase",
    }}>{label}</span>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, onSelect }) {
  const [imgError, setImgError] = useState(false);
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div
      onClick={() => onSelect(product)}
      style={{
        background: "#1E2D3D",
        borderRadius: 6,
        overflow: "hidden",
        cursor: "pointer",
        border: "1px solid #2A3D52",
        transition: "transform 0.15s, border-color 0.15s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = "#C9A84C";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#2A3D52";
      }}
    >
      {/* Cover image */}
      <div style={{ position: "relative", aspectRatio: "2/3", background: "#0D1B2A", overflow: "hidden" }}>
        {!imgError ? (
          <img
            src={product.image}
            alt={product.title}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column", gap: 8,
            color: "#3A4A5A"
          }}>
            <span style={{ fontSize: 32 }}>🎬</span>
            <span style={{ fontSize: 10, textAlign: "center", padding: "0 8px" }}>{product.title}</span>
          </div>
        )}
        {/* Badges overlay */}
        <div style={{ position: "absolute", top: 6, left: 6, display: "flex", flexDirection: "column", gap: 4 }}>
          {product.newRelease && <Badge label="New" color="#8B2635" />}
          {product.bestSeller && <Badge label="Best Seller" color="#1A5276" />}
          {discount >= 20 && <Badge label={`-${discount}%`} color="#1E6B3C" />}
        </div>
        {/* Format pill */}
        <div style={{
          position: "absolute", bottom: 6, right: 6,
          background: product.format === "4K UHD" ? "#C9A84C" : "#2A3D52",
          color: product.format === "4K UHD" ? "#0D1B2A" : "#8A9AB0",
          fontSize: 9, fontWeight: 700, padding: "2px 6px",
          borderRadius: 2, letterSpacing: "0.06em"
        }}>
          {product.format}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#E8E0D0", lineHeight: 1.3 }}>
          {product.title}
        </div>
        <div style={{ fontSize: 11, color: "#8A9AB0" }}>{product.year} · {product.genre}</div>
        <StarRating rating={product.rating} count={product.reviews} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: "auto" }}>
          <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: 15 }}>${product.price.toFixed(2)}</span>
          {product.originalPrice > product.price && (
            <span style={{ color: "#5A6A7A", fontSize: 11, textDecoration: "line-through" }}>
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT MODAL ─────────────────────────────────────────────────────────────
function ProductModal({ product, onClose }) {
  const [imgError, setImgError] = useState(false);
  if (!product) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(5,10,15,0.85)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1E2D3D", borderRadius: 8, maxWidth: 640, width: "100%",
          border: "1px solid #2A3D52", overflow: "hidden",
          display: "grid", gridTemplateColumns: "200px 1fr",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left: cover */}
        <div style={{ background: "#0D1B2A", minHeight: 280 }}>
          {!imgError ? (
            <img
              src={product.image}
              alt={product.title}
              onError={() => setImgError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#3A4A5A", fontSize: 48 }}>🎬</div>
          )}
        </div>

        {/* Right: details */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#E8E0D0", fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.04em" }}>{product.title}</div>
              <div style={{ color: "#8A9AB0", fontSize: 12, marginTop: 2 }}>{product.year} · {product.genre}</div>
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none", color: "#5A6A7A", cursor: "pointer",
              fontSize: 20, padding: 0, lineHeight: 1
            }}>✕</button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              background: product.format === "4K UHD" ? "#C9A84C" : "#2A3D52",
              color: product.format === "4K UHD" ? "#0D1B2A" : "#8A9AB0",
              fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 2
            }}>{product.format}</span>
            {product.newRelease && <Badge label="New Release" color="#8B2635" />}
            {product.bestSeller && <Badge label="Best Seller" color="#1A5276" />}
          </div>

          <StarRating rating={product.rating} count={product.reviews} />

          <div style={{ background: "#0D1B2A", borderRadius: 4, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ color: "#C9A84C", fontSize: 24, fontWeight: 700 }}>${product.price.toFixed(2)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span style={{ color: "#5A6A7A", fontSize: 14, textDecoration: "line-through" }}>
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <span style={{ color: "#2ECC71", fontSize: 12 }}>
                    Save ${(product.originalPrice - product.price).toFixed(2)}
                  </span>
                </>
              )}
            </div>
            <div style={{ color: "#5A6A7A", fontSize: 11, marginTop: 4 }}>Price on Amazon (via affiliate link)</div>
          </div>

          <a
            href={affiliateUrl(product.asin)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#C9A84C", color: "#0D1B2A", textDecoration: "none",
              padding: "12px 20px", borderRadius: 4, fontWeight: 700, fontSize: 14,
              textAlign: "center", letterSpacing: "0.03em",
              transition: "background 0.15s",
              display: "block",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#E0BF6A"}
            onMouseLeave={e => e.currentTarget.style.background = "#C9A84C"}
          >
            Buy on Amazon →
          </a>

          <div style={{ color: "#4A5A6A", fontSize: 10, textAlign: "center" }}>
            As an Amazon Associate, we earn from qualifying purchases.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [format, setFormat] = useState("All Formats");
  const [sort, setSort] = useState("featured");
  const [selected, setSelected] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filtered = useCallback(() => {
    let results = [...MOCK_PRODUCTS];
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(p => p.title.toLowerCase().includes(q) || p.genre.toLowerCase().includes(q));
    }
    if (genre !== "All") results = results.filter(p => p.genre === genre);
    if (format !== "All Formats") results = results.filter(p => p.format === format);

    switch (sort) {
      case "price-asc": return results.sort((a, b) => a.price - b.price);
      case "price-desc": return results.sort((a, b) => b.price - a.price);
      case "rating": return results.sort((a, b) => b.rating - a.rating);
      case "newest": return results.sort((a, b) => (b.newRelease ? 1 : 0) - (a.newRelease ? 1 : 0));
      default: return results.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0));
    }
  }, [search, genre, format, sort]);

  const results = filtered();
  const newReleases = MOCK_PRODUCTS.filter(p => p.newRelease);

  const selectStyle = {
    background: "#1E2D3D", color: "#E8E0D0", border: "1px solid #2A3D52",
    borderRadius: 4, padding: "8px 10px", fontSize: 13, cursor: "pointer",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D1B2A", color: "#E8E0D0",
      fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D1B2A; }
        ::-webkit-scrollbar-thumb { background: #2A3D52; border-radius: 3px; }
        body { background: #0D1B2A; }
      `}</style>

      {/* ── FILMSTRIP HEADER ─────────────────────────────────────────────────── */}
      <header style={{ background: "#080F18", borderBottom: "3px solid #C9A84C" }}>
        {/* Filmstrip decoration */}
        <div style={{
          height: 14, background: "#060D15", display: "flex", alignItems: "center",
          paddingLeft: 8, gap: 6, overflow: "hidden",
        }}>
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} style={{
              width: 14, height: 8, background: "#1E2D3D", borderRadius: 1,
              flexShrink: 0, border: "1px solid #2A3D52"
            }} />
          ))}
        </div>

        {/* Nav bar */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 56 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22, fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.08em", color: "#C9A84C" }}>DISC</span>
            <span style={{ fontSize: 22, fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.08em", color: "#E8E0D0" }}>VAULT</span>
            <span style={{ color: "#3A4A5A", fontSize: 18 }}>|</span>
            <span style={{ fontSize: 11, color: "#5A6A7A", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Blu-ray &amp; 4K Deals
            </span>
          </div>

          <nav style={{ display: "flex", gap: 24 }}>
            {["New Releases", "Best Sellers", "4K UHD", "Blu-ray"].map(item => (
              <button key={item} onClick={() => {
                if (item === "New Releases") setSort("newest");
                else if (item === "Best Sellers") setSort("featured");
                else if (item === "4K UHD") { setFormat("4K UHD"); setSort("featured"); }
                else if (item === "Blu-ray") { setFormat("Blu-ray"); setSort("featured"); }
              }} style={{
                background: "none", border: "none", color: "#8A9AB0", cursor: "pointer",
                fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase",
                fontWeight: 500, transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#C9A84C"}
              onMouseLeave={e => e.currentTarget.style.color = "#8A9AB0"}
              >{item}</button>
            ))}
          </nav>
        </div>

        {/* Bottom filmstrip */}
        <div style={{
          height: 14, background: "#060D15", display: "flex", alignItems: "center",
          paddingLeft: 8, gap: 6, overflow: "hidden",
        }}>
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} style={{
              width: 14, height: 8, background: "#1E2D3D", borderRadius: 1,
              flexShrink: 0, border: "1px solid #2A3D52"
            }} />
          ))}
        </div>
      </header>

      {/* ── NEW RELEASES HERO STRIP ─────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(180deg, #111E2D 0%, #0D1B2A 100%)",
        borderBottom: "1px solid #1E2D3D", padding: "20px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 3, height: 18, background: "#C9A84C", borderRadius: 2 }} />
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em",
              fontSize: 16, color: "#C9A84C" }}>NEW RELEASES</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 12, maxWidth: "100%" }}>
            {newReleases.map(p => (
              <ProductCard key={p.asin} product={p} onSelect={setSelected} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SEARCH + FILTERS ─────────────────────────────────────────────── */}
      <div style={{ background: "#111E2D", borderBottom: "1px solid #1E2D3D",
        padding: "14px 20px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto",
          display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "#5A6A7A", fontSize: 14, pointerEvents: "none" }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search titles, genres..."
              style={{ ...selectStyle, width: "100%", paddingLeft: 32 }}
            />
          </div>

          {/* Genre */}
          <select value={genre} onChange={e => setGenre(e.target.value)} style={selectStyle}>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>

          {/* Format */}
          <select value={format} onChange={e => setFormat(e.target.value)} style={selectStyle}>
            {FORMATS.map(f => <option key={f}>{f}</option>)}
          </select>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)} style={selectStyle}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Clear */}
          {(search || genre !== "All" || format !== "All Formats") && (
            <button onClick={() => { setSearch(""); setGenre("All"); setFormat("All Formats"); }}
              style={{ ...selectStyle, color: "#C9A84C", borderColor: "#C9A84C", background: "transparent",
                fontSize: 12, whiteSpace: "nowrap" }}>
              Clear ✕
            </button>
          )}

          <span style={{ color: "#5A6A7A", fontSize: 12, marginLeft: "auto" }}>
            {results.length} title{results.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 60px" }}>
        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#5A6A7A" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>No titles found</div>
            <div style={{ fontSize: 13 }}>Try adjusting your search or filters</div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 16,
          }}>
            {results.map(p => (
              <ProductCard key={p.asin} product={p} onSelect={setSelected} />
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#080F18", borderTop: "1px solid #1E2D3D",
        padding: "24px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ color: "#3A4A5A", fontSize: 11, lineHeight: 1.7 }}>
            DiscVault is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program 
            designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.<br />
            Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.
          </div>
        </div>
      </footer>

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
