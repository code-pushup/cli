import { Server, createServer } from 'http';
import { Mock, vi } from 'vitest';

export class Deferred<T> {
  promise: Promise<T>;
  resolve!: (value?: T) => void;
  reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve as any;
      this.reject = reject;
    });
  }
}

function randomPort() {
  return Math.floor(Math.random() * 10000) + 10000;
}

export async function createMockServer(port = randomPort()): Promise<{
  server: Server;
  requestListener: Mock;
  requestBody: Deferred<unknown>;
  port: number;
}> {
  const requestBody = new Deferred<unknown>();

  const requestListener = vi.fn((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });

    let json = '';

    req.on('data', (chunk: string) => {
      json += chunk;
    });

    req.on('end', () => {
      const report = JSON.parse(json);

      // emulate the response from the GraphQL API
      res.end(JSON.stringify({ data: {} }));

      requestBody.resolve(report);
    });
  });

  const server = createServer(requestListener);
  server.listen(port);

  return { server, requestListener, requestBody, port };
}
