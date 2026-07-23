
## UC-015: Kelola Tikrar di Sekolah

**Aktor:** Pengampu

**Pre-condition:**
- Pengampu sudah login
- Berada di halaman `/pengampu/tikrar`
- Sudah ada record Tikrar dengan status `wajib_sekolah` untuk santri di halaqahnya

**Main Flow — Tandai Selesai di Sekolah:**
1. Pengampu membuka `/pengampu/tikrar`
2. Sistem menampilkan daftar Tikrar aktif seluruh santri halaqah beserta statusnya
3. Pengampu menemukan Tikrar dengan status `wajib_sekolah`
4. Pengampu menekan tombol "Selesai di Sekolah" pada Tikrar tersebut
5. Sistem menampilkan konfirmasi "Tandai Tikrar ini selesai di sekolah?"
6. Pengampu menekan "Ya"
7. Sistem mengubah status Tikrar menjadi `selesai_sekolah`
8. Sistem menampilkan toast sukses "Tikrar ditandai selesai di sekolah"

**Main Flow — Alihkan ke Rumah:**
1. Pengampu menemukan Tikrar dengan status `selesai_sekolah`
2. Pengampu menekan tombol "Alihkan ke Rumah"
3. Sistem menampilkan konfirmasi "Tikrar akan dialihkan ke rumah dan orang tua akan memvalidasi"
4. Pengampu menekan "Ya"
5. Sistem mengubah status Tikrar menjadi `wajib_rumah`
6. Sistem menampilkan toast sukses "Tikrar dialihkan ke rumah"

**Alternative/Exception Flow:**
- Sistem tidak memperbolehkan perpindahan status yang melompat atau mundur — tombol aksi hanya muncul sesuai status saat ini
- Jika koneksi gagal → sistem menampilkan error state dengan tombol "Coba Lagi"

**Post-condition:**
- Status Tikrar diperbarui di database sesuai alur linear
- Orang Tua dapat melihat Tikrar dengan status `wajib_rumah` di akun mereka

---
