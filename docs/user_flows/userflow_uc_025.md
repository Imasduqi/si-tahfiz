---

## UC-025: Approve / Reject UKJ

**Aktor:** Koordinator

**Pre-condition:**
- Koordinator sudah login
- Berada di halaman `/koordinator/ukj`
- Pengampu sudah menginput hasil UKJ yang menunggu approval

**Main Flow — Approve:**
1. Koordinator membuka `/koordinator/ukj`
2. Sistem menampilkan daftar UKJ yang menunggu approval beserta detail: nama santri, halaqah, juz yang diujikan, nilai, dan status dari pengampu
3. Koordinator menekan tombol "Approve" pada UKJ yang dipilih
4. Sistem menampilkan konfirmasi "Setujui hasil UKJ ini?"
5. Koordinator menekan "Ya, Setujui"
6. Sistem mengubah status UKJ menjadi approved
7. Sistem menampilkan toast sukses "UKJ berhasil disetujui"
8. UKJ tidak lagi muncul di daftar pending

**Main Flow — Reject:**
1. Koordinator menekan tombol "Tolak" pada UKJ yang dipilih
2. Sistem menampilkan modal konfirmasi dengan field alasan penolakan
3. Koordinator mengisi alasan lalu menekan "Ya, Tolak"
4. Sistem mengubah status UKJ menjadi rejected
5. Sistem menampilkan toast sukses "UKJ berhasil ditolak"
6. Pengampu dapat melihat UKJ yang ditolak beserta alasannya di riwayat UKJ mereka

**Alternative/Exception Flow:**
- Jika tidak ada UKJ pending → sistem menampilkan empty state "Tidak ada UKJ yang menunggu persetujuan"
- Jika Koordinator menekan "Batal" di konfirmasi → tidak ada perubahan
- Jika koneksi gagal → sistem menampilkan error state dengan tombol "Coba Lagi"

**Post-condition:**
- Status UKJ diperbarui di database
- Jika approved, hasil UKJ dianggap sah
- Jika rejected, pengampu dapat menginput UKJ baru setelah santri ujian ulang
- Record UKJ yang ditolak tetap tersimpan sebagai riwayat
- Aktivitas approve dan reject UKJ tercatat di audit trail

---
