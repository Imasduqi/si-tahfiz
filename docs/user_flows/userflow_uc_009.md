
## UC-009: Konfigurasi Hari Libur

**Aktor:** Staff TU

**Pre-condition:**
- Staff TU sudah login
- Berada di halaman `/tu/konfigurasi`

**Main Flow — Tambah Hari Libur:**
1. Staff TU menekan tombol "Tambah Hari Libur"
2. Sistem menampilkan modal form dengan field: tanggal dan keterangan (nama hari libur)
3. Staff TU mengisi field lalu menekan "Simpan"
4. Sistem menyimpan hari libur ke database
5. Sistem menampilkan toast sukses "Hari libur berhasil ditambahkan"
6. Tanggal tersebut tidak akan dihitung sebagai hari kerja efektif di rekap semester

**Main Flow — Hapus Hari Libur:**
1. Staff TU menekan tombol "Hapus" pada hari libur yang dipilih
2. Sistem menampilkan konfirmasi penghapusan
3. Staff TU menekan "Ya, Hapus"
4. Sistem menghapus hari libur dari database
5. Sistem menampilkan toast sukses "Hari libur berhasil dihapus"

**Alternative/Exception Flow:**
- Jika tanggal yang ditambahkan sudah ada di daftar hari libur → sistem menampilkan pesan error "Tanggal ini sudah terdaftar sebagai hari libur"
- Jika field tanggal kosong → sistem menampilkan pesan error "Tanggal wajib diisi"

**Post-condition:**
- Hari libur tersimpan di database
- Rekap semester mengecualikan tanggal tersebut dari hari kerja efektif

---
