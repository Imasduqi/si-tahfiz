
## UC-033: Download Rekap Excel

**Aktor:** Kepala Sekolah

**Pre-condition:**
- Kepsek sudah login
- Konfigurasi tanggal semester sudah diisi oleh TU
- Sudah ada data setoran di sistem

**Main Flow:**
1. Kepsek membuka `/kepsek/rekap`
2. Sistem menampilkan form filter dengan pilihan semester (Ganjil/Genap) dan tahun ajaran
3. Kepsek memilih semester dan tahun ajaran lalu menekan tombol "Generate Rekap"
4. Sistem memproses data setoran, nilai, dan kehadiran seluruh santri
5. Sistem menghasilkan file Excel dengan struktur per halaqah
6. Browser otomatis mengunduh file Excel

**Alternative/Exception Flow:**
- Jika filter semester atau tahun ajaran belum dipilih → sistem menampilkan pesan error "Pilih semester dan tahun ajaran terlebih dahulu"
- Jika tidak ada data untuk semester yang dipilih → sistem menampilkan pesan "Tidak ada data untuk semester ini"
- Jika proses generate gagal → sistem menampilkan error state dengan tombol "Coba Lagi"

**Post-condition:**
- File Excel terunduh di perangkat Kepsek
- File dikelompokkan per halaqah dengan kolom lengkap sesuai format rekap semester

---

