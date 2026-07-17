
## UC-010: Kelola Audit Trail

**Aktor:** Staff TU

**Pre-condition:**
- Staff TU sudah login
- Berada di halaman `/tu/sistem/audit`

**Main Flow — Lihat Audit Trail:**
1. Sistem menampilkan daftar seluruh aktivitas kritis dalam tabel: waktu, aktor, role, jenis aktivitas, dan detail
2. Staff TU dapat filter berdasarkan rentang tanggal, role, atau jenis aktivitas
3. Staff TU dapat mencari berdasarkan nama aktor

**Main Flow — Hapus Manual:**
1. Staff TU menekan tombol "Hapus Data Lama"
2. Sistem menampilkan konfirmasi "Data audit trail lebih dari 3 bulan akan dihapus permanen. Lanjutkan?"
3. Staff TU menekan "Ya, Hapus"
4. Sistem menghapus seluruh record audit trail yang berusia lebih dari 3 bulan
5. Sistem menampilkan toast sukses "Data audit trail lama berhasil dihapus"

**Main Flow — Auto Delete:**
- Sistem secara otomatis menghapus record audit trail yang berusia lebih dari 3 bulan setiap hari tanpa perlu tindakan manual

**Alternative/Exception Flow:**
- Jika tidak ada data yang berusia lebih dari 3 bulan saat hapus manual → sistem menampilkan pesan "Tidak ada data lama yang perlu dihapus"
- Jika gagal memuat data → sistem menampilkan error state dengan tombol "Coba Lagi"

**Post-condition:**
- Staff TU dapat melihat seluruh aktivitas kritis sistem
- Record lama terhapus untuk menjaga kapasitas database

---
