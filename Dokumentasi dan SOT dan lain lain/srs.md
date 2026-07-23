

## Tujuan Sistem

SI-Tahfiz adalah aplikasi web manajemen program Tahfiz Al-Qur'an untuk MTs TQ Jamilurrahman Yogyakarta. Sistem ini menggantikan proses manual berbasis buku catatan dan spreadsheet tidak terintegrasi yang sebelumnya digunakan. Dengan SI-Tahfiz, seluruh proses pencatatan setoran harian, validasi Manzil oleh orang tua, manajemen ujian, absensi, penilaian akhlaq, dan rekap semester dilakukan secara digital dalam satu platform yang dapat diakses oleh semua pemangku kepentingan sesuai perannya masing-masing.

Aplikasi ini diakses via browser dan dirancang **mobile-first** karena mayoritas pengguna (terutama pengampu dan orang tua) mengaksesnya melalui smartphone. Tampilan desktop tetap didukung penuh tanpa perbedaan fungsionalitas.

---

## Aktor Pengguna

| Role | Keterangan | Login Via |
|------|------------|-----------|
| **Staff TU** | Admin sistem. Mengelola seluruh akun pengguna, data santri, halaqah, konfigurasi sistem, dan audit trail | Email |
| **Koordinator** | Mengelola program tahfiz secara keseluruhan. Approve/reject UKJ, kelola periode Syahrul Quran dan Pekan Murajaah, ubah grade santri, lihat semua halaqah | Email |
| **Pengampu** | Guru tahfiz. Input setoran harian (Sabak & Sabki), kelola Tikrar, input nilai UKJ & UAS & Akhlaq, input absensi. Hanya bisa akses halaqahnya sendiri | Email |
| **Orang Tua/Wali** | Input Manzil, validasi Tikrar rumah, pantau perkembangan anak, terima notifikasi Alpha. Satu akun bisa untuk lebih dari satu anak | Nomor HP |
| **Kepala Sekolah** | Monitoring eksekutif. Lihat dashboard statistik dan download rekap Excel. Tidak ada aksi input apapun | Email |

---

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| **Frontend** | Next.js 14 + TypeScript + Tailwind CSS |
| **Backend & Database** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Hosting** | Vercel (frontend), Supabase cloud (backend) |
| **Export Excel** | SheetJS (XLSX) |
| **Grafik/Chart** | Recharts |
| **Ikon** | Lucide React |
| **Notifikasi UI** | Sonner (toast) |

---


---

## In-Scope Features

### F-01 · Autentikasi & Manajemen Akun
- Login menggunakan email untuk role TU, Koordinator, Pengampu, dan Kepsek
- Login menggunakan nomor HP untuk role Orang Tua/Wali
- Staff TU wajib bisa create, edit, reset password, dan hapus akun untuk semua role
- Satu akun Orang Tua dapat terhubung ke lebih dari satu anak

---

### F-02 · Setoran Harian (Sabak & Sabki)
- Hanya Pengampu yang bisa input Sabak dan Sabki
- Satuan input adalah baris, dengan keterangan halaman awal sampai halaman akhir
- Sistem wajib mencegah duplikasi setoran jenis yang sama untuk santri yang sama di hari yang sama
- Sistem wajib menentukan status lulus atau mengulang berdasarkan jumlah kesalahan
- Saat periode Syahrul Quran aktif, kolom input Sabki tidak muncul sama sekali

---

### F-03 · Setoran Manzil
- Hanya Orang Tua yang bisa input Manzil (bukan pengampu)
- Satuan input adalah baris, dengan keterangan halaman awal sampai halaman akhir
- Saat periode Syahrul Quran aktif, kolom input Manzil tidak muncul sama sekali

---

### F-04 · Tikrar
- Tikrar dibuat otomatis oleh sistem saat santri melebihi batas kesalahan saat setoran
- Alur status bersifat linear satu arah: `wajib_sekolah` → `selesai_sekolah` → `wajib_rumah` → `selesai_rumah`
- Pengampu menandai `selesai_sekolah` atau mengalihkan ke rumah (`wajib_rumah`)
- Orang tua menandai `selesai_rumah` sebagai validasi bahwa Tikrar sudah dilakukan di rumah
- Tidak boleh ada status yang melompat atau mundur

---

