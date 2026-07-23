
---

## Global Layout

### Mobile (Primary — Mobile First)
- **Topbar:** Logo aplikasi di kiri + ikon profil di kanan. Topbar selalu tampil di semua halaman
- **Konten:** Area utama di tengah, mengisi seluruh lebar layar
- **Bottom Navigation:** Menu navigasi utama di bagian bawah layar, maksimal 4 item per role

### Desktop (Secondary)
- **Topbar:** Logo aplikasi di kiri + ikon profil di kanan
- **Sidebar:** Menu navigasi di kiri, dapat dibuka dan ditutup (collapsible)
- **Konten:** Area utama di kanan sidebar

### Halaman Khusus (Tanpa Layout)
- Halaman Login — layout mandiri, tidak ada topbar atau navigasi
- Halaman Maintenance — layout mandiri, hanya tampil pesan maintenance

---

## Route Map

### Public (Unauthenticated)
| URL | Halaman | Keterangan |
|-----|---------|------------|
| `/` | — | Redirect otomatis ke `/login` |
| `/login` | Login Email | Untuk role TU, Koordinator, Pengampu, Kepsek. Menampilkan berita dari TU di bagian bawah halaman |
| `/login/ortu` | Login Nomor HP | Khusus Orang Tua/Wali |
| `/maintenance` | Halaman Maintenance | Semua role selain TU di-redirect ke sini saat maintenance mode aktif |

---

### Staff TU (`/tu/...`)
| URL | Halaman | Keterangan |
|-----|---------|------------|
| `/tu/akun` | Manajemen Akun | CRUD akun semua role |
| `/tu/data/santri` | Manajemen Santri | CRUD data santri |
| `/tu/data/halaqah` | Manajemen Halaqah | CRUD halaqah dan pengampu |
| `/tu/konfigurasi` | Konfigurasi Sistem | Tanggal semester, bobot nilai, hari libur |
| `/tu/sistem/audit` | Audit Trail | Lihat dan hapus manual audit trail |
| `/tu/sistem/berita` | Berita Login | CRUD berita di halaman login |
| `/tu/profil` | Profil | Info akun dan ganti password |

---

### Koordinator (`/koordinator/...`)
| URL | Halaman | Keterangan |
|-----|---------|------------|
| `/koordinator/beranda` | Beranda | Ringkasan semua halaqah, statistik cepat |
| `/koordinator/ukj` | UKJ | Daftar UKJ pending, approve atau reject |
| `/koordinator/kelola/syahrul-quran` | Kelola Syahrul Quran | Tetapkan tanggal mulai dan selesai |
| `/koordinator/kelola/pekan-murajaah` | Kelola Pekan Murajaah | Tetapkan tanggal dan target |
| `/koordinator/kelola/grade` | Kelola Grade Santri | Ubah grade santri secara manual |
| `/koordinator/pengumuman` | Pengumuman | Buat dan kelola pengumuman per role |
| `/koordinator/rekap` | Rekap Excel | Download rekap semua halaqah |
| `/koordinator/pesan` | Pesan | Komunikasi dengan orang tua per santri |
| `/koordinator/halaqah` | Detail Halaqah | Lihat detail semua halaqah |
| `/koordinator/profil` | Profil | Info akun dan ganti password |

---

### Pengampu (`/pengampu/...`)
| URL | Halaman | Keterangan |
|-----|---------|------------|
| `/pengampu/beranda` | Beranda | Ringkasan halaqah sendiri |
| `/pengampu/setoran` | Setoran | Daftar santri halaqah, klik santri → modal input Sabak & Sabki |
| `/pengampu/absensi` | Absensi | Input ketidakhadiran santri harian |
| `/pengampu/lainnya` | Lainnya | Halaman grid ikon menu tambahan |
| `/pengampu/tikrar` | Tikrar & Status Manzil | Lihat status Tikrar dan Manzil seluruh santri halaqah |
| `/pengampu/ukj` | UKJ | Input dan riwayat UKJ per santri |
| `/pengampu/uas` | UAS | Input nilai UAS per juz per santri |
| `/pengampu/akhlaq` | Akhlaq | Input nilai akhlaq per santri |
| `/pengampu/pesan` | Pesan | Komunikasi dengan orang tua per santri |
| `/pengampu/profil` | Profil | Info akun dan ganti password |

---

### Orang Tua (`/ortu/...`)
| URL | Halaman | Keterangan |
|-----|---------|------------|
| `/ortu/beranda` | Beranda | Progress hafalan anak, tab nama anak jika lebih dari satu |
| `/ortu/manzil` | Manzil | Input setoran Manzil anak |
| `/ortu/tikrar` | Tikrar | Validasi Tikrar rumah anak |
| `/ortu/pesan` | Pesan | Komunikasi dengan pengampu |
| `/ortu/profil` | Profil | Info akun dan ganti password |

---

### Kepala Sekolah (`/kepsek/...`)
| URL | Halaman | Keterangan |
|-----|---------|------------|
| `/kepsek/dashboard` | Dashboard | Statistik dan grafik perkembangan program tahfiz |
| `/kepsek/rekap` | Rekap Excel | Filter semester lalu download rekap Excel |
| `/kepsek/profil` | Profil | Info akun dan ganti password |

---

## Navigasi Per Role

### Staff TU
| Posisi | Item | URL Tujuan |
|--------|------|------------|
| Bottom Nav / Sidebar | Akun | `/tu/akun` |
| Bottom Nav / Sidebar | Data | `/tu/data/santri` |
| Bottom Nav / Sidebar | Konfigurasi | `/tu/konfigurasi` |
| Bottom Nav / Sidebar | Sistem | `/tu/sistem/audit` |
| Topbar | Profil | `/tu/profil` |

---

### Koordinator
| Posisi | Item | URL Tujuan |
|--------|------|------------|
| Bottom Nav / Sidebar | Beranda | `/koordinator/beranda` |
| Bottom Nav / Sidebar | UKJ | `/koordinator/ukj` |
| Bottom Nav / Sidebar | Kelola | Sub-menu: Syahrul Quran, Pekan Murajaah, Grade |
| Bottom Nav / Sidebar | Lainnya | Grid: Pengumuman, Rekap, Pesan, Halaqah |
| Topbar | Profil | `/koordinator/profil` |

---

### Pengampu
| Posisi | Item | URL Tujuan |
|--------|------|------------|
| Bottom Nav / Sidebar | Beranda | `/pengampu/beranda` |
| Bottom Nav / Sidebar | Setoran | `/pengampu/setoran` |
| Bottom Nav / Sidebar | Absensi | `/pengampu/absensi` |
| Bottom Nav / Sidebar | Lainnya | Grid: Tikrar & Manzil, UKJ, UAS, Akhlaq, Pesan |
| Topbar | Profil | `/pengampu/profil` |

---

### Orang Tua
| Posisi | Item | URL Tujuan |
|--------|------|------------|
| Bottom Nav / Sidebar | Beranda | `/ortu/beranda` |
| Bottom Nav / Sidebar | Manzil | `/ortu/manzil` |
| Bottom Nav / Sidebar | Tikrar | `/ortu/tikrar` |
| Bottom Nav / Sidebar | Pesan | `/ortu/pesan` |
| Topbar | Profil | `/ortu/profil` |

---

### Kepala Sekolah
| Posisi | Item | URL Tujuan |
|--------|------|------------|
| Bottom Nav / Sidebar | Dashboard | `/kepsek/dashboard` |
| Bottom Nav / Sidebar | Rekap | `/kepsek/rekap` |
| Topbar | Profil | `/kepsek/profil` |

---

