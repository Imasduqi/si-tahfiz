## UC-035: Konfigurasi Target Grade & Syahrul Quran

**Aktor:** Koordinator (atau Staff TU)

**Pre-condition:**
- Aktor sudah login
- Berada di halaman pengaturan/konfigurasi sistem

**Main Flow:**
1. Aktor memilih menu "Konfigurasi Target Grade"
2. Sistem menampilkan daftar grade (Tahsin, Takmil, Tahfiz) beserta target baris harian saat ini untuk Sabak, Sabki, dan Manzil, serta target khusus untuk periode Syahrul Quran
3. Aktor menekan tombol "Edit Target" pada salah satu grade (misal: Tahsin)
4. Sistem memunculkan modal form yang berisi:
   - Target Sabak (Min dan/atau Max)
   - Target Sabki (Min dan/atau Max)
   - Target Manzil (Min dan/atau Max)
   - Target Syahrul Quran (Min dan/atau Max)
5. Aktor mengubah angka target baris harian pada field yang diinginkan
6. Aktor menekan tombol "Simpan"
7. Sistem memvalidasi input (memastikan target_max >= target_min, nilai > 0)
8. Sistem menyimpan pembaruan ke tabel `target_grade` dan `target_syahrul_quran`
9. Sistem menampilkan pesan sukses "Target grade berhasil diperbarui" dan menutup modal

**Alternative/Exception Flow:**
- Jika aktor memasukkan nilai negatif atau nol → sistem menampilkan pesan error pada field terkait "Target minimal 1 baris"
- Jika aktor mengisi target maksimum lebih kecil dari target minimum → sistem menampilkan pesan error "Target maksimal tidak boleh lebih kecil dari minimum"
- Jika aktor menekan tombol "Batal" pada modal → form ditutup tanpa menyimpan perubahan

**Post-condition:**
- Pembaruan target berlaku segera untuk perhitungan setoran pada hari-hari berikutnya
- Semua pengampu dan santri dalam grade tersebut akan langsung melihat panduan target yang baru di antarmuka mereka
