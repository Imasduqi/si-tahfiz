# System Logic Index

Document Version: v1.0
Project: [Nama Proyek]
Product: SI-Tahfiz
Status: Draft
Last Updated: [Tanggal]
Author: [Nama]
Source: user_flows/index.md, srs.md

---

## Catatan Arsitektur

- **Client:** Next.js 14 + TypeScript
- **Backend:** Supabase SDK langsung dari frontend (tidak ada REST API route custom)
- **Auth:** `supabase.auth` — session dikelola otomatis oleh Supabase Auth
- **Query:** `supabase.from('table').select/insert/update/delete`
- **Security:** RLS (Row Level Security) policies di level database, bukan middleware
- **Realtime:** `supabase.channel()` untuk notifikasi Alpha

---

## Keterangan Kompleksitas

| Label | Arti |
|-------|------|
| 🟢 Simple | Operasi CRUD tunggal, tidak ada logika kalkulasi |
| 🟡 Medium | Melibatkan beberapa tabel atau ada validasi bisnis |
| 🔴 Complex | Kalkulasi otomatis, multi-tabel, atau ada side effect ke tabel lain |

---

## Autentikasi & Akun

| UC ID | Nama | File | Aktor | Kompleksitas | Tabel Utama |
|-------|------|------|-------|--------------|-------------|
| UC-001 | Login Email | sys_uc_001.md | TU, Koordinator, Pengampu, Kepsek | 🟢 Simple | profiles |
| UC-002 | Login Nomor HP | sys_uc_002.md | Orang Tua | 🟢 Simple | orang_tua |
| UC-003 | Logout | sys_uc_003.md | Semua Role | 🟢 Simple | — |
| UC-034 | Edit Profil & Ganti Password | sys_uc_034.md | Semua Role | 🟢 Simple | profiles, orang_tua |
| UC-036 | Berlangganan Notifikasi Real-time | sys_uc_036.md | Semua Role | 🟡 Medium | push_subscriptions, mobile_push_tokens |

---

## Staff TU

| UC ID | Nama | File | Aktor | Kompleksitas | Tabel Utama |
|-------|------|------|-------|--------------|-------------|
| UC-004 | CRUD Akun Pengguna | sys_uc_004.md | Staff TU | 🟡 Medium | profiles, orang_tua, audit_trail |
| UC-005 | CRUD Data Santri | sys_uc_005.md | Staff TU | 🟡 Medium | santri, audit_trail |
| UC-006 | CRUD Halaqah | sys_uc_006.md | Staff TU | 🟡 Medium | halaqah, santri, audit_trail |
| UC-007 | Konfigurasi Tanggal Semester | sys_uc_007.md | Staff TU | 🟢 Simple | konfigurasi |
| UC-008 | Konfigurasi Bobot Nilai Akhir | sys_uc_008.md | Staff TU | 🟡 Medium | konfigurasi |
| UC-009 | Konfigurasi Hari Libur | sys_uc_009.md | Staff TU | 🟢 Simple | hari_libur |
| UC-010 | Kelola Audit Trail | sys_uc_010.md | Staff TU | 🟡 Medium | audit_trail |
| UC-011 | Kelola Berita Halaman Login | sys_uc_011.md | Staff TU | 🟢 Simple | berita_login |
| UC-012 | Aktifkan/Nonaktifkan Maintenance Mode | sys_uc_012.md | Staff TU | 🟡 Medium | konfigurasi |

---

## Pengampu

| UC ID | Nama | File | Aktor | Kompleksitas | Tabel Utama |
|-------|------|------|-------|--------------|-------------|
| UC-013 | Input Setoran Sabak & Sabki | sys_uc_013.md | Pengampu | 🔴 Complex | setoran, tikrar, syahrul_quran |
| UC-014 | Input Absensi Santri | sys_uc_014.md | Pengampu | 🟡 Medium | absensi |
| UC-015 | Kelola Tikrar di Sekolah | sys_uc_015.md | Pengampu | 🟡 Medium | tikrar |
| UC-016 | Lihat Status Manzil Santri | sys_uc_016.md | Pengampu | 🟢 Simple | setoran |
| UC-017 | Input Hasil UKJ | sys_uc_017.md | Pengampu | 🟡 Medium | ukj, audit_trail |
| UC-018 | Input Nilai UAS Per Juz | sys_uc_018.md | Pengampu | 🔴 Complex | uas, uas_detail |
| UC-019 | Input Nilai Akhlaq | sys_uc_019.md | Pengampu | 🟢 Simple | akhlaq, konfigurasi |
| UC-020 | Kirim & Balas Pesan ke Orang Tua | sys_uc_020.md | Pengampu | 🟡 Medium | percakapan, pesan |

---

## Orang Tua

