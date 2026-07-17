

## UC-001: Login Email

**Aktor:** Staff TU, Koordinator, Pengampu, Kepala Sekolah

**Pre-condition:**
- Aktor belum login
- Aktor sudah memiliki akun yang dibuat oleh Staff TU

**Main Flow:**
1. Aktor membuka aplikasi dan diarahkan ke `/login`
2. Aktor melihat form login dengan field email dan password
3. Aktor mengisi email dan password lalu menekan tombol "Masuk"
4. Sistem memvalidasi kredensial ke Supabase Auth
5. Sistem membaca role aktor dari database
6. Sistem menyimpan session dan redirect ke halaman beranda sesuai role:
   - TU → `/tu/akun`
   - Koordinator → `/koordinator/beranda`
   - Pengampu → `/pengampu/beranda`
   - Kepsek → `/kepsek/dashboard`

**Alternative/Exception Flow:**
- Jika email atau password salah → sistem menampilkan pesan error "Email atau password salah" di bawah form, halaman tidak berpindah
- Jika field email atau password kosong saat tombol ditekan → sistem menampilkan pesan error "Field ini wajib diisi" di bawah field yang kosong
- Jika maintenance mode aktif dan role bukan TU → setelah login berhasil sistem redirect ke `/maintenance`

**Post-condition:**
- Aktor berhasil login dan berada di halaman beranda sesuai rolenya
- Session tersimpan di browser

---

