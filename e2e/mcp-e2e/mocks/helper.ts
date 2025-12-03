import { spawn } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

export function createRpcClient(cmd: string, args: string[]) {
  const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

  let buffer = '';

  const messageStream = new Promise<never>(() => {}); // unused but keeps type happy

  const readMessage = (): Promise<any> =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('RPC timeout')), 5000);

      const onData = (chunk: Buffer) => {
        buffer += chunk.toString();

        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;

        const header = buffer.slice(0, headerEnd);
        const match = header.match(/Content-Length:\s*(\d+)/i);
        if (!match) return;

        const length = Number(match[1]);
        const bodyStart = headerEnd + 4;
        const bodyEnd = bodyStart + length;

        if (buffer.length < bodyEnd) return;

        const json = JSON.parse(buffer.slice(bodyStart, bodyEnd));
        buffer = buffer.slice(bodyEnd);

        clearTimeout(timeout);
        proc.stdout.off('data', onData);
        resolve(json);
      };

      proc.stdout.on('data', onData);
    });

  const sendMessage = (msg: any) => {
    const json = JSON.stringify(msg);
    const payload = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`;
    proc.stdin.write(payload);
  };

  return { proc, send: sendMessage, recv: readMessage };
}

describe('MCP Server', () => {
  it('responds to initialize', async () => {
    const serverPath = path.join(
      process.cwd(),
      'packages',
      'mcp',
      'dist',
      'src',
      'index.js',
    );

    const rpc = createRpcClient('node', [serverPath]);

    try {
      // 🔹 Send proper MCP initialize message
      rpc.send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      });

      // 🔹 Wait for JSON-RPC decoded object
      const response = await rpc.recv();

      expect(response.id).toBe(1);
      expect(response.result?.serverInfo?.name).toContain('code-pushup-mcp');
    } finally {
      rpc.proc.kill();
    }
  }, 15000);
});
