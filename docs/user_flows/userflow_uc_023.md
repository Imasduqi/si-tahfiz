
## UC-023: Switch Antar Anak

**Aktor:** Orang Tua / Wali Santri yang memiliki lebih dari satu anak

**Pre-condition:**
- Orang Tua sudah login
- Akun Orang Tua terhubung ke lebih dari satu santri
- Berada di halaman `/ortu/beranda`

**Main Flow:**
1. Orang Tua membuka `/ortu/beranda`
2. Sistem menampilkan tab nama anak di bagian atas beranda, contoh: "Ahmad" | "Fatimah"
3. Orang Tua menekan tab nama anak yang ingin dilihat
4. Sistem menampilkan data progress hafalan anak yang dipilih
5. Seluruh halaman menyesuaikan konteks ke anak yang sedang aktif dipilih

**Alternative/Exception Flow:**
- Jika akun hanya terhubung ke satu anak → tab tidak muncul, beranda langsung menampilkan data anak tersebut

**Post-condition:**
- Seluruh data yang ditampilkan di beranda dan halaman lain mengacu ke anak yang sedang aktif dipilih

---

