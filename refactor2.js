const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('e:/dpsi proyek akhir/si-tahfiz/src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  // skip client.ts and use-user.ts just in case, but use-user.ts is already handled.
  if (filePath.includes('client.ts') || filePath.includes('server.ts') || filePath.includes('tu-akun.ts')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('const supabase = createClient()') || content.includes('const supabase = createClient( )')) {
    content = content.replace(/const\s+supabase\s*=\s*createClient\(\)/g, 'const supabase = useMemo(() => createClient(), [])');
    
    if (content.includes('from \'react\'') || content.includes('from "react"')) {
      if (!content.includes('useMemo')) {
        content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]react['"]/, (match, p1) => {
          return `import { ${p1.trim()}, useMemo } from 'react'`;
        });
      }
    } else {
      content = `import { useMemo } from 'react'\n` + content;
    }
    
    fs.writeFileSync(filePath, content);
    console.log('Updated: ' + filePath);
  }
});
