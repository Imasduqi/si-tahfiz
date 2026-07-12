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

  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('useMemo') && !content.includes('import { useMemo }') && !content.includes(', useMemo }') && !content.includes('{ useMemo,') && !content.includes(' {useMemo}')) {
    
    // It uses useMemo but doesn't import it.
    // Let's add the import.
    
    if (content.match(/import\s+.*?from\s+['"]react['"]/)) {
      // It has a react import. Let's add useMemo to it.
      // E.g., import React, { useState, useEffect } from 'react'
      // E.g., import { useState } from "react"
      
      content = content.replace(/(import\s+(?:[^\{]*?,\s*)?\{)([^}]+)(\}\s+from\s+['"]react['"])/, (match, p1, p2, p3) => {
        return p1 + p2 + ', useMemo' + p3;
      });
      
      // What if it's `import React from 'react'`?
      if (!content.includes('useMemo')) {
         content = content.replace(/(import\s+[^\{]+?)(\s+from\s+['"]react['"])/, (match, p1, p2) => {
             return p1 + ', { useMemo }' + p2;
         });
      }
    } else {
      // No react import at all.
      // add at top after 'use client' if it exists.
      if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
         content = content.replace(/^(["']use client["'];?\s*)/, "$1\nimport { useMemo } from 'react';\n");
      } else {
         content = "import { useMemo } from 'react';\n" + content;
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log('Fixed missing import in: ' + filePath);
  }
});
