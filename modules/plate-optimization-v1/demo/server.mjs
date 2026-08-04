import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(moduleDirectory, '../..');
const port = Number(process.env.PORT || 4177);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.csv', 'text/csv; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.hha', 'text/plain; charset=utf-8']
]);

function send(response, status, body, type = 'text/plain; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  response.end(body);
}

const server = http.createServer((request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const rawPath = decodeURIComponent(requestUrl.pathname);
    const requestedPath = rawPath === '/'
      ? '/modules/plate-optimization-v1/demo/index.html'
      : rawPath;
    const filePath = path.resolve(repositoryRoot, `.${requestedPath}`);

    if (!filePath.startsWith(repositoryRoot + path.sep)) {
      send(response, 403, 'Forbidden');
      return;
    }

    fs.stat(filePath, (error, stat) => {
      if (error || !stat.isFile()) {
        send(response, 404, 'Not found');
        return;
      }

      response.writeHead(200, {
        'Content-Type': contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(filePath).pipe(response);
    });
  } catch (error) {
    send(response, 500, error instanceof Error ? error.message : String(error));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`KMS Plate Optimization test UI: http://127.0.0.1:${port}`);
  console.log('Moduł testowy. Nie jest podłączony do main ani recovery.');
});
