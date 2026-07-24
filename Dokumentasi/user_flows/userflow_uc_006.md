
## UC-006: CRUD Halaqah

**Aktor:** Staff TU

**Pre-condition:**
- Staff TU sudah login
- Berada di halaman `/tu/data/halaqah`
- Akun Pengampu sudah dibuat sebelumnya

**Main Flow — Create:**
1. Staff TU menekan tombol "Tambah Halaqah"
2. Sistem menampilkan modal form dengan field: nama halaqah, grade halaqah (Tahsin/Takmil/Tahfiz), dan pengampu yang bertanggung jawab
3. Staff TU mengisi field lalu menekan "Simpan"
4. Sistem menyimpan data halaqah ke database
5. Sistem menampilkan toast sukses "Halaqah berhasil dibuat"

**Main Flow — Read:**
1. Sistem menampilkan daftar seluruh halaqah dalam tabel beserta nama pengampu dan jumlah santri

**Main Flow — Update:**
1. Staff TU menekan tombol "Edit" pada halaqah yang dipilih
2. Sistem menampilkan modal form dengan data yang sudah terisi
3. Staff TU mengubah data lalu menekan "Simpan"
4. Sistem memperbarui data di database
5. Sistem menampilkan toast sukses "Halaqah berhasil diperbarui"

**Main Flow — Delete:**
1. Staff TU menekan tombol "Hapus" pada halaqah yang dipilih
2. Sistem menampilkan konfirmasi "Apakah kamu yakin ingin menghapus halaqah ini?"
3. Staff TU menekan "Ya, Hapus"
4. Sistem menghapus data halaqah dari database
5. Sistem menampilkan toast sukses "Halaqah berhasil dihapus"

**Alternative/Exception Flow:**
- Jika halaqah masih memiliki santri aktif → sistem menampilkan pesan error "Halaqah tidak dapat dihapus karena masih memiliki santri aktif"
- Jika belum ada akun Pengampu → sistem menampilkan pesan error "Buat akun pengampu terlebih dahulu"
- Jika Staff TU menekan "Batal" → modal tertutup, tidak ada perubahan

**Post-condition:**
- Data halaqah tersimpan di database
- Pengampu yang ditugaskan dapat mengakses halaqah tersebut
- Aktivitas hapus halaqah tercatat di audit trail

---
