-- Catalog of Blu-ray / 4K UHD deals shown on the storefront.
-- Seeded to 1000 rows on first read and grown daily by the scheduled function.
CREATE TABLE deals (
  id             SERIAL PRIMARY KEY,
  asin           TEXT UNIQUE NOT NULL,
  title          TEXT NOT NULL,
  image          TEXT,
  price          NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  rating         NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  reviews        INTEGER NOT NULL DEFAULT 0,
  year           TEXT,
  format         TEXT NOT NULL DEFAULT 'Blu-ray',
  genre          TEXT NOT NULL DEFAULT 'Drama',
  best_seller    BOOLEAN NOT NULL DEFAULT false,
  new_release    BOOLEAN NOT NULL DEFAULT false,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX deals_genre_idx    ON deals (genre);
CREATE INDEX deals_added_at_idx ON deals (added_at DESC);
