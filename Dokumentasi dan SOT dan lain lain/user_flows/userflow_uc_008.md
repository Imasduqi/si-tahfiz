
## UC-008: Konfigurasi Bobot Nilai Akhir

**Aktor:** Staff TU

**Pre-condition:**
- Staff TU sudah login
- Berada di halaman `/tu/konfigurasi`

**Main Flow:**
1. Staff TU melihat form konfigurasi bobot nilai dengan field: bobot Setoran Harian (%), bobot UAS (%), bobot Akhlaq (%), bobot Kehadiran (%)
2. Staff TU mengubah bobot sesuai kebijakan terbaru
3. Staff TU menekan tombol "Simpan Konfigurasi"
4. Sistem memvalidasi bahwa total seluruh bobot sama dengan 100%
5. Sistem menyimpan konfigurasi ke database
6. Sistem menampilkan toast sukses "Konfigurasi bobot nilai berhasil disimpan"

**Alternative/Exception Flow:**
- Jika total bobot tidak sama dengan 100% → sistem menampilkan pesan error "Total bobot harus 100%"
- Jika field bobot kosong atau berisi angka negatif → sistem menampilkan pesan error "Bobot tidak valid"

**Post-condition:**
- Konfigurasi bobot tersimpan di database
- Sistem menggunakan bobot baru untuk kalkulasi nilai akhir semester berikutnya

---
