
## UC-034: Edit Profil & Ganti Password

**Aktor:** Semua Role

**Pre-condition:**
- Aktor sudah login

**Main Flow:**
1. Aktor menekan ikon profil di topbar
2. Sistem membuka halaman profil dengan informasi akun saat ini
3. Aktor mengubah informasi yang ingin diubah (nama, dan/atau password baru)
4. Untuk ganti password: aktor mengisi password lama, password baru, dan konfirmasi password baru
5. Aktor menekan tombol "Simpan"
6. Sistem memvalidasi perubahan
7. Sistem menyimpan perubahan ke database
8. Sistem menampilkan toast sukses "Profil berhasil diperbarui"

**Alternative/Exception Flow:**
- Jika password lama yang diisi salah → sistem menampilkan pesan error "Password lama tidak sesuai"
- Jika password baru dan konfirmasi password tidak cocok → sistem menampilkan pesan error "Konfirmasi password tidak sesuai"
- Jika password baru kurang dari 8 karakter → sistem menampilkan pesan error "Password minimal 8 karakter"
- Jika tidak ada perubahan yang dilakukan lalu tekan simpan → sistem menampilkan pesan "Tidak ada perubahan yang disimpan"

**Post-condition:**
- Data profil diperbarui di database
- Jika password diubah, aktor tetap dalam kondisi login dengan session yang sama

---

