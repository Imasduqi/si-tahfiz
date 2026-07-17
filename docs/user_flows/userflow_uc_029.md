
## UC-029: Buat & Kelola Pengumuman

**Aktor:** Koordinator

**Pre-condition:**
- Koordinator sudah login
- Berada di halaman `/koordinator/pengumuman`

**Main Flow — Buat Pengumuman:**
1. Koordinator membuka `/koordinator/pengumuman`
2. Sistem menampilkan daftar pengumuman yang sudah dibuat
3. Koordinator menekan tombol "Buat Pengumuman"
4. Sistem menampilkan modal form dengan field: judul, isi pengumuman, dan target role penerima (bisa pilih satu atau lebih role)
5. Koordinator mengisi field lalu menekan "Simpan"
6. Sistem menyimpan pengumuman ke database
7. Sistem menampilkan toast sukses "Pengumuman berhasil dibuat"
8. Pengumuman akan muncul sebagai popup saat pengguna dengan role yang dipilih login berikutnya

**Main Flow — Hapus Pengumuman:**
1. Koordinator menekan tombol "Hapus" pada pengumuman yang dipilih
2. Sistem menampilkan konfirmasi "Apakah kamu yakin ingin menghapus pengumuman ini?"
3. Koordinator menekan "Ya, Hapus"
4. Sistem menghapus pengumuman dari database
5. Sistem menampilkan toast sukses "Pengumuman berhasil dihapus"

**Alternative/Exception Flow:**
- Jika field judul atau isi kosong → sistem menampilkan pesan error "Field ini wajib diisi"
- Jika tidak ada role yang dipilih sebagai target → sistem menampilkan pesan error "Pilih minimal satu role penerima"
- Jika koordinator menekan "Batal" → modal tertutup, tidak ada perubahan

**Post-condition:**
- Pengumuman tersimpan di database
- Pengguna dengan role yang dipilih akan melihat popup pengumuman saat login berikutnya
- Popup tertutup saat diklik dan tidak muncul lagi setelahnya

---
