import { type ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

async function readMessage(proc: ChildProcess, signal: AbortSignal) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex === -1) {
        return;
      }
      proc.stdout!.off('data', onData);
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
      const message = JSON.parse(line);
      resolve(message);
    };
    const onAbort = () => {
      proc.stdout!.off('data', onData);
      reject(new Error('Aborted waiting for JSON-RPC message'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    proc.stdout!.on('data', onData);
  });
}

export function createRpcClient(cmd: string, args: string[]) {
  const proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

  const sendMessage = (msg: any) => {
    const json = JSON.stringify(msg) + '\n';
    proc.stdin.write(json);
  };

  const recvMessage = (timeoutMs = 10000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    return readMessage(proc, controller.signal).finally(() =>
      clearTimeout(timeout),
    );
  };

  return { proc, send: sendMessage, recv: recvMessage };
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
