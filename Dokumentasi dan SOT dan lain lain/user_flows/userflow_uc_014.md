
## UC-014: Input Absensi Santri

**Aktor:** Pengampu

**Pre-condition:**
- Pengampu sudah login
- Berada di halaman `/pengampu/absensi`
- Sudah ada santri di halaqah pengampu tersebut

**Main Flow:**
1. Pengampu membuka `/pengampu/absensi`
2. Sistem menampilkan daftar santri halaqah dengan status default semua hadir
3. Pengampu memilih tanggal absensi (default hari ini, bisa diubah)
4. Pengampu menekan nama santri yang tidak hadir
5. Sistem menampilkan pilihan status: Alpha, Sakit, atau Izin
6. Pengampu memilih status ketidakhadiran
7. Sistem menyimpan record absensi ke database
8. Jika status Alpha, sistem otomatis mengirim notifikasi in-app ke akun Orang Tua santri tersebut
9. Sistem menampilkan toast sukses "Absensi berhasil disimpan"

**Alternative/Exception Flow:**
- Jika santri tidak memiliki akun Orang Tua, penyimpanan absensi tetap berhasil tanpa error — kegagalan notifikasi tidak membatalkan penyimpanan
- Jika pengampu ingin mengubah status absensi yang sudah diinput → pengampu menekan kembali nama santri dan memilih status baru
- Jika koneksi gagal saat menyimpan → sistem menampilkan error state dengan tombol "Coba Lagi"

**Post-condition:**
- Record absensi tersimpan di database hanya untuk santri yang tidak hadir
- Notifikasi Alpha terkirim ke Orang Tua jika status Alpha
- Data kehadiran masuk ke kalkulasi nilai akhir semester

---
