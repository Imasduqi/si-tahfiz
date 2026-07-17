## UC-036: Berlangganan Notifikasi Real-time (Push Notifications)

**Aktor:** Semua Role

**Pre-condition:**
- Aktor sudah login ke dalam aplikasi
- Browser/Perangkat aktor mendukung fitur Push Notifications atau Service Worker
- Aktor sedang mengakses sistem menggunakan perangkat (laptop/smartphone) yang belum terdaftar untuk menerima notifikasi

**Main Flow:**
1. Sistem menampilkan banner atau *prompt* di area *Dashboard* atau halaman *Profil* dengan pesan "Aktifkan Notifikasi untuk menerima pembaruan instan."
2. Aktor menekan tombol "Aktifkan" atau *toggle* notifikasi
3. Browser akan memunculkan dialog permission bawaan ("*SI-Tahfiz wants to send you notifications*")
4. Aktor memilih "Allow" (Izinkan) pada permission dialog
5. Sistem (Frontend) secara *background* mendaftarkan *service worker* dan meng-generate *endpoint*, *p256dh*, dan *auth_key* (untuk Web Push) atau FCM token (untuk Mobile Push)
6. Sistem mengirim data pendaftaran tersebut ke server
7. Sistem (Backend) menyimpan data *subscription* ke tabel `push_subscriptions` (atau `mobile_push_tokens`) beserta `user_id` milik aktor
8. Sistem mengubah status pada antarmuka menjadi "Notifikasi Aktif" dan menghilangkan banner *prompt*
9. Sistem menampilkan toast sukses "Berhasil mengaktifkan notifikasi perangkat ini"

**Alternative/Exception Flow:**
- Jika aktor memilih "Block" pada permission browser → sistem akan mengubah antarmuka menjadi peringatan bahwa fitur ini diblokir dari pengaturan browser, dan memberikan petunjuk cara mengaktifkannya secara manual
- Jika aktor menolak *prompt* awal ("Nanti saja" / *Close*) → banner ditutup sementara, dan akan ditawarkan kembali di lain waktu (opsional) atau aktor bisa mengaktifkannya manual via halaman Profil
- Jika proses generate token di sisi client gagal (karena ad-blocker atau browser tidak mendukung) → sistem menampilkan pesan error ramah "Gagal mengaktifkan notifikasi. Peramban Anda mungkin tidak mendukung fitur ini."

**Post-condition:**
- *Device* aktor berhasil terdaftar di database untuk menerima pesan notifikasi instan
- Jika ada *event* penting (seperti Santri Alpha, Pesan Masuk, atau Pengumuman baru), aktor akan langsung menerima notifikasi *push* meskipun aplikasi sedang tertutup (bergantung platform)
