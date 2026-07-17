

## UC-005: CRUD Data Santri

**Aktor:** Staff TU

**Pre-condition:**
- Staff TU sudah login
- Berada di halaman `/tu/data/santri`
- Halaqah sudah dibuat sebelumnya (untuk assign santri ke halaqah)

**Main Flow — Create:**
1. Staff TU menekan tombol "Tambah Santri"
2. Sistem menampilkan modal form dengan field: nama lengkap, kelas, grade (Tahsin/Takmil/Tahfiz), halaqah, dan akun Orang Tua (opsional)
3. Staff TU mengisi field lalu menekan "Simpan"
4. Sistem menyimpan data santri ke database
5. Sistem menampilkan toast sukses "Data santri berhasil ditambahkan"

**Main Flow — Read:**
1. Sistem menampilkan daftar seluruh santri dalam tabel
2. Staff TU dapat filter berdasarkan halaqah, kelas, atau grade

**Main Flow — Update:**
1. Staff TU menekan tombol "Edit" pada santri yang dipilih
2. Sistem menampilkan modal form dengan data santri yang sudah terisi
3. Staff TU mengubah data lalu menekan "Simpan"
4. Sistem memperbarui data di database
5. Sistem menampilkan toast sukses "Data santri berhasil diperbarui"

**Main Flow — Delete:**
1. Staff TU menekan tombol "Hapus" pada santri yang dipilih
2. Sistem menampilkan konfirmasi "Apakah kamu yakin ingin menghapus data santri ini?"
3. Staff TU menekan "Ya, Hapus"
4. Sistem menghapus data santri dari database
5. Sistem menampilkan toast sukses "Data santri berhasil dihapus"

**Alternative/Exception Flow:**
- Jika field nama kosong → sistem menampilkan pesan error "Nama wajib diisi"
- Jika belum ada halaqah yang tersedia → sistem menampilkan pesan error "Buat halaqah terlebih dahulu"
- Jika Staff TU menekan "Batal" → modal tertutup, tidak ada perubahan

**Post-condition:**
- Data santri tersimpan di database
- Santri muncul di halaqah yang dipilih
- Aktivitas hapus santri tercatat di audit trail

---
