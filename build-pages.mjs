import { mkdir, copyFile, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
await mkdir(output, { recursive: true });
await unlink(join(output, '_routes.json')).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
await copyFile(join(root, 'index.html'), join(output, 'index.html'));
await copyFile(join(root, 'worker.js'), join(output, '_worker.js'));
console.log('Cloudflare Pages assets and Worker prepared in dist/.');
