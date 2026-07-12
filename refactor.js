const fs = require('fs');
const path = require('path');

const files = [
  'src/app/(auth)/login/page.tsx',
  'src/app/(dashboard)/kepsek/dashboard/page.tsx',
  'src/app/(dashboard)/kepsek/hafalan/page.tsx',
  'src/app/(dashboard)/kepsek/rekap/page.tsx',
  'src/app/(dashboard)/koordinator/dashboard/page.tsx',
  'src/app/(dashboard)/koordinator/hafalan/page.tsx',
  'src/app/(dashboard)/koordinator/rekap/page.tsx',
  'src/app/(dashboard)/koordinator/santri/page.tsx',
  'src/app/(dashboard)/koordinator/syahrul-quran/page.tsx',
  'src/app/(dashboard)/koordinator/target/page.tsx',
  'src/app/(dashboard)/ortu/beranda/page.tsx',
  'src/app/(dashboard)/ortu/grafik/page.tsx',
  'src/app/(dashboard)/ortu/hafalan/page.tsx',
  'src/app/(dashboard)/ortu/syahrul-quran/page.tsx',
  'src/app/(dashboard)/pengampu/beranda/page.tsx',
  'src/app/(dashboard)/pengampu/hafalan/page.tsx',
  'src/app/(dashboard)/pengampu/rekap/page.tsx',
  'src/app/(dashboard)/pengampu/setoran/page.tsx',
  'src/app/(dashboard)/pengampu/syahrul-quran/page.tsx',
  'src/app/(dashboard)/pengampu/target/page.tsx',
  'src/app/(dashboard)/tu/dashboard/page.tsx',
  'src/app/(dashboard)/tu/kelas/page.tsx',
  'src/app/(dashboard)/tu/manajemen-akun/page.tsx',
  'src/app/(dashboard)/tu/pengampu/page.tsx',
  'src/app/(dashboard)/tu/rombel/page.tsx',
  'src/app/(dashboard)/tu/santri/page.tsx',
  'src/components/layout/dashboard-shell.tsx',
  'src/components/profile/profile-form.tsx',
  'src/hooks/use-push-subscription.ts'
];

for (const file of files) {
  const fullPath = path.join('e:/dpsi proyek akhir/si-tahfiz', file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace createClient() call
  if (content.includes('const supabase = createClient()')) {
    content = content.replace(/const supabase = createClient\(\)/g, 'const supabase = useMemo(() => createClient(), [])');
    
    // Add useMemo to react import
    if (content.includes('from \'react\'') || content.includes('from "react"')) {
      if (!content.includes('useMemo')) {
        content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]react['"]/, (match, p1) => {
          return `import { ${p1.trim()}, useMemo } from 'react'`;
        });
      }
    } else {
      content = `import { useMemo } from 'react'\n` + content;
    }
    
    fs.writeFileSync(fullPath, content);
    console.log('Updated: ' + file);
  }
}
