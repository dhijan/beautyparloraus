-- Studio operations: the bookable menu, the roster, appointments, closures and
-- stock. Idempotent on purpose — schema.sql includes it for fresh databases and
-- migrations.sql includes it for existing ones.

CREATE TABLE IF NOT EXISTS treatments (
  number VARCHAR(4) PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  dur INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(12) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  role VARCHAR(120) NOT NULL,
  studio VARCHAR(8) NOT NULL,
  -- Treatment labels this therapist is qualified for.
  cats JSONB NOT NULL DEFAULT '[]',
  -- Working window per weekday index ("0".."6", 0 = Sunday). Missing key = day off.
  hours JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bookings (
  ref VARCHAR(12) PRIMARY KEY,
  studio VARCHAR(8) NOT NULL,
  treatment_number VARCHAR(4) NOT NULL REFERENCES treatments (number),
  staff_id VARCHAR(12) NOT NULL REFERENCES staff (id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  -- Duration and price are copied in, not joined: repricing the menu must not
  -- silently reprice an appointment the guest already agreed to.
  dur INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  deposit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  client_name VARCHAR(120) NOT NULL,
  client_phone VARCHAR(40) NOT NULL,
  client_email VARCHAR(160) NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  channel VARCHAR(16) NOT NULL DEFAULT 'online',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bookings_status_check CHECK (
    status IN ('pending', 'confirmed', 'completed', 'cancelled', 'declined')
  )
);

CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS bookings_staff_date_idx ON bookings (staff_id, booking_date);
CREATE INDEX IF NOT EXISTS bookings_phone_idx ON bookings (client_phone);

-- Blocked-out time: training, public holidays, centre closures.
CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  -- 'all' means every studio / every therapist.
  studio VARCHAR(8) NOT NULL DEFAULT 'all',
  staff_id VARCHAR(12) NOT NULL DEFAULT 'all',
  block_date DATE NOT NULL,
  from_time TIME NOT NULL,
  to_time TIME NOT NULL,
  reason VARCHAR(160) NOT NULL DEFAULT 'Blocked'
);

CREATE INDEX IF NOT EXISTS blocks_date_idx ON blocks (block_date);

-- Therapist notes, keyed by the client's mobile — there are no client accounts.
CREATE TABLE IF NOT EXISTS client_notes (
  id SERIAL PRIMARY KEY,
  client_phone VARCHAR(40) NOT NULL,
  body TEXT NOT NULL,
  author VARCHAR(120) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS client_notes_phone_idx ON client_notes (client_phone);

CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(12) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  cat VARCHAR(20) NOT NULL,
  sku VARCHAR(40) NOT NULL,
  unit VARCHAR(60) NOT NULL DEFAULT '',
  cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  retail NUMERIC(10, 2) NOT NULL DEFAULT 0,
  -- Reorder point, per studio.
  par INTEGER NOT NULL DEFAULT 0,
  supplier VARCHAR(120) NOT NULL DEFAULT '',
  -- On-hand count keyed by studio ({"R": 12, "H2": 8, ...}).
  stock JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(12) NOT NULL REFERENCES inventory_items (id) ON DELETE CASCADE,
  studio VARCHAR(8) NOT NULL,
  qty INTEGER NOT NULL,
  placed DATE NOT NULL DEFAULT CURRENT_DATE,
  eta DATE,
  status VARCHAR(16) NOT NULL DEFAULT 'ordered'
);

CREATE TABLE IF NOT EXISTS stock_moves (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(12) NOT NULL REFERENCES inventory_items (id) ON DELETE CASCADE,
  studio VARCHAR(8) NOT NULL,
  -- Signed: positive receives, negative sales/usage/wastage.
  qty INTEGER NOT NULL,
  kind VARCHAR(16) NOT NULL,
  moved_on DATE NOT NULL DEFAULT CURRENT_DATE,
  who VARCHAR(80) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS stock_moves_recent_idx ON stock_moves (created_at DESC);
