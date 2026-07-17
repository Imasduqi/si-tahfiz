
## UC-020: Kirim & Balas Pesan ke Orang Tua

**Aktor:** Pengampu

**Pre-condition:**
- Pengampu sudah login
- Berada di halaman `/pengampu/pesan`
- Santri di halaqah pengampu memiliki akun Orang Tua

**Main Flow — Kirim Pesan Baru:**
1. Pengampu membuka `/pengampu/pesan`
2. Sistem menampilkan daftar percakapan per santri
3. Pengampu memilih santri yang ingin dikirim pesan ke orang tuanya
4. Sistem membuka thread percakapan antara pengampu dan orang tua santri tersebut
5. Pengampu mengetik pesan di field teks lalu menekan tombol "Kirim"
6. Sistem menyimpan pesan ke database
7. Pesan muncul di thread percakapan
8. Orang Tua menerima notifikasi in-app bahwa ada pesan baru

**Main Flow — Balas Pesan:**
1. Pengampu membuka thread percakapan yang memiliki pesan dari Orang Tua
2. Pengampu mengetik balasan di field teks lalu menekan "Kirim"
3. Sistem menyimpan balasan ke database
4. Balasan muncul di thread percakapan

**Alternative/Exception Flow:**
- Jika field pesan kosong saat tombol Kirim ditekan → sistem tidak mengirim pesan, tombol tetap tidak aktif
- Jika santri tidak memiliki akun Orang Tua → thread percakapan tidak tersedia untuk santri tersebut
- Jika koneksi gagal saat mengirim → sistem menampilkan pesan error "Pesan gagal terkirim, coba lagi"

**Post-condition:**
- Pesan tersimpan di database dan muncul di thread percakapan kedua pihak
- Orang Tua dapat melihat dan membalas pesan di akun mereka

---