### F-05 · Ujian Kenaikan Juz (UKJ)
- Pengampu input hasil UKJ: nilai (skala 0-100) dan status lulus atau mengulang
- Koordinator wajib approve atau reject setiap UKJ yang diinput pengampu
- UKJ yang sudah di-approve koordinator tidak dapat diubah pengampu
- Jika ditolak koordinator, pengampu dapat input ulang dengan data baru (santri ujian ulang)
- Record UKJ yang ditolak tetap tersimpan sebagai riwayat, tidak dihapus

---

### F-06 · Ujian Akhir Semester (UAS)
- Pengampu memilih juz yang diujikan per santri, dengan pilihan statis maksimal 3 juz (opsi 1, 2, atau 3 juz)
- Jika jumlah hafalan santri kurang dari atau sama dengan batas juz yang dipilih tersebut, seluruh hafalan wajib diujikan
- Pengampu input nilai per juz (skala 0-100)
- Nilai akhir UAS dihitung otomatis sebagai rata-rata dari seluruh nilai per juz
- UAS tidak memerlukan approval koordinator

---

### F-07 · Absensi & Notifikasi Alpha
- Model exception-based: semua santri dianggap hadir secara default
- Pengampu hanya mencatat ketidakhadiran dengan status: Alpha, Sakit, atau Izin
- Saat santri ditandai Alpha, sistem otomatis mengirim notifikasi in-app ke akun Orang Tua
- Status Sakit dan Izin tidak memicu notifikasi apapun
- Jika Orang Tua tidak memiliki akun, penyimpanan absensi tetap berhasil tanpa error

---

### F-08 · Penilaian Akhlaq
- Pengampu input satu nilai angka (skala 0-100) per santri per semester
- Fitur ini dapat diaktifkan atau dinonaktifkan oleh Koordinator

---

### F-09 · Periode Syahrul Quran
- Koordinator menetapkan tanggal mulai dan selesai periode Syahrul Quran
- Selama periode ini hanya setoran Sabak yang dapat diinput, Sabki dan Manzil tidak muncul di antarmuka
- Target harian per grade selama Syahrul Quran sama dengan target normal
- Pekan yang masuk periode Syahrul Quran ditandai simbol ★ di rekap Excel

---

### F-10 · Pekan Murajaah
- Koordinator mengaktifkan periode Pekan Murajaah dengan menentukan tanggal mulai dan selesai
- Koordinator menginformasikan target harian ke pengampu, pengampu input target secara manual
- Aturan target: hafalan lebih dari 3 juz maka 2 lembar per hari; hafalan kurang dari 3 juz maka total hafalan dibagi 15 hari
- Setoran selama Pekan Murajaah masuk hitungan nilai akhir semester seperti biasa
- Pekan Murajaah ditandai khusus di rekap Excel

---

### F-11 · Rekap Semester (Export Excel)
- Dapat didownload oleh Koordinator, Pengampu, dan Kepala Sekolah
- Dikelompokkan berdasarkan halaqah (nama pengampu dan grade halaqah)
- Struktur kolom dari kiri ke kanan:
  - No + Nama Lengkap + Kelas (digabung)
  - Per bulan: Pekan 1-5 × 3 jenis setoran (Sabak, Sabki, Manzil) + kolom baris tidak tercapai + kolom total bulan
  - Total semester: total Sabak + Sabki + Manzil dalam baris
  - Total hari efektif
  - Nilai Setoran Harian (40%)
  - Nilai UAS (40%)
  - Nilai Akhlaq (10%)
  - Nilai Kehadiran (10%)
  - Nilai Raport (nilai akhir)
  - Rank per halaqah
- Hari kerja didefinisikan sebagai Senin–Jumat dikurangi hari libur yang terdaftar di sistem
- Pekan Syahrul Quran ditandai ★, Pekan Murajaah ditandai khusus

---

### F-12 · Nilai Akhir Semester (Otomatis)
- Dihitung otomatis oleh sistem saat seluruh komponen sudah terisi
- Formula default: Setoran Harian 40% + UAS 40% + Akhlaq 10% + Kehadiran 10%
- Bobot formula dapat dikonfigurasi oleh Staff TU
- Dalam komponen Setoran Harian: Nilai rata-rata harian (Sabak & Sabki) bobot 60% + Nilai total Manzil bobot 40%
- Cara hitung Sabak & Sabki: Persentase rata-rata per hari efektif dari gabungan capaian baris harian dibagi target hariannya.
- Cara hitung Manzil: `(total baris aktual Manzil semester ÷ total baris target Manzil semester) × 100`, maksimal 100
- Nilai Kehadiran: `((total hari efektif - jumlah hari Alpha) ÷ total hari efektif) × 100`
- Hasil akhir dibulatkan ke 1 angka desimal

