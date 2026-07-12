export type Role = 'tu' | 'koordinator' | 'pengampu' | 'kepsek'
export type Grade = 'tahsin' | 'takmil' | 'tahfiz'
export type TipeSetoran = 'sabak' | 'sabki' | 'manzil'
export type StatusSetoran = 'lulus' | 'mengulang'
export type StatusTikrar = 'wajib_sekolah' | 'selesai_sekolah' | 'wajib_rumah' | 'selesai_rumah'
export type StatusAbsensi = 'alpha' | 'sakit' | 'izin'
export type StatusApproval = 'pending' | 'approved' | 'rejected'
export type StatusUkjSantri = 'lulus' | 'mengulang'
export type Semester = 'ganjil' | 'genap'

export interface Profile {
  id: string
  nama_lengkap: string
  role: Role
  email: string
  created_at: string
}

export interface OrangTua {
  id: string
  nama_lengkap: string
  nomor_hp: string
  created_at: string
}

export interface Halaqah {
  id: string
  nama_halaqah: string
  grade: Grade
  pengampu_id: string
  created_at: string
}

export interface Santri {
  id: string
  nama_lengkap: string
  kelas: string
  grade: Grade
  halaqah_id: string
  orang_tua_id: string | null
  created_at: string
}

export interface Konfigurasi {
  id: string
  bobot_setoran: number
  bobot_uas: number
  bobot_akhlaq: number
  bobot_kehadiran: number
  tanggal_mulai_ganjil: string | null
  tanggal_selesai_ganjil: string | null
  tanggal_mulai_genap: string | null
  tanggal_selesai_genap: string | null
  fitur_akhlaq_aktif: boolean
  maintenance_mode: boolean
  updated_at: string
}

export interface HariLibur {
  id: string
  tanggal: string
  keterangan: string
  created_at: string
}

export interface TargetGrade {
  id: string
  grade: Grade
  tipe_setoran: TipeSetoran
  target_min: number
  target_max: number | null
  updated_at: string
}

export interface TargetSyahrulQuran {
  id: string
  grade: Grade
  target_min: number
  target_max: number | null
  updated_at: string
}

export interface Setoran {
  id: string
  santri_id: string
  tipe: TipeSetoran
  tanggal: string
  jumlah_baris: number
  halaman_awal: number
  halaman_akhir: number
  jumlah_kesalahan: number | null
  status: StatusSetoran
  input_oleh: string
  created_at: string
  updated_at: string
}

export interface Tikrar {
  id: string
  santri_id: string
  tanggal: string
  surah: string
  status: StatusTikrar
  diselesaikan_pengampu_at: string | null
  dialihkan_rumah_at: string | null
  diselesaikan_ortu_at: string | null
  created_at: string
}

export interface Absensi {
  id: string
  santri_id: string
  tanggal: string
  status: StatusAbsensi
  created_at: string
}

export interface Ukj {
  id: string
  santri_id: string
  pengampu_id: string
  nomor_juz: number
  nilai: number
  status_santri: StatusUkjSantri
  status_approval: StatusApproval
  alasan_penolakan: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

export interface Uas {
  id: string
  santri_id: string
  pengampu_id: string
  semester: Semester
  tahun_ajaran: string
  nilai_akhir: number | null
  created_at: string
  updated_at: string
}

export interface UasDetail {
  id: string
  uas_id: string
  nomor_juz: number
  nilai: number
  created_at: string
}

export interface Akhlaq {
  id: string
  santri_id: string
  pengampu_id: string
  semester: Semester
  tahun_ajaran: string
  nilai: number
  created_at: string
  updated_at: string
}

export interface SyahrulQuran {
  id: string
  tanggal_mulai: string
  tanggal_selesai: string
  dibuat_oleh: string
  created_at: string
}

export interface PekanMurajaah {
  id: string
  tanggal_mulai: string
  tanggal_selesai: string
  dibuat_oleh: string
  created_at: string
}

export interface TargetMurajaah {
  id: string
  pekan_murajaah_id: string
  halaqah_id: string
  target_baris_per_hari: number
  created_at: string
}

export interface Percakapan {
  id: string
  santri_id: string
  pengampu_id: string
  ortu_id: string
  created_at: string
}

export interface Pesan {
  id: string
  percakapan_id: string
  pengirim_id: string
  isi: string
  created_at: string
}

export interface Pengumuman {
  id: string
  judul: string
  isi: string
  target_role: string[]
  dibuat_oleh: string
  created_at: string
}

export interface PengumumanRead {
  id: string
  pengumuman_id: string
  user_id: string
  read_at: string
}

export interface BeritaLogin {
  id: string
  judul: string
  isi: string
  dibuat_oleh: string
  created_at: string
  updated_at: string
}

export interface AuditTrail {
  id: string
  user_id: string
  aktivitas: string
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth_key: string
  created_at: string
}

export interface MobilePushToken {
  id: string
  user_id: string
  fcm_token: string
  platform: string
  created_at: string
}
