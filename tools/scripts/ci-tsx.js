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

// Log the command being executed
console.log(`> ${command} ${args.join(' ')}`);

// Handle Windows-specific command execution
// On Windows, npm bin scripts need .cmd extension (e.g., nx.cmd)
const isWindows = process.platform === 'win32';
const commandToRun =
  isWindows && !command.endsWith('.exe') && !command.endsWith('.cmd')
    ? `${command}.cmd`
    : command;

// Spawn the command with the configured environment without shell
// This avoids the DEP0190 deprecation warning
const child = spawn(commandToRun, args, {
  env,
  stdio: 'inherit',
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