---

### F-13 · Pesan Pengampu–Orang Tua
- Komunikasi dua arah antara Pengampu dan Orang Tua per santri
- Hanya mendukung teks, tidak ada lampiran file atau foto

---

### F-14 · Pengumuman
- Koordinator atau TU membuat pengumuman yang ditujukan ke role tertentu
- Pengumuman muncul sebagai popup saat pengguna login
- Popup langsung tertutup saat diklik, tidak muncul lagi setelahnya

---

### F-15 · Berita Halaman Login
- Hanya Staff TU yang dapat membuat dan mengedit berita
- Berita ditampilkan di halaman login (dapat dilihat sebelum login)
- Format teks saja, tidak ada gambar atau foto

---

### F-16 · Audit Trail
- Sistem mencatat aktivitas kritis: login, hapus data, dan approve UKJ
- Hanya Staff TU yang dapat melihat audit trail
- Data audit trail tidak dapat dihapus secara manual
- Auto-delete otomatis setiap 3 bulan, dengan opsi hapus manual oleh TU

---

### F-17 · Manajemen Sistem (Staff TU)
- CRUD akun untuk semua role
- CRUD data santri dan pengelompokan ke halaqah
- CRUD halaqah beserta pengampu yang bertanggung jawab
- Konfigurasi tanggal semester (ganjil dan genap)
- Konfigurasi bobot nilai akhir semester
- Konfigurasi hari libur

---

### F-18 · Grade Santri (Marhalah)
- 3 grade tersedia: Tahsin, Takmil, dan Tahfiz
- Target baris harian per grade dikonfigurasi oleh Koordinator atau Staff TU secara global
- Grade Tahsin memiliki target berupa range minimum dan maksimum (misal: 7-10 baris), dikonfigurasi secara terpusat untuk semua halaqah
- Kenaikan grade santri dilakukan manual oleh Koordinator
- Grade tidak terkait dengan kelas (7/8/9), bersifat independen

---


---

## Out-of-Scope Features

### OS-01 · Fitur yang Pernah Dipertimbangkan tapi Dihapus
- Tanda tangan digital untuk validasi Manzil — dihapus, validasi cukup dengan input baris oleh orang tua
- Flag atau notifikasi otomatis santri Stagnant — dihapus, tidak urgent dan membebani sistem
- Fitur forgot password — reset password hanya bisa dilakukan oleh Staff TU

---

### OS-02 · Akademik di Luar Program Tahfiz
- Nilai mata pelajaran reguler (Matematika, Bahasa Indonesia, dll.)
- Absensi kelas reguler di luar halaqah tahfiz
- Jadwal pelajaran atau kurikulum umum
- Rapor akademik umum sekolah

---

### OS-03 · Administrasi Sekolah Umum
- Pendaftaran siswa baru (PPDB)
- Pengelolaan keuangan, SPP, atau pembayaran apapun
- Penggajian atau manajemen kepegawaian
- Inventaris atau aset sekolah

---

### OS-04 · Integrasi Sistem Eksternal
- Integrasi dengan Dapodik
- Integrasi dengan EMIS Kemenag
- Integrasi dengan payment gateway apapun
- Integrasi dengan WhatsApp, email, atau SMS untuk notifikasi — notifikasi hanya in-app

---

### OS-05 · Aplikasi Mobile Native
- Aplikasi Android (APK)
- Aplikasi iOS
- Sistem hanya diakses via browser, dioptimalkan mobile-first

---

### OS-06 · Fitur Komunikasi Lanjutan
- Lampiran foto atau file di fitur pesan
- Group chat atau forum diskusi
- Video call atau voice note

---

### OS-07 · Fitur AI atau Analitik Lanjutan
- Prediksi perkembangan hafalan santri
- Rekomendasi otomatis kenaikan grade
- Analitik data historis lintas tahun ajaran

---

---

## Business Rules

### BR-01 · Autentikasi & Akun

- Role TU, Koordinator, Pengampu, dan Kepsek wajib login menggunakan email
- Role Orang Tua/Wali wajib login menggunakan nomor HP
- Reset password hanya boleh dilakukan oleh Staff TU, tidak ada fitur forgot password mandiri
- Satu akun Orang Tua dapat terhubung ke lebih dari satu santri
- Seluruh akun (semua role) hanya boleh dibuat, diubah, dan dihapus oleh Staff TU

