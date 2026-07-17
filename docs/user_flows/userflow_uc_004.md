---

## UC-004: CRUD Akun Pengguna

**Aktor:** Staff TU

**Pre-condition:**
- Staff TU sudah login
- Berada di halaman `/tu/akun`

**Main Flow — Create:**
1. Staff TU menekan tombol "Tambah Akun"
2. Sistem menampilkan modal form dengan field: nama lengkap, role, email (jika bukan Orang Tua), nomor HP (jika Orang Tua), dan password awal
3. Staff TU mengisi seluruh field lalu menekan "Simpan"
4. Sistem membuat akun di Supabase Auth dan menyimpan data ke database
5. Sistem menampilkan toast sukses "Akun berhasil dibuat"
6. Akun baru muncul di daftar

**Main Flow — Read:**
1. Sistem menampilkan daftar seluruh akun pengguna dalam tabel
2. Staff TU dapat filter berdasarkan role atau mencari berdasarkan nama

**Main Flow — Update:**
1. Staff TU menekan tombol "Edit" pada akun yang dipilih
2. Sistem menampilkan modal form dengan data akun yang sudah terisi
3. Staff TU mengubah data yang perlu diubah lalu menekan "Simpan"
4. Sistem memperbarui data di database
5. Sistem menampilkan toast sukses "Akun berhasil diperbarui"

**Main Flow — Reset Password:**
1. Staff TU menekan tombol "Reset Password" pada akun yang dipilih
2. Sistem menampilkan modal konfirmasi dengan field password baru
3. Staff TU mengisi password baru lalu menekan "Simpan"
4. Sistem memperbarui password di Supabase Auth
5. Sistem menampilkan toast sukses "Password berhasil direset"

**Main Flow — Delete:**
1. Staff TU menekan tombol "Hapus" pada akun yang dipilih
2. Sistem menampilkan konfirmasi "Apakah kamu yakin ingin menghapus akun ini?"
3. Staff TU menekan "Ya, Hapus"
4. Sistem menghapus akun dari Supabase Auth dan database
5. Sistem menampilkan toast sukses "Akun berhasil dihapus"
6. Akun hilang dari daftar

**Alternative/Exception Flow:**
- Jika email sudah terdaftar → sistem menampilkan pesan error "Email sudah digunakan"
- Jika nomor HP sudah terdaftar → sistem menampilkan pesan error "Nomor HP sudah digunakan"
- Jika field wajib kosong → sistem menampilkan pesan error di bawah field yang kosong
- Jika Staff TU menekan "Batal" di modal manapun → modal tertutup, tidak ada perubahan

**Post-condition:**
- Data akun tersimpan di database
- Aktivitas hapus akun tercatat di audit trail

---
