-- ============================================================
-- SI-TAHFIZ: Sistem Informasi Manajemen Program Tahfiz Al-Qur'an
-- MTs TQ Jamilurrahman Yogyakarta
-- Database Schema — Supabase PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE role_enum AS ENUM (
  'tu',
  'koordinator',
  'pengampu',
  'kepsek'
);

CREATE TYPE grade_enum AS ENUM (
  'tahsin',
  'takmil',
  'tahfiz'
);

CREATE TYPE tipe_setoran_enum AS ENUM (
  'sabak',
  'sabki',
  'manzil'
);

CREATE TYPE status_setoran_enum AS ENUM (
  'lulus',
  'mengulang'
);

CREATE TYPE status_tikrar_enum AS ENUM (
  'wajib_sekolah',
  'selesai_sekolah',
  'wajib_rumah',
  'selesai_rumah'
);

CREATE TYPE status_absensi_enum AS ENUM (
  'alpha',
  'sakit',
  'izin'
);

CREATE TYPE status_approval_enum AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE status_ukj_santri_enum AS ENUM (
  'lulus',
  'mengulang'
);

CREATE TYPE semester_enum AS ENUM (
  'ganjil',
  'genap'
);

-- ============================================================
-- AUTH & PENGGUNA
-- ============================================================