---

### BR-02 · Setoran Harian

- Sabak dan Sabki hanya boleh diinput oleh Pengampu, tidak ada role lain yang bisa input
- Manzil hanya boleh diinput oleh Orang Tua, Pengampu tidak boleh input Manzil
- Satuan input setoran wajib dalam baris, disertai keterangan halaman awal dan halaman akhir
- Sistem wajib mencegah duplikasi: tidak boleh ada dua setoran dengan jenis yang sama untuk santri yang sama pada hari yang sama
- Sistem wajib menentukan status lulus atau mengulang berdasarkan jumlah kesalahan saat setoran
- Saat periode Syahrul Quran aktif, kolom input Sabki dan Manzil wajib disembunyikan dari antarmuka sepenuhnya — tidak hanya disabled tapi benar-benar tidak muncul

---

### BR-03 · Tikrar

- Tikrar dibuat otomatis oleh sistem saat santri melebihi batas kesalahan yang ditentukan saat setoran
- Alur status Tikrar bersifat linear dan satu arah: `wajib_sekolah` → `selesai_sekolah` → `wajib_rumah` → `selesai_rumah`
- Tidak boleh ada perpindahan status yang melompat atau mundur
- Pengampu adalah satu-satunya yang berwenang menandai `selesai_sekolah` atau mengalihkan ke `wajib_rumah`
- Orang Tua adalah satu-satunya yang berwenang menandai `selesai_rumah`
- Sistem wajib mencegah duplikasi Tikrar: tidak boleh ada Tikrar baru dengan kombinasi santri + tanggal + surah yang sama jika sudah ada Tikrar aktif

---

### BR-04 · UKJ (Ujian Kenaikan Juz)

- Pengampu wajib mengisi nilai (skala 0–100) dan status lulus atau mengulang saat input UKJ
- Setiap UKJ yang diinput pengampu wajib melalui approval koordinator sebelum dianggap sah
- UKJ yang sudah di-approve koordinator tidak boleh diubah oleh pengampu
- Jika koordinator menolak UKJ, santri harus ujian ulang dan pengampu boleh input data UKJ baru
- Record UKJ yang ditolak wajib tetap tersimpan sebagai riwayat, tidak boleh dihapus

---

### BR-05 · UAS (Ujian Akhir Semester)

- Pengampu memilih juz yang diujikan per individu santri
- Jumlah maksimal juz yang diujikan dibatasi secara statis maksimal 3 juz (opsi 1, 2, atau 3 juz)
- Jika jumlah hafalan santri kurang dari atau sama dengan batas pilihan juz tersebut, seluruh hafalan wajib diujikan tanpa pengecualian
- Pengampu input nilai per juz dengan skala 0–100
- Nilai akhir UAS dihitung otomatis sebagai rata-rata aritmatika dari seluruh nilai per juz
- Nilai akhir UAS hanya bisa dihitung jika seluruh juz yang dipilih sudah memiliki nilai — jika ada satu juz yang kosong maka nilai akhir UAS belum terhitung
- UAS tidak memerlukan approval koordinator

---

### BR-06 · Absensi

- Model absensi bersifat exception-based: tidak adanya record absensi untuk santri pada hari tertentu berarti santri tersebut hadir
- Sistem tidak boleh menyimpan record absensi dengan status `hadir`
- Pengampu hanya mencatat ketidakhadiran dengan tiga status yang tersedia: Alpha, Sakit, atau Izin
- Hanya status Alpha yang memicu notifikasi in-app otomatis ke akun Orang Tua
- Status Sakit dan Izin tidak memicu notifikasi apapun
- Jika santri tidak memiliki akun Orang Tua, penyimpanan absensi tetap berhasil tanpa error — kegagalan notifikasi tidak boleh membatalkan penyimpanan absensi

---

### BR-07 · Penilaian Akhlaq

- Pengampu input satu nilai tunggal (skala 0–100) per santri per semester
- Fitur akhlaq hanya aktif jika diaktifkan oleh Koordinator — jika nonaktif, kolom akhlaq tidak muncul di antarmuka manapun

---

### BR-08 · Periode Syahrul Quran

- Hanya Koordinator yang berwenang menetapkan tanggal mulai dan selesai Syahrul Quran
- Selama periode aktif, hanya Sabak yang dapat diinput — Sabki dan Manzil wajib tidak dapat diinput
- Target baris harian per grade selama Syahrul Quran menggunakan target yang sama dengan target normal
- Target Manzil tidak dihitung dalam komponen nilai selama periode Syahrul Quran
- Pekan yang masuk dalam periode Syahrul Quran wajib ditandai simbol ★ di rekap Excel

