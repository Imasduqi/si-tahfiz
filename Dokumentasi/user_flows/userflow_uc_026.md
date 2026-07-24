

## UC-026: Kelola Periode Syahrul Quran

**Aktor:** Koordinator

**Pre-condition:**
- Koordinator sudah login
- Berada di halaman `/koordinator/kelola/syahrul-quran`
- Konfigurasi tanggal semester sudah diisi oleh TU

**Main Flow — Aktifkan Periode:**
1. Koordinator membuka `/koordinator/kelola/syahrul-quran`
2. Sistem menampilkan status periode Syahrul Quran saat ini (aktif/tidak aktif) dan riwayat periode sebelumnya
3. Koordinator menekan tombol "Tetapkan Periode Baru"
4. Sistem menampilkan modal form dengan field: tanggal mulai dan tanggal selesai
5. Koordinator mengisi tanggal lalu menekan "Simpan"
6. Sistem menyimpan periode Syahrul Quran ke database
7. Sistem menampilkan toast sukses "Periode Syahrul Quran berhasil ditetapkan"
8. Selama periode aktif, seluruh antarmuka input Sabki dan Manzil disembunyikan dari pengampu dan orang tua

**Main Flow — Akhiri Periode Lebih Awal:**
1. Koordinator menekan tombol "Akhiri Periode Sekarang"
2. Sistem menampilkan konfirmasi "Periode Syahrul Quran akan diakhiri sekarang. Lanjutkan?"
3. Koordinator menekan "Ya, Akhiri"
4. Sistem memperbarui tanggal selesai menjadi hari ini
5. Sistem menampilkan toast sukses "Periode Syahrul Quran telah diakhiri"
6. Kolom input Sabki dan Manzil kembali muncul di antarmuka pengampu dan orang tua

**Alternative/Exception Flow:**
- Jika tanggal selesai lebih awal dari tanggal mulai → sistem menampilkan pesan error "Tanggal selesai tidak boleh lebih awal dari tanggal mulai"
- Jika sudah ada periode aktif saat koordinator mencoba membuat periode baru → sistem menampilkan pesan error "Sudah ada periode Syahrul Quran yang aktif, akhiri periode ini terlebih dahulu"
- Jika koordinator menekan "Batal" → modal tertutup, tidak ada perubahan

**Post-condition:**
- Periode Syahrul Quran tersimpan di database
- Selama periode aktif, kolom Sabki dan Manzil tidak muncul di antarmuka manapun
- Pekan yang masuk periode ini ditandai ★ di rekap Excel

---
