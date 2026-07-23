


# UC-033 — Download Rekap Excel (Kepala Sekolah)

Document Version: v1.0
Use Case ID: UC-033
Use Case Name: Download Rekap Excel (Kepala Sekolah)
File Path: ./sys_uc_033.md
Status: Draft
Actors: Kepala Sekolah
Complexity: 🔴 Complex
Tabel Utama: setoran, absensi, uas, uas_detail, akhlaq, hari_libur, syahrul_quran, pekan_murajaah, konfigurasi

## Purpose

Kepala Sekolah men-generate dan mengunduh rekap Excel semester. Logika generate identik dengan UC-030 (Koordinator) — perbedaannya hanya pada role yang mengakses.

## Preconditions

- Kepsek sudah login.
- Berada di halaman `/kepsek/rekap`.
- Konfigurasi tanggal semester sudah diisi TU.

## Main Flow

1. Kepsek memilih semester dan tahun ajaran di form filter.
2. Kepsek menekan "Generate Rekap".
3. Logika generate identik dengan UC-030.
4. Browser mengunduh file Excel.

## Alternate / Error Flows

Identik dengan UC-030.

## Sequence Diagram

Identik dengan UC-030 — lihat sys_uc_030.md.

## API Contract (Supabase SDK)

Identik dengan UC-030 — lihat sys_uc_030.md.

## Data Model

Identik dengan UC-030.

## Validation Rules

- semester: required, enum (ganjil, genap)
- tahun_ajaran: required

## Security & Permissions

- RLS: Kepsek boleh SELECT semua tabel yang dibutuhkan.
- Kepsek tidak boleh INSERT, UPDATE, DELETE.

## Traceability

User Flow: userflow_uc_033.md
SRS: F-11, F-12

---
