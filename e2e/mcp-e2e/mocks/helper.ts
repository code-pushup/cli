import { type ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';

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
  const proc = spawn(cmd, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.join(process.cwd(), 'tmp/e2e/mcp-e2e'),
  });

  proc.stderr?.on('data', chunk => {
    console.error('RpcClient stderr:', chunk.toString());
  });

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
