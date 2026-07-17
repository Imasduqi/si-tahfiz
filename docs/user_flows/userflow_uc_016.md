
## UC-016: Lihat Status Manzil Santri

**Aktor:** Pengampu

**Pre-condition:**
- Pengampu sudah login
- Berada di halaman `/pengampu/tikrar`
- Orang Tua sudah menginput Manzil

**Main Flow:**
1. Pengampu membuka `/pengampu/tikrar`
2. Sistem menampilkan daftar status Manzil seluruh santri halaqah
3. Pengampu dapat melihat santri mana yang sudah dan belum Manzil hari ini
4. Pengampu dapat filter berdasarkan tanggal

**Alternative/Exception Flow:**
- Jika belum ada santri yang input Manzil pada tanggal tersebut → sistem menampilkan empty state "Belum ada setoran Manzil"

**Post-condition:**
- Pengampu mendapat visibilitas status Manzil santri tanpa bisa mengubah data Manzil

---
