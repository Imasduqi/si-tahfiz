
## UC-017: Input Hasil UKJ

**Aktor:** Pengampu

**Pre-condition:**
- Pengampu sudah login
- Berada di halaman `/pengampu/ukj`
- Santri telah melaksanakan ujian kenaikan juz

**Main Flow:**
1. Pengampu membuka `/pengampu/ukj`
2. Sistem menampilkan daftar riwayat UKJ santri halaqah
3. Pengampu menekan tombol "Input UKJ"
4. Sistem menampilkan modal form dengan field: nama santri, juz yang diujikan, nilai (0-100), dan status (Lulus/Mengulang)
5. Pengampu mengisi seluruh field lalu menekan "Simpan"
6. Sistem menyimpan data UKJ ke database dengan status menunggu approval koordinator
7. Sistem menampilkan toast sukses "Hasil UKJ berhasil diinput, menunggu persetujuan koordinator"

**Alternative/Exception Flow:**
- Jika field nilai atau status kosong → sistem menampilkan pesan error "Field ini wajib diisi"
- Jika nilai di luar rentang 0-100 → sistem menampilkan pesan error "Nilai harus antara 0 dan 100"
- Jika UKJ sudah di-approve koordinator → pengampu tidak dapat mengubah data UKJ tersebut, tombol edit tidak muncul

**Post-condition:**
- Data UKJ tersimpan di database dengan status menunggu approval
- Koordinator dapat melihat UKJ baru di halaman approval mereka

---
