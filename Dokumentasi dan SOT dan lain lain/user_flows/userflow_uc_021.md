---

## UC-021: Input Setoran Manzil

**Aktor:** Orang Tua / Wali Santri

**Pre-condition:**
- Orang Tua sudah login
- Berada di halaman `/ortu/manzil`
- Periode Syahrul Quran tidak sedang aktif

**Main Flow:**
1. Orang Tua membuka `/ortu/manzil`
2. Jika memiliki lebih dari satu anak, Orang Tua memilih tab nama anak yang ingin diinput
3. Sistem menampilkan form input Manzil dengan field: tanggal (default hari ini, bisa diubah), jumlah baris, halaman awal, halaman akhir
4. Orang Tua mengisi seluruh field lalu menekan "Simpan"
5. Sistem memvalidasi bahwa belum ada Manzil untuk anak ini pada tanggal tersebut
6. Sistem menyimpan setoran Manzil ke database
7. Sistem menampilkan toast sukses "Setoran Manzil berhasil disimpan"

**Main Flow — Edit Manzil:**
1. Orang Tua melihat riwayat Manzil yang sudah diinput
2. Orang Tua menekan tombol "Edit" pada record Manzil yang ingin diubah
3. Sistem menampilkan form dengan data yang sudah terisi
4. Orang Tua mengubah data lalu menekan "Simpan"
5. Sistem memperbarui data di database
6. Sistem menampilkan toast sukses "Setoran Manzil berhasil diperbarui"

**Alternative/Exception Flow:**
- Jika Manzil untuk anak ini pada tanggal tersebut sudah ada → sistem menampilkan pesan error "Setoran Manzil untuk tanggal ini sudah ada, silakan edit"
- Jika field jumlah baris kosong → sistem menampilkan pesan error "Jumlah baris wajib diisi"
- Jika periode Syahrul Quran aktif → halaman Manzil menampilkan pesan "Setoran Manzil tidak tersedia selama periode Syahrul Quran" dan form input tidak muncul
- Jika Orang Tua menekan "Batal" → tidak ada perubahan

**Post-condition:**
- Setoran Manzil tersimpan di database
- Pengampu dapat melihat status Manzil santri di halaman Tikrar & Status Manzil
- Data Manzil masuk ke kalkulasi rekap dan nilai akhir semester

---