-- Profil pengguna internal (TU, Koordinator, Pengampu, Kepsek)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  role        role_enum NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profil pengguna eksternal (Orang Tua / Wali)
CREATE TABLE orang_tua (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  nomor_hp    TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DATA MASTER
-- ============================================================

-- Halaqah (dibuat sebelum santri karena santri FK ke halaqah)
CREATE TABLE halaqah (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_halaqah TEXT NOT NULL,
  grade        grade_enum NOT NULL,
  pengampu_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Santri
CREATE TABLE santri (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_lengkap TEXT NOT NULL,
  kelas        TEXT NOT NULL,
  grade        grade_enum NOT NULL,
  halaqah_id   UUID NOT NULL REFERENCES halaqah(id) ON DELETE RESTRICT,
  orang_tua_id UUID REFERENCES orang_tua(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- KONFIGURASI
-- ============================================================

-- Konfigurasi sistem — hanya satu baris
CREATE TABLE konfigurasi (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bobot_setoran           INTEGER NOT NULL DEFAULT 40,
  bobot_uas               INTEGER NOT NULL DEFAULT 40,
  bobot_akhlaq            INTEGER NOT NULL DEFAULT 10,
  bobot_kehadiran         INTEGER NOT NULL DEFAULT 10,
  tanggal_mulai_ganjil    DATE,
  tanggal_selesai_ganjil  DATE,
  tanggal_mulai_genap     DATE,
  tanggal_selesai_genap   DATE,
  fitur_akhlaq_aktif      BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_mode        BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT bobot_total_100 CHECK (
    bobot_setoran + bobot_uas + bobot_akhlaq + bobot_kehadiran = 100
  )
);

-- Insert baris default konfigurasi
INSERT INTO konfigurasi (
  bobot_setoran, bobot_uas, bobot_akhlaq, bobot_kehadiran,
  fitur_akhlaq_aktif, maintenance_mode
) VALUES (40, 40, 10, 10, TRUE, FALSE);

-- Hari libur
CREATE TABLE hari_libur (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanggal     DATE NOT NULL UNIQUE,
  keterangan  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Target baris harian per grade dan tipe setoran
CREATE TABLE target_grade (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade        grade_enum NOT NULL,
  tipe_setoran tipe_setoran_enum NOT NULL,
  target_min   INTEGER NOT NULL,
  target_max   INTEGER,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT target_min_positive CHECK (target_min > 0),
  CONSTRAINT target_max_gte_min CHECK (target_max IS NULL OR target_max >= target_min),
  CONSTRAINT unique_target_grade_tipe UNIQUE (grade, tipe_setoran)
);

-- Insert default target per kombinasi grade dan tipe setoran
INSERT INTO target_grade (grade, tipe_setoran, target_min, target_max) VALUES
  ('tahsin', 'sabak',  3,  4),
  ('takmil', 'sabak',  5,  7),
  ('tahfiz', 'sabak', 15, NULL),
  ('tahsin', 'sabki', 22, NULL),
  ('takmil', 'sabki', 22, NULL),
  ('tahfiz', 'sabki', 22, NULL),
  ('tahsin', 'manzil', 75, NULL),
  ('takmil', 'manzil', 75, NULL),
  ('tahfiz', 'manzil', 75, NULL);

-- Target baris harian per grade saat Syahrul Quran
CREATE TABLE target_syahrul_quran (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade       grade_enum NOT NULL UNIQUE,
  target_min  INTEGER NOT NULL,
  target_max  INTEGER,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT target_syahrul_min_positive CHECK (target_min > 0),
  CONSTRAINT target_syahrul_max_gte_min CHECK (target_max IS NULL OR target_max >= target_min)
);

-- Insert default target Syahrul Quran per grade
INSERT INTO target_syahrul_quran (grade, target_min, target_max) VALUES
  ('tahsin',   7, 10),
  ('takmil',  15, NULL),
  ('tahfiz', 300, NULL);

-- ============================================================
-- SETORAN
-- ============================================================

CREATE TABLE setoran (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id        UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  tipe             tipe_setoran_enum NOT NULL,
  tanggal          DATE NOT NULL,
  jumlah_baris     INTEGER NOT NULL,
  halaman_awal     INTEGER NOT NULL,
  halaman_akhir    INTEGER NOT NULL,
  jumlah_kesalahan INTEGER,
  status           status_setoran_enum NOT NULL,
  input_oleh       UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Satu santri hanya boleh punya satu setoran per tipe per tanggal
  CONSTRAINT unique_setoran_per_hari UNIQUE (santri_id, tipe, tanggal),
  CONSTRAINT jumlah_baris_positive CHECK (jumlah_baris > 0),
  CONSTRAINT halaman_valid CHECK (halaman_akhir >= halaman_awal)
);

-- ============================================================
-- TIKRAR
-- ============================================================

CREATE TABLE tikrar (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id                UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  tanggal                  DATE NOT NULL,
  surah                    TEXT NOT NULL,
  status                   status_tikrar_enum NOT NULL DEFAULT 'wajib_sekolah',
  diselesaikan_pengampu_at TIMESTAMPTZ,
  dialihkan_rumah_at       TIMESTAMPTZ,
  diselesaikan_ortu_at     TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Tidak boleh duplikat tikrar untuk santri + tanggal + surah yang sama
  CONSTRAINT unique_tikrar UNIQUE (santri_id, tanggal, surah)
);

-- ============================================================
-- ABSENSI
-- ============================================================

CREATE TABLE absensi (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id   UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  tanggal     DATE NOT NULL,
  status      status_absensi_enum NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Satu santri hanya boleh punya satu record absensi per tanggal
  CONSTRAINT unique_absensi_per_hari UNIQUE (santri_id, tanggal)
);

-- ============================================================
-- UJIAN
-- ============================================================

-- Ujian Kenaikan Juz
CREATE TABLE ukj (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id         UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  pengampu_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  nomor_juz         INTEGER NOT NULL,
  nilai             INTEGER NOT NULL,
  status_santri     status_ukj_santri_enum NOT NULL,
  status_approval   status_approval_enum NOT NULL DEFAULT 'pending',
  alasan_penolakan  TEXT,
  approved_by       UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT nilai_ukj_valid CHECK (nilai >= 0 AND nilai <= 100),
  CONSTRAINT nomor_juz_valid CHECK (nomor_juz >= 1 AND nomor_juz <= 30)
);

-- Ujian Akhir Semester (header)
CREATE TABLE uas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id    UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  pengampu_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  semester     semester_enum NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  nilai_akhir  NUMERIC(5,1),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Satu santri hanya boleh punya satu UAS per semester per tahun ajaran
  CONSTRAINT unique_uas_per_semester UNIQUE (santri_id, semester, tahun_ajaran)
);

-- Ujian Akhir Semester (detail per juz)
CREATE TABLE uas_detail (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uas_id      UUID NOT NULL REFERENCES uas(id) ON DELETE CASCADE,
  nomor_juz   INTEGER NOT NULL,
  nilai       INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_juz_per_uas UNIQUE (uas_id, nomor_juz),
  CONSTRAINT nilai_uas_valid CHECK (nilai >= 0 AND nilai <= 100),
  CONSTRAINT nomor_juz_uas_valid CHECK (nomor_juz >= 1 AND nomor_juz <= 30)
);

-- ============================================================
-- AKHLAQ
-- ============================================================

CREATE TABLE akhlaq (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id    UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  pengampu_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  semester     semester_enum NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  nilai        INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_akhlaq_per_semester UNIQUE (santri_id, semester, tahun_ajaran),
  CONSTRAINT nilai_akhlaq_valid CHECK (nilai >= 0 AND nilai <= 100)
);

-- ============================================================
-- PERIODE KHUSUS
-- ============================================================

-- Syahrul Quran
CREATE TABLE syahrul_quran (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanggal_mulai   DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  dibuat_oleh     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tanggal_syahrul_valid CHECK (tanggal_selesai >= tanggal_mulai)
);

-- Pekan Murajaah
CREATE TABLE pekan_murajaah (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanggal_mulai   DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  dibuat_oleh     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tanggal_murajaah_valid CHECK (tanggal_selesai >= tanggal_mulai)
);

-- Target per halaqah saat Pekan Murajaah
CREATE TABLE target_murajaah (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pekan_murajaah_id    UUID NOT NULL REFERENCES pekan_murajaah(id) ON DELETE CASCADE,
  halaqah_id           UUID NOT NULL REFERENCES halaqah(id) ON DELETE CASCADE,
  target_baris_per_hari INTEGER NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_target_per_halaqah UNIQUE (pekan_murajaah_id, halaqah_id),
  CONSTRAINT target_baris_positive CHECK (target_baris_per_hari > 0)
);

-- ============================================================
-- KOMUNIKASI
-- ============================================================

-- Thread percakapan antara pengampu dan ortu per santri
CREATE TABLE percakapan (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  santri_id    UUID NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  pengampu_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  ortu_id      UUID NOT NULL REFERENCES orang_tua(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Satu thread unik per kombinasi santri + pengampu + ortu
  CONSTRAINT unique_percakapan UNIQUE (santri_id, pengampu_id, ortu_id)
);

-- Isi pesan
CREATE TABLE pesan (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  percakapan_id   UUID NOT NULL REFERENCES percakapan(id) ON DELETE CASCADE,
  pengirim_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  isi             TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PENGUMUMAN & BERITA
-- ============================================================

-- Pengumuman (popup saat login)
CREATE TABLE pengumuman (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judul        TEXT NOT NULL,
  isi          TEXT NOT NULL,
  target_role  TEXT[] NOT NULL,
  dibuat_oleh  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tracking pengumuman yang sudah dibaca per user
CREATE TABLE pengumuman_read (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengumuman_id   UUID NOT NULL REFERENCES pengumuman(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_pengumuman_read UNIQUE (pengumuman_id, user_id)
);

-- Berita di halaman login (publik)
CREATE TABLE berita_login (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judul        TEXT NOT NULL,
  isi          TEXT NOT NULL,
  dibuat_oleh  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PUSH NOTIFICATIONS
-- ============================================================

CREATE TABLE push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mobile_push_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token  TEXT NOT NULL,
  platform   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT TRAIL
-- ============================================================

CREATE TABLE audit_trail (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  aktivitas   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES (performa query)
-- ============================================================

-- Setoran — sering diquery per santri dan tanggal
CREATE INDEX idx_setoran_santri_id ON setoran(santri_id);
CREATE INDEX idx_setoran_tanggal ON setoran(tanggal);
CREATE INDEX idx_setoran_santri_tipe_tanggal ON setoran(santri_id, tipe, tanggal);

-- Tikrar — sering diquery per santri dan status
CREATE INDEX idx_tikrar_santri_id ON tikrar(santri_id);
CREATE INDEX idx_tikrar_status ON tikrar(status);

-- Absensi — sering diquery per santri dan tanggal
CREATE INDEX idx_absensi_santri_id ON absensi(santri_id);
CREATE INDEX idx_absensi_tanggal ON absensi(tanggal);

-- UKJ — sering diquery per status approval
CREATE INDEX idx_ukj_status_approval ON ukj(status_approval);
CREATE INDEX idx_ukj_santri_id ON ukj(santri_id);

-- UAS Detail — sering diquery per uas_id
CREATE INDEX idx_uas_detail_uas_id ON uas_detail(uas_id);

-- Santri — sering diquery per halaqah
CREATE INDEX idx_santri_halaqah_id ON santri(halaqah_id);
CREATE INDEX idx_santri_orang_tua_id ON santri(orang_tua_id);

-- Pesan — sering diquery per percakapan
CREATE INDEX idx_pesan_percakapan_id ON pesan(percakapan_id);

-- Pengumuman read — sering diquery per user
CREATE INDEX idx_pengumuman_read_user_id ON pengumuman_read(user_id);

-- Audit trail — sering diquery per tanggal
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at);
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);

-- Push Notifications
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_mobile_push_tokens_user_id ON mobile_push_tokens(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orang_tua ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE halaqah ENABLE ROW LEVEL SECURITY;
ALTER TABLE konfigurasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE hari_libur ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_grade ENABLE ROW LEVEL SECURITY;
ALTER TABLE setoran ENABLE ROW LEVEL SECURITY;
ALTER TABLE tikrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE ukj ENABLE ROW LEVEL SECURITY;
ALTER TABLE uas ENABLE ROW LEVEL SECURITY;
ALTER TABLE uas_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE akhlaq ENABLE ROW LEVEL SECURITY;
ALTER TABLE syahrul_quran ENABLE ROW LEVEL SECURITY;
ALTER TABLE pekan_murajaah ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_murajaah ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_syahrul_quran ENABLE ROW LEVEL SECURITY;
ALTER TABLE percakapan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumuman_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE berita_login ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_push_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNGSI AUTO-DELETE AUDIT TRAIL (tiap 3 bulan)
-- ============================================================

CREATE OR REPLACE FUNCTION delete_old_audit_trail()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_trail
  WHERE created_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RINGKASAN TABEL
-- ============================================================
-- Auth & Pengguna  : profiles, orang_tua
-- Data Master      : halaqah, santri
-- Konfigurasi      : konfigurasi, hari_libur, target_grade, target_syahrul_quran
-- Setoran          : setoran
-- Tikrar           : tikrar
-- Absensi          : absensi
-- Ujian            : ukj, uas, uas_detail
-- Akhlaq           : akhlaq
-- Periode Khusus   : syahrul_quran, pekan_murajaah, target_murajaah
-- Komunikasi       : percakapan, pesan
-- Pengumuman       : pengumuman, pengumuman_read, berita_login
-- Notifikasi Push  : push_subscriptions, mobile_push_tokens
-- Audit Trail      : audit_trail
-- Total            : 26 tabel
-- ============================================================

-- ============================================================
-- FASE 38-39 UPDATES (documented here for reference — already
-- applied manually in Supabase SQL Editor, do not re-run blindly)
-- ============================================================

-- Fase 38: RPC function for atomic UAS detail replacement
CREATE OR REPLACE FUNCTION replace_uas_detail(
  p_uas_id UUID,
  p_details JSONB
)
RETURNS void AS $$
BEGIN
  DELETE FROM uas_detail WHERE uas_id = p_uas_id;
  INSERT INTO uas_detail (uas_id, nomor_juz, nilai)
  SELECT p_uas_id, (elem->>'nomor_juz')::INTEGER, (elem->>'nilai')::INTEGER
  FROM jsonb_array_elements(p_details) AS elem;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Gagal memperbarui detail UAS: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION replace_uas_detail(UUID, JSONB) TO authenticated;

-- Fase 39: Prevent overlapping periods at database level
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE syahrul_quran
ADD CONSTRAINT no_overlapping_syahrul_quran
EXCLUDE USING gist (daterange(tanggal_mulai, tanggal_selesai, '[]') WITH &&);

ALTER TABLE pekan_murajaah
ADD CONSTRAINT no_overlapping_pekan_murajaah
EXCLUDE USING gist (daterange(tanggal_mulai, tanggal_selesai, '[]') WITH &&);