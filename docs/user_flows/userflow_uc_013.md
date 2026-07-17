---

## UC-013: Input Setoran Sabak & Sabki

**Aktor:** Pengampu

**Pre-condition:**
- Pengampu sudah login
- Berada di halaman `/pengampu/setoran`
- Sudah ada santri di halaqah pengampu tersebut

**Main Flow:**
1. Pengampu membuka `/pengampu/setoran`
2. Sistem menampilkan daftar nama santri di halaqah pengampu
3. Pengampu memilih tanggal setoran (default hari ini, bisa diubah ke tanggal lain)
4. Pengampu menekan nama santri yang akan diinput setorannya
5. Sistem menampilkan modal input dengan field:
   - Sabak: jumlah baris, halaman awal, halaman akhir, jumlah kesalahan
   - Sabki: jumlah baris, halaman awal, halaman akhir, jumlah kesalahan
   - (Jika periode Syahrul Quran aktif, kolom Sabki tidak muncul sama sekali)
6. Pengampu mengisi field lalu menekan "Simpan"
7. Sistem menentukan status lulus atau mengulang berdasarkan jumlah kesalahan
8. Jika jumlah kesalahan melebihi batas, sistem otomatis membuat record Tikrar
9. Sistem menyimpan setoran ke database
10. Sistem menampilkan toast sukses "Setoran berhasil disimpan"
11. Modal tertutup, daftar santri kembali tampil

**Main Flow — Edit Setoran:**
1. Pengampu menekan nama santri yang sudah diinput setorannya pada tanggal tertentu
2. Sistem menampilkan modal dengan data setoran yang sudah terisi
3. Pengampu mengubah data lalu menekan "Simpan"
4. Sistem memperbarui data setoran di database
5. Sistem menampilkan toast sukses "Setoran berhasil diperbarui"

**Alternative/Exception Flow:**
- Jika pengampu mencoba input setoran jenis yang sama untuk santri yang sama di tanggal yang sama → sistem menampilkan pesan error "Setoran untuk santri ini pada tanggal ini sudah ada, silakan edit"
- Jika field jumlah baris kosong → sistem menampilkan pesan error "Jumlah baris wajib diisi"
- Jika pengampu menekan "Batal" → modal tertutup, tidak ada perubahan

**Post-condition:**
- Setoran tersimpan di database
- Jika kesalahan melebihi batas, Tikrar otomatis terbuat dengan status `wajib_sekolah`
- Data setoran masuk ke kalkulasi rekap dan nilai akhir semester

---
