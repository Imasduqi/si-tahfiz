
## UC-022: Validasi Tikrar Rumah

**Aktor:** Orang Tua / Wali Santri

**Pre-condition:**
- Orang Tua sudah login
- Berada di halaman `/ortu/tikrar`
- Sudah ada record Tikrar dengan status `wajib_rumah` untuk anak mereka

**Main Flow:**
1. Orang Tua membuka `/ortu/tikrar`
2. Jika memiliki lebih dari satu anak, Orang Tua memilih tab nama anak
3. Sistem menampilkan daftar Tikrar aktif anak dengan status `wajib_rumah`
4. Orang Tua menekan tombol "Tandai Selesai di Rumah" pada Tikrar yang sudah diselesaikan
5. Sistem menampilkan konfirmasi "Apakah Tikrar ini sudah diselesaikan di rumah?"
6. Orang Tua menekan "Ya, Sudah Selesai"
7. Sistem mengubah status Tikrar menjadi `selesai_rumah`
8. Sistem menampilkan toast sukses "Tikrar berhasil ditandai selesai di rumah"

**Alternative/Exception Flow:**
- Jika tidak ada Tikrar dengan status `wajib_rumah` → sistem menampilkan empty state "Tidak ada Tikrar yang perlu diselesaikan di rumah"
- Jika Orang Tua menekan "Batal" pada konfirmasi → tidak ada perubahan, status Tikrar tetap `wajib_rumah`
- Jika koneksi gagal → sistem menampilkan error state dengan tombol "Coba Lagi"

**Post-condition:**
- Status Tikrar diperbarui menjadi `selesai_rumah` di database
- Pengampu dapat melihat bahwa Tikrar sudah selesai di halaman Tikrar & Status Manzil

---
