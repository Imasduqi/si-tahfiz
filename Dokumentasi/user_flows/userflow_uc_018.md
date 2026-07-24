
## UC-018: Input Nilai UAS Per Juz

**Aktor:** Pengampu

**Pre-condition:**
- Pengampu sudah login
- Berada di halaman `/pengampu/uas`
- Semester sedang berjalan dan konfigurasi tanggal semester sudah diisi TU

**Main Flow:**
1. Pengampu membuka `/pengampu/uas`
2. Sistem menampilkan daftar santri halaqah
3. Pengampu menekan tombol "Input UAS" pada santri yang dipilih
4. Sistem menampilkan modal form dengan:
   - Pilihan juz yang diujikan (dapat ditambah sesuai konfigurasi, default maksimal 3 juz)
   - Jika hafalan santri kurang dari atau sama dengan jumlah juz yang dikonfigurasi, seluruh hafalan otomatis dipilih
   - Field nilai per juz (0-100)
5. Pengampu memilih juz dan mengisi nilai per juz lalu menekan "Simpan"
6. Sistem menghitung nilai akhir UAS sebagai rata-rata dari seluruh nilai per juz
7. Sistem menyimpan data UAS ke database
8. Sistem menampilkan toast sukses "Nilai UAS berhasil disimpan"

**Alternative/Exception Flow:**
- Jika ada juz yang dipilih tapi nilainya belum diisi → nilai akhir UAS belum terhitung, sistem menampilkan status "Belum lengkap"
- Jika nilai di luar rentang 0-100 → sistem menampilkan pesan error "Nilai harus antara 0 dan 100"
- Jika pengampu ingin mengubah nilai → pengampu menekan tombol "Edit" dan mengubah data

**Post-condition:**
- Data UAS tersimpan di database
- Nilai akhir UAS terhitung otomatis jika seluruh juz sudah memiliki nilai
- Nilai UAS masuk ke kalkulasi nilai akhir semester

---
