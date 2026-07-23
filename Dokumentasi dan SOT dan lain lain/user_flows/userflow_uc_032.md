
## UC-032: Lihat Dashboard Statistik

**Aktor:** Kepala Sekolah

**Pre-condition:**
- Kepsek sudah login
- Sudah ada data santri, setoran, dan halaqah di sistem

**Main Flow:**
1. Kepsek membuka `/kepsek/dashboard`
2. Sistem mengambil data statistik dari database
3. Sistem menampilkan dashboard berisi:
   - Total santri aktif
   - Jumlah halaqah dan pengampu
   - Grafik perkembangan setoran per bulan
   - Rekap nilai rata-rata per halaqah
   - Statistik kehadiran keseluruhan

**Alternative/Exception Flow:**
- Jika data belum ada atau semester belum dikonfigurasi TU → sistem menampilkan empty state dengan pesan "Data belum tersedia"
- Jika gagal mengambil data dari server → sistem menampilkan error state dengan tombol "Coba Lagi"

**Post-condition:**
- Kepsek dapat melihat statistik program tahfiz secara keseluruhan
- Tidak ada aksi input yang dapat dilakukan di halaman ini

---
