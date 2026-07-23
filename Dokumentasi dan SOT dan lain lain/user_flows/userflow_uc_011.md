
## UC-011: Kelola Berita Halaman Login

**Aktor:** Staff TU

**Pre-condition:**
- Staff TU sudah login
- Berada di halaman `/tu/sistem/berita`

**Main Flow — Create:**
1. Staff TU menekan tombol "Tambah Berita"
2. Sistem menampilkan modal form dengan field: judul dan isi berita (teks saja)
3. Staff TU mengisi field lalu menekan "Simpan"
4. Sistem menyimpan berita ke database
5. Sistem menampilkan toast sukses "Berita berhasil ditambahkan"
6. Berita langsung tampil di halaman login

**Main Flow — Update:**
1. Staff TU menekan tombol "Edit" pada berita yang dipilih
2. Sistem menampilkan modal form dengan data berita yang sudah terisi
3. Staff TU mengubah konten lalu menekan "Simpan"
4. Sistem memperbarui berita di database
5. Sistem menampilkan toast sukses "Berita berhasil diperbarui"

**Main Flow — Delete:**
1. Staff TU menekan tombol "Hapus" pada berita yang dipilih
2. Sistem menampilkan konfirmasi penghapusan
3. Staff TU menekan "Ya, Hapus"
4. Sistem menghapus berita dari database
5. Sistem menampilkan toast sukses "Berita berhasil dihapus"
6. Berita tidak lagi tampil di halaman login

**Alternative/Exception Flow:**
- Jika field judul atau isi kosong → sistem menampilkan pesan error "Field ini wajib diisi"
- Jika Staff TU menekan "Batal" → modal tertutup, tidak ada perubahan

**Post-condition:**
- Berita tersimpan di database dan tampil di halaman `/login` tanpa perlu login

---
