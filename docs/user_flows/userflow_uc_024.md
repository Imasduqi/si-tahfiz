
## UC-024: Kirim & Balas Pesan ke Pengampu

**Aktor:** Orang Tua / Wali Santri

**Pre-condition:**
- Orang Tua sudah login
- Berada di halaman `/ortu/pesan`

**Main Flow — Kirim Pesan Baru:**
1. Orang Tua membuka `/ortu/pesan`
2. Jika memiliki lebih dari satu anak, sistem menampilkan daftar percakapan per anak
3. Orang Tua memilih percakapan dengan pengampu anak yang dituju
4. Sistem membuka thread percakapan antara Orang Tua dan Pengampu untuk anak tersebut
5. Orang Tua mengetik pesan di field teks lalu menekan tombol "Kirim"
6. Sistem menyimpan pesan ke database
7. Pesan muncul di thread percakapan
8. Pengampu menerima notifikasi in-app bahwa ada pesan baru dari Orang Tua

**Main Flow — Balas Pesan:**
1. Orang Tua membuka thread percakapan yang memiliki pesan dari Pengampu
2. Orang Tua mengetik balasan di field teks lalu menekan "Kirim"
3. Sistem menyimpan balasan ke database
4. Balasan muncul di thread percakapan

**Alternative/Exception Flow:**
- Jika field pesan kosong saat tombol Kirim ditekan → sistem tidak mengirim pesan, tombol tetap tidak aktif
- Jika koneksi gagal saat mengirim → sistem menampilkan pesan error "Pesan gagal terkirim, coba lagi"

**Post-condition:**
- Pesan tersimpan di database dan muncul di thread percakapan kedua pihak
- Pengampu dapat melihat dan membalas pesan di akun mereka

---

