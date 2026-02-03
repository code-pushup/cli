import { readFile } from 'node:fs/promises';
import {
  type IncomingMessage,
  type Server,
  type ServerResponse,
  createServer,
} from 'node:http';
import { join } from 'node:path';
import { text } from 'node:stream/consumers';

const SESSION_COOKIE = 'session=authenticated';

function getCookie(req: IncomingMessage, name: string): string | undefined {
  const cookies = req.headers.cookie?.split(';').map(c => c.trim()) ?? [];
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie?.split('=')[1];
}

function isAuthenticated(req: IncomingMessage): boolean {
  return getCookie(req, 'session') === 'authenticated';
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  serverDir: string,
): Promise<void> {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  if (url === '/login' && method === 'GET') {
    const html = await readFile(join(serverDir, 'login.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (url === '/login' && method === 'POST') {
    const body = await text(req);
    const params = new URLSearchParams(body);
    const username = params.get('username');
    const password = params.get('password');

    if (username === 'testuser' && password === 'testpass') {
      res.writeHead(302, {
        Location: '/dashboard',
        'Set-Cookie': `${SESSION_COOKIE}; Path=/; HttpOnly`,
      });
      res.end();
    } else {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Invalid credentials');
    }
    return;
  }

  if (url === '/dashboard') {
    if (!isAuthenticated(req)) {
      res.writeHead(302, { Location: '/login' });
      res.end();
      return;
    }
    const html = await readFile(join(serverDir, 'dashboard.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  res.writeHead(302, { Location: '/login' });
  res.end();
}

export function createAuthServer(serverDir: string): Server {
  return createServer((req, res) => {
    handleRequest(req, res, serverDir).catch(error => {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    });
  });
}

export function startServer(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, () => resolve());
  });
}

export function stopServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
