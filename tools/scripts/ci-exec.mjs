#!/usr/bin/env node

/**
 * Wrapper script to execute commands with tsx environment setup.
 * Works cross-platform (Windows, macOS, Linux).
 */
import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, '../..');

// Get the command and args from process.argv
const [, , ...commandArgs] = process.argv;

if (commandArgs.length === 0) {
  console.error('Usage: ci-exec <command> [args...]');
  process.exit(1);
}

// Set up environment variables
const env = {
  ...process.env,
  NODE_OPTIONS: '--import tsx',
  TSX_TSCONFIG_PATH: process.env.GITHUB_WORKSPACE
    ? `${process.env.GITHUB_WORKSPACE}/tsconfig.base.json`
    : `${workspaceRoot}/tsconfig.base.json`,
};

// Execute the command
const child = spawn(commandArgs[0], commandArgs.slice(1), {
  env,
  stdio: 'inherit',
  shell: false,
});

child.on('exit', code => {
  process.exit(code || 0);
});

child.on('error', err => {
  console.error('Failed to execute command:', err);
  process.exit(1);
});
