// Local static HTTP server for playing and testing Saffron & Ember in desktop Chrome.
// Usage: node serve.ts [--port 8080]
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDir = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const cliArgs = process.argv.slice(2);
const portFlag = cliArgs.indexOf('--port');
const parsedPort = portFlag === -1 ? 8080 : Number(cliArgs[portFlag + 1]);
const port = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  let reqPath: string;
  try {
    reqPath = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end('Bad Request');
    return;
  }
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  const target = resolve(join(gameDir, normalize(reqPath)));
  if (target !== gameDir && !target.startsWith(gameDir + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  let size = 0;
  try {
    const info = statSync(target);
    if (!info.isFile()) throw new Error('Not a file');
    size = info.size;
  } catch {
    res.writeHead(404).end('Not Found');
    return;
  }
  const mime = CONTENT_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, {
    'content-type': mime,
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Saffron & Ember serving at http://127.0.0.1:${port}`);
});