| UC ID | Nama | File | Aktor | Kompleksitas | Tabel Utama |
|-------|------|------|-------|--------------|-------------|
| UC-021 | Input Setoran Manzil | sys_uc_021.md | Orang Tua | 🟡 Medium | setoran, syahrul_quran |
| UC-022 | Validasi Tikrar Rumah | sys_uc_022.md | Orang Tua | 🟡 Medium | tikrar |
| UC-023 | Switch Antar Anak | sys_uc_023.md | Orang Tua | 🟢 Simple | santri, orang_tua |
| UC-024 | Kirim & Balas Pesan ke Pengampu | sys_uc_024.md | Orang Tua | 🟡 Medium | percakapan, pesan |

---

## Koordinator

| UC ID | Nama | File | Aktor | Kompleksitas | Tabel Utama |
|-------|------|------|-------|--------------|-------------|
| UC-025 | Approve / Reject UKJ | sys_uc_025.md | Koordinator | 🟡 Medium | ukj, audit_trail |
| UC-026 | Kelola Periode Syahrul Quran | sys_uc_026.md | Koordinator | 🟡 Medium | syahrul_quran |
| UC-027 | Kelola Pekan Murajaah | sys_uc_027.md | Koordinator | 🟡 Medium | pekan_murajaah, target_murajaah |
| UC-028 | Ubah Grade Santri | sys_uc_028.md | Koordinator | 🟢 Simple | santri, target_grade |
| UC-029 | Buat & Kelola Pengumuman | sys_uc_029.md | Koordinator | 🟡 Medium | pengumuman, pengumuman_read |
| UC-030 | Download Rekap Excel | sys_uc_030.md | Koordinator | 🔴 Complex | setoran, absensi, uas, akhlaq, hari_libur, syahrul_quran, pekan_murajaah, konfigurasi |
| UC-031 | Aktifkan / Nonaktifkan Fitur Akhlaq | sys_uc_031.md | Koordinator | 🟢 Simple | konfigurasi |
| UC-035 | Konfigurasi Target Grade & Syahrul Quran | sys_uc_035.md | Koordinator | 🟡 Medium | target_grade, target_syahrul_quran |

---

## Kepala Sekolah

| UC ID | Nama | File | Aktor | Kompleksitas | Tabel Utama |
|-------|------|------|-------|--------------|-------------|
| UC-032 | Lihat Dashboard Statistik | sys_uc_032.md | Kepala Sekolah | 🟡 Medium | santri, halaqah, setoran, absensi |
| UC-033 | Download Rekap Excel | sys_uc_033.md | Kepala Sekolah | 🔴 Complex | setoran, absensi, uas, akhlaq, hari_libur, syahrul_quran, pekan_murajaah, konfigurasi |

---

## Ringkasan

| Kompleksitas | Jumlah |
|--------------|--------|
| 🔴 Complex | 4 |
| 🟡 Medium | 20 |
| 🟢 Simple | 12 |
| **Total** | **36** |

---

## Urutan Prioritas Implementasi

Urutan ini disarankan untuk vibe coding agar fitur inti bisa diuji lebih awal:

### Fase 1 — Fondasi (harus ada sebelum fitur lain)
- UC-001: Login Email
- UC-002: Login Nomor HP
- UC-003: Logout
- UC-004: CRUD Akun Pengguna
- UC-005: CRUD Data Santri
- UC-006: CRUD Halaqah
- UC-007: Konfigurasi Tanggal Semester
- UC-035: Konfigurasi Target Grade & Syahrul Quran

### Fase 2 — Fitur Harian (core workflow)
- UC-013: Input Setoran Sabak & Sabki
- UC-021: Input Setoran Manzil
- UC-014: Input Absensi Santri
- UC-015: Kelola Tikrar di Sekolah
- UC-022: Validasi Tikrar Rumah
- UC-016: Lihat Status Manzil

### Fase 3 — Ujian & Penilaian
- UC-017: Input Hasil UKJ
- UC-025: Approve / Reject UKJ
- UC-018: Input Nilai UAS Per Juz
- UC-019: Input Nilai Akhlaq
- UC-031: Aktifkan / Nonaktifkan Fitur Akhlaq
- UC-028: Ubah Grade Santri

### Fase 4 — Periode Khusus
- UC-026: Kelola Periode Syahrul Quran
- UC-027: Kelola Pekan Murajaah

### Fase 5 — Rekap & Dashboard
- UC-030: Download Rekap Excel (Koordinator)
- UC-033: Download Rekap Excel (Kepsek)
- UC-032: Lihat Dashboard Statistik
- UC-008: Konfigurasi Bobot Nilai Akhir
- UC-009: Konfigurasi Hari Libur

### Fase 6 — Komunikasi & Pengumuman
- UC-020: Kirim & Balas Pesan ke Orang Tua
- UC-024: Kirim & Balas Pesan ke Pengampu
- UC-029: Buat & Kelola Pengumuman
- UC-011: Kelola Berita Halaman Login

### Fase 7 — Sistem & Profil
- UC-034: Edit Profil & Ganti Password
- UC-010: Kelola Audit Trail
- UC-012: Aktifkan/Nonaktifkan Maintenance Mode
- UC-023: Switch Antar Anak
- UC-036: Berlangganan Notifikasi Real-time