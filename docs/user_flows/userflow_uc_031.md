
## UC-031: Aktifkan / Nonaktifkan Fitur Akhlaq

**Aktor:** Koordinator

**Pre-condition:**
- Koordinator sudah login
- Berada di halaman `/koordinator/beranda` atau menu pengaturan koordinator

**Main Flow — Aktifkan:**
1. Koordinator menemukan toggle "Fitur Penilaian Akhlaq"
2. Koordinator menekan toggle untuk mengaktifkan
3. Sistem menampilkan konfirmasi "Fitur penilaian akhlaq akan diaktifkan. Pengampu dapat mulai menginput nilai akhlaq. Lanjutkan?"
4. Koordinator menekan "Ya, Aktifkan"
5. Sistem mengaktifkan fitur akhlaq di database
6. Sistem menampilkan toast sukses "Fitur akhlaq berhasil diaktifkan"
7. Menu Akhlaq muncul di halaman Lainnya pengampu

**Main Flow — Nonaktifkan:**
1. Koordinator menekan toggle "Fitur Penilaian Akhlaq" yang sedang aktif
2. Sistem menampilkan konfirmasi "Fitur penilaian akhlaq akan dinonaktifkan. Menu akhlaq tidak akan muncul di halaman pengampu. Lanjutkan?"
3. Koordinator menekan "Ya, Nonaktifkan"
4. Sistem menonaktifkan fitur akhlaq di database
5. Sistem menampilkan toast sukses "Fitur akhlaq berhasil dinonaktifkan"
6. Menu Akhlaq hilang dari halaman Lainnya pengampu

**Alternative/Exception Flow:**
- Jika koordinator menekan "Batal" di konfirmasi → tidak ada perubahan, toggle kembali ke posisi semula
- Jika koneksi gagal → sistem menampilkan error state dan toggle kembali ke posisi semula

**Post-condition:**
- Status fitur akhlaq tersimpan di database
- Jika dinonaktifkan, menu akhlaq tidak muncul di antarmuka pengampu manapun
- Data nilai akhlaq yang sudah diinput sebelumnya tetap tersimpan meski fitur dinonaktifkan

---

