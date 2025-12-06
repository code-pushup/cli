#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn } from 'node:child_process';
import { z } from 'zod';

const mcpServer = new McpServer({
  name: 'code-pushup-mcp',
  version: '0.92.0',
});

// Helper to execute CLI commands
async function execCommand(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { shell: true });
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', data => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      } else {
        resolve({ stdout, stderr });
      }
    });

    proc.on('error', error => {
      reject(error);
    });
  });
}

// Build CLI arguments from tool parameters
function buildCliArgs(
  command: string,
  args: Record<string, unknown>,
): string[] {
  const cliArgs: string[] = [];

  if (command !== 'autorun') {
    cliArgs.push(command);
  }

  if (args.config) {
    cliArgs.push(`--config=${args.config}`);
  }

  if (args.onlyPlugins) {
    cliArgs.push(`--onlyPlugins=${args.onlyPlugins}`);
  }
  if (args.skipPlugins) {
    cliArgs.push(`--skipPlugins=${args.skipPlugins}`);
  }

  if (args.persist && typeof args.persist === 'object') {
    const persist = args.persist as Record<string, unknown>;
    if (persist.outputDir) {
      cliArgs.push(`--persist.outputDir=${persist.outputDir}`);
    }
    if (persist.format && Array.isArray(persist.format)) {
      cliArgs.push(`--persist.format=${persist.format.join(',')}`);
    }
  }

  return cliArgs;
}

// Register tools
mcpServer.registerTool(
  'code_pushup_collect',
  {
    description:
      'Run Code PushUp collect command to gather code quality metrics from configured plugins',
    inputSchema: {
      config: z
        .string()
        .optional()
        .describe('Path to config file (e.g., code-pushup.config.ts)'),
      onlyPlugins: z
        .string()
        .optional()
        .describe('Comma-separated list of plugins to run (skip others)'),
      skipPlugins: z
        .string()
        .optional()
        .describe('Comma-separated list of plugins to skip'),
      persist: z
        .object({
          outputDir: z
            .string()
            .optional()
            .describe('Output directory for reports'),
          format: z
            .array(z.string())
            .optional()
            .describe('Report formats (json, md, stdout)'),
        })
        .optional(),
    },
  },
  async (args: any) => {
    try {
      const cliArgs = buildCliArgs('collect', args);
      const { stdout, stderr } = await execCommand('npx', [
        'code-pushup',
        ...cliArgs,
      ]);
      return {
        content: [
          {
            type: 'text' as const,
            text: stdout || stderr || 'Command executed successfully',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

mcpServer.registerTool(
  'code_pushup_compare',
  {
    description: 'Compare two Code PushUp reports',
    inputSchema: {
      before: z.string().describe('Path to before report JSON file'),
      after: z.string().describe('Path to after report JSON file'),
      outputDir: z
        .string()
        .optional()
        .describe('Output directory for comparison report'),
    },
  },
  async (args: any) => {
    try {
      const cliArgs = buildCliArgs('compare', args);
      const { stdout, stderr } = await execCommand('npx', [
        'code-pushup',
        ...cliArgs,
      ]);
      return {
        content: [
          {
            type: 'text' as const,
            text: stdout || stderr || 'Comparison completed successfully',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

mcpServer.registerTool(
  'code_pushup_print_config',
  {
    description: 'Print resolved Code PushUp configuration',
    inputSchema: {
      config: z.string().optional().describe('Path to config file'),
    },
  },
  async (args: any) => {
    try {
      const cliArgs = buildCliArgs('print-config', args);
      const { stdout, stderr } = await execCommand('npx', [
        'code-pushup',
        ...cliArgs,
      ]);
      return {
        content: [
          {
            type: 'text' as const,
            text: stdout || stderr || 'Config printed successfully',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('Code PushUp MCP server running on stdio');
}

main().catch(error => {
  console.error('Server error:', error);
  process.exit(1);
});
