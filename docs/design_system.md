

---

## Color Palette

| Nama | HEX | Digunakan untuk |
|------|-----|-----------------|
| **Forest Green (Utama)** | `#228B22` | Background logo, shadow dekoratif utama, update banner |
| **Primary** | `#059669` | Warna utama tailwind, tombol primary, ikon aktif |
| **Primary Dark** | `#047857` | Hover state tombol primary |
| **Primary Light** | `#D1FAE5` | Background badge, highlight ringan |
| **Secondary** | `#6B7280` | Teks sekunder, ikon nonaktif, border |
| **Orange Accent** | `#F97316` | Ikon aksen tertentu, badge notifikasi |
| **Warning** | `#F59E0B` | Peringatan, status pending |
| **Success** | `#10B981` | Konfirmasi berhasil (sama dengan primary) |
| **Danger** | `#EF4444` | Hapus, error, status ditolak |
| **Background** | `#FFFFFF` | Background utama semua halaman |
| **Surface** | `#F9FAFB` | Background card, tabel, input |
| **Border** | `#E5E7EB` | Garis tepi card, input, tabel |
| **Text Primary** | `#111827` | Teks utama |
| **Text Secondary** | `#6B7280` | Teks pendukung, placeholder |
| **Text Disabled** | `#D1D5DB` | Teks nonaktif |

---

## Tipografi

**Font Family:** `Plus Jakarta Sans` (Google Fonts)

| Elemen | Ukuran | Weight | Keterangan |
|--------|--------|--------|------------|
| H1 | 30px | 700 | Judul halaman utama |
| H2 | 24px | 700 | Judul section |
| H3 | 20px | 600 | Sub-judul |
| H4 | 18px | 600 | Judul card |
| H5 | 16px | 600 | Label penting |
| H6 | 14px | 600 | Label kecil |
| Body | 14px | 400 | Teks umum |
| Body Small | 12px | 400 | Teks pendukung, caption |
| Label | 12px | 500 | Label form |

---

## Karakter Visual Per Role

### Pengampu & Orang Tua — Hangat & Friendly
- Sudut tombol: `rounded-full` (border-radius maksimal)
- Tombol shadow: `shadow-md` lembut
- Spacing: longgar, padding lebih besar
- Kesan: ramah, mudah disentuh di layar HP

### Koordinator & Kepala Sekolah — Bersih & Minimal
- Sudut tombol: `rounded-lg` (border-radius 8px)
- Tombol shadow: `shadow-sm` tipis
- Spacing: sedang, whitespace banyak
- Kesan: bersih, fokus ke data dan informasi

### Staff TU — Profesional & Structured
- Sudut tombol: `rounded-md` (border-radius 6px)
- Tombol shadow: tidak ada shadow, pakai border tegas
- Spacing: rapat, dense untuk tabel dan form
- Kesan: rapi, efisien, seperti panel admin

*(Catatan: Sudut komponen dinamis ini hanya berlaku untuk tombol/elemen interaktif. Komponen struktur seperti Card bersifat statis untuk semua role)*

---

## Komponen UI

### Button

| Tipe | Background | Teks | Border | Hover |
|------|------------|------|--------|-------|
| **Primary** | `#059669` | `#FFFFFF` | — | `#047857` |
| **Secondary** | `#FFFFFF` | `#111827` | `#E5E7EB` | `#F9FAFB` |
| **Danger** | `#EF4444` | `#FFFFFF` | — | `#DC2626` |
| **Ghost** | Transparan | `#059669` | — | `#D1FAE5` |
| **Disabled** | `#F3F4F6` | `#D1D5DB` | — | Tidak berubah |

- Ukuran padding: `12px 20px` untuk default, `8px 14px` untuk small
- Sudut mengikuti karakter role masing-masing

---

### Input Form

- Background: `#F9FAFB`
- Border: `1px solid #E5E7EB`
- Border saat fokus: `2px solid #059669`
- Border saat error: `2px solid #EF4444`
- Sudut: `rounded-lg`
- Padding: `10px 14px`
- Font size: `14px`
- Placeholder warna: `#9CA3AF`

---

### Card

- Background: `#FFFFFF`
- Border: `1px solid #E0EDE0`
- Sudut (Border Radius): Selalu statis `rounded-2xl` (16px) untuk semua role
- Shadow: Statis menggunakan warna hijau transparan custom `rgba(34,139,34,0.08)` untuk bayangan utama
- Padding: `16px` mobile, `24px` desktop

---

### Tabel

- Header background: `#F3F4F6`
- Header teks: `#374151`, weight 600
- Row background: `#FFFFFF`
- Row hover: `#F9FAFB`
- Row garis pemisah: `1px solid #E5E7EB`
- Font size isi: `14px`
- Padding cell: `12px 16px`

---

### Badge & Status

| Status | Background | Teks |
|--------|------------|------|
| Lulus / Selesai | `#D1FAE5` | `#065F46` |
| Pending / Menunggu | `#FEF3C7` | `#92400E` |
| Ditolak / Error | `#FEE2E2` | `#991B1B` |
| Izin | `#DBEAFE` | `#1E40AF` |
| Sakit | `#F3E8FF` | `#6B21A8` |
| Alpha | `#FEE2E2` | `#991B1B` |

---

## State Management Visual

### Empty State
- Ikon ilustrasi ukuran `80px` warna `#D1D5DB`
- Teks utama: `"Belum ada data"` — font size 16px, weight 600, warna `#374151`
- Teks pendukung: penjelasan singkat — font size 14px, warna `#6B7280`
- Tombol aksi (jika relevan): Primary button di bawah teks

### Loading State
- Skeleton loader mengikuti bentuk konten yang sedang dimuat
- Warna skeleton: animasi `#F3F4F6` → `#E5E7EB` (pulse)
- Tidak menggunakan spinner di tengah halaman kecuali untuk aksi tombol

### Error State
- Background: `#FEF2F2`
- Border: `1px solid #FECACA`
- Ikon: `⚠` warna `#EF4444`
- Teks error: font size 14px, warna `#991B1B`
- Tombol "Coba Lagi" jika error bisa di-retry

### Success Toast
- Menggunakan Sonner
- Warna: background `#ECFDF5`, teks `#065F46`, ikon centang `#059669`
- Durasi: 3 detik lalu hilang otomatis

---
