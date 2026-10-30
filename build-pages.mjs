// Builds dist/ for Cloudflare Pages: the dashboard plus a single-file Worker (_worker.js) assembled from
// auth-core.js, so Cloudflare runs exactly the same auth code as the Node server.
import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await copyFile(join(root, 'index.html'), join(output, 'index.html'));

const core = (await readFile(join(root, 'auth-core.js'), 'utf8')).replace(/^export (async function|function|class|const)/gm, '$1');
const entry = `
export default {
  async fetch(request, env) {
    const handled = await handleRequest(request, env);
    return secureHeaders(handled || await env.ASSETS.fetch(request));
  }
};
`;
await writeFile(join(output, '_worker.js'), core + entry);
console.log('Cloudflare Pages assets and Worker prepared in dist/.');
