// @ts-check
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

// Determine the workspace root (GITHUB_WORKSPACE or current working directory)
const workspaceRoot = process.env.GITHUB_WORKSPACE || process.cwd();
const tsconfigPath = resolve(workspaceRoot, 'tsconfig.base.json');

// Set up environment variables
const env = {
  ...process.env,
  NODE_OPTIONS: '--import tsx',
  TSX_TSCONFIG_PATH: tsconfigPath,
};

// Get the command and its arguments from the command line
const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node ci-tsx.js <command> [args...]');
  console.error('Example: node ci-tsx.js nx affected -t test');
  process.exit(1);
}

// Spawn the command with the configured environment
const child = spawn(command, args, {
  env,
  stdio: 'inherit',
  shell: true,
});

// Forward exit code
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

// Handle errors
child.on('error', error => {
  console.error('Failed to start child process:', error);
  process.exit(1);
});
