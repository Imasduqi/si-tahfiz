

## UC-003: Logout

**Aktor:** Semua Role

**Pre-condition:**
- Aktor sudah login dan berada di halaman manapun dalam aplikasi

**Main Flow:**
1. Aktor menekan ikon profil di topbar
2. Sistem membuka halaman profil
3. Aktor menekan tombol "Keluar"
4. Sistem menampilkan konfirmasi "Apakah kamu yakin ingin keluar?"
5. Aktor menekan "Ya, Keluar"
6. Sistem menghapus session dan redirect ke halaman login sesuai role:
   - Orang Tua → `/login/ortu`
   - Role lain → `/login`

**Alternative/Exception Flow:**
- Jika aktor menekan "Batal" pada konfirmasi → popup tertutup, aktor tetap di halaman yang sama
- Jika session sudah expired sebelum logout manual → sistem otomatis redirect ke halaman login saat aktor melakukan aksi apapun

**Post-condition:**
- Session dihapus dari browser
- Aktor berada di halaman login dan tidak bisa mengakses halaman authenticated tanpa login ulang

---

