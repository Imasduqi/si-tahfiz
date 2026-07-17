

## UC-002: Login Nomor HP

**Aktor:** Orang Tua / Wali Santri

**Pre-condition:**
- Aktor belum login
- Akun Orang Tua sudah dibuat oleh Staff TU dengan nomor HP terdaftar

**Main Flow:**
1. Aktor membuka `/login/ortu`
2. Aktor melihat form login dengan field nomor HP dan password
3. Aktor mengisi nomor HP dan password lalu menekan tombol "Masuk"
4. Sistem memvalidasi kredensial ke Supabase Auth
5. Sistem membaca data anak yang terhubung ke akun tersebut
6. Sistem redirect ke `/ortu/beranda`

**Alternative/Exception Flow:**
- Jika nomor HP atau password salah → sistem menampilkan pesan error "Nomor HP atau password salah" di bawah form
- Jika field kosong saat tombol ditekan → sistem menampilkan pesan error "Field ini wajib diisi"
- Jika maintenance mode aktif → setelah login berhasil sistem redirect ke `/maintenance`

**Post-condition:**
- Orang Tua berhasil login dan berada di `/ortu/beranda`
- Jika akun terhubung ke lebih dari satu anak, tab nama anak tampil di beranda

---

