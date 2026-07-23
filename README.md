# SI-Tahfiz: Sistem Informasi Manajemen Program Tahfiz Al-Qur'an

SI-Tahfiz adalah aplikasi web komprehensif yang dirancang untuk MTs TQ Jamilurrahman Yogyakarta. Sistem ini bertujuan mendigitalisasi proses manajemen hafalan Al-Qur'an secara terintegrasi, yang sebelumnya menggunakan buku catatan manual dan spreadsheet.

Aplikasi ini bersifat **Mobile-First** dan mendukung 5 jenis pengguna (Role): **Staff TU, Koordinator, Pengampu, Kepala Sekolah, dan Orang Tua/Wali**.

---

## 👥 Tim Pengembang

**Kelompok 404 Not Found**

| Nama | NIM | Peran / Kontribusi |
|------|-----|--------------------|
| Imam Faqih Masduqi | 2400016067 | Koordinator penyusunan draf utama dan finalisasi kelengkapan dokumen |
| Ahmad Raka Putra Pratama | 2400016089 | Penyiapan kerangka dokumen dan penyusunan file pendukung laporan |
| Dadan Julianto | 2400016070 | Dokumentasi audio dan ekstraksi poin-poin penting dari wawancara |
| Franchisco Dabutar | 2400016081 | Analisis data temuan lapangan dan penyelarasan alur logika (traceability) |
| Mohammed Rashed Mansoor | 2406016105 | Dokumentasi visual sistem, penyusunan artefak proyek, dan validasi antarmuka lapangan |

---

## 🌐 Link Proyek

- 🚀 **URL Aplikasi (Deploy):** [https://si-tahfiz.vercel.app/](https://si-tahfiz.vercel.app/)
- 📦 **URL Repository GitHub:** [https://github.com/Imasduqi/si-tahfiz](https://github.com/Imasduqi/si-tahfiz)

---

## 🏗️ Struktur & Dokumentasi Proyek

Proyek ini sangat terdokumentasi dengan baik. Seluruh *blueprint* arsitektur dan spesifikasi aplikasi berada di direktori *root* (di luar folder aplikasi utama `si-tahfiz/`). 

Berikut adalah peta dokumentasi proyek:

### 1. Spesifikasi Utama
- 📄 **`srs.md`** : Software Requirements Specification. Dokumen utama yang memuat aturan bisnis inti, penjabaran kewenangan per *role*, dan definisi fitur secara *high-level*.
- 📄 **`information_architecture.md`** : Peta situs (Sitemap) dan alur navigasi halaman aplikasi per *role*.
- 📄 **`design_system.md`** : Panduan visual UI/UX (termasuk palet warna "Forest Green", tipografi `Plus Jakarta Sans`, spesifikasi *rounded corner* statis pada komponen, dan *styling* spesifik lainnya).

### 2. Arsitektur Data & Alur Sistem
- 📄 **`data_model.md`** : Dokumentasi *Database Schema* komprehensif yang mencakup 26 tabel (termasuk tabel notifikasi push), kamus data, *relationships*, dan *traceability matrix*.
- 📂 **`user_flows/`** : Kumpulan dokumen (total 36 *Use Cases*, `UC-001` hingga `UC-036`) yang merinci alur interaksi antarmuka pengguna, selangkah demi selangkah. Termasuk fitur kompleks seperti Konfigurasi Target Grade & Syahrul Quran hingga Berlangganan Notifikasi Push.
- 📂 **`system_logics/`** : Dokumentasi arsitektur sistem (API Contract) untuk ke-36 Use Cases tersebut. Membahas *state management*, validasi Zod, dan *query* Supabase secara teknis (Next.js 14 App Router + Server Actions).

### 3. Database SQL
- 🗄️ **`database_tahfidz (1).sql`** : *Data Definition Language* (DDL) lengkap untuk Supabase PostgreSQL. Mengandung 26 tabel beserta tipe enumerasi, fungsi otomatis (*auto-delete audit trail*), indeks performa, pembatas kustom (*exclusion constraint* untuk anti-tumpang tindih tanggal), serta Row Level Security (RLS) di semua tabel.

---

## 💻 Tech Stack Aplikasi (`si-tahfiz/`)

- **Framework:** Next.js 14 (App Router)
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS + UI Components (radix-ui/shadcn)
- **Database & Auth:** Supabase (dengan RLS untuk keamanan lapis database)
- **Fitur Tambahan:** Service Worker & Firebase/Web Push (PWA/Notifikasi Real-time)

---

## 🚀 Setup Development

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm
- Akun Supabase (untuk Database & Autentikasi)

### Langkah Setup

**1. Clone dan Install Dependencies:**
```bash
git clone https://github.com/Imasduqi/si-tahfiz
cd si-tahfiz
npm install
```

**2. Konfigurasi Environment Variables:**
Buat file `.env.local` di dalam folder `si-tahfiz/`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

**3. Setup Database (Supabase):**
Buka Supabase SQL Editor dan jalankan isi dari file `database_tahfidz (1).sql` yang berada di direktori *root*. Ini akan meng-generate 26 tabel beserta seluruh struktur keamanan (RLS) dan data konfigurasi *default*.

**4. Pembuatan Akun Perdana:**
Buka *Supabase Dashboard* → *Authentication* → Tambahkan pengguna secara manual (contoh: `admin@sitahfiz.com`).
Kemudian jalankan *query* berikut di SQL Editor untuk memberikan wewenang Staff TU:
```sql
INSERT INTO profiles (id, nama_lengkap, role, email)
SELECT id, 'Admin TU', 'tu', 'admin@sitahfiz.com'
FROM auth.users
WHERE email = 'admin@sitahfiz.com';
```

**5. Jalankan Development Server:**
```bash
npm run dev
```
Aplikasi dapat diakses melalui `http://localhost:3000`.

---

## 🔒 Login Info
Setelah *setup*, masuklah menggunakan akun TU yang telah dibuat secara manual. Untuk menjaga integritas sistem, semua akun pengguna berikutnya (Kepsek, Koordinator, Pengampu, Orang Tua) hanya dapat dibuat, diatur, dan dikontrol eksklusif melalui dasbor **Staff TU**.

(Khusus Orang Tua login menggunakan Nomor HP, dengan *password default* format: `TAHFIZ_{nomorHP}`)