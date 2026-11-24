-- Splitz initial schema
-- Jalankan pada database/branch Neon yang dipakai oleh DATABASE_URL di Vercel.
-- Aman dijalankan ulang: tidak menghapus atau menimpa data yang sudah ada.

BEGIN;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Satu snapshot JSONB per struk. Item, peserta, split, dan detail bensin
-- ada di payload sesuai bentuk Receipt pada aplikasi. Baris deleted=true
-- adalah tombstone agar penghapusan ikut tersinkron antar perangkat.
CREATE TABLE IF NOT EXISTS user_receipts (
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  receipt_id TEXT NOT NULL,
  payload JSONB,
  updated_at BIGINT NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, receipt_id),
  CONSTRAINT user_receipts_payload_state_check CHECK (
    (deleted = true AND payload IS NULL) OR
    (deleted = false AND payload IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS user_receipts_updated_idx
  ON user_receipts (user_id, updated_at DESC);

-- Preferensi yang saat ini masih lokal: theme, mode pribadi/keluarga,
-- dan status onboarding.
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  theme_mode TEXT NOT NULL DEFAULT 'system'
    CHECK (theme_mode IN ('system', 'light', 'dark')),
  app_mode TEXT NOT NULL DEFAULT 'pribadi'
    CHECK (app_mode IN ('pribadi', 'keluarga')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

-- Rekening bank, e-wallet, atau tunai. Saldo sekarang dihitung dari saldo awal
-- dikurangi struk yang menggunakan account_id terkait.
CREATE TABLE IF NOT EXISTS payment_accounts (
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'ewallet', 'tunai')),
  color TEXT NOT NULL,
  provider TEXT,
  initial_balance NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (initial_balance >= 0),
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  PRIMARY KEY (user_id, account_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS payment_accounts_name_per_user_idx
  ON payment_accounts (user_id, lower(name));

-- Anggota keluarga yang dipilih untuk laporan keluarga dan split bill.
CREATE TABLE IF NOT EXISTS family_members (
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  name TEXT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  PRIMARY KEY (user_id, member_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS family_members_name_per_user_idx
  ON family_members (user_id, lower(name));

-- Kategori buatan pengguna. Kategori bawaan berada di kode aplikasi.
CREATE TABLE IF NOT EXISTS custom_categories (
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  PRIMARY KEY (user_id, name)
);
CREATE UNIQUE INDEX IF NOT EXISTS custom_categories_name_per_user_idx
  ON custom_categories (user_id, lower(name));

-- Snapshot tutup buku disimpan sebagai ringkasan final.
CREATE TABLE IF NOT EXISTS book_closings (
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  closing_id TEXT NOT NULL,
  label TEXT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  total NUMERIC(18, 2) NOT NULL DEFAULT 0,
  receipt_count INTEGER NOT NULL DEFAULT 0 CHECK (receipt_count >= 0),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT,
  PRIMARY KEY (user_id, closing_id),
  CHECK (date_to >= date_from)
);

CREATE TABLE IF NOT EXISTS book_closing_categories (
  user_id UUID NOT NULL,
  closing_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, closing_id, category_name),
  FOREIGN KEY (user_id, closing_id)
    REFERENCES book_closings(user_id, closing_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS book_closing_people (
  user_id UUID NOT NULL,
  closing_id TEXT NOT NULL,
  person_name TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, closing_id, person_name),
  FOREIGN KEY (user_id, closing_id)
    REFERENCES book_closings(user_id, closing_id) ON DELETE CASCADE
);

COMMIT;
