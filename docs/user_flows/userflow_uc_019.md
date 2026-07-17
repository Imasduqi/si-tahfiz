

## UC-019: Input Nilai Akhlaq

**Aktor:** Pengampu

**Pre-condition:**
- Pengampu sudah login
- Berada di halaman `/pengampu/akhlaq`
- Koordinator sudah mengaktifkan fitur akhlaq

**Main Flow:**
1. Pengampu membuka `/pengampu/akhlaq`
2. Sistem menampilkan daftar santri halaqah dengan kolom nilai akhlaq semester ini
3. Pengampu menekan tombol "Input" pada santri yang dipilih
4. Sistem menampilkan modal form dengan field nilai akhlaq (0-100)
5. Pengampu mengisi nilai lalu menekan "Simpan"
6. Sistem menyimpan nilai akhlaq ke database
7. Sistem menampilkan toast sukses "Nilai akhlaq berhasil disimpan"

**Alternative/Exception Flow:**
- Jika fitur akhlaq dinonaktifkan koordinator → halaman `/pengampu/akhlaq` tidak dapat diakses dan menu tidak muncul di Lainnya
- Jika nilai di luar rentang 0-100 → sistem menampilkan pesan error "Nilai harus antara 0 dan 100"
- Jika pengampu ingin mengubah nilai → pengampu menekan tombol "Edit" dan mengubah data

**Post-condition:**
- Nilai akhlaq tersimpan di database per santri per semester
- Nilai akhlaq masuk ke kalkulasi nilai akhir semester

---
