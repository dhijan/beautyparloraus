-- Idempotent ALTERs for databases created before these columns existed.
-- Fresh databases get them from schema.sql; this file is only for existing data.
--   npm run db:migrate

-- Stripe Payment Link for the product's "Buy Now" button.
ALTER TABLE products ADD COLUMN IF NOT EXISTS payment_link TEXT;

-- Stripe Checkout Session id. UNIQUE is what makes the webhook idempotent:
-- Stripe retries deliveries, and the retry hits ON CONFLICT DO NOTHING.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_session_id_key
  ON orders (stripe_session_id);

-- Studio operations: bookings, roster, closures, stock.
\ir salon.sql

-- The service menu is the treatments table now (one source for /services and
-- /book), so the old content-managed services table is gone.
DROP TABLE IF EXISTS services;
