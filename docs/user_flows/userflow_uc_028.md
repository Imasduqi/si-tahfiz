
## UC-028: Ubah Grade Santri

**Aktor:** Koordinator

**Pre-condition:**
- Koordinator sudah login
- Berada di halaman `/koordinator/kelola/grade`
- Sudah ada data santri di sistem

**Main Flow:**
1. Koordinator membuka `/koordinator/kelola/grade`
2. Sistem menampilkan daftar seluruh santri beserta grade saat ini, halaqah, dan kelas
3. Koordinator dapat filter berdasarkan halaqah atau grade
4. Koordinator menekan tombol "Ubah Grade" pada santri yang dipilih
5. Sistem menampilkan modal dengan dropdown pilihan grade: Tahsin, Takmil, atau Tahfiz
6. Koordinator memilih grade baru lalu menekan "Simpan"
7. Sistem memperbarui grade santri di database
8. Sistem menampilkan toast sukses "Grade santri berhasil diperbarui"

**Alternative/Exception Flow:**
- Jika grade yang dipilih sama dengan grade saat ini → sistem menampilkan pesan "Grade tidak berubah"
- Jika koordinator menekan "Batal" → modal tertutup, tidak ada perubahan
- Jika koneksi gagal → sistem menampilkan error state dengan tombol "Coba Lagi"

**Post-condition:**
- Grade santri diperbarui di database
- Target baris harian santri menyesuaikan grade baru
- Perubahan grade berlaku mulai hari berikutnya untuk kalkulasi rekap

---
