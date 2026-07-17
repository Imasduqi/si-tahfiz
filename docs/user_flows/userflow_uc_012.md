
## UC-012: Aktifkan/Nonaktifkan Maintenance Mode

**Aktor:** Staff TU

**Pre-condition:**
- Staff TU sudah login
- Berada di halaman `/tu/konfigurasi`

**Main Flow — Aktifkan:**
1. Staff TU menekan toggle "Maintenance Mode"
2. Sistem menampilkan konfirmasi "Seluruh pengguna selain TU akan di-redirect ke halaman maintenance. Lanjutkan?"
3. Staff TU menekan "Ya, Aktifkan"
4. Sistem mengaktifkan maintenance mode di database
5. Sistem menampilkan toast sukses "Maintenance mode aktif"
6. Seluruh pengguna yang sedang login dengan role selain TU di-redirect ke `/maintenance`

**Main Flow — Nonaktifkan:**
1. Staff TU menekan toggle "Maintenance Mode" yang sedang aktif
2. Sistem menampilkan konfirmasi "Maintenance mode akan dinonaktifkan. Pengguna dapat kembali mengakses sistem. Lanjutkan?"
3. Staff TU menekan "Ya, Nonaktifkan"
4. Sistem menonaktifkan maintenance mode di database
5. Sistem menampilkan toast sukses "Maintenance mode nonaktif"
6. Seluruh pengguna dapat kembali mengakses sistem

**Alternative/Exception Flow:**
- Jika Staff TU menekan "Batal" di konfirmasi → tidak ada perubahan, toggle kembali ke posisi semula
- Jika koneksi gagal saat mengubah status → sistem menampilkan error state dan toggle kembali ke posisi semula

**Post-condition:**
- Status maintenance mode tersimpan di database
- Seluruh role selain TU tidak dapat mengakses halaman manapun selama maintenance aktif

---
