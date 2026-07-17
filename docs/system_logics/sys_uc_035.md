## UC-035: Konfigurasi Target Grade & Syahrul Quran

### 1. File Terkait
- **Page:** `src/app/(dashboard)/koordinator/pengaturan/target-grade/page.tsx`
- **Komponen:**
  - `src/components/features/pengaturan/TargetGradeForm.tsx`
  - `src/components/features/pengaturan/TargetSyahrulQuranForm.tsx`
- **Actions:** `src/app/actions/pengaturan.ts` (fungsi `updateTargetGrade` dan `updateTargetSyahrulQuran`)

### 2. State & Data
- `targetGrades`: Array object dari tabel `target_grade` (tipe: sabak, sabki, manzil) per grade
- `targetSyahrulQuran`: Array object dari tabel `target_syahrul_quran` per grade
- `isLoading`: boolean state untuk proses fetch dan update

### 3. Logika Utama

**1. Fetch Data Awal (SSR/RSC)**
```typescript
// Fetch data target normal
const { data: targetGrades, error: errorNormal } = await supabase
  .from('target_grade')
  .select('*')
  .order('grade', { ascending: true });

// Fetch data target syahrul quran
const { data: targetSyahrulQuran, error: errorSyahrul } = await supabase
  .from('target_syahrul_quran')
  .select('*')
  .order('grade', { ascending: true });
```

**2. Validasi Form (Zod Schema)**
```typescript
const targetGradeSchema = z.object({
  target_min: z.number().min(1, 'Target minimal 1 baris'),
  target_max: z.number().nullable()
}).refine(data => {
  if (data.target_max !== null) {
    return data.target_max >= data.target_min;
  }
  return true;
}, {
  message: 'Target maksimal tidak boleh lebih kecil dari minimum',
  path: ['target_max']
});
```

**3. Update Target Normal**
```typescript
const { error } = await supabase
  .from('target_grade')
  .update({
    target_min: input.target_min,
    target_max: input.target_max,
    updated_at: new Date().toISOString()
  })
  .eq('id', input.id);
```

**4. Side Effects & Keamanan**
- Menggunakan RLS untuk memastikan hanya Koordinator atau Staff TU yang dapat melakukan update ke tabel `target_grade` dan `target_syahrul_quran`.
- Revalidasi path (`revalidatePath`) dipanggil setelah update berhasil agar pengguna (termasuk pengampu dan santri) langsung mendapatkan data terbaru saat input/melihat setoran.

### 4. Error Handling
- Menangkap dan menampilkan *Toast* error jika terjadi kegagalan dari Supabase saat *update*.
- Error validasi Zod ditampilkan di bawah masing-masing input *field* pada form modal.
