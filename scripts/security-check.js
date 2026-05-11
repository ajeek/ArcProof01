import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const IGNORE_DIRS = ['node_modules', 'dist', '.git', 'build', 'coverage'];
const IGNORE_FILES = ['.env.example', 'security-check.js', 'package-lock.json'];
const SECRET_PATTERNS = [
  /0x[a-fA-F0-9]{64}/g, // Private Key / Hex Secret
  /AIza[0-9A-Za-z-_]{35}/g, // Google API Key
  /xox[baprs]-[0-9A-Za-z-]{10,200}/g, // Slack token
  /gh[pous]_[0-9A-Za-z]{36}/g, // GitHub token
  /PRIVATE_KEY\s*=\s*['"][a-fA-F0-9]{64}['"]/gi,
  /SECRET\s*=\s*['"][^'"]+['"]/gi
];

function scanFile(filePath) {
  if (IGNORE_FILES.some(f => filePath.endsWith(f))) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const leaks = [];
  
  SECRET_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Double check it's not a placeholder
        if (!match.includes('YOUR_') && !match.includes('PLACEHOLDER')) {
          leaks.push({ file: filePath, match });
        }
      });
    }
  });
  
  return leaks;
}

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        results = results.concat(walkDir(filePath));
      }
    } else {
      results = results.concat(scanFile(filePath));
    }
  });
  
  return results;
}

console.log('--- Starting Security Scan ---');
const leaks = walkDir(process.cwd());

if (leaks.length > 0) {
  console.error('SECURE ERROR: Potential secrets detected in the following files:');
  leaks.forEach(leak => {
    console.error(`- ${leak.file}: Found potential secret match`);
  });
  process.exit(1);
} else {
  console.log('✅ No secrets detected.');
  process.exit(0);
}
