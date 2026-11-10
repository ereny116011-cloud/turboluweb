import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

/* dist/ altındaki dağıtım dosyaları için SHA-256 sağlama toplamı üretir. */

const dir = path.resolve(process.argv[2] || 'dist');
const allowed = new Set(['.exe', '.appimage', '.deb', '.dmg', '.zip']);

const files = (await readdir(dir))
  .filter((file) => allowed.has(path.extname(file).toLowerCase()))
  .sort();

if (files.length === 0) {
  console.error('Sağlama toplamı için dosya bulunamadı:', dir);
  process.exit(1);
}

const lines = [];
for (const file of files) {
  const hash = createHash('sha256')
    .update(await readFile(path.join(dir, file)))
    .digest('hex');
  lines.push(`${hash}  ${file}`);
}

const output = path.join(dir, 'SHA256SUMS.txt');
await writeFile(output, lines.join('\n') + '\n', 'utf8');
console.log(lines.join('\n'));
