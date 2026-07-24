## UC-036: Berlangganan Notifikasi Real-time (Push Notifications)

### 1. File Terkait
- **Komponen:**
  - `src/components/features/notifications/PushNotificationPrompt.tsx` (komponen banner/tombol opt-in)
  - `src/hooks/usePushSubscription.ts` (custom hook untuk mengelola logic browser permission)
- **Service Worker:** `public/sw.js` (untuk intercept dan menampilkan web push)
- **Actions:** `src/app/actions/notifications.ts` (fungsi `subscribeDevice`)

### 2. State & Data
- `permissionStatus`: State browser ('granted', 'denied', 'default')
- `isSubscribed`: State pengecekan apakah device saat ini sudah teregistrasi
- `isSubmitting`: Loading state saat mengirim data ke database

### 3. Logika Utama

**1. Cek Dukungan Browser & Status Saat Ini**
```typescript
if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
  console.log('Browser tidak mendukung Push Notifications');
  return;
}

const registration = await navigator.serviceWorker.ready;
const existingSubscription = await registration.pushManager.getSubscription();
if (existingSubscription) {
  setIsSubscribed(true);
}
```

**2. Meminta Izin (Request Permission)**
```typescript
const permission = await window.Notification.requestPermission();
if (permission !== 'granted') {
  throw new Error('Izin notifikasi ditolak oleh pengguna');
}
```

**3. Generate Endpoint dan Kunci (VAPID)**
```typescript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
});

const subData = subscription.toJSON();
```

**4. Simpan ke Database (Supabase)**
```typescript
// Di dalam server action
const { error } = await supabase
  .from('push_subscriptions')
  .insert({
    user_id: session.user.id,
    endpoint: subData.endpoint,
    p256dh: subData.keys?.p256dh,
    auth_key: subData.keys?.auth,
    created_at: new Date().toISOString()
  });
```

### 4. Error Handling
- **Tolak Permission:** Menampilkan indikator UI yang jelas jika status menjadi 'denied' dan menyarankan pengguna untuk mengaktifkannya secara manual dari pengaturan *browser*.
- **Gagal Simpan ke DB:** Menampilkan toast error "Gagal menyimpan pendaftaran notifikasi, silakan coba lagi".
- **RLS:** Tabel `push_subscriptions` memiliki kebijakan keamanan ketat yang mencegah _insert_ data dengan `user_id` yang berbeda dari _session_ yang aktif saat itu.
