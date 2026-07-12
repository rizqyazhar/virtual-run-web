-- ============================================================
-- Schema Database: Sistem Manajemen Event Virtual Run
-- Standar status baku: 'pending', 'approved', 'rejected'
-- ============================================================

-- ============================================================
-- Tabel: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'participant')) DEFAULT 'participant',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabel: events
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    distance    NUMERIC(6,2) NOT NULL,       -- jarak lomba dalam km
    price       NUMERIC(12,2) NOT NULL DEFAULT 0,
    start_date  TIMESTAMPTZ NOT NULL,
    end_date    TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (end_date >= start_date)
);

-- ============================================================
-- Tabel: registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS registrations (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id          INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, event_id)  -- 1 peserta hanya bisa daftar 1x per event
);

-- ============================================================
-- Tabel: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id               SERIAL PRIMARY KEY,
    registration_id  INTEGER NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
    payment_proof    TEXT,                     -- path/URL file bukti transfer
    screenshot       TEXT,                     -- path/URL screenshot (jika terpisah dari payment_proof)
    status           TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at      TIMESTAMPTZ
);

-- ============================================================
-- Tabel: running_results
-- ============================================================
CREATE TABLE IF NOT EXISTS running_results (
    id                  SERIAL PRIMARY KEY,
    registration_id     INTEGER NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
    distance            NUMERIC(6,2) NOT NULL,      -- jarak yang ditempuh (km)
    finish_time         INTERVAL NOT NULL,           -- durasi waktu tempuh, mis. '01:23:45'
    screenshot          TEXT,                         -- path/URL bukti hasil lari
    verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    certificate_url      TEXT,                         -- diisi setelah sertifikat digenerate & diaktifkan admin
    submitted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at           TIMESTAMPTZ
);

-- ============================================================
-- Index tambahan untuk query yang sering dipakai
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_running_results_verification_status ON running_results(verification_status);