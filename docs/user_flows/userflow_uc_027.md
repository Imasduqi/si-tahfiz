

## UC-027: Kelola Pekan Murajaah

**Aktor:** Koordinator

**Pre-condition:**
- Koordinator sudah login
- Berada di halaman `/koordinator/kelola/pekan-murajaah`

**Main Flow — Aktifkan Periode:**
1. Koordinator membuka `/koordinator/kelola/pekan-murajaah`
2. Sistem menampilkan status Pekan Murajaah saat ini dan riwayat periode sebelumnya
3. Koordinator menekan tombol "Tetapkan Periode Baru"
4. Sistem menampilkan modal form dengan field: tanggal mulai dan tanggal selesai
5. Koordinator mengisi tanggal lalu menekan "Simpan"
6. Sistem menyimpan periode Pekan Murajaah ke database
7. Sistem menampilkan toast sukses "Pekan Murajaah berhasil ditetapkan"
8. Koordinator menginformasikan target harian ke masing-masing pengampu secara manual di luar sistem
9. Pengampu kemudian menginput target harian santri secara manual di sistem

**Main Flow — Akhiri Periode Lebih Awal:**
1. Koordinator menekan tombol "Akhiri Periode Sekarang"
2. Sistem menampilkan konfirmasi "Pekan Murajaah akan diakhiri sekarang. Lanjutkan?"
3. Koordinator menekan "Ya, Akhiri"
4. Sistem memperbarui tanggal selesai menjadi hari ini
5. Sistem menampilkan toast sukses "Pekan Murajaah telah diakhiri"

**Alternative/Exception Flow:**
- Jika tanggal selesai lebih awal dari tanggal mulai → sistem menampilkan pesan error "Tanggal selesai tidak boleh lebih awal dari tanggal mulai"
- Jika sudah ada Pekan Murajaah aktif → sistem menampilkan pesan error "Sudah ada Pekan Murajaah yang aktif, akhiri periode ini terlebih dahulu"
- Jika koordinator menekan "Batal" → modal tertutup, tidak ada perubahan

**Post-condition:**
- Periode Pekan Murajaah tersimpan di database
- Setoran selama periode ini masuk ke kalkulasi nilai akhir semester seperti biasa
- Pekan Murajaah ditandai khusus di rekap Excel

---
