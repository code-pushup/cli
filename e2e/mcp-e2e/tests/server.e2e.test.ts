import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRpcClient } from '../mocks/helper.js';

describe('MCP Server', () => {
  let rpc: ReturnType<typeof createRpcClient>;

  beforeEach(async () => {
    // Use npx to run the local workspace package
    rpc = createRpcClient('npx', ['@code-pushup/mcp']);
  });

  afterEach(() => {
    if (rpc && !rpc.proc.killed) {
      rpc.proc.kill();
    }
  });

  it('responds to initialize', async () => {
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

    await expect(rpc.recv()).resolves.toStrictEqual({
      jsonrpc: '2.0',
      id: 1,
      result: expect.objectContaining({
        protocolVersion: expect.any(String),
        capabilities: expect.any(Object),
        serverInfo: expect.objectContaining({
          name: 'code-pushup-mcp',
          version: expect.any(String),
        }),
      }),
    });
  });

  it('lists available tools', async () => {
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

    await rpc.recv();

    rpc.send({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    });

    rpc.send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    });

    const toolsResponse = await rpc.recv();

    expect(toolsResponse).toMatchObject({
      jsonrpc: '2.0',
      id: 2,
      result: {
        tools: expect.arrayContaining([
          expect.objectContaining({
            name: 'code_pushup_collect',
            description: expect.any(String),
            inputSchema: expect.any(Object),
          }),
          expect.objectContaining({
            name: 'code_pushup_compare',
            description: expect.any(String),
            inputSchema: expect.any(Object),
          }),
          expect.objectContaining({
            name: 'code_pushup_print_config',
            description: expect.any(String),
            inputSchema: expect.any(Object),
          }),
        ]),
      },
    });

    expect(toolsResponse.result.tools).toHaveLength(3);
  });

  it('calls code_pushup_print_config tool', async () => {
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

    await rpc.recv();

    rpc.send({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    });

    rpc.send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'code_pushup_print_config',
        arguments: {},
      },
    });

    const toolResponse = await rpc.recv();

    expect(toolResponse).toMatchObject({
      jsonrpc: '2.0',
      id: 2,
      result: {
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.any(String),
          }),
        ]),
      },
    });

    const textContent = toolResponse.result.content.find(
      (c: any) => c.type === 'text',
    );
    expect(textContent.text).toBeTruthy();
  }, 30000);
});