---

### BR-09 · Pekan Murajaah

- Hanya Koordinator yang berwenang mengaktifkan Pekan Murajaah dengan menentukan tanggal mulai dan selesai
- Koordinator wajib menginformasikan target harian ke masing-masing Pengampu secara manual
- Pengampu input target harian secara manual berdasarkan informasi dari Koordinator
- Panduan target yang digunakan: hafalan lebih dari 3 juz maka 2 lembar per hari; hafalan kurang dari atau sama dengan 3 juz maka total hafalan dibagi 15 hari
- Setoran selama Pekan Murajaah masuk hitungan nilai akhir semester seperti setoran biasa
- Pekan Murajaah wajib ditandai khusus di rekap Excel

---

### BR-10 · Grade Santri (Marhalah)

- Tiga grade tersedia: Tahsin, Takmil, dan Tahfiz
- Target baris harian per grade dikonfigurasi oleh Koordinator atau Staff TU dan dapat diubah sewaktu-waktu
- Grade Tahsin menggunakan target berupa range minimum dan maksimum, dikonfigurasi secara global dan terpusat untuk semua halaqah
- Kenaikan atau penurunan grade santri hanya boleh dilakukan manual oleh Koordinator
- Grade bersifat independen dari kelas (7/8/9) — santri kelas 9 bisa saja masih di grade Tahsin

---

### BR-11 · Nilai Akhir Semester

- Nilai akhir dihitung otomatis oleh sistem saat seluruh komponen sudah terisi — tidak ada tombol hitung manual
- Formula default: Setoran Harian 40% + UAS 40% + Akhlaq 10% + Kehadiran 10%
- Bobot formula dapat dikonfigurasi oleh Staff TU jika ada perubahan kebijakan
- Dalam komponen Setoran Harian: Nilai rata-rata harian (Sabak & Sabki) bobot 60% + Nilai total Manzil bobot 40%
- Cara hitung Sabak & Sabki: Persentase rata-rata ketercapaian per hari secara proporsional.
- Cara hitung Manzil: `(total baris aktual Manzil semester ÷ total baris target Manzil semester) × 100`, nilai maksimal di-cap di 100
- Cara hitung nilai kehadiran: `((total hari efektif - jumlah hari Alpha) ÷ total hari efektif) × 100`
- Hanya Alpha yang mengurangi nilai kehadiran — Sakit dan Izin tidak berpengaruh
- Nilai akhir dibulatkan ke 1 angka desimal

---

### BR-12 · Rekap Semester (Excel)

- Hari kerja didefinisikan sebagai Senin sampai Jumat dikurangi tanggal yang terdaftar sebagai hari libur di sistem
- Sabtu dan Ahad selalu dianggap bukan hari kerja
- Pekan dimulai dari Senin dan berakhir di Jumat
- Isi tiap sel setoran adalah total baris yang disetorkan selama satu pekan, bukan rata-rata harian
- Rekap wajib dikelompokkan berdasarkan halaqah, menampilkan nama pengampu dan grade halaqah
- Rank dihitung per halaqah, bukan antar semua santri lintas halaqah

---

### BR-13 · Komunikasi & Pengumuman

- Pesan antara Pengampu dan Orang Tua bersifat dua arah — keduanya bisa membalas
- Pesan hanya mendukung format teks, tidak ada lampiran foto atau file
- Pesan terikat per santri — percakapan antara pengampu dan orang tua dari santri A terpisah dari santri B meskipun orang tuanya sama
- Pengumuman muncul sebagai popup saat pengguna login pertama kali setelah pengumuman diterbitkan
- Popup pengumuman langsung tertutup saat diklik dan tidak muncul lagi setelahnya

---

### BR-14 · Audit Trail

- Sistem wajib mencatat aktivitas kritis berikut: login, hapus data, dan approve atau reject UKJ
- Audit trail bersifat append-only — tidak boleh ada mekanisme edit atau hapus manual oleh siapapun
- Auto-delete otomatis berjalan setiap 3 bulan sejak tanggal pencatatan
- Staff TU dapat memicu penghapusan manual sebelum jadwal auto-delete jika diperlukan
- Hanya Staff TU yang dapat melihat audit trail

---

