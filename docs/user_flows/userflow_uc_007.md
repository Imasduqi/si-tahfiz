
## UC-007: Konfigurasi Tanggal Semester

**Aktor:** Staff TU

**Pre-condition:**
- Staff TU sudah login
- Berada di halaman `/tu/konfigurasi`

**Main Flow:**
1. Staff TU melihat form konfigurasi semester dengan 4 field: tanggal mulai semester ganjil, tanggal selesai semester ganjil, tanggal mulai semester genap, tanggal selesai semester genap
2. Staff TU mengisi atau mengubah tanggal yang diperlukan
3. Staff TU menekan tombol "Simpan Konfigurasi"
4. Sistem menyimpan konfigurasi ke database
5. Sistem menampilkan toast sukses "Konfigurasi tanggal semester berhasil disimpan"

**Alternative/Exception Flow:**
- Jika tanggal selesai lebih awal dari tanggal mulai → sistem menampilkan pesan error "Tanggal selesai tidak boleh lebih awal dari tanggal mulai"
- Jika field tanggal kosong → sistem menampilkan pesan error "Tanggal wajib diisi"

**Post-condition:**
- Konfigurasi tanggal semester tersimpan di database
- Fitur Rekap Semester dan Nilai Akhir dapat berfungsi

---

