

## UC-030: Download Rekap Excel

**Aktor:** Koordinator

**Pre-condition:**
- Koordinator sudah login
- Berada di halaman `/koordinator/rekap`
- Konfigurasi tanggal semester sudah diisi oleh TU
- Sudah ada data setoran di sistem

**Main Flow:**
1. Koordinator membuka `/koordinator/rekap`
2. Sistem menampilkan form filter dengan pilihan semester (Ganjil/Genap) dan tahun ajaran
3. Koordinator memilih semester dan tahun ajaran lalu menekan tombol "Generate Rekap"
4. Sistem memproses seluruh data setoran, nilai, kehadiran, dan akhlaq semua santri
5. Sistem menghasilkan file Excel dengan struktur:
   - Dikelompokkan per halaqah (nama pengampu dan grade halaqah)
   - Kolom: No + Nama Lengkap + Kelas, per bulan (Pekan 1-5 × Sabak/Sabki/Manzil + baris tidak tercapai + total bulan), total semester, total hari efektif, nilai setoran harian (40%), nilai UAS (40%), nilai akhlaq (10%), nilai kehadiran (10%), nilai raport, rank per halaqah
   - Pekan Syahrul Quran ditandai ★
   - Pekan Murajaah ditandai khusus
6. Browser otomatis mengunduh file Excel

**Alternative/Exception Flow:**
- Jika filter semester atau tahun ajaran belum dipilih → sistem menampilkan pesan error "Pilih semester dan tahun ajaran terlebih dahulu"
- Jika tidak ada data untuk semester yang dipilih → sistem menampilkan pesan "Tidak ada data untuk semester ini"
- Jika proses generate gagal → sistem menampilkan error state dengan tombol "Coba Lagi"

**Post-condition:**
- File Excel terunduh di perangkat Koordinator
- File berisi rekap lengkap seluruh santri dikelompokkan per halaqah

---
